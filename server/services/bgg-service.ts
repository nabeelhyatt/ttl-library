import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { BGGGame } from '@shared/schema';

class BoardGameGeekService {
  private API_BASE = 'https://boardgamegeek.com/xmlapi2/';
  private RETRY_DELAY = 2000; // 2 seconds
  private MAX_RETRIES = 5; // Increase retry attempts
  private lastRequestTime = 0; // Track last request time for rate limiting
  
  // Cache for hot games
  private hotGamesCache: BGGGame[] | null = null;
  private hotGamesCacheTimestamp: number = 0;
  private CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
  private CACHE_HITS: number = 0; // Counter for cache hits
  
  // Add rate limiting to avoid 429 errors from BGG
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    const minDelay = 1000; // 1 second minimum between requests
    
    if (elapsed < minDelay) {
      const delay = minDelay - elapsed;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }
  
  // Handle rate limiting errors with exponential backoff
  private async handleRateLimitError(error: any, retryFn: () => Promise<any>, retries = 0): Promise<any> {
    console.error('Rate limit error from BGG API, retrying with backoff...');
    
    if (retries >= this.MAX_RETRIES) {
      throw new Error(`Failed after ${this.MAX_RETRIES} retry attempts due to rate limits`);
    }
    
    const delay = this.RETRY_DELAY * Math.pow(2, retries);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryFn();
  }
  
  // Get hot games from BGG API or cache
  async getHotGames(): Promise<BGGGame[]> {
    console.log('🚀 PERFORMANCE: GET /api/bgg/hot - Fetching hot games (will use cache if available)');
    console.log('*********************************************');
    
    const now = Date.now();
    
    // Check if cache is valid
    if (this.hotGamesCache && (now - this.hotGamesCacheTimestamp < this.CACHE_TTL)) {
      this.CACHE_HITS++;
      console.log(`✅ CACHE HIT (${this.CACHE_HITS}): Returning cached hot games`);
      console.log(`✅ Cache age: ${Math.round((now - this.hotGamesCacheTimestamp) / 1000 / 60)} minutes old`);
      console.log('*********************************************');
      return this.hotGamesCache;
    }
    
    console.log('❌ CACHE MISS: Fetching hot games from BGG API...');
    console.log(`❌ Current time: ${new Date().toLocaleTimeString()}`);
    console.log('*********************************************');
    
    try {
      await this.rateLimit();
      
      // Since we're having issues with the hot games, let's return a fixed list of popular games
      // This is a temporary hardcoded solution to get the app working again
      const popularGameIds = [
        224517, // Brass Birmingham
        342942, // Ark Nova
        366013, // Dune Imperium
        162886, // Spirit Island
        291457, // Gloomhaven
        167791, // Terraforming Mars
        174430, // Gloomhaven
        220308, // Pandemic Legacy
        233078, // Twilight Imperium
        266192  // Wingspan
      ];
      
      console.log(`Using fallback list of ${popularGameIds.length} popular games`);
      const hotGames = await this.getGamesDetails(popularGameIds);
      
      // Sort by BGG rank if available
      hotGames.sort((a, b) => {
        if (a.bggRank && b.bggRank) return a.bggRank - b.bggRank;
        if (a.bggRank) return -1;
        if (b.bggRank) return 1;
        return 0;
      });
      
      // Update cache
      this.hotGamesCache = hotGames;
      this.hotGamesCacheTimestamp = now;
      
      return hotGames;
    } catch (error) {
      console.error('Error fetching hot games:', error);
      
      // If we have cached data (even if outdated), return it as fallback
      if (this.hotGamesCache) {
        console.log('❌ Error fetching fresh data, using outdated cache as fallback');
        return this.hotGamesCache;
      }
      
      throw error;
    }
  }
  
  // Search for games matching a query
  async searchGames(query: string, options: { exact?: boolean; limit?: number; sort?: 'rank' | 'rating' | 'year' } = {}): Promise<BGGGame[]> {
    const searchGamesImpl = async () => {
      await this.rateLimit();
      
      // Build search parameters
      const params = new URLSearchParams();
      params.append('query', query);
      params.append('type', 'boardgame');
      
      if (options.exact) {
        params.append('exact', '1');
      }
      
      try {
        const response = await axios.get(`${this.API_BASE}search?${params.toString()}`);
        const result = await parseStringPromise(response.data, { explicitArray: false });
        
        // Handle no results
        if (!result.items.item) {
          return [];
        }
        
        // Ensure item is always an array
        const items = Array.isArray(result.items.item) 
          ? result.items.item 
          : [result.items.item];
        
        // Apply limit to search results if specified
        const limitedItems = options.limit 
          ? items.slice(0, options.limit) 
          : items;
        
        // Extract game IDs and fetch full details
        const gameIds = limitedItems.map((item: any) => parseInt(item.id));
        let games = await this.getGamesDetails(gameIds);
        
        // Sort results based on options
        if (options.sort) {
          switch (options.sort) {
            case 'rank':
              games = games.sort((a, b) => {
                if (a.bggRank && b.bggRank) return a.bggRank - b.bggRank;
                if (a.bggRank) return -1;
                if (b.bggRank) return 1;
                return 0;
              });
              break;
            case 'rating':
              games = games.sort((a, b) => {
                const ratingA = a.bggRating ? parseFloat(a.bggRating) : 0;
                const ratingB = b.bggRating ? parseFloat(b.bggRating) : 0;
                return ratingB - ratingA;
              });
              break;
            case 'year':
              games = games.sort((a, b) => {
                const yearA = a.yearPublished || 0;
                const yearB = b.yearPublished || 0;
                return yearB - yearA;
              });
              break;
          }
        }
        
        return games;
      } catch (error: any) {
        if (error.response && error.response.status === 429) {
          return this.handleRateLimitError(error, searchGamesImpl);
        }
        throw error;
      }
    };
    
    return searchGamesImpl();
  }
  
  // Combined search strategy with exact and partial matches
  async searchGamesCombined(query: string, options: { limit?: number } = {}): Promise<BGGGame[]> {
    console.log(`Performing combined search for query: "${query}"`);
    
    try {
      // First get exact matches (up to 3)
      const exactMatches = await this.searchGames(query, { 
        exact: true, 
        limit: 3, 
        sort: 'rank' 
      });
      
      console.log(`Found ${exactMatches.length} exact matches for "${query}"`);
      
      // Then get partial matches (up to 10)
      const partialMatches = await this.searchGames(query, { 
        exact: false, 
        limit: 10, 
        sort: 'rank' 
      });
      
      console.log(`Found ${partialMatches.length} partial matches for "${query}"`);
      
      // Combine results, removing duplicates
      const exactMatchIds = new Set(exactMatches.map(game => game.gameId));
      
      // Filter out any partial matches that are already in the exact matches
      const uniquePartialMatches = partialMatches.filter(game => !exactMatchIds.has(game.gameId));
      
      console.log(`After deduplication: ${exactMatches.length} exact matches, ${uniquePartialMatches.length} unique partial matches`);
      
      // Combine both sets
      const combinedResults = [...exactMatches, ...uniquePartialMatches];
      
      return combinedResults;
    } catch (error) {
      console.error('Error in combined search:', error);
      throw error;
    }
  }
  
  // Get details for a specific game by ID
  async getGameDetails(gameId: number, retries = 0): Promise<BGGGame> {
    // Check for valid game ID
    if (!gameId || isNaN(gameId)) {
      console.error(`Invalid game ID: ${gameId}`);
      return {
        gameId: 0,
        name: "Unknown Game",
        description: "This game could not be loaded from BoardGameGeek.",
        image: "",
        thumbnail: "",
        categories: ["Unknown"],
        mechanics: [],
        designers: [],
        publishers: []
      } as BGGGame;
    }
    
    try {
      await this.rateLimit();
      const response = await axios.get(`${this.API_BASE}thing?id=${gameId}&stats=1`);
      const result = await parseStringPromise(response.data, { explicitArray: false });
      
      if (!result.items.item) {
        throw new Error(`Game with ID ${gameId} not found`);
      }
      
      const gameData = result.items.item;
      
      // For handling name which might be an array
      let name = '';
      if (typeof gameData.name === 'string') {
        name = gameData.name;
      } else if (Array.isArray(gameData.name)) {
        name = gameData.name[0].$.value;
      } else if (gameData.name && gameData.name.$) {
        name = gameData.name.$.value;
      } else {
        name = `Game ${gameId}`;
      }
      
      // Extract game details
      const game: BGGGame = {
        gameId,
        name: name,
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
        
        // Extract categories, mechanics, designers, publishers
        categories: this.extractLinkedItems(gameData, 'boardgamecategory'),
        mechanics: this.extractLinkedItems(gameData, 'boardgamemechanic'),
        designers: this.extractLinkedItems(gameData, 'boardgamedesigner'),
        publishers: this.extractLinkedItems(gameData, 'boardgamepublisher')
      };
      
      return game;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        // BGG rate limit - wait and retry
        if (retries >= this.MAX_RETRIES) {
          console.error(`Max retries (${this.MAX_RETRIES}) exceeded for game ID ${gameId}`);
          throw new Error(`Failed to fetch game ${gameId} after ${this.MAX_RETRIES} retries due to rate limits`);
        }
        
        console.log(`BGG rate limit hit for game ${gameId}, waiting to retry (attempt ${retries + 1}/${this.MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * Math.pow(2, retries)));
        return this.getGameDetails(gameId, retries + 1);
      }
      
      throw error;
    }
  }
  
  // Get details for multiple games in parallel
  private async getGamesDetails(gameIds: number[]): Promise<BGGGame[]> {
    // Process in batches of 5 to avoid rate limits
    const batchSize = 5;
    const results: BGGGame[] = [];
    
    for (let i = 0; i < gameIds.length; i += batchSize) {
      const batch = gameIds.slice(i, i + batchSize);
      const batchPromises = batch.map(id => this.getGameDetails(id).catch(error => {
        console.error(`Error fetching details for game ${id}:`, error);
        // Return a minimal game object on error
        return {
          gameId: id,
          name: `Game ${id}`,
          description: '',
          image: '',
          thumbnail: '',
          categories: [],
          mechanics: [],
          designers: [],
          publishers: []
        } as BGGGame;
      }));
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }
  
  // Helper function to extract linked items from game data
  private extractLinkedItems(gameData: any, type: string): string[] {
    if (!gameData.link) {
      return [];
    }
    
    // Ensure link is an array
    const links = Array.isArray(gameData.link) ? gameData.link : [gameData.link];
    
    // Filter links by type and extract values
    return links
      .filter((link: any) => link.$ && link.$.type === type)
      .map((link: any) => link.$.value);
  }
  
  // Helper function to extract BGG rank
  private extractBGGRank(gameData: any): number | undefined {
    try {
      if (!gameData.statistics || !gameData.statistics.ratings || !gameData.statistics.ratings.ranks) {
        return undefined;
      }
      
      const ranks = gameData.statistics.ratings.ranks.rank;
      if (!ranks) return undefined;
      
      // Ensure ranks is an array
      const ranksArray = Array.isArray(ranks) ? ranks : [ranks];
      
      // Find the BGG rank (type = 'boardgame')
      const bggRank = ranksArray.find((rank: any) => rank.$ && rank.$.type === 'subtype' && rank.$.name === 'boardgame');
      
      // Return the rank value, or undefined if no rank or not ranked
      return bggRank && bggRank.$ && bggRank.$.value !== 'Not Ranked' ? parseInt(bggRank.$.value) : undefined;
    } catch (error) {
      console.error('Error extracting BGG rank:', error);
      return undefined;
    }
  }
}

export const boardGameGeekService = new BoardGameGeekService();