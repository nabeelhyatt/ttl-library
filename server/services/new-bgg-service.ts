import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { BGGGame } from '@shared/schema';

/**
 * This is a complete rewrite of the BGG service with improved error handling, 
 * simpler implementation, and better caching.
 */
class NewBoardGameGeekService {
  // Constants
  private readonly API_BASE = 'https://boardgamegeek.com/xmlapi2/';
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour cache
  private readonly RATE_LIMIT_DELAY = 100; // 100ms between requests (reduced from 2000ms)
  private readonly MAX_RETRIES = 3;
  
  // Cache structures
  private hotGamesCache: { 
    data: BGGGame[], 
    timestamp: number 
  } | null = null;
  
  private gameDetailsCache: Map<number, { 
    data: BGGGame, 
    timestamp: number 
  }> = new Map();
  
  private searchCache: Map<string, { 
    data: BGGGame[], 
    timestamp: number 
  }> = new Map();
  
  // Flag to temporarily disable cache for testing/debugging
  private cacheEnabled: boolean = true;
  
  // Timestamps for rate limiting
  private lastRequestTime = 0;
  
  // Private helper methods
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    
    if (elapsed < this.RATE_LIMIT_DELAY) {
      const delay = this.RATE_LIMIT_DELAY - elapsed;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }
  
  private async retryWithBackoff<T>(
    operation: () => Promise<T>, 
    retries = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      // Check for rate limiting (status 429)
      if (error?.response?.status === 429 && retries < this.MAX_RETRIES) {
        console.log(`Rate limit hit, retrying in ${this.RATE_LIMIT_DELAY * (2 ** retries)}ms (attempt ${retries + 1}/${this.MAX_RETRIES})`);
        await new Promise(resolve => 
          setTimeout(resolve, this.RATE_LIMIT_DELAY * (2 ** retries))
        );
        return this.retryWithBackoff(operation, retries + 1);
      }
      
      // Check for BGG specific maintenance window or other 5xx errors
      if (error?.response?.status >= 500 && retries < this.MAX_RETRIES) {
        console.log(`BGG server error (${error?.response?.status}), retrying in ${this.RATE_LIMIT_DELAY * (2 ** retries)}ms`);
        await new Promise(resolve => 
          setTimeout(resolve, this.RATE_LIMIT_DELAY * (2 ** retries))
        );
        return this.retryWithBackoff(operation, retries + 1);
      }
      
      // Rethrow other errors
      throw error;
    }
  }
  
  private extractBGGRank(gameData: any): number | undefined {
    try {
      if (!gameData.statistics?.ratings?.ranks) {
        return undefined;
      }
      
      const ranks = gameData.statistics.ratings.ranks.rank;
      const ranksArray = Array.isArray(ranks) ? ranks : [ranks];
      
      // Find the BGG rank (type = 'subtype', name = 'boardgame')
      const bggRank = ranksArray.find((rank: any) => 
        rank.$ && 
        rank.$.type === 'subtype' && 
        rank.$.name === 'boardgame'
      );
      
      return bggRank && 
             bggRank.$ && 
             bggRank.$.value !== 'Not Ranked' ? 
               parseInt(bggRank.$.value) : 
               undefined;
    } catch (error) {
      console.error('Error extracting BGG rank:', error);
      return undefined;
    }
  }
  
  private extractLinkedItems(gameData: any, type: string): string[] {
    try {
      const link = gameData.link;
      if (!link) return [];
      
      const links = Array.isArray(link) ? link : [link];
      
      return links
        .filter((item: any) => item.$ && item.$.type === type)
        .map((item: any) => item.$.value);
    } catch (error) {
      console.error(`Error extracting linked items (${type}):`, error);
      return [];
    }
  }
  
  private gameDataToModel(gameData: any, gameId: number): BGGGame {
    try {
      // Handle name which might be an array or object with different formats
      let name = '';
      
      if (typeof gameData.name === 'string') {
        name = gameData.name;
      } else if (Array.isArray(gameData.name)) {
        // Find primary name (nameType="primary") or use the first one
        const primaryName = gameData.name.find((n: any) => n.$ && n.$.type === 'primary');
        name = primaryName ? primaryName.$.value : gameData.name[0].$.value;
      } else if (gameData.name && gameData.name.$) {
        name = gameData.name.$.value;
      } else {
        name = `Game ${gameId}`;
      }
      
      return {
        gameId,
        name,
        description: gameData.description || '',
        image: gameData.image || '',
        thumbnail: gameData.thumbnail || '',
        yearPublished: gameData.yearpublished && gameData.yearpublished.$ ? 
          parseInt(gameData.yearpublished.$.value) : undefined,
        minPlayers: gameData.minplayers && gameData.minplayers.$ ? 
          parseInt(gameData.minplayers.$.value) : undefined,
        maxPlayers: gameData.maxplayers && gameData.maxplayers.$ ? 
          parseInt(gameData.maxplayers.$.value) : undefined,
        playingTime: gameData.playingtime && gameData.playingtime.$ ? 
          parseInt(gameData.playingtime.$.value) : undefined,
        minPlayTime: gameData.minplaytime && gameData.minplaytime.$ ? 
          parseInt(gameData.minplaytime.$.value) : undefined,
        maxPlayTime: gameData.maxplaytime && gameData.maxplaytime.$ ? 
          parseInt(gameData.maxplaytime.$.value) : undefined,
        minAge: gameData.minage && gameData.minage.$ ? 
          parseInt(gameData.minage.$.value) : undefined,
        bggRating: gameData.statistics && gameData.statistics.ratings && 
          gameData.statistics.ratings.average && gameData.statistics.ratings.average.$ ? 
          gameData.statistics.ratings.average.$.value : undefined,
        bggRank: this.extractBGGRank(gameData),
        weightRating: gameData.statistics && gameData.statistics.ratings && 
          gameData.statistics.ratings.averageweight && gameData.statistics.ratings.averageweight.$ ? 
          gameData.statistics.ratings.averageweight.$.value : undefined,
        
        // Categories and metadata
        categories: this.extractLinkedItems(gameData, 'boardgamecategory'),
        mechanics: this.extractLinkedItems(gameData, 'boardgamemechanic'),
        designers: this.extractLinkedItems(gameData, 'boardgamedesigner'),
        publishers: this.extractLinkedItems(gameData, 'boardgamepublisher')
      };
    } catch (error) {
      console.error(`Error converting game data to model:`, error);
      
      // Return a minimal valid game object
      return {
        gameId,
        name: `Game ${gameId}`,
        description: 'Error loading game details',
        image: '',
        thumbnail: '',
        categories: [],
        mechanics: [],
        designers: [],
        publishers: []
      };
    }
  }
  
  // Public API Methods
  
  /**
   * Get hot games list from BGG with caching
   */
  async getHotGames(): Promise<BGGGame[]> {
    // Check cache first
    const now = Date.now();
    if (this.hotGamesCache && now - this.hotGamesCache.timestamp < this.CACHE_TTL) {
      console.log(`🔥 Returning ${this.hotGamesCache.data.length} hot games from cache`);
      return this.hotGamesCache.data;
    }
    
    // Cache miss - fetch from BGG
    console.log('🔥 Hot games cache miss - fetching from BGG');
    
    return this.retryWithBackoff(async () => {
      // Apply rate limiting
      await this.rateLimit();
      
      const response = await axios.get(`${this.API_BASE}hot?type=boardgame`);
      const result = await parseStringPromise(response.data, { explicitArray: false });
      
      if (!result.items || !result.items.item) {
        console.error('❌ No hot games found in BGG response');
        return [];
      }
      
      // Ensure items are in an array
      const items = Array.isArray(result.items.item) ? 
        result.items.item : [result.items.item];
      
      // Process up to 10 hot games
      const hotGames: BGGGame[] = [];
      const itemsToProcess = items.slice(0, 10);
      
      // Process each game
      for (const item of itemsToProcess) {
        try {
          // Extract the basic info and the game ID
          const gameId = parseInt(item.$.id);
          
          if (isNaN(gameId) || gameId <= 0) {
            console.warn(`❌ Invalid game ID in hot games: ${item.$.id}`);
            continue;
          }
          
          // Try to get full game details
          const gameDetails = await this.getGameDetails(gameId);
          hotGames.push(gameDetails);
        } catch (error) {
          console.error(`❌ Error processing hot game ${item.$.id}:`, error);
        }
      }
      
      // Update cache
      this.hotGamesCache = {
        data: hotGames,
        timestamp: now
      };
      
      console.log(`🔥 Successfully fetched ${hotGames.length} hot games from BGG`);
      return hotGames;
    });
  }
  
  /**
   * Search for games by name
   */
  async searchGames(query: string): Promise<BGGGame[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    
    // Normalize the query by lowercase and trim
    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `search_${normalizedQuery}`;
    
    // Check cache first, but only if cache is enabled
    const now = Date.now();
    const cachedResult = this.searchCache.get(cacheKey);
    
    // Enable caching to improve performance
    this.cacheEnabled = true;
    
    if (this.cacheEnabled && cachedResult && now - cachedResult.timestamp < this.CACHE_TTL) {
      console.log(`🔍 Returning search results for "${query}" from cache (${cachedResult.data.length} results)`);
      return cachedResult.data;
    }
    
    // Removed cache clearing code to improve performance
    
    return this.retryWithBackoff(async () => {
      console.log(`🔍 Searching BGG for: "${query}"`);

      // Start with an empty results array
      let results: BGGGame[] = [];
      let specialCaseId: number | null = null;
      
      // STEP 1: Get special case game first if applicable
      if (this.isSpecialCaseQuery(normalizedQuery)) {
        console.log(`🔍 Processing special case for "${normalizedQuery}" - getting definitive version first`);
        const specialCaseResults = await this.handleSpecialCaseSearch(normalizedQuery);
        if (specialCaseResults.length > 0) {
          // Add special case to top of results
          results = [...specialCaseResults];
          specialCaseId = specialCaseResults[0].gameId;
          console.log(`🔍 Added special case game as first result (ID: ${specialCaseId})`);
        }
      }
      
      // STEP 2: Always perform a regular search for related games
      console.log(`🔍 Performing regular search for "${normalizedQuery}" to find related games`);
      
      // Always use non-exact search to get a broader set of results
      let searchResults = await this.performBGGSearch(normalizedQuery, false);
      
      // If still no results and query contains spaces, try first word
      if (searchResults.length === 0 && normalizedQuery.includes(' ')) {
        const firstWord = normalizedQuery.split(' ')[0];
        console.log(`🔍 No results for "${normalizedQuery}", trying first word "${firstWord}"`);
        searchResults = await this.performBGGSearch(firstWord, false);
      }
      
      // If still no results and query is short, try with wildcard
      if (searchResults.length === 0 && normalizedQuery.length <= 3) {
        console.log(`🔍 No results for short query "${normalizedQuery}", trying with wildcard`);
        searchResults = await this.performBGGSearch(`${normalizedQuery}*`, false);
      }
      
      // STEP 3: If we have a special case game and regular search results, remove duplicates and combine
      console.log(`🔍 Combining results: ${results.length} special case + ${searchResults.length} search results`);
      
      if (results.length > 0 && specialCaseId !== null) {
        // Filter out any search results that have the same ID as the special case
        const filteredResults = searchResults.filter(game => game.gameId !== specialCaseId);
        
        if (filteredResults.length < searchResults.length) {
          console.log(`🔍 Removed duplicate special case game from search results`);
        }
        
        // Combine the special case with the filtered search results
        results = [...results, ...filteredResults];
        console.log(`🔍 Final combined results: ${results.length} games (1 special case + ${filteredResults.length} regular results)`);
      } else {
        // If no special case, just use the search results
        results = searchResults;
        console.log(`🔍 Using only regular search results: ${results.length} games`);
      }
      
      if (results.length === 0) {
        console.log(`🔍 WARNING: No results found for "${query}" after all search attempts!`);
      } else if (results.length === 1) {
        console.log(`🔍 NOTE: Only found 1 result for "${query}" (ID: ${results[0].gameId})`);
      }
      
      // Cache the combined results
      this.searchCache.set(cacheKey, {
        data: results,
        timestamp: now
      });
      
      return results;
    });
  }
  
  /**
   * Get details for a specific game by ID
   */
  async getGameDetails(gameId: number): Promise<BGGGame> {
    if (!gameId || isNaN(gameId) || gameId <= 0) {
      throw new Error(`Invalid game ID: ${gameId}`);
    }
    
    // Check cache first
    const now = Date.now();
    const cachedGame = this.gameDetailsCache.get(gameId);
    
    if (cachedGame && now - cachedGame.timestamp < this.CACHE_TTL) {
      return cachedGame.data;
    }
    
    // Cache miss - fetch from BGG
    return this.retryWithBackoff(async () => {
      // Apply rate limiting
      await this.rateLimit();
      
      const response = await axios.get(`${this.API_BASE}thing?id=${gameId}&stats=1`);
      const result = await parseStringPromise(response.data, { explicitArray: false });
      
      if (!result.items || !result.items.item) {
        throw new Error(`Game with ID ${gameId} not found`);
      }
      
      const gameData = result.items.item;
      const game = this.gameDataToModel(gameData, gameId);
      
      // Cache the result
      this.gameDetailsCache.set(gameId, {
        data: game, 
        timestamp: now
      });
      
      return game;
    });
  }
  
  // Helper methods
  
  private isSpecialCaseQuery(query: string): boolean {
    const specialCases = [
      'above', 'go', 'risk', 'uno', 'chess', 'monopoly', 
      'scrabble', 'clue', 'stratego'
      // Removed 'catan' to improve performance
    ];
    return specialCases.includes(query);
  }
  
  private async handleSpecialCaseSearch(query: string): Promise<BGGGame[]> {
    // Map of special case queries to known BGG IDs
    const specialCaseIds: Record<string, number> = {
      'above': 191004, // Above and Below
      'go': 188,      // Go
      'risk': 181,    // Risk
      'uno': 2223,    // Uno
      'chess': 171,   // Chess
      'monopoly': 1406, // Monopoly
      'scrabble': 320,  // Scrabble
      // 'catan': 13,    // Removed Settlers of Catan to improve performance
      'clue': 1294,   // Clue
      'stratego': 1917 // Stratego
    };
    
    const gameId = specialCaseIds[query];
    if (!gameId) return [];
    
    console.log(`🔍 Special case search for "${query}" - using direct lookup of game ID ${gameId}`);
    
    try {
      // Cache key for special case
      const cacheKey = `game_${gameId}`;
      const now = Date.now();
      
      // Check if we have this game in the cache already
      const cachedGame = this.gameDetailsCache.get(gameId);
      if (cachedGame && now - cachedGame.timestamp < this.CACHE_TTL) {
        console.log(`🔍 Found special case game ${gameId} in cache`);
        return [cachedGame.data];
      }
      
      // Not in cache, so fetch it
      const game = await this.getGameDetails(gameId);
      return [game];
    } catch (error) {
      console.error(`❌ Special case lookup failed for "${query}":`, error);
      return [];
    }
  }
  
  private async performBGGSearch(
    query: string, 
    exact: boolean
  ): Promise<BGGGame[]> {
    // Apply rate limiting
    await this.rateLimit();
    
    // Add path for exact search if needed
    const exactParam = exact ? '&exact=1' : '';
    
    console.log(`🔍 [DEBUG] Performing BGG ${exact ? 'exact' : 'regular'} search for "${query}"`);
    
    // Make BGG search API call
    const response = await axios.get(
      `${this.API_BASE}search?query=${encodeURIComponent(query)}${exactParam}&type=boardgame`
    );
    
    const result = await parseStringPromise(response.data, { explicitArray: false });
    
    if (!result.items || !result.items.item) {
      console.log(`🔍 [DEBUG] No items found for "${query}" with exact=${exact}`);
      return [];
    }
    
    // Ensure we have an array of items
    const items = Array.isArray(result.items.item) ? 
      result.items.item : [result.items.item];
    
    console.log(`🔍 [DEBUG] Found ${items.length} items for "${query}" with exact=${exact}`);
    
    // Limit results to improve search performance
    const limit = 10; // Reduced from 20-25 to improve performance
    console.log(`🔍 [DEBUG] Limiting to top ${limit} results from ${items.length} total items`);
    const topItems = items.slice(0, limit);
    
    // Get full details for each game
    const games: BGGGame[] = [];
    
    for (const item of topItems) {
      try {
        const id = parseInt(item.$.id);
        if (isNaN(id) || id <= 0) continue;
        
        // If this is not a special case search, check if game is already in the games array
        // to prevent duplicates (especially for common games like Catan)
        if (games.some(game => game.gameId === id)) {
          console.log(`🔍 [DEBUG] Skipping duplicate game with ID ${id}`);
          continue;
        }
        
        console.log(`🔍 [DEBUG] Getting details for game ID ${id}`);
        const details = await this.getGameDetails(id);
        games.push(details);
      } catch (error) {
        console.error(`❌ Error getting details for search result ${item.$.id}:`, error);
      }
    }
    
    console.log(`🔍 [DEBUG] Returning ${games.length} search results for "${query}"`);
    
    // Sort by BGG rank
    return this.sortByRank(games);
  }
  
  private sortByRank(games: BGGGame[]): BGGGame[] {
    return [...games].sort((a, b) => {
      // If both have a rank, sort by rank
      if (a.bggRank && b.bggRank) {
        return a.bggRank - b.bggRank;
      }
      
      // Games with ranks come before games without
      if (a.bggRank) return -1;
      if (b.bggRank) return 1;
      
      // If neither has a rank, sort by name
      return a.name.localeCompare(b.name);
    });
  }
  
  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.hotGamesCache = null;
    this.gameDetailsCache.clear();
    this.searchCache.clear();
    console.log('🧹 All BGG caches cleared');
  }
}

export const newBoardGameGeekService = new NewBoardGameGeekService();