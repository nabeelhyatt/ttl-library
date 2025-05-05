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
    // Check if this is a rate limit error
    if (error?.response?.status === 429 && retries < this.MAX_RETRIES) {
      console.log(`BGG rate limit hit, waiting to retry (attempt ${retries + 1}/${this.MAX_RETRIES})`);
      
      // Wait longer for each retry
      const delay = this.RETRY_DELAY * (retries + 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Try again
      return retryFn();
    }
    
    // If not a rate limit error or max retries exceeded, rethrow
    throw error;
  }

  // Get hot games from BGG
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
        
        // First get exact matches
        const exactUrl = `${this.API_BASE}search?type=boardgame&exact=1&query=${encodeURIComponent(`"${query}"`)}`; 
        const exactResponse = await axios.get(exactUrl);
        const exactResult = await parseStringPromise(exactResponse.data, { explicitArray: false });
        
        // Then get general matches
        const generalUrl = `${this.API_BASE}search?type=boardgame&query=${encodeURIComponent(query)}`;
        const generalResponse = await axios.get(generalUrl);
        const generalResult = await parseStringPromise(generalResponse.data, { explicitArray: false });
        
        // Process exact matches
        const exactItems = exactResult.items.item ? 
          (Array.isArray(exactResult.items.item) ? exactResult.items.item : [exactResult.items.item]) : 
          [];
        const exactIds = exactItems.slice(0, 3).map((item: any) => parseInt(item.$.id));
        
        // Process general matches
        const generalItems = generalResult.items.item ? 
          (Array.isArray(generalResult.items.item) ? generalResult.items.item : [generalResult.items.item]) : 
          [];
        const generalIds = generalItems
          .map((item: any) => parseInt(item.$.id))
          .filter((id: number) => !exactIds.includes(id)) // Remove duplicates
          .slice(0, 10);
        
        // Combine IDs
        const allIds = [...exactIds, ...generalIds];
        
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
        
        // Get full details and sort by BGG rank
        const games = await this.getGamesDetails(allIds);
        games.sort((a, b) => {
          const rankA = a.bggRank || 999999;
          const rankB = b.bggRank || 999999;
          return rankA - rankB;
        });
        
        return games;
      } catch (error) {
        return this.handleRateLimitError(
          error, 
          () => searchGamesImpl(retries + 1),
          retries
        );
      }
    };
    
    try {
      return await searchGamesImpl();
    } catch (error) {
      console.error('Error searching games on BGG:', error);
      throw new Error('Failed to search games on BoardGameGeek');
    }
  }
  
  // Get details for a single game
  async getGameDetails(gameId: number, retries = 0): Promise<BGGGame> {
    try {
      await this.rateLimit();
      const response = await axios.get(`${this.API_BASE}thing?id=${gameId}&stats=1`);
      
      // Check for "please wait" response
      if (response.data.includes('Please wait a bit')) {
        if (retries < this.MAX_RETRIES) {
          console.log(`BGG returned "please wait" for game ${gameId}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
          return this.getGameDetails(gameId, retries + 1);
        } else {
          throw new Error('Too many retries for BGG API');
        }
      }
      
      const result = await parseStringPromise(response.data, { explicitArray: false });
      const gameData = result.items.item;
      
      // Handle names - can be array or single object
      let primaryName = '';
      if (Array.isArray(gameData.name)) {
        const primaryNameObj = gameData.name.find((n: any) => n.$.type === 'primary');
        primaryName = primaryNameObj ? primaryNameObj.$.value : gameData.name[0].$.value;
      } else {
        primaryName = gameData.name.$.value;
      }
      
      // Extract categories, mechanics, designers, and publishers
      const categories: string[] = [];
      const mechanics: string[] = [];
      const designers: string[] = [];
      const publishers: string[] = [];
      
      if (gameData.link) {
        const links = Array.isArray(gameData.link) ? gameData.link : [gameData.link];
        links.forEach((link: any) => {
          switch (link.$.type) {
            case 'boardgamecategory':
              categories.push(link.$.value);
              break;
            case 'boardgamemechanic':
              mechanics.push(link.$.value);
              break;
            case 'boardgamedesigner':
              designers.push(link.$.value);
              break;
            case 'boardgamepublisher':
              publishers.push(link.$.value);
              break;
          }
        });
      }
      
      // Build the game object
      return {
        gameId: parseInt(gameData.$.id),
        name: primaryName,
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
        bggRating: gameData.statistics?.ratings?.average?.$.value || undefined,
        bggRank: this.extractBGGRank(gameData),
        weightRating: gameData.statistics?.ratings?.averageweight?.$.value || undefined,
        categories,
        mechanics,
        designers,
        publishers
      };
    } catch (error: any) {
      // Handle rate limit errors
      if (error?.response?.status === 429 && retries < this.MAX_RETRIES) {
        console.log(`BGG rate limit hit for game ${gameId}, waiting to retry (attempt ${retries + 1}/${this.MAX_RETRIES})`);
        const delay = this.RETRY_DELAY * (retries + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.getGameDetails(gameId, retries + 1);
      }
      
      console.error(`Error fetching game details for ID ${gameId}:`, error);
      throw new Error(`Failed to fetch game details from BoardGameGeek for game ID ${gameId}`);
    }
  }
  
  // Get details for multiple games
  private async getGamesDetails(gameIds: number[]): Promise<BGGGame[]> {
    const gamesWithDetails: BGGGame[] = [];
    
    for (let i = 0; i < gameIds.length; i += 10) {
      // Process in batches of 10 to avoid overloading the API
      const batch = gameIds.slice(i, i + 10);
      const batchPromises = batch.map(id => this.getGameDetails(id));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            gamesWithDetails.push(result.value);
          }
        });
        
        // Small delay between batches to be nice to the BGG API
        if (i + 10 < gameIds.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Error processing batch of game details:', error);
      }
    }
    
    return gamesWithDetails;
  }
  
  // Extract BGG rank from game data
  private extractBGGRank(gameData: any): number | undefined {
    try {
      if (!gameData.statistics?.ratings?.ranks?.rank) {
        return undefined;
      }
      
      const ranks = Array.isArray(gameData.statistics.ratings.ranks.rank) 
        ? gameData.statistics.ratings.ranks.rank 
        : [gameData.statistics.ratings.ranks.rank];
      
      // Find the boardgame rank (type = 'subtype', name = 'boardgame')
      const boardgameRank = ranks.find((rank: any) => 
        rank.$.type === 'subtype' && rank.$.name === 'boardgame'
      );
      
      if (boardgameRank && boardgameRank.$.value !== 'Not Ranked') {
        return parseInt(boardgameRank.$.value);
      }
      
      return undefined;
    } catch (error) {
      console.error('Error extracting BGG rank:', error);
      return undefined;
    }
  }
}

export const boardGameGeekService = new BoardGameGeekService();
