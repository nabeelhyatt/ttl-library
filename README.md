
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
- **Authentication**: Session-based with MemoryStore

## Project Structure

```
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions and API clients
│   │   │   └── new-bgg-api.ts  # Client-side BGG API handlers
│   │   ├── pages/         # Page components
│   │   └── styles/        # Global styles
├── server/                 # Backend Express application
│   ├── services/          # Business logic and external services
│   │   ├── new-bgg-service.ts  # Advanced BoardGameGeek service with caching and error handling
│   │   └── airtable-direct.ts  # Direct Airtable API integration
│   ├── routes/            # Modular route definitions
│   │   └── bgg-routes.ts  # BGG-specific API routes
│   └── routes.ts          # Main API route definitions
└── shared/                # Shared TypeScript types and schemas
```

## Search Architecture

The application implements an advanced search system with several layers of functionality:

1. **Special Case Handling**: Common games like Chess, Catan, etc. are identified by direct ID lookup to improve reliability
   
2. **Multi-Mode Search**: The search system supports two modes:
   - Regular fuzzy search that finds related games
   - Exact search using quotes for precise matching (e.g., "Catan" for exact match)
   
3. **Combined Results Strategy**: For popular games, the definitive version is shown first, followed by related games
   
4. **Fallback Mechanisms**:
   - If exact search fails, fallback to regular search
   - For multi-word queries with no results, try searching just the first word
   - For short queries (≤3 chars), add wildcards automatically
   
5. **Caching System**: Implements intelligent caching with TTL (Time To Live) to reduce API calls and improve performance
   
6. **Rate Limiting**: Respects BoardGameGeek API rate limits to prevent throttling
   
7. **Airtable Enrichment**: Game data is automatically enriched with Airtable metadata when available

## Key Features

1. **Advanced Game Search & Display**
   - Integration with BoardGameGeek API with robust error handling and rate limiting
   - Advanced search architecture with special case handling for popular games
   - Smart search that shows definitive games first, followed by related games
   - Support for exact match searches using quotes (e.g., "Chess" vs Chess)
   - Responsive game cards with detailed information
   - Automatic enrichment with Airtable metadata when available

2. **Game Collection Progress Tracking**
   - Visual progress bar showing games in stock, on order, and voted for
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

## Development Setup

1. Ensure you have Node.js installed
2. Install dependencies: `npm install`
3. Set up environment variables in Replit Secrets:
   - `AIRTABLE_API_KEY`
   - `AIRTABLE_BASE_ID`
4. Start development server: `npm run dev`

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
   - The application implements retry mechanisms with backoff
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
