# TTL Game Voting - Project Plan

This document outlines the upcoming features and improvements for the Tabletop Library Game Voting application.

If I tell you one of these is complete you should delete it, and then add details of the implementation to readme.md

You should prioritize the first take, and only do one task at a time. When you start a project do not assume you know how it should be implemented or what I mean by it. Instead, write up a PRD of what you want to do and how, asking questions on areas that might be open to interpretation and lead to bugs. In general we want clean, isolated code. 

## Priority Tasks

1. **Fix Search Functionality on Rankings Page**
   - Currently search only works from homepage/hot games view
   - Implement consistent search functionality across all pages
   - Ensure search parameters are properly passed between pages

2. **Implement Bulk Game Processing via LLM**
   - Create interface to input plain text lists of games
   - Process through Claude/LLM to parse and identify games
   - Conduct group searching based on parsed results
   - Handle various input formats (comma-separated, line breaks, etc.)

3. **Fix User Vote History Retrieval**
   - Resolve issue where previous votes aren't populated in new sessions
   - Properly populate "My Votes" section with historical data from Airtable
   - Ensure session persistence for returning users

4. **Improve Search Algorithm**
   - Fix "exact" search failures for common titles like "Chess" or "Heat"
   - Implement sorting of search results by popularity
   - Add weighting to search results for better relevance

5. **Add "If You Like This You'll Like" Recommendation Engine**
   - After a user votes, show game recommendations
   - Base recommendations on game mechanics, categories, and other users' votes
   - Implement similarity algorithm for game recommendations

6. **Link TLCS Codes to Category Games**
   - Make TLCS codes clickable to show all games in that category
   - Allow voting directly from category view
   - Improve category navigation and discovery

7. **Enhance Rankings Page with Subcategory Drill-Down**
   - Make categories clickable to show subcategories from Airtable
   - Display hierarchical category structure
   - Maintain consistent voting functionality in subcategory views

8. **Remove Direct Login Button**
   - Remove the Direct Login button from the interface
   - Ensure other login methods are prominent and functional

9. **Optimize Game Card UI**
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

## Next Steps

We'll continue with Task #1 (Fix Search Functionality on Rankings Page) and work our way through the list in order, seeking clarification at each step.