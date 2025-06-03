# The Tabletop Library Game Voting System

A web application for the Tabletop Library that allows users to vote on board games and manage game rankings. Built with React, Express, and Airtable integration.

## Project Overview

This application serves as a voting and ranking system for board games, integrating with BoardGameGeek's API for game data and using Airtable as a backend database. Users can:

- Browse hot games from BoardGameGeek
- Search for specific games
- Vote on games
- View their voting history
- See overall game rankings

## Technical Stack

- **Frontend**: React with TypeScript, Tailwind CSS, Radix UI components
- **Backend**: Express.js with TypeScript
- **APIs**: BoardGameGeek API, Airtable API
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Authentication**: Dual authentication system - Phone-based magic links (primary) and Replit OAuth (fallback)

## Phone Authentication System

✅ **COMPLETED**: The application has successfully migrated to a dual authentication system with phone-based magic links as the primary method and Replit OAuth as fallback.

### Current Status
- ✅ **Backend Infrastructure**: 100% Complete - All phone auth endpoints functional
- ✅ **Verification Page**: Complete React component handling magic link verification  
- ✅ **AuthContext Integration**: Dual authentication support with smart fallback
- ✅ **Frontend Login Component**: Complete UI supporting both phone and Replit authentication
- ✅ **Session Management**: Both authentication types working simultaneously with proper persistence
- ✅ **User Experience**: Phone formatting, error handling, loading states, SMS integration

### Authentication Features
- **Magic Link SMS**: Users receive SMS with authentication links (Twilio integration)
- **Development Mode**: Test tokens available via `/api/auth/phone/test-token` endpoint
- **10-minute Token Expiry**: Secure, time-limited authentication tokens
- **Rate Limiting**: Protection against abuse (3 SMS per phone per 15 min, 5 verifications per IP per 5 min)
- **Airtable Integration**: Direct integration with Members table
- **Smart Fallback**: Automatically tries phone auth first, then falls back to Replit auth
- **Dual UI**: Login dialog supports both 📱 Phone and 💻 Replit authentication
- **Session Persistence**: MemoryStore fallback ensures sessions persist when DATABASE_URL not available

### Authentication Flow
1. **Login**: Users can choose phone or Replit authentication from login dialog
2. **Phone Auth**: Enter phone number → Receive SMS magic link → Click link → Authenticated → Stay logged in
3. **Development**: Use test token endpoint for testing without SMS
4. **Fallback**: System automatically tries phone auth first, then Replit auth
5. **Session**: Both auth types maintain compatible sessions with proper persistence

### Testing Phone Authentication
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

## Project Structure

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

## Search Architecture

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

## Key Features

1. **Advanced Game Search & Display**
   - Integration with BoardGameGeek API with robust error handling and rate limiting
   - Consistent search functionality across all pages using React Context
   - Search state persistence when navigating between pages
   - URL parameter synchronization for shareable search results
   - Advanced search architecture with special case handling for popular games
   - Smart search that shows definitive games first, followed by related games
   - Support for exact match searches using quotes (e.g., "Chess" vs Chess)
   - Responsive game cards with detailed information
   - Automatic enrichment with Airtable metadata when available
   - Game availability tags ("In Library", "For Sale", "Backordered") for quick status identification
   - Batch processing for bulk searches to reduce API calls and avoid rate limiting

2. **Game Collection Progress Tracking**
   - Visual progress bar showing games in library, on order, and voted for
   - Live data from Airtable TLCS Categories table
   - Progress tracking toward collection goals
   - Color-coded segments showing collection status
   - Real-time updates when new games are added

3. **Voting System**
   - User authentication
   - Vote tracking
   - Integration with Airtable for persistent storage

4. **Rankings**
   - Aggregated game rankings
   - Filtering and sorting capabilities
   - Real-time updates

## Known Issues

The following issues have been identified and need to be addressed:

### Critical Issues
- **My Votes page not loading from Airtable**: Vote retrieval system needs debugging
- **Votes not being recorded to Airtable**: Vote persistence to Airtable is broken
- **Game Collection progress not loading properly**: Progress bar data source failing

### UI/UX Improvements Needed
- **My Votes page missing Airtable fields**: Need plain text fields for Airtable integration
- **Bulk search UI**: Bulk should be a button next to search instead of separate page
- **Game card ratings display**: Replace current Ratings section with compact graphic format showing Airtable rankings (Thematic Depth, Randomness, Player Interaction, etc.)
- **Game card category display**: Show TLCS category & subcategory when available
- **Game image quality**: Need high resolution images on game cards

## Development Setup

1. Ensure you have Node.js installed
2. Install dependencies: `npm install`
3. Set up environment variables:
   - `AIRTABLE_API_KEY`
   - `AIRTABLE_BASE_ID`
   - `TWILIO_ACCOUNT_SID` (for SMS sending)
   - `TWILIO_AUTH_TOKEN` (for SMS sending)
   - `TWILIO_PHONE_NUMBER` (for SMS sending)
   - `SESSION_SECRET` (optional - for secure sessions)
   - `DATABASE_URL` (optional - for PostgreSQL session store, falls back to MemoryStore)
4. Start development server: `npm run dev`

**Note**: Phone authentication works without Twilio credentials using the test token endpoint for development. Sessions work without DATABASE_URL using MemoryStore fallback.

## Deployment

The application is configured for deployment on Replit with:
- Automatic builds using `npm run build`
- Production server start using `npm run start`
- Environment variable configuration through Replit's deployment settings

## Testing

The project includes shell scripts for testing various functionalities:
- `test-vote.sh`: Tests the voting system
- `test-summary.sh`: Tests vote aggregation
- `test-delete-vote.sh`: Tests vote deletion
- `test-create-and-verify.sh`: Tests game creation and verification

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License

## Note

This project is specifically designed for the Tabletop Library and integrates with their existing Airtable database structure. The application handles game data synchronization between BoardGameGeek and Airtable, providing a seamless voting and ranking system for the library's community.
