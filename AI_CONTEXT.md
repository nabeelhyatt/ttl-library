# AI Context - TTL Game Library Development

This file contains comprehensive context for AI assistants working on the TTL Game Library codebase. It includes development guidelines, technical implementation details, and system architecture information.

## Development Guidelines

### Core Principles
- We prefer simple, clean, maintainable solutions over clever or complex ones, even if the latter are more concise or performant. Readability and maintainability are primary concerns.
- Make the smallest reasonable changes to get to the desired outcome. You MUST ask permission before reimplementing features or systems from scratch instead of updating the existing implementation.
- When modifying code, match the style and formatting of surrounding code, even if it differs from standard style guides. Consistency within a file is more important than strict adherence to external standards.
- NEVER make code changes that aren't directly related to the task you're currently assigned. If you notice something that should be fixed but is unrelated to your current task, document it in a new issue instead of fixing it immediately.
- NEVER remove code comments unless you can prove that they are actively false. Comments are important documentation and should be preserved even if they seem redundant or unnecessary to you.
- All code files should start with a brief 2 line comment explaining what the file does. Each line of the comment should start with the string "ABOUTME: " to make it easy to grep for.
- When writing comments, avoid referring to temporal context about refactors or recent changes. Comments should be evergreen and describe the code as it is, not how it evolved or was recently changed.
- NEVER implement a mock mode for testing or for any purpose. We always use real data and real APIs, never mock implementations.
- When you are trying to fix a bug or compilation error or any other issue, YOU MUST NEVER throw away the old implementation and rewrite without explicit permission from the user. If you are going to do this, YOU MUST STOP and get explicit permission from the user.
- NEVER name things as 'improved' or 'new' or 'enhanced', etc. Code naming should be evergreen. What is new today will be "old" someday.

### Communication Rules
- ALWAYS ask for clarification rather than making assumptions.
- If you're having trouble with something, it's ok to stop and ask for help. Especially if it's something your human might be better at.
- ONLY respond to the specific issue or task provided.
- Do not initiate unrelated changes.
- Do not assume what I want to do next.
- Do not "fix" unrelated files or code unless explicitly asked.
- ASK BEFORE ACTING when in doubt, stop and confirm.
- Do not auto-complete or auto-refactor unless prompted.

### Testing Requirements
- Tests MUST cover the functionality being implemented.
- NEVER ignore the output of the system or the tests - Logs and messages often contain CRITICAL information.
- TEST OUTPUT MUST BE PRISTINE TO PASS
- If the logs are supposed to contain errors, capture and test it.
- NO EXCEPTIONS POLICY: Under no circumstances should you mark any test type as "not applicable". Every project, regardless of size or complexity, MUST have unit tests, integration tests, AND end-to-end tests. If you believe a test type doesn't apply, you need the human to say exactly "I AUTHORIZE YOU TO SKIP WRITING TESTS THIS TIME"

#### TDD Implementation Process
- Write a failing test that defines a desired function or improvement
- Run the test to confirm it fails as expected
- Write minimal code to make the test pass
- Run the test to confirm success
- Refactor code continuously while ensuring tests still pass
- Repeat the cycle for each new feature or bugfix

## Technical Architecture

### Phone Authentication System - Complete Implementation

The application has successfully migrated to a dual authentication system with phone-based magic links as the primary method and Replit OAuth as fallback.

#### Current Status
- ✅ **Backend Infrastructure**: 100% Complete - All phone auth endpoints functional
- ✅ **Verification Page**: Complete React component handling magic link verification  
- ✅ **AuthContext Integration**: Dual authentication support with smart fallback
- ✅ **Frontend Login Component**: Complete UI supporting both phone and Replit authentication
- ✅ **Session Management**: Both authentication types working simultaneously with proper persistence
- ✅ **User Experience**: Phone formatting, error handling, loading states, SMS integration

#### Authentication Features
- **Magic Link SMS**: Users receive SMS with authentication links (Twilio integration)
- **Development Mode**: Test tokens available via `/api/auth/phone/test-token` endpoint
- **10-minute Token Expiry**: Secure, time-limited authentication tokens
- **Rate Limiting**: Protection against abuse (3 SMS per phone per 15 min, 5 verifications per IP per 5 min)
- **Airtable Integration**: Direct integration with Members table
- **Smart Fallback**: Automatically tries phone auth first, then falls back to Replit auth
- **Dual UI**: Login dialog supports both 📱 Phone and 💻 Replit authentication
- **Session Persistence**: MemoryStore fallback ensures sessions persist when DATABASE_URL not available

#### Authentication Flow
1. **Login**: Users can choose phone or Replit authentication from login dialog
2. **Phone Auth**: Enter phone number → Receive SMS magic link → Click link → Authenticated → Stay logged in
3. **Development**: Use test token endpoint for testing without SMS
4. **Fallback**: System automatically tries phone auth first, then Replit auth
5. **Session**: Both auth types maintain compatible sessions with proper persistence

#### Implementation Details

**Backend Services**:
- `PhoneAuthService`: Complete SMS and token management with environment-aware URL generation
- `MemberService`: Airtable Members integration with user creation/lookup
- Phone auth routes with comprehensive rate limiting and security measures
- Fixed phone validation for real US numbers vs strict telecom validation
- Smart base URL detection for magic links (localhost in dev, production URL in prod)

**Frontend Components**:
- Complete auth verification page (`/auth/verify`) with error handling and user feedback
- Updated dual authentication login dialog with real-time phone formatting
- AuthContext integration supporting both authentication types with smart user display
- Comprehensive loading states, error messaging, and success handling

**Security & Infrastructure**:
- Session persistence fixes with MemoryStore fallback when DATABASE_URL unavailable
- Environment-aware magic link URL generation (no more localhost in production)
- Token management with proper expiry, single-use tokens, and rate limiting
- Production-ready with both authentication types working simultaneously

#### Testing Phone Authentication
```bash
# Test the phone authentication endpoints
./test-phone-auth.sh

# Get a development test token
curl http://localhost:3000/api/auth/phone/test-token

# Check authentication stats
curl http://localhost:3000/api/auth/phone/stats

# Test complete flow with session persistence
curl -c cookies.txt "http://localhost:3000/api/auth/phone/verify?token=YOUR_TOKEN"
curl -b cookies.txt http://localhost:3000/api/auth/phone/user
```

### Search Architecture Implementation

The application implements an advanced search system with several layers of functionality:

1. **Consistent Cross-Page Search**: Search functionality is implemented using a shared React context that maintains search state across all pages
   - Search state persists when navigating between pages
   - Search results are displayed consistently across the application
   - URL parameters are synchronized with search queries for shareable links

2. **Special Case Handling**: Common games like Chess, Catan, etc. are identified by direct ID lookup to improve reliability
   
3. **Multi-Mode Search**: The search system supports two modes:
   - Regular fuzzy search that finds related games
   - Exact search using quotes for precise matching (e.g., "Catan" for exact match)
   
4. **Combined Results Strategy**: For popular games, the definitive version is shown first, followed by related games
   
5. **Fallback Mechanisms**:
   - If exact search fails, fallback to regular search
   - For multi-word queries with no results, try searching just the first word
   - For short queries (≤3 chars), add wildcards automatically
   
6. **Caching System**: Implements intelligent caching with TTL (Time To Live) to reduce API calls and improve performance
   
7. **Rate Limiting**: Respects BoardGameGeek API rate limits to prevent throttling
   
8. **Airtable Enrichment**: Game data is automatically enriched with Airtable metadata when available

## Technology-Specific Guidelines

### BoardGameGeek API Integration
- The BGG API has rate limiting that requires careful handling
- Official documentation recommends a 5-second wait between requests
- For bulk operations, use batch requests with comma-separated IDs
- Implement exponential backoff for retry mechanisms (starting at 100ms)
- Use caching aggressively to reduce API calls
- Monitor and log rate limit errors (HTTP 429) for debugging

### Game Availability Tags
- Games have four availability properties: inLibrary, forSale, toOrder (Backordered), and forRent
- If a game is forRent, it must also be inLibrary (automatic conversion)
- Frontend displays these as tags on game cards with specific labels:
  - "In Library" for inLibrary property
  - "For Sale" for forSale property (previously "In the Store")
  - "Backordered" for toOrder property (previously "On order")
- All availability properties are optional booleans in the BGGGame interface

### Python Development
- I prefer to use uv for everything (uv add, uv run, etc)
- Do not use old fashioned methods for package management like poetry, pip or easy_install.
- Make sure that there is a pyproject.toml file in the root directory.
- If there isn't a pyproject.toml file, create one using uv by running uv init.

## Current System Architecture

### Project Structure
```
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   └── auth/       # Authentication components
│   │   │       ├── login-dialog.tsx  # Dual authentication login dialog
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions and API clients
│   │   │   └── new-bgg-api.ts  # Client-side BGG API handlers
│   │   ├── pages/         # Page components
│   │   │   └── auth-verify.tsx  # Phone authentication verification page
│   │   ├── contexts/      # React contexts
│   │   │   └── AuthContext.tsx  # Dual authentication context (phone + Replit)
│   │   └── styles/        # Global styles
├── server/                 # Backend Express application
│   ├── services/          # Business logic and external services
│   │   ├── new-bgg-service.ts  # Advanced BoardGameGeek service with caching and error handling
│   │   ├── airtable-direct.ts  # Direct Airtable API integration
│   │   ├── PhoneAuthService.ts  # Phone authentication and magic link management
│   │   └── MemberService.ts     # Airtable member management
│   ├── routes/            # Modular route definitions
│   │   ├── bgg-routes.ts  # BGG-specific API routes
│   │   └── phone-auth-routes.ts  # Phone authentication endpoints
│   └── routes.ts          # Main API route definitions
└── shared/                # Shared TypeScript types and schemas
```

### Known Critical Issues

The following issues have been identified and need to be addressed:

#### Critical System Issues
- **My Votes page not loading from Airtable**: Vote retrieval system needs debugging
- **Votes not being recorded to Airtable**: Vote persistence to Airtable is broken
- **Game Collection progress not loading properly**: Progress bar data source failing

#### UI/UX Improvements Needed
- **My Votes page missing Airtable fields**: Need plain text fields for Airtable integration
- **Bulk search UI**: Bulk should be a button next to search instead of separate page
- **Game card ratings display**: Replace current Ratings section with compact graphic format showing Airtable rankings (Thematic Depth, Randomness, Player Interaction, etc.)
- **Game card category display**: Show TLCS category & subcategory when available
- **Game image quality**: Need high resolution images on game cards

## Environment Configuration

### Required Environment Variables
- `AIRTABLE_API_KEY` - For Airtable integration
- `AIRTABLE_BASE_ID` - For Airtable integration
- `TWILIO_ACCOUNT_SID` - For SMS sending
- `TWILIO_AUTH_TOKEN` - For SMS sending
- `TWILIO_PHONE_NUMBER` - For SMS sending
- `SESSION_SECRET` - Optional, for secure sessions
- `DATABASE_URL` - Optional, for PostgreSQL session store (falls back to MemoryStore)

### Development Notes
- Phone authentication works without Twilio credentials using the test token endpoint for development
- Sessions work without DATABASE_URL using MemoryStore fallback
- Server runs on port 3000 consistently across all environments
- All test scripts updated to use consistent port configuration

## Troubleshooting

### Search Issues
1. **BGG API Rate Limiting**
   - The BoardGameGeek API has rate limiting that can cause intermittent failures
   - The application implements retry mechanisms with exponential backoff
   - BGG documentation recommends a 5-second wait between requests
   - For bulk operations, the application uses batch requests to reduce API calls
   - If searches consistently fail, wait a few minutes between attempts

2. **Cache-Related Issues**
   - To clear all search caches, use the `/api/bgg/clear-cache` endpoint
   - For development, the cache can be disabled in `new-bgg-service.ts`

3. **Search Not Finding Expected Games**
   - Try using quotes for exact match: `"Game Name"` instead of `Game Name`
   - For popular games, check if it's in the special cases list in `new-bgg-service.ts`
   - The search prioritizes games with BGG ranks; unranked games may appear lower

### Authentication Issues
1. **Phone Authentication Not Working**
   - Check Twilio credentials are correct in environment variables
   - Verify phone number format includes country code (+1 for US)
   - Check Twilio account balance for SMS sending
   - Use test token endpoint for development testing

2. **Session Persistence Issues**
   - Verify DATABASE_URL is set for production PostgreSQL sessions
   - Development uses MemoryStore fallback which loses sessions on restart
   - Check session configuration in `server/replitAuth.ts`

3. **Replit Authentication Issues**
   - Verify REPLIT_DOMAINS environment variable is set correctly
   - For production, should be set to actual domain
   - Development falls back to localhost:3000

## Completed Major Implementations

### Phone Authentication Migration - 100% Complete
- **Phase 1.1**: Phone Number Validation Fixed (30 minutes)
- **Phase 1.3**: Complete Verification Page (1.5 hours) 
- **Phase 2.1**: AuthContext Integration (1 hour)
- **Phase 2.2**: Frontend Login Component (1 hour)
- **Session Fix**: Resolved session persistence issue (30 minutes)
- **Magic Link URL Fix**: Fixed localhost bug in production (30 minutes)
- **Port Consistency Fix**: Updated all test scripts to consistent port (20 minutes)

### Infrastructure Improvements Completed
- Fixed game name display issue in BGG API integration
- Implemented reliable fallback for hot games list  
- Added error handling for BGG API rate limiting
- Added "Games on Order" Progress Graphic showing collection status
- Implemented Bulk Game Processing allowing users to input up to 10 game titles at once
- Comprehensive testing scripts for end-to-end validation
- Environment setup documentation and examples

This context should provide comprehensive information for AI assistants to effectively work on the TTL Game Library codebase while following established patterns and guidelines. 