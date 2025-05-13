# Replit Auth Implementation Plan for Tabletop Library

## Overview
This document outlines the plan to implement Replit's OpenID Connect authentication for the Tabletop Library application. The implementation will follow a phased approach to ensure we can test each component separately.

## Current Issues
1. Missing AuthProvider import in App.tsx causing runtime errors
2. getUserBySessionToken not properly implemented
3. Login dialog not properly preserving pending votes
4. Login flow not well integrated with Airtable user verification

## Implementation Plan

### Phase 1: Core Replit Authentication Setup

#### 1.1 Install Required Dependencies
```bash
npm install passport openid-client connect-pg-simple
```

#### 1.2 Update Database Schema
Update `shared/schema.ts` to include:
- Sessions table for PostgreSQL session storage
- Updated User model compatible with Replit auth claims

```typescript
// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User model updated for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(), // Replit user ID from OIDC
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

#### 1.3 Create Server-Side Auth Components
Create `server/replitAuth.ts`:
- Configure OpenID Connect client
- Set up session management with database storage
- Implement necessary auth routes

#### 1.4 Update Server Routes
Update `server/routes.ts`:
- Remove old auth endpoints
- Add Replit auth endpoints
- Add user profile endpoint

#### 1.5 Create Frontend Auth Hook
Create `client/src/hooks/useAuth.ts`:
- Implement useAuth hook that fetches current user
- Add login/logout methods

### Phase 2: Vote Handling During Authentication

#### 2.1 Enhance AuthContext
Update `client/src/contexts/AuthContext.tsx`:
- Add pending vote storage
- Add methods to process pending votes after login

```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingVote: { gameId: number; voteType: number } | null;
  setPendingVote: (vote: { gameId: number; voteType: number } | null) => void;
  processPendingVote: () => Promise<boolean>;
  login: () => void;
  logout: () => void;
}
```

#### 2.2 Update Game Card Component
Update `client/src/components/game/game-card.tsx`:
- Store pending vote in AuthContext
- Redirect to login when vote attempted without auth
- Process vote after successful authentication

#### 2.3 Implement Auto Vote Processing
Add automatic vote processing after login:
- Check for pending votes in AuthContext
- Submit vote if one exists
- Show appropriate feedback

### Phase 3: Airtable Integration

#### 3.1 Update User Storage Interface
Update `server/storage.ts`:
- Add methods to find and create users based on Replit claims
- Add methods to load previous votes from Airtable

#### 3.2 Update Vote Synchronization
Modify `server/services/airtable-direct.ts`:
- Ensure votes are properly synced with Airtable
- Add robust error handling for API issues

### Phase 4: Tufte-Styled UI Components

#### 4.1 Create Login Button Component
Create a Tufte-styled login UI:
- Design "Login with Replit" button in Tufte style
- Add loading and error states
- Include Replit logo as appropriate

#### 4.2 Update Header Component
Update `client/src/components/layout/header.tsx`:
- Replace current login dialog with Replit login button
- Show user profile information when logged in
- Match Tufte aesthetic throughout

## Migration Strategy
When implementing this plan, we will:
1. Make gradual, incremental changes to avoid breaking existing functionality
2. Test thoroughly after each phase
3. Maintain backward compatibility where possible
4. Keep the Tufte aesthetic consistent throughout the UI

## Testing Plan
For each phase:
1. Test logged-out state functionality
2. Test login flow and session persistence
3. Test vote storage and processing
4. Test handling of errors and edge cases

## Rollback Strategy
If implementation issues arise:
1. Roll back to the last working commit
2. Re-evaluate the strategy
3. Consider alternative approaches

## Deployment Considerations
- Ensure SESSION_SECRET is set in Replit environment variables
- Configure proper CORS for Replit domains
- Set up PostgreSQL database for session storage