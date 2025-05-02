import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { BGGGame } from '@shared/schema';

class BoardGameGeekService {
  private API_BASE = 'https://boardgamegeek.com/xmlapi2/';
  private RETRY_DELAY = 2000; // 2 seconds
  private MAX_RETRIES = 5; // Increase retry attempts
  private lastRequestTime = 0; // Track last request time for rate limiting
  
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
      return await fetchHotGames();
    } catch (error) {
      console.error('Error fetching hot games from BGG:', error);
      throw new Error('Failed to fetch hot games from BoardGameGeek');
    }
  }
  
  // Search games by name
  async searchGames(query: string): Promise<BGGGame[]> {
    const searchGamesImpl = async (retries = 0): Promise<BGGGame[]> => {
      try {
        await this.rateLimit();
        const response = await axios.get(`${this.API_BASE}search?query=${encodeURIComponent(query)}&type=boardgame`);
        const result = await parseStringPromise(response.data, { explicitArray: false });
        
        // Check if there are results
        if (!result.items.item) {
          return [];
        }
        
        // Ensure items.item is an array
        const items = Array.isArray(result.items.item) ? result.items.item : [result.items.item];
        
        // Extract game IDs from search results, limit to 10 for better performance
        const gameIds = items.map((item: any) => parseInt(item.$.id)).slice(0, 10);
        
        // Fetch details for each game
        const gamesWithDetails = await this.getGamesDetails(gameIds);
        
        return gamesWithDetails;
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
