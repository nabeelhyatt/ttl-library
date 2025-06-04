# The Tabletop Library Game Voting System

A comprehensive web application for the Tabletop Library that allows users to vote on board games, manage game rankings, and discover new games. Built with modern web technologies and integrated with BoardGameGeek's extensive game database.

## 🎯 Project Overview

The TTL Game Voting System serves as the digital backbone for the Tabletop Library's game collection management and community voting. The application seamlessly integrates with BoardGameGeek's API for comprehensive game data while using Airtable as a robust backend database for community interactions.

### What Users Can Do
- **Discover Games**: Browse trending games from BoardGameGeek with advanced search capabilities
- **Vote & Rate**: Cast votes on games using the library's custom voting system
- **Track Collection**: Monitor the library's game acquisition progress and availability
- **Personal Dashboard**: View voting history and personalized game recommendations
- **Community Rankings**: See how games rank within the library community

### Key Differentiators
- **Dual Authentication**: Modern phone-based magic link authentication with Replit OAuth fallback
- **Advanced Search**: Multi-mode search with exact matching, fuzzy search, and smart fallbacks
- **Real-time Sync**: Live integration between BoardGameGeek data and Airtable community data
- **Collection Insights**: Visual progress tracking toward collection goals with availability status
- **Bulk Operations**: Process multiple games simultaneously for efficient library management

## 🏗️ Technical Stack

- **Frontend**: React with TypeScript, Tailwind CSS, Radix UI components
- **Backend**: Express.js with TypeScript
- **APIs**: BoardGameGeek API, Airtable API
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Authentication**: Dual system - Phone-based magic links (primary) + Replit OAuth (fallback)
- **Database**: Airtable for community data, PostgreSQL for sessions (with MemoryStore fallback)

## 🔐 Authentication System

The application features a sophisticated dual authentication system designed for both ease of use and reliability:

### Primary: Phone Authentication
- **Magic Link SMS**: Users receive SMS with secure authentication links
- **10-minute Token Expiry**: Time-limited tokens for enhanced security
- **Rate Limiting**: Protection against abuse (3 SMS per phone per 15 min)
- **Real-time Formatting**: Phone input with live formatting as users type
- **Cross-device Support**: Magic links work seamlessly across devices

### Fallback: Replit OAuth
- **Seamless Integration**: Automatic fallback when phone auth unavailable
- **Persistent Sessions**: Long-term session management with secure cookies
- **Development Friendly**: Easy testing and development workflow

### User Experience
- **Smart Detection**: System automatically tries phone auth first, then Replit
- **Visual Indicators**: Users see 📱 for phone auth, 💻 for Replit auth
- **Unified Interface**: Single login dialog supporting both authentication methods
- **Session Persistence**: Users stay logged in across browser sessions

## 🔍 Advanced Search System

The application implements a sophisticated search architecture with multiple layers of functionality:

### Core Search Features
- **Consistent Cross-Page Search**: Search state persists when navigating between pages
- **URL Synchronization**: Search queries sync with URL parameters for shareable links
- **Multi-mode Search**: Regular fuzzy search and exact matching with quotes
- **Smart Fallbacks**: Automatic fallback strategies for better results

### Advanced Capabilities
- **Special Case Handling**: Common games like Chess, Catan identified by direct lookup
- **Combined Results Strategy**: Popular games shown first, followed by related games
- **Intelligent Caching**: TTL-based caching to reduce API calls and improve performance
- **Rate Limit Respect**: Careful handling of BoardGameGeek API limitations
- **Airtable Enrichment**: Game data automatically enhanced with community metadata

### Bulk Processing
- **Multi-game Input**: Process up to 10 games simultaneously
- **Format Flexibility**: Handles comma-separated, line-separated, and numbered lists
- **Progress Tracking**: Visual progress indicators during bulk operations
- **Error Handling**: Graceful handling of individual game search failures

## 📊 Game Collection Management

### Collection Progress Tracking
- **Visual Progress Bar**: Shows games in library, on order, and voted for
- **Live Data Integration**: Real-time updates from Airtable TLCS Categories table
- **Color-coded Status**: Clear visual indicators for collection status
- **Goal Tracking**: Progress monitoring toward collection targets

### Game Availability System
Games display availability status with clear visual tags:
- **"In Library"**: Games available for checkout
- **"For Sale"**: Games available for purchase
- **"Backordered"**: Games on order from distributors
- **Dynamic Updates**: Status changes reflect immediately across the system

### Voting & Rankings
- **Community Voting**: Users vote on games they want to see in the library
- **Aggregated Rankings**: Community preferences drive acquisition decisions
- **Personal History**: Users can track their voting history and preferences
- **Real-time Updates**: Rankings update dynamically as votes are cast

## 🚀 Project Structure

```
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   │   └── auth/       # Authentication-specific components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions and API clients
│   │   ├── pages/         # Page components and routes
│   │   ├── contexts/      # React contexts for state management
│   │   └── styles/        # Global styles and themes
├── server/                 # Backend Express application
│   ├── services/          # Business logic and external service integration
│   │   ├── new-bgg-service.ts      # BoardGameGeek API integration
│   │   ├── airtable-direct.ts      # Airtable API integration
│   │   ├── phone-auth-service.ts   # Phone authentication management
│   │   └── member-service.ts       # User and member management
│   ├── routes/            # API route definitions
│   └── storage/           # Data persistence layer
└── shared/                # Shared TypeScript types and utilities
```

## ⚡ Key Features

### 1. Intelligent Game Discovery
- **BoardGameGeek Integration**: Access to comprehensive game database with robust error handling
- **Smart Search**: Multi-mode search with exact matching and fuzzy search capabilities
- **Special Case Handling**: Optimized search for popular games with direct ID lookup
- **Batch Processing**: Efficient bulk game searches with rate limiting protection

### 2. Community Voting System
- **Secure Authentication**: Dual authentication system ensures legitimate voting
- **Vote Tracking**: Comprehensive vote management with Airtable persistence
- **Personal History**: Users can view and manage their voting history
- **Community Impact**: Votes directly influence library acquisition decisions

### 3. Collection Progress Visualization
- **Real-time Progress**: Live tracking of collection status and goals
- **Multiple Categories**: Progress across different game categories and types
- **Visual Indicators**: Clear, color-coded progress bars and status indicators
- **Data Integration**: Seamless sync between community votes and collection status

### 4. Advanced User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Real-time Updates**: Live data updates without page refreshes
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Performance Optimization**: Intelligent caching and API usage optimization

## 🛠️ Development Setup

### Prerequisites
- Node.js (16+ recommended)
- Git for version control
- Airtable account with appropriate base setup
- Optional: Twilio account for SMS functionality

### Quick Start
1. **Clone the repository**
   ```bash
   git clone https://github.com/nabeelhyatt/ttl-library.git
   cd ttl-library
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit .env with your credentials
   # Required:
   AIRTABLE_API_KEY=your_airtable_api_key
   AIRTABLE_BASE_ID=your_airtable_base_id
   
   # Optional for phone auth:
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `AIRTABLE_API_KEY` | Yes | Airtable API key for database access |
| `AIRTABLE_BASE_ID` | Yes | Airtable base ID for the library database |
| `TWILIO_ACCOUNT_SID` | No | Twilio account SID for SMS functionality |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth token for SMS sending |
| `TWILIO_PHONE_NUMBER` | No | Twilio phone number for SMS sending |
| `SESSION_SECRET` | No | Secret for session encryption |
| `DATABASE_URL` | No | PostgreSQL URL for session storage |

**Note**: Phone authentication gracefully degrades without Twilio credentials, using development test tokens instead.

## 🧪 Testing

The project includes comprehensive testing infrastructure:

### Test Scripts
```bash
# Test phone authentication system
./test-phone-auth.sh

# Test voting system functionality
./test-vote.sh

# Test Airtable integration
./test-airtable-votes.sh

# Test complete authentication flow
./test-verification-flow.sh
```

### Testing Features
- **End-to-end Authentication**: Complete phone auth flow testing
- **Rate Limiting Verification**: Ensure security measures work correctly
- **API Integration Testing**: Validate BoardGameGeek and Airtable connections
- **Cross-browser Compatibility**: Ensure consistent behavior across browsers

## 🚢 Deployment

### Production Environment
The application is configured for deployment on Replit with:
- **Automatic Builds**: Using `npm run build`
- **Production Optimization**: Environment-aware configuration
- **Session Management**: PostgreSQL for production, MemoryStore fallback
- **Security**: Production-grade security headers and session configuration

### Environment Setup
For production deployment, ensure these environment variables are configured:
- All required Airtable credentials
- Twilio credentials for SMS functionality
- `REPLIT_DOMAINS` set to production domain
- `DATABASE_URL` for persistent session storage
- `SESSION_SECRET` for secure session encryption

## 🔧 Known Issues & Roadmap

### Current Known Issues
- **My Votes Page**: Vote retrieval from Airtable needs debugging
- **Vote Persistence**: Votes not consistently saving to Airtable
- **Collection Progress**: Progress bar data source occasionally fails
- **Game Images**: Need higher resolution images for better visual experience

### Planned Improvements
- **Enhanced UI/UX**: Compact game card redesign with better information density
- **Bulk Search Integration**: Move bulk search to main search interface
- **Category Navigation**: Clickable TLCS codes for category-based browsing
- **Recommendation Engine**: "If you like this, you'll like" suggestion system
- **Performance Optimization**: Further API usage optimization and caching improvements

## 🤝 Contributing

We welcome contributions to the TTL Game Voting System! Here's how you can help:

### Getting Started
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our coding guidelines
4. Test your changes thoroughly
5. Submit a pull request with a clear description

### Development Guidelines
- Follow existing code style and patterns
- Write comprehensive tests for new features
- Update documentation for any API changes
- Ensure all tests pass before submitting

### Reporting Issues
- Use GitHub Issues to report bugs or request features
- Provide detailed reproduction steps for bugs
- Include environment information (OS, browser, Node version)

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🏛️ About the Tabletop Library

This project is specifically designed for the Tabletop Library and integrates with their existing Airtable database structure. The application handles game data synchronization between BoardGameGeek and Airtable, providing a seamless voting and ranking system for the library's community.

The system is designed to scale with the library's growing collection and community, providing robust tools for game discovery, community engagement, and collection management.

---

**Built with ❤️ for the board game community**
