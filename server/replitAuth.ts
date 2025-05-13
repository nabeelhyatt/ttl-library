import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
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
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || 'tabletop-library-session-secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    name: claims["name"] || `${claims["first_name"] || ''} ${claims["last_name"] || ''}`.trim()
  });
}

// Function to handle processing pending votes after login
export async function processPendingVotes(sessionId: string, userId: string) {
  try {
    // Get all pending votes for this session
    const pendingVotes = await storage.getPendingVotesBySession(sessionId);
    
    if (pendingVotes.length > 0) {
      console.log(`Processing ${pendingVotes.length} pending votes for user ${userId}`);
      
      // Process each pending vote
      for (const vote of pendingVotes) {
        // Check if user already has a vote for this game
        const existingVote = await storage.getUserVoteForGame(userId, vote.gameId);
        
        if (existingVote) {
          // Update existing vote
          await storage.updateVote(existingVote.id, {
            userId,
            gameId: vote.gameId,
            voteType: vote.voteType
          });
        } else {
          // Create new vote
          await storage.createVote({
            userId,
            gameId: vote.gameId,
            voteType: vote.voteType
          });
        }
      }
      
      // Delete processed pending votes
      await storage.deletePendingVotesBySession(sessionId);
    }
  } catch (error) {
    console.error("Error processing pending votes:", error);
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
    // Store any pending vote information in the session
    if (req.query.gameId && req.query.voteType) {
      req.session.pendingVote = {
        gameId: parseInt(req.query.gameId as string),
        voteType: parseInt(req.query.voteType as string),
      };
    }
    
    // Store the return URL in the session if provided
    if (req.query.returnTo) {
      req.session.returnTo = req.query.returnTo as string;
    }
    
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", async (req, res, next) => {
    // Use a custom callback to handle the authentication result
    passport.authenticate(`replitauth:${req.hostname}`, { session: true }, async (err, user) => {
      if (err) {
        return res.redirect('/login-error');
      }
      
      if (!user) {
        return res.redirect('/login-error');
      }
      
      req.login(user, async (loginErr) => {
        if (loginErr) {
          return res.redirect('/login-error');
        }
        
        // Check if there's a pending vote in the session
        if (req.session.pendingVote) {
          const { gameId, voteType } = req.session.pendingVote;
          const userId = user.claims.sub;
          
          try {
            // Check if user already has a vote for this game
            const existingVote = await storage.getUserVoteForGame(userId, gameId);
            
            if (existingVote) {
              await storage.updateVote(existingVote.id, {
                userId,
                gameId,
                voteType
              });
            } else {
              await storage.createVote({
                userId,
                gameId,
                voteType
              });
            }
            
            // Clear the pending vote from session
            delete req.session.pendingVote;
          } catch (error) {
            console.error("Error handling pending vote:", error);
          }
        }
        
        // Process any pending votes from database
        if (req.sessionID && user.claims.sub) {
          await processPendingVotes(req.sessionID, user.claims.sub);
        }
        
        // Redirect to the return URL if available, or to the home page
        const returnTo = req.session.returnTo || '/';
        delete req.session.returnTo;
        
        return res.redirect(returnTo);
      });
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
  
  // Add route to handle temporary votes that will be stored until login completes
  app.post("/api/temp-vote", async (req, res) => {
    try {
      const { gameId, voteType } = req.body;
      
      if (!gameId || !voteType) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // If user is already logged in, create the vote right away
      if (req.isAuthenticated() && req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        
        // Check if user already has a vote for this game
        const existingVote = await storage.getUserVoteForGame(userId, gameId);
        
        if (existingVote) {
          await storage.updateVote(existingVote.id, {
            userId,
            gameId,
            voteType
          });
          return res.status(200).json({ message: "Vote updated" });
        } else {
          const vote = await storage.createVote({
            userId,
            gameId,
            voteType
          });
          return res.status(201).json(vote);
        }
      }
      
      // Otherwise, store the vote as pending using the session ID
      if (!req.sessionID) {
        return res.status(400).json({ message: "Session ID not available" });
      }
      
      await storage.createPendingVote({
        sessionId: req.sessionID,
        gameId,
        voteType
      });
      
      res.status(202).json({ 
        message: "Vote stored temporarily",
        requiresLogin: true
      });
    } catch (error) {
      console.error("Error storing temporary vote:", error);
      res.status(500).json({ message: "Failed to store vote" });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (user.expires_at && now <= user.expires_at) {
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
    await upsertUser(user.claims);
    return next();
  } catch (error) {
    return res.redirect("/api/login");
  }
};