# TTL Game Voting - Project Plan

This document outlines the upcoming features and improvements for the Tabletop Library Game Voting application.

## Priority Tasks

1. **Add "Games on Order" Progress Graphic**
   - Create a visual indicator showing progress toward 200 games on order
   - Track votes and increment progress as votes come in
   - Display prominently on the homepage or dashboard

2. **Fix Search Functionality on Rankings Page**
   - Currently search only works from homepage/hot games view
   - Implement consistent search functionality across all pages
   - Ensure search parameters are properly passed between pages

3. **Implement Bulk Game Processing via LLM**
   - Create interface to input plain text lists of games
   - Process through Claude/LLM to parse and identify games
   - Conduct group searching based on parsed results
   - Handle various input formats (comma-separated, line breaks, etc.)

4. **Fix User Vote History Retrieval**
   - Resolve issue where previous votes aren't populated in new sessions
   - Properly populate "My Votes" section with historical data from Airtable
   - Ensure session persistence for returning users

5. **Improve Search Algorithm**
   - Fix "exact" search failures for common titles like "Chess" or "Heat"
   - Implement sorting of search results by popularity
   - Add weighting to search results for better relevance

6. **Add "If You Like This You'll Like" Recommendation Engine**
   - After a user votes, show game recommendations
   - Base recommendations on game mechanics, categories, and other users' votes
   - Implement similarity algorithm for game recommendations

7. **Link TLCS Codes to Category Games**
   - Make TLCS codes clickable to show all games in that category
   - Allow voting directly from category view
   - Improve category navigation and discovery

8. **Enhance Rankings Page with Subcategory Drill-Down**
   - Make categories clickable to show subcategories from Airtable
   - Display hierarchical category structure
   - Maintain consistent voting functionality in subcategory views

9. **Remove Direct Login Button**
   - Remove the Direct Login button from the interface
   - Ensure other login methods are prominent and functional

10. **Optimize Game Card UI**
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

## Next Steps

We'll begin with Task #1 (Add "Games on Order" Progress Graphic) and work our way through the list in order, seeking clarification at each step.