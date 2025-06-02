import { Router } from 'express';
import { newBoardGameGeekService } from '../services/new-bgg-service';
import { airtableDirectService } from '../services/airtable-direct';

// Create a router for BGG-related endpoints
const router = Router();

/**
 * Get hot games from BoardGameGeek
 * GET /api/bgg/hot
 */
router.get('/hot', async (req, res) => {
  try {
    console.log('==============================================');
    console.log('🚀 GET /api/bgg/hot - Fetching hot games (will use cache if available)');
    const startTime = Date.now();
    
    // Get basic hot games list
    const hotGames = await newBoardGameGeekService.getHotGames();
    
    // Enrich with Airtable data (in parallel)
    const enrichedGames = await Promise.all(
      hotGames.map(async (game) => {
        try {
          // Check if game exists in Airtable
          const airtableGameInfo = await airtableDirectService.getGameByBGGId(game.gameId);
          
          if (airtableGameInfo) {
            // Return enriched game with Airtable data
            return {
              ...game,
              tlcsCode: airtableGameInfo.tlcsCode || null,
              subcategoryName: airtableGameInfo.subcategoryName || null,
              inLibrary: airtableGameInfo.inLibrary || false,
              forRent: airtableGameInfo.forRent || false,
              forSale: airtableGameInfo.forSale || false,
              toOrder: airtableGameInfo.toOrder || false,
              // Use Airtable categories if available and valid
              categories: airtableGameInfo.categories?.length ? 
                airtableGameInfo.categories : game.categories
            };
          }
          
          return game;
        } catch (error) {
          console.error(`Error enriching game ${game.gameId} with Airtable data:`, error);
          return game;
        }
      })
    );
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    console.log(`✅ GET /api/bgg/hot - Successfully returned ${enrichedGames.length} hot games in ${executionTime}ms`);
    console.log('==============================================');
    
    return res.status(200).json(enrichedGames);
  } catch (error: any) {
    console.error('❌ Error fetching hot games:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch hot games',
      error: error.message || 'Unknown error'
    });
  }
});

/**
 * Search for games by name
 * GET /api/bgg/search
 */
router.get('/search', async (req, res) => {
  try {
    // Accept either 'query' or 'q' as the parameter name
    const query = (req.query.query || req.query.q) as string;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        message: 'Search query is required and must be a string' 
      });
    }
    
    console.log(`📚 Search request received for: "${query}"`);
    const startTime = Date.now();
    
    // Perform search with the new service
    const results = await newBoardGameGeekService.searchGames(query);
    
    if (results.length === 0) {
      console.log(`📚 No results found for query: "${query}"`);
      return res.status(200).json([]);
    }
    
    console.log(`🔍 [DEBUG] Returning ${results.length} search results for "${query}"`);
    
    // For bulk searches, use a more efficient approach
    let enrichedResults;
    if (results.length > 5) {
      console.log(`🔍 Combining results: 0 special case + ${results.length} search results`);
      console.log(`🔍 Using only regular search results: ${results.length} games`);
      
      // Get all game IDs from search results
      const gameIds = results.map(game => game.gameId);
      
      // Fetch Airtable data for all games (this is done one by one but is usually fast)
      const airtableData = new Map();
      for (const gameId of gameIds) {
        console.log(`Looking for game with BGG ID ${gameId} in Airtable`);
        try {
          const gameInfo = await airtableDirectService.getGameByBGGId(gameId);
          if (gameInfo) {
            airtableData.set(gameId, gameInfo);
          }
        } catch (error) {
          console.error(`Error fetching Airtable data for game ${gameId}:`, error);
        }
      }
      
      // Enrich the results with Airtable data
      enrichedResults = results.map(game => {
        const airtableGameInfo = airtableData.get(game.gameId);
        
        if (airtableGameInfo) {
          return {
            ...game,
            tlcsCode: airtableGameInfo.tlcsCode || null,
            subcategoryName: airtableGameInfo.subcategoryName || null,
            inLibrary: airtableGameInfo.inLibrary || false,
            forRent: airtableGameInfo.forRent || false,
            forSale: airtableGameInfo.forSale || false,
            toOrder: airtableGameInfo.toOrder || false,
            categories: airtableGameInfo.categories?.length ? 
              airtableGameInfo.categories : game.categories
          };
        }
        
        return game;
      });
    } else {
      // For small result sets, use the original approach with Promise.all
      console.log(`📚 Search returned ${results.length} results for "${query}"`);
      
      // Enrich with Airtable data (in parallel)
      enrichedResults = await Promise.all(
        results.map(async (game) => {
          try {
            // Check if game exists in Airtable
            const airtableGameInfo = await airtableDirectService.getGameByBGGId(game.gameId);
            
            if (airtableGameInfo) {
              // Return enriched game with Airtable data
              return {
                ...game,
                tlcsCode: airtableGameInfo.tlcsCode || null,
                subcategoryName: airtableGameInfo.subcategoryName || null,
                inLibrary: airtableGameInfo.inLibrary || false,
                forRent: airtableGameInfo.forRent || false,
                forSale: airtableGameInfo.forSale || false,
                toOrder: airtableGameInfo.toOrder || false,
                // Use Airtable categories if available
                categories: airtableGameInfo.categories?.length ? 
                  airtableGameInfo.categories : game.categories
              };
            }
            
            return game;
          } catch (error) {
            console.error(`Error enriching game ${game.gameId} with Airtable data:`, error);
            return game;
          }
        })
      );
    }
    
    const executionTime = Date.now() - startTime;
    console.log(`📚 Search completed in ${executionTime}ms - returning ${enrichedResults.length} results`);
    
    return res.status(200).json(enrichedResults);
  } catch (error: any) {
    console.error('Error searching games:', error);
    return res.status(500).json({ 
      message: 'Failed to search games',
      error: error.message || 'Unknown error'
    });
  }
});

/**
 * Get details for a specific game by ID
 * GET /api/bgg/game/:id
 */
router.get('/game/:id', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    
    if (isNaN(gameId) || gameId <= 0) {
      return res.status(400).json({ message: 'Invalid game ID' });
    }
    
    console.log(`🎲 Fetching details for game ID: ${gameId}`);
    const startTime = Date.now();
    
    // Get game details from BGG
    const game = await newBoardGameGeekService.getGameDetails(gameId);
    
    // Check if game exists in Airtable and get additional information
    const airtableGameInfo = await airtableDirectService.getGameByBGGId(gameId);
    
    // Merge Airtable data with BGG data
    const enrichedGame = {
      ...game,
      tlcsCode: airtableGameInfo?.tlcsCode || null,
      subcategoryName: airtableGameInfo?.subcategoryName || null,
      inLibrary: airtableGameInfo?.inLibrary || false,
      forRent: airtableGameInfo?.forRent || false,
      forSale: airtableGameInfo?.forSale || false,
      toOrder: airtableGameInfo?.toOrder || false,
      // Use Airtable categories if available
      categories: airtableGameInfo?.categories?.length ? 
        airtableGameInfo.categories : game.categories
    };
    
    const executionTime = Date.now() - startTime;
    console.log(`🎲 Game details fetched in ${executionTime}ms`);
    
    return res.status(200).json(enrichedGame);
  } catch (error: any) {
    console.error(`Error fetching game details:`, error);
    return res.status(500).json({ 
      message: 'Failed to fetch game details',
      error: error.message || 'Unknown error'
    });
  }
});

/**
 * Clear all BGG caches
 * POST /api/bgg/clear-cache
 */
router.post('/clear-cache', (req, res) => {
  try {
    newBoardGameGeekService.clearCaches();
    return res.status(200).json({ 
      message: 'BGG caches cleared successfully' 
    });
  } catch (error: any) {
    console.error('Error clearing BGG caches:', error);
    return res.status(500).json({ 
      message: 'Failed to clear BGG caches',
      error: error.message || 'Unknown error'
    });
  }
});

export default router;