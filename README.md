
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
│   │   ├── pages/         # Page components
│   │   └── styles/        # Global styles
├── server/                 # Backend Express application
│   ├── services/          # Business logic and external services
│   └── routes.ts          # API route definitions
└── shared/                # Shared TypeScript types and schemas
```

## Key Features

1. **Game Search & Display**
   - Integration with BoardGameGeek API
   - Real-time search functionality
   - Responsive game cards with detailed information

2. **Voting System**
   - User authentication
   - Vote tracking
   - Integration with Airtable for persistent storage

3. **Rankings**
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
