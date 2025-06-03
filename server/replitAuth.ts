import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Check for REPLIT_DOMAINS in development, but provide a fallback for testing
if (!process.env.REPLIT_DOMAINS) {
  console.warn("Environment variable REPLIT_DOMAINS not provided, using fallback");
  process.env.REPLIT_DOMAINS = "localhost:3000";
}

// Check for REPL_ID in development, but provide a fallback for testing
if (!process.env.REPL_ID) {
  console.warn("Environment variable REPL_ID not provided, using fallback");
  process.env.REPL_ID = "tabletoplibrary";
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  if (!process.env.SESSION_SECRET) {
    console.warn('SESSION_SECRET environment variable not set. Using insecure default value for development only.');
  }
  
  let sessionStore;
  
  // Use PostgreSQL store if DATABASE_URL is available, otherwise fallback to MemoryStore
  if (process.env.DATABASE_URL) {
    console.log('Using PostgreSQL session store');
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true, // Allow table creation for development
      ttl: sessionTtl,
      tableName: "sessions",
    });
  } else {
    console.log('DATABASE_URL not set, using MemoryStore for sessions (development only)');
    sessionStore = undefined; // express-session will use MemoryStore by default
  }
  
  return session({
    secret: process.env.SESSION_SECRET || "tabletop-library-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only use secure in production
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  // First update our local storage with user info from Replit
  const user = await storage.upsertReplitUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });

  // Now, if the user has an email, we need to also update Airtable
  // This keeps the Airtable member record in sync with our authentication
  if (user && user.email) {
    try {
      const { airtableDirectService } = await import('./services/airtable-direct');
      // We use the private method via any type to access it
      const airtableService = airtableDirectService as any;
      
      // Attempt to find or create the member in Airtable
      // Combine firstName and lastName for the full name
      const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(' ') || user.name || user.email;
        
      // Create a simplified user object for the Airtable service
      await airtableService.findOrCreateMember({
        id: user.id,
        email: user.email,
        name: fullName
      });
      
      console.log(`Successfully synchronized user ${user.email} with Airtable`);
    } catch (error) {
      console.error('Error syncing user with Airtable:', error);
      // We continue even if Airtable sync fails
      // The user will still be authenticated in our system
    }
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.redirect("/api/login");
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    return res.redirect("/api/login");
  }
};