
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

2. **Game Collection Progress Tracking**
   - Enhanced visual progress bar showing games in library, on order, and voted for
   - **Enhanced Airtable Query Strategy**: Uses precise filtering to count games accurately
   - **In Library**: Count of games marked as available in the library in Airtable
   - **On Order**: Count of games marked as "to Order" OR "Ordered" in Airtable
   - **Voted Only**: Count of games with votes that are NOT in library or on order
   - Live data from Airtable Games table with parallel API queries
   - Progress tracking toward collection goals with proper categorization
   - Color-coded segments showing collection status
   - Real-time updates when new games are added or status changes

3. **Voting System**
   - User authentication
   - Vote tracking
   - Integration with Airtable for persistent storage

4. **Bulk Game Search**
   - Dedicated "/bulk" page for processing multiple game titles at once
   - Text parsing that handles comma-separated, line-separated, and numbered lists
   - Automatic search execution for each parsed game title (up to 10 games)
   - Progress tracking with visual progress bar during bulk processing
   - Results display showing found games using existing GameCard components
   - Clear indication of games not found with suggestions for manual search
   - Rate limiting protection with 500ms delays between searches
   - Error handling for individual game search failures

5. **Rankings**
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

# Maintaining a project

- Create and maintain a readme.md file and describes the entire project, it's file structure, and features of the project. If I say "remember" then record a summary of the thing I tell you to remember in the readme.md file. Refer to the readme.md file for guidance. Refer to PROJECT_PLAN.MD to get state of the project.

# Writing code

- We prefer simple, clean, maintainable solutions over clever or complex ones, even if the latter are more concise or performant. Readability and maintainability are primary concerns.
- Make the smallest reasonable changes to get to the desired outcome. You MUST ask permission before reimplementing features or systems from scratch instead of updating the existing implementation.
- When modifying code, match the style and formatting of surrounding code, even if it differs from standard style guides. Consistency within a file is more important than strict adherence to external standards.
- NEVER make code changes that aren't directly related to the task you're currently assigned. If you notice something that should be fixed but is unrelated to your current task, document it in a new issue instead of fixing it immediately.
- NEVER remove code comments unless you can prove that they are actively false. Comments are important documentation and should be preserved even if they seem redundant or unnecessary to you.
- All code files should start with a brief 2 line comment explaining what the file does. Each line of the comment should start with the string "ABOUTME: " to make it easy to grep for.
- When writing comments, avoid referring to temporal context about refactors or recent changes. Comments should be evergreen and describe the code as it is, not how it evolved or was recently changed.
- NEVER implement a mock mode for testing or for any purpose. We always use real data and real APIs, never mock implementations.
- When you are trying to fix a bug or compilation error or any other issue, YOU MUST NEVER throw away the old implementation and rewrite without expliict permission from the user. If you are going to do this, YOU MUST STOP and get explicit permission from the user.
- NEVER name things as 'improved' or 'new' or 'enhanced', etc. Code naming should be evergreen. What is new today will be "old" someday.

# Getting help

- ALWAYS ask for clarification rather than making assumptions.
- If you're having trouble with something, it's ok to stop and ask for help. Especially if it's something your human might be better at.

# Testing

- Tests MUST cover the functionality being implemented.
- NEVER ignore the output of the system or the tests - Logs and messages often contain CRITICAL information.
- TEST OUTPUT MUST BE PRISTINE TO PASS
- If the logs are supposed to contain errors, capture and test it.
- NO EXCEPTIONS POLICY: Under no circumstances should you mark any test type as "not applicable". Every project, regardless of size or complexity, MUST have unit tests, integration tests, AND end-to-end tests. If you believe a test type doesn't apply, you need the human to say exactly "I AUTHORIZE YOU TO SKIP WRITING TESTS THIS TIME"

## We practice TDD. That means:

- Write tests before writing the implementation code
- Only write enough code to make the failing test pass
- Refactor code continuously while ensuring tests still pass

### TDD Implementation Process

- Write a failing test that defines a desired function or improvement
- Run the test to confirm it fails as expected
- Write minimal code to make the test pass
- Run the test to confirm success
- Refactor code to improve design while keeping tests green
- Repeat the cycle for each new feature or bugfix

# Specific Technologies

## Python

- I prefer to use uv for everything (uv add, uv run, etc)
- Do not use old fashioned methods for package management like poetry, pip or easy_install.
- Make sure that there is a pyproject.toml file in the root directory.
- If there isn't a pyproject.toml file, create one using uv by running uv init.