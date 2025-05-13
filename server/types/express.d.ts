import 'express';

// Define the user claims object from Replit Auth
interface ReplitAuthClaims {
  sub: string; // Stable and unique user ID
  email?: string; // User email (if available)
  first_name?: string; // User first name (if available)
  last_name?: string; // User last name (if available)
  profile_image_url?: string; // URL to user's profile picture
  iat: number; // Issued at timestamp
  exp: number; // Expires at timestamp
}

// Define the auth user object from Replit Auth
interface ReplitAuthUser {
  claims: ReplitAuthClaims;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// Extend the Express Request object to include the auth user
declare global {
  namespace Express {
    interface User extends ReplitAuthUser {}
  }
}