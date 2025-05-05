import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { BGGGame } from '@shared/schema';

class BoardGameGeekService {
  private API_BASE = 'https://boardgamegeek.com/xmlapi2/';
  private RETRY_DELAY = 2000; // 2 seconds
  private MAX_RETRIES = 5; // Increase retry attempts
  private lastRequestTime = 0; // Track last request time for rate limiting
  
  // Cache for hot games data
  private hotGamesCache: BGGGame[] | null = null;
  private hotGamesCacheTimestamp: number = 0;
  private CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
  private CACHE_HITS: number = 0; // Counter for cache hits
  
  // Apply rate limiting to requests
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Ensure at least 1 second between requests
    if (this.lastRequestTime > 0 && timeSinceLastRequest < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
  }
  
  // Handle rate limit errors
  private async handleRateLimitError(error: any, retryFn: () => Promise<any>, retries = 0): Promise<any> {
    if (retries >= this.MAX_RETRIES) {
      console.error(`Max retries (${this.MAX_RETRIES}) exceeded:`, error);
      throw new Error(`Failed after ${this.MAX_RETRIES} retries: ${error.message || 'Unknown error'}`);
    }
    
    if (error.response && error.response.status === 429) {
      console.log(`BGG rate limit hit, waiting to retry (attempt ${retries + 1}/${this.MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * Math.pow(2, retries)));
      return retryFn();
    }
    
    if (error.message && error.message.includes('Rate limit')) {
      console.log(`BGG rate limit hit for game ${error.gameId}, waiting to retry (attempt ${retries + 1}/${this.MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * Math.pow(2, retries)));
      return retryFn();
    }
    
    // Other errors - just throw
    throw error;
  }
  
  // Get the current hot games list
  async getHotGames(): Promise<BGGGame[]> {
    // Check if we have a valid cache
    const now = Date.now();
    if (this.hotGamesCache && (now - this.hotGamesCacheTimestamp < this.CACHE_TTL)) {
      this.CACHE_HITS++;
      const minutesRemaining = Math.floor((this.CACHE_TTL - (now - this.hotGamesCacheTimestamp)) / 60000);
      console.log('*********************************************');
      console.log(`🔄 CACHE HIT #${this.CACHE_HITS}: Using cached hot games (expires in ${minutesRemaining} minutes)`);
      console.log(`🔄 Cache created: ${new Date(this.hotGamesCacheTimestamp).toLocaleTimeString()}`);
      console.log(`🔄 Cache expires: ${new Date(this.hotGamesCacheTimestamp + this.CACHE_TTL).toLocaleTimeString()}`);
      console.log(`🔄 Cache hits since server start: ${this.CACHE_HITS}`);
      console.log('*********************************************');
      return this.hotGamesCache;
    }
    
    console.log('*********************************************');
    console.log('❌ CACHE MISS: Fetching hot games from BGG API...');
    console.log(`❌ Current time: ${new Date().toLocaleTimeString()}`);
    console.log('*********************************************');
    
    const fetchHotGames = async (retries = 0): Promise<BGGGame[]> => {
      try {
        await this.rateLimit();
        const response = await axios.get(`${this.API_BASE}hot?type=boardgame`);
        const result = await parseStringPromise(response.data, { explicitArray: false });
        
        // Extract game IDs from the hot list
        const gameIds = result.items.item.map((item: any) => parseInt(item.$.id)).slice(0, 20); // Reduce to 20 games
        
        // Fetch details for each game
        const gamesWithDetails = await this.getGamesDetails(gameIds);
        
        return gamesWithDetails;
      } catch (error) {
        return this.handleRateLimitError(
          error, 
          () => fetchHotGames(retries + 1),
          retries
        );
      }
    };
    
    try {
      // Fetch fresh data from BGG
      const hotGames = await fetchHotGames();
      
      // Update cache with new data and timestamp
      this.hotGamesCache = hotGames;
      this.hotGamesCacheTimestamp = Date.now();
      console.log('*********************************************');
      console.log(`✅ CACHE UPDATED: Stored ${hotGames.length} hot games in cache (valid for 1 hour)`);
      console.log(`✅ Cache created at: ${new Date(this.hotGamesCacheTimestamp).toLocaleTimeString()}`);
      console.log(`✅ Cache expires at: ${new Date(this.hotGamesCacheTimestamp + this.CACHE_TTL).toLocaleTimeString()}`);
      console.log('*********************************************');
      
      return hotGames;
    } catch (error) {
      console.error('Error fetching hot games from BGG:', error);
      
      // If we have an expired cache, return it as a fallback
      if (this.hotGamesCache) {
        console.log('Returning expired cache as fallback due to BGG API error');
        return this.hotGamesCache;
      }
      
      throw new Error('Failed to fetch hot games from BoardGameGeek');
    }
  }
  
  // Search games by name
  async searchGames(query: string, options: { exact?: boolean; limit?: number; sort?: 'rank' | 'rating' | 'year' } = {}): Promise<BGGGame[]> {
    const searchGamesImpl = async (retries = 0): Promise<BGGGame[]> => {
      try {
        await this.rateLimit();
        const searchQuery = options.exact ? `"${query}"` : query;
        let url = `${this.API_BASE}search?type=boardgame`;
        
        // Add search parameters
        if (options.exact) {
          url += `&exact=1&query=${encodeURIComponent(searchQuery)}`;
        } else {
          // Try to match start of name for better results
          url += `&query=${encodeURIComponent(searchQuery)}`;
        }
        
        const response = await axios.get(url);
        const result = await parseStringPromise(response.data, { explicitArray: false });
        
        // Check if there are results
        if (!result.items.item) {
          return [];
        }
        
        // Ensure items.item is an array
        const items = Array.isArray(result.items.item) ? result.items.item : [result.items.item];
        
        // Extract game IDs from search results
        const gameIds = items.map((item: any) => parseInt(item.$.id)).slice(0, options.limit || 10);
        
        // Get full details for games
        let games = await this.getGamesDetails(gameIds);
        
        // Sort by chosen field
        if (options.sort === 'rank') {
          games = games.sort((a, b) => (a.bggRank || 9999) - (b.bggRank || 9999));
        } else if (options.sort === 'rating') {
          games = games.sort((a, b) => {
            const ratingA = a.bggRating ? parseFloat(a.bggRating) : 0;
            const ratingB = b.bggRating ? parseFloat(b.bggRating) : 0;
            return ratingB - ratingA; // Higher rating first
          });
        } else if (options.sort === 'year') {
          games = games.sort((a, b) => (b.yearPublished || 0) - (a.yearPublished || 0)); // Newer first
        }
        
        return games;
      } catch (error) {
        return this.handleRateLimitError(
          error, 
          () => searchGamesImpl(retries + 1),
          retries
        );
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
    try {
      await this.rateLimit();
      const response = await axios.get(`${this.API_BASE}thing?id=${gameId}&stats=1`);
      const result = await parseStringPromise(response.data, { explicitArray: false });
      
      if (!result.items.item) {
        throw new Error(`Game with ID ${gameId} not found`);
      }
      
      const gameData = result.items.item;
      
      // Extract game details
      const game: BGGGame = {
        gameId,
        name: gameData.name.$.value || 'Unknown Game',
        description: gameData.description || '',
        image: gameData.image || '',
        thumbnail: gameData.thumbnail || '',
        yearPublished: gameData.yearpublished ? parseInt(gameData.yearpublished.$.value) : undefined,
        minPlayers: gameData.minplayers ? parseInt(gameData.minplayers.$.value) : undefined,
        maxPlayers: gameData.maxplayers ? parseInt(gameData.maxplayers.$.value) : undefined,
        playingTime: gameData.playingtime ? parseInt(gameData.playingtime.$.value) : undefined,
        minPlayTime: gameData.minplaytime ? parseInt(gameData.minplaytime.$.value) : undefined,
        maxPlayTime: gameData.maxplaytime ? parseInt(gameData.maxplaytime.$.value) : undefined,
        minAge: gameData.minage ? parseInt(gameData.minage.$.value) : undefined,
        bggRating: gameData.statistics?.ratings?.average?.$?.value || undefined,
        bggRank: this.extractBGGRank(gameData),
        weightRating: gameData.statistics?.ratings?.averageweight?.$?.value || undefined,
        
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
        console.error(`Error fetching details for game ${id}:`, error.message);
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
        };
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
      .filter((link: any) => link.$.type === type)
      .map((link: any) => link.$.value);
  }
  
  // Helper function to extract BGG rank
  private extractBGGRank(gameData: any): number | undefined {
    try {
      const ranks = gameData.statistics?.ratings?.ranks?.rank;
      if (!ranks) return undefined;
      
      // Ensure ranks is an array
      const ranksArray = Array.isArray(ranks) ? ranks : [ranks];
      
      // Find the BGG rank (type = 'boardgame')
      const bggRank = ranksArray.find((rank: any) => rank.$.type === 'subtype' && rank.$.name === 'boardgame');
      
      // Return the rank value, or undefined if no rank or not ranked
      return bggRank && bggRank.$.value !== 'Not Ranked' ? parseInt(bggRank.$.value) : undefined;
    } catch (error) {
      console.error('Error extracting BGG rank:', error);
      return undefined;
    }
  }
}

export const boardGameGeekService = new BoardGameGeekService();