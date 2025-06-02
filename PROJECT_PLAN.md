# TTL Game Voting - Project Plan

This document outlines the upcoming features and improvements for the Tabletop Library Game Voting application.

If I tell you one of these is complete you should delete it, and then add details of the implementation to readme.md

You should prioritize the first take, and only do one task at a time. When you start a project do not assume you know how it should be implemented or what I mean by it. Instead, write up a PRD of what you want to do and how, asking questions on areas that might be open to interpretation and lead to bugs. In general we want clean, isolated code. 

## Priority Tasks

1. **Investigate BGG API Rate Limiting for Bulk Operations**
   - Research official BGG API rate limit documentation and best practices
   - Optimize batch processing for bulk game searches and updates
   - Implement more sophisticated queuing system for API requests
   - Add monitoring and logging for rate limit errors
   - Consider implementing circuit breaker pattern for API resilience

2. **Switch Authentication from Replit to Twilio**
   - Research Twilio authentication options (Verify API, Authy, etc.)
   - Design authentication flow with phone number verification
   - Implement secure token-based session management
   - Migrate existing user data to new authentication system
   - Add user profile management with phone number verification

3. **Add "If You Like This You'll Like" Recommendation Engine**
   - After a user votes, show game recommendations
   - Base recommendations on game mechanics, categories, and other users' votes
   - Implement similarity algorithm for game recommendations

4. **Link TLCS Codes to Category Games**
   - Make TLCS codes clickable to show all games in that category
   - Allow voting directly from category view
   - Improve category navigation and discovery

5. **Enhance Rankings Page with Subcategory Drill-Down**
   - Make categories clickable to show subcategories from Airtable
   - Display hierarchical category structure
   - Maintain consistent voting functionality in subcategory views

6. **Optimize Game Card UI**
    - Replace full game description with shorter summary
    - Reduce overall card size for better visual density
    - Improve information hierarchy on game cards
    - Make cards more compact while maintaining usability

## Implementation Notes

For each task, we will:
1. Analyze current implementation
2. Propose specific solution approach
3. Seek clarification before proceeding with coding
4. Implement changes
5. Test thoroughly
6. Document changes

## Current Status

We'll update this section as we complete tasks:
- ✅ Fixed game name display issue in BGG API integration
- ✅ Implemented reliable fallback for hot games list
- ✅ Added error handling for BGG API rate limiting
- ✅ Added "Games on Order" Progress Graphic showing collection status
- ✅ Implemented Bulk Game Processing allowing users to input up to 10 game titles at once

## Next Steps

We'll continue with Task #1 (Fix Search Functionality on Rankings Page) and work our way through the list in order, seeking clarification at each step.