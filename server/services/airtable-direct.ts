/**
 * This service implements direct API calls to Airtable based on the successful MCP approach
 * that worked in our tests.
 */

import { Vote, User, Game } from '@shared/schema';
import { storage } from '../storage';
import { VoteType } from '@shared/schema';

export interface GameWithVotes {
  id: number;
  bggId: number;
  name: string;
  subcategory: string | null;
  voteCount: number;
}

export interface CategoryWithVotes {
  id: number;
  name: string;
  description: string;
  voteCount: number;
}

export class AirtableDirectService {
  private apiKey: string;
  private baseId: string;

  constructor() {
    this.apiKey = process.env.AIRTABLE_API_KEY || '';
    this.baseId = process.env.AIRTABLE_BASE_ID || '';
    
    if (!this.apiKey) {
      console.error('AIRTABLE_API_KEY environment variable is not set');
      console.error('Airtable integration will not work in deployment. Please set the environment variable in the Deployment settings.');
    }
    
    if (!this.baseId) {
      console.error('AIRTABLE_BASE_ID environment variable is not set');
      console.error('Airtable integration will not work in deployment. Please set the environment variable in the Deployment settings.');
    }
    
    // Log a success message if both are configured
    if (this.apiKey && this.baseId) {
      console.log('Airtable credentials configured successfully');
    }
  }
  
  /**
   * Get game statistics from TLCS Categories table in Airtable
   */
  async getGameStats(): Promise<{
    totalGames: number;
    gamesOnOrder: number;
    gamesInStock: number;
    votedGames: number;
    categories: {
      id: string;
      name: string; 
      description: string;
      totalGames: number;
      votedGames: number;
    }[]
  }> {
    try {
      if (!this.apiKey || !this.baseId) {
        console.error('Airtable configuration is incomplete');
        return {
          totalGames: 0,
          gamesOnOrder: 0,
          gamesInStock: 0,
          votedGames: 0,
          categories: []
        };
      }
      
      console.log('Fetching game statistics from Airtable');
      
      // Get count of games explicitly marked as "to Order" from the Games table
      // This helps us distinguish between games in stock vs on order
      const encodedFormula = encodeURIComponent('{to Order}=1');
      const gamesOnOrderUrl = `https://api.airtable.com/v0/${this.baseId}/Games?filterByFormula=${encodedFormula}&fields%5B%5D=BGG%20ID`;
      
      // Get count of games with at least one vote
      const votedGamesUrl = `https://api.airtable.com/v0/${this.baseId}/Games?filterByFormula=NOT({# Votes}=BLANK())&fields%5B%5D=#%20Votes`;
      
      // Get total number of games (count all records in Games table)
      const totalGamesUrl = `https://api.airtable.com/v0/${this.baseId}/Games?fields%5B%5D=Title`;
      
      // Make all requests in parallel
      const [onOrderResponse, votedResponse, totalResponse] = await Promise.all([
        fetch(gamesOnOrderUrl, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${this.apiKey}` }
        }),
        fetch(votedGamesUrl, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${this.apiKey}` }
        }),
        fetch(totalGamesUrl, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${this.apiKey}` }
        })
      ]);
      
      if (!onOrderResponse.ok || !votedResponse.ok || !totalResponse.ok) {
        console.error('Error fetching game statistics from Airtable:', {
          onOrderStatus: onOrderResponse.status,
          votedStatus: votedResponse.status,
          totalStatus: totalResponse.status
        });
        return {
          totalGames: 0,
          gamesOnOrder: 0,
          gamesInStock: 0,
          votedGames: 0,
          categories: []
        };
      }
      
      // Parse responses
      const [onOrderData, votedData, totalData] = await Promise.all([
        onOrderResponse.json(),
        votedResponse.json(),
        totalResponse.json()
      ]);
      
      const gamesOnOrder = onOrderData.records?.length || 0;
      const totalGames = totalData.records?.length || 0;
      const votedGames = votedData.records?.length || 0;
      const gamesInStock = totalGames - gamesOnOrder;
      
      console.log(`Total: ${totalGames}, In Stock: ${gamesInStock}, On Order: ${gamesOnOrder}, Voted For: ${votedGames}`);
      
      // For now, return empty categories since we're not using them in the UI
      // We can enhance this later if needed
      const categories: any[] = [];
      
      return {
        totalGames,
        gamesInStock,
        gamesOnOrder,
        votedGames,
        categories
      };
    } catch (err) {
      console.error('Error fetching game statistics from Airtable:', err instanceof Error ? err.message : String(err));
      return {
        totalGames: 0,
        gamesOnOrder: 0,
        gamesInStock: 0,
        votedGames: 0,
        categories: []
      };
    }
  }

  /**
   * Creates a vote in Airtable using direct API calls with the correct format
   */
  async createVote(vote: Vote): Promise<string> {
    try {
      if (!this.apiKey || !this.baseId) {
        console.error('Airtable configuration is incomplete');
        return '';
      }
      
      // Get user and game details
      const user = await storage.getUser(vote.userId);
      const game = await storage.getGame(vote.gameId);
      
      if (!user || !game) {
        throw new Error('User or game not found');
      }
      
      console.log('Creating vote in Airtable:');
      console.log(`- User: ${user.id} (${user.email})`);
      console.log(`- Game: ${game.id} (${game.name}, BGG ID: ${game.bggId})`);
      console.log(`- Vote Type: ${vote.voteType}`);
      
      // First step: Find or create user in Airtable
      const memberId = await this.findOrCreateMember(user);
      if (!memberId) {
        console.log('Could not find or create member in Airtable');
        return '';
      }
      
      // Second step: Find game in Airtable, or create if it doesn't exist
      let gameId = await this.findGame(game.bggId);
      
      // If game doesn't exist in Airtable, create it with data from our storage
      if (!gameId) {
        console.log(`Game with BGG ID ${game.bggId} not found in Airtable. Creating new record...`);
        gameId = await this.createGameInAirtable(game);
        
        if (!gameId) {
          console.log('Failed to create game in Airtable, skipping vote creation');
          return '';
        }
        
        console.log(`Successfully created game with BGG ID ${game.bggId} in Airtable`);
      }
      
      // Create the vote with the correct structure
      const votePayload = {
        fields: {
          "Member": [memberId],
          "Game": [gameId],
          "Vote Type": this.getVoteTypeString(vote.voteType)
        }
      };
      
      console.log('Vote creation payload:', JSON.stringify(votePayload));
      
      const response = await fetch(`https://api.airtable.com/v0/${this.baseId}/Votes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(votePayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating vote in Airtable:', JSON.stringify(errorData));
        return '';
      }
      
      const data = await response.json();
      console.log('Successfully created vote in Airtable:', JSON.stringify(data));
      return data.id;
    } catch (err) {
      console.error('Error creating vote in Airtable:', err instanceof Error ? err.message : String(err));
      return '';
    }
  }
  
  /**
   * Updates a vote in Airtable
   */
  async updateVote(vote: Vote): Promise<void> {
    try {
      if (!this.apiKey || !this.baseId) {
        console.error('Airtable configuration is incomplete');
        return;
      }
      
      console.log(`Updating vote in Airtable: Vote ID ${vote.id}`);
      
      // Get user and game details
      const user = await storage.getUser(vote.userId);
      const game = await storage.getGame(vote.gameId);
      
      if (!user || !game) {
        console.log('User or game not found, cannot update vote');
        return;
      }
      
      // Find member in Airtable
      const memberId = await this.findOrCreateMember(user);
      if (!memberId) {
        console.log('Could not find member in Airtable');
        return;
      }
      
      // Find game in Airtable, or create if it doesn't exist
      let gameId = await this.findGame(game.bggId);
      
      // If game doesn't exist in Airtable, create it with data from our storage
      if (!gameId) {
        console.log(`Game with BGG ID ${game.bggId} not found in Airtable. Creating new record...`);
        gameId = await this.createGameInAirtable(game);
        
        if (!gameId) {
          console.log('Failed to create game in Airtable, skipping vote update');
          return;
        }
        
        console.log(`Successfully created game with BGG ID ${game.bggId} in Airtable`);
      }
      
      // Find existing vote
      const voteId = await this.findVote(memberId, gameId);
      if (!voteId) {
        console.log('No existing vote found, creating new vote');
        await this.createVote(vote);
        return;
      }
      
      // Update the vote
      const updatePayload = {
        fields: {
          "Vote Type": this.getVoteTypeString(vote.voteType)
        }
      };
      
      console.log(`Updating vote ${voteId} with:`, JSON.stringify(updatePayload));
      
      const response = await fetch(`https://api.airtable.com/v0/${this.baseId}/Votes/${voteId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error updating vote in Airtable:', JSON.stringify(errorData));
        return;
      }
      
      const data = await response.json();
      console.log('Successfully updated vote in Airtable:', JSON.stringify(data));
    } catch (err) {
      console.error('Error updating vote in Airtable:', err instanceof Error ? err.message : String(err));
    }
  }
  
  /**
   * Deletes a vote in Airtable
   */
  async deleteVote(voteId: number): Promise<void> {
    try {
      if (!this.apiKey || !this.baseId) {
        console.error('Airtable configuration is incomplete');
        return;
      }
      
      console.log(`Deleting vote from Airtable: Vote ID ${voteId}`);
      
      // Important: In case the vote is already deleted from local storage,
      // we need to directly query Airtable for votes with the given ID
      const encodedFormula = encodeURIComponent(`{Vote ID}=${voteId}`);
      const url = `https://api.airtable.com/v0/${this.baseId}/Votes?filterByFormula=${encodedFormula}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        console.error(`Error finding vote in Airtable: ${response.status} ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      
      if (!data.records || data.records.length === 0) {
        console.log(`No vote found with Vote ID ${voteId} in Airtable`);
        return;
      }
      
      // Get the Airtable record ID for the vote
      const airtableVoteId = data.records[0].id;
      console.log(`Found vote in Airtable with record ID: ${airtableVoteId}`);
      
      // Delete the vote directly using its record ID
      const deleteResponse = await fetch(`https://api.airtable.com/v0/${this.baseId}/Votes/${airtableVoteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        console.error('Error deleting vote in Airtable:', JSON.stringify(errorData));
        return;
      }
      
      console.log(`Successfully deleted vote with ID ${voteId} from Airtable`);
    } catch (err) {
      console.error('Error deleting vote from Airtable:', err instanceof Error ? err.message : String(err));
    }
  }

  /**
   * Retrieves game details from Airtable by BGG ID
   */
  async getGameByBGGId(bggId: number): Promise<{
    tlcsCode?: string;
    subcategoryName?: string;
    forRent?: boolean;
    forSale?: boolean;
    toOrder?: boolean;
    categories?: string[];
  } | null> {
    try {
      if (!this.apiKey || !this.baseId) {
        console.error('Airtable configuration is incomplete');
        return null;
      }
      
      console.log(`Looking for game with BGG ID ${bggId} in Airtable`);
      
      // Construct the URL with the filter
      const url = `https://api.airtable.com/v0/${this.baseId}/Games?filterByFormula={BGG%20ID}=${bggId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        console.error(`Error retrieving game from Airtable: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      
      if (!data.records || data.records.length === 0) {
        console.log(`No game found with BGG ID ${bggId} in Airtable`);
        return null;
      }
      
      const record = data.records[0];
      const fields = record.fields;
      
      console.log(`Found game "${fields['Title'] || 'Unknown'}" in Airtable`);
      console.log('Available fields:', Object.keys(fields));
      
      // Create result object
      const result: {
        tlcsCode?: string;
        subcategoryName?: string;
        forRent?: boolean;
        forSale?: boolean;
        toOrder?: boolean;
        categories?: string[];
      } = {};
      
      // Add TLCS code if available
      if (fields['TLCS Code']) {
        result.tlcsCode = fields['TLCS Code'];
      }
      
      // Add subcategory name if available
      const exactFieldName = 'Subcategory Name (from TLCS Subcategory)';
      if (fields[exactFieldName]) {
        const subcategoryNames = fields[exactFieldName];
        console.log(`Raw subcategory data:`, subcategoryNames, `Type:`, typeof subcategoryNames);
        
        if (Array.isArray(subcategoryNames) && subcategoryNames.length > 0) {
          result.subcategoryName = subcategoryNames.join(', ');
          console.log('Found subcategory name (array):', result.subcategoryName);
        } else if (typeof subcategoryNames === 'string') {
          result.subcategoryName = subcategoryNames;
          console.log('Found subcategory name (string):', result.subcategoryName);
        } else {
          console.log('Subcategory name found but has unexpected type:', typeof subcategoryNames);
        }
      } else {
        console.log('No subcategory name found in fields');
      }
      
      // Add availability information
      const toOrderValue = fields['to Order'];
      const forRentValue = fields['# for Rent'];
      const forSaleValue = fields['# for Sale'];
      
      console.log('Availability data:', {
        toOrder: toOrderValue,
        forRent: forRentValue,
        forSale: forSaleValue
      });
      
      result.toOrder = Boolean(toOrderValue);
      result.forRent = Boolean(forRentValue && forRentValue > 0);
      result.forSale = Boolean(forSaleValue && forSaleValue > 0);
      
      // Return result
      console.log('Game data from Airtable:', result);
      return result;
    } catch (err) {
      console.error('Error retrieving game from Airtable:', err instanceof Error ? err.message : String(err));
      return null;
    }
  }

  private async findMember(email: string): Promise<string | null> {
    try {
      if (!this.apiKey || !this.baseId) {
        console.error('Airtable configuration is incomplete');
        return null;
      }
      
      // Encode the query
      const encodedFormula = encodeURIComponent(`LOWER({Email}) = "${email.toLowerCase()}"`);
      const url = `https://api.airtable.com/v0/${this.baseId}/Members?filterByFormula=${encodedFormula}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        console.error(`Error finding member in Airtable: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      
      if (!data.records || data.records.length === 0) {
        console.log(`No member found with email ${email} in Airtable`);
        return null;
      }
      
      console.log(`Found member with email ${email} in Airtable: ${data.records[0].id}`);
      return data.records[0].id;
    } catch (err) {
      console.error('Error finding member in Airtable:', err instanceof Error ? err.message : String(err));
      return null;
    }
  }
  
  /**
   * Finds or creates a member in Airtable
   */
  private async findOrCreateMember(user: User): Promise<string | null> {
    try {
      if (!this.apiKey || !this.baseId) {
        console.error('Airtable configuration is incomplete');
        return null;
      }
      
      // First, try to find the member by email
      const memberId = await this.findMember(user.email);
      
      // If member exists, check if we need to update the name
      if (memberId) {
        // Update full name if needed
        if (user.name) {
          await this.updateMemberName(memberId, user.name);
        }
        return memberId;
      }
      
      // If not found, create a new member
      console.log(`Creating new member in Airtable for ${user.email}`);
      
      const createPayload = {
        fields: {
          "Email": user.email,
          "Full Name": user.name || ""
          // Removed "Member ID" field as it's computed in Airtable
        }
      };
      
      const response = await fetch(`https://api.airtable.com/v0/${this.baseId}/Members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createPayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating member in Airtable:', JSON.stringify(errorData));
        return null;
      }
      
      const data = await response.json();
      console.log('Successfully created member in Airtable:', JSON.stringify(data));
      return data.id;
    } catch (err) {
      console.error('Error creating member in Airtable:', err instanceof Error ? err.message : String(err));
      return null;
    }
  }
  
  /**
   * Finds a game in Airtable by BGG ID
   */
  private async findGame(bggId: number): Promise<string | null> {
    try {
      if (!this.apiKey || !this.baseId) {
        console.error('Airtable configuration is incomplete');
        return null;
      }
      
      // Construct the URL with the filter
      const url = `https://api.airtable.com/v0/${this.baseId}/Games?filterByFormula={BGG%20ID}=${bggId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        console.error(`Error finding game in Airtable: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      
      if (!data.records || data.records.length === 0) {
        console.log(`No game found with BGG ID ${bggId} in Airtable`);
        return null;
      }
      
      console.log(`Found game with BGG ID ${bggId} in Airtable: ${data.records[0].id}`);
      return data.records[0].id;
    } catch (err) {
      console.error('Error finding game in Airtable:', err instanceof Error ? err.message : String(err));
      return null;
    }
  }
  
  /**
   * Creates a game in Airtable with data from BGG
   */
  private async createGameInAirtable(game: Game): Promise<string | null> {
    try {
      if (!this.apiKey || !this.baseId) {
        console.error('Airtable configuration is incomplete');
        return null;
      }
      
      console.log(`Creating game in Airtable: ${game.name} (BGG ID: ${game.bggId})`);
      
      // Create the game with the necessary fields
      const createPayload = {
        fields: {
          "Title": game.name,
          "BGG ID": game.bggId,
          "Year Published": game.yearPublished || null,
          "Player Count Min": game.minPlayers || null,
          "Player Count Max": game.maxPlayers || null,
          // Only add subcategory if we have one
          ...(game.subcategory ? { "Subcategory": game.subcategory } : {})
        }
      };
      
      const response = await fetch(`https://api.airtable.com/v0/${this.baseId}/Games`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createPayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating game in Airtable:', JSON.stringify(errorData));
        return null;
      }
      
      const data = await response.json();
      console.log('Successfully created game in Airtable:', JSON.stringify(data));
      return data.id;
    } catch (err) {
      console.error('Error creating game in Airtable:', err instanceof Error ? err.message : String(err));
      return null;
    }
  }
  
  /**
   * Finds a vote in Airtable by member and game IDs
   */
  private async findVote(memberId: string, gameId: string): Promise<string | null> {
    try {
      if (!this.apiKey || !this.baseId) {
        console.error('Airtable configuration is incomplete');
        return null;
      }
      
      // Create a formula to find votes where both Member and Game match
      const encodedFormula = encodeURIComponent(`AND(FIND("${memberId}", ARRAYJOIN(Member)), FIND("${gameId}", ARRAYJOIN(Game)))`);
      const url = `https://api.airtable.com/v0/${this.baseId}/Votes?filterByFormula=${encodedFormula}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        console.error(`Error finding vote in Airtable: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      
      if (!data.records || data.records.length === 0) {
        console.log(`No vote found for member ${memberId} and game ${gameId} in Airtable`);
        return null;
      }
      
      console.log(`Found vote for member ${memberId} and game ${gameId} in Airtable: ${data.records[0].id}`);
      return data.records[0].id;
    } catch (err) {
      console.error('Error finding vote in Airtable:', err instanceof Error ? err.message : String(err));
      return null;
    }
  }
  
  /**
   * Updates a member's name in Airtable
   */
  private async updateMemberName(memberId: string, name: string): Promise<void> {
    try {
      if (!this.apiKey || !this.baseId) {
        console.error('Airtable configuration is incomplete');
        return;
      }
      
      console.log(`Updating member name in Airtable. Member ID: ${memberId}, New Name: ${name}`);
      
      const updatePayload = {
        fields: {
          "Full Name": name
        }
      };
      
      const response = await fetch(`https://api.airtable.com/v0/${this.baseId}/Members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error updating member name in Airtable:', JSON.stringify(errorData));
        return;
      }
      
      console.log(`Successfully updated name for member ${memberId} in Airtable`);
    } catch (err) {
      console.error('Error updating member name in Airtable:', err instanceof Error ? err.message : String(err));
    }
  }
  
  /**
   * Get most voted games from Airtable, sorted by total votes
   */
  async getMostVotedGames(limit: number = 15): Promise<GameWithVotes[]> {
    try {
      if (!this.apiKey || !this.baseId) {
        console.error('Airtable configuration is incomplete');
        return [];
      }
      
      console.log(`Fetching most voted games from Airtable (limit: ${limit})...`);
      
      // Construct the URL to get games sorted by vote count
      // We'll select fields we need and sort by "# Votes" in descending order
      const fields = [
        'Title', 
        'BGG ID', 
        '# Votes',
        'Subcategory Name (from TLCS Subcategory)'
      ].map(field => `fields%5B%5D=${encodeURIComponent(field)}`).join('&');
      
      const url = `https://api.airtable.com/v0/${this.baseId}/Games?${fields}&sort%5B0%5D%5Bfield%5D=${encodeURIComponent('# Votes')}&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=${limit}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching games from Airtable: ${response.status} ${response.statusText}`, errorText);
        return [];
      }
      
      const data = await response.json();
      
      if (!data.records || data.records.length === 0) {
        console.log('No games found in Airtable');
        return [];
      }
      
      console.log(`Retrieved ${data.records.length} games with votes from Airtable`);
      
      // Map Airtable records to our GameWithVotes interface
      const games: GameWithVotes[] = data.records.map((record: any, index: number) => {
        const fields = record.fields;
        return {
          id: index,
          bggId: parseInt(fields['BGG ID'] || 0),
          name: fields['Title'] || 'Unknown Game',
          subcategory: fields['Subcategory Name (from TLCS Subcategory)'] 
            ? Array.isArray(fields['Subcategory Name (from TLCS Subcategory)']) 
              ? fields['Subcategory Name (from TLCS Subcategory)'][0] 
              : fields['Subcategory Name (from TLCS Subcategory)'] 
            : null,
          voteCount: parseInt(fields['# Votes'] || 0) // Updated to use '# Votes' field
        };
      });
      
      return games;
    } catch (err) {
      console.error('Error fetching games from Airtable:', err instanceof Error ? err.message : String(err));
      return [];
    }
  }

  /**
   * Get category data with vote counts from TLCS Categories table
   */
  async getCategoryVotes(): Promise<CategoryWithVotes[]> {
    try {
      if (!this.apiKey || !this.baseId) {
        console.error('Airtable configuration is incomplete');
        return [];
      }
      
      console.log(`Fetching category votes from Airtable...`);
      
      // Construct the URL to get categories
      // We'll select fields we need and include vote count information
      const fields = [
        'Category Code',
        'Category Name',
        'Category Description',
        'Total Games (Votes)', // Correct field name from TLCS Categories table
        'Total Games' // Field for number of games in stock
      ].map(field => `fields%5B%5D=${encodeURIComponent(field)}`).join('&');
      
      // Get the correct table ID for TLCS Categories
      const tableId = 'tblWT4nF0DlbeGA4c'; // TLCS Categories table ID
      const url = `https://api.airtable.com/v0/${this.baseId}/${tableId}?${fields}&sort%5B0%5D%5Bfield%5D=Category%20Code&sort%5B0%5D%5Bdirection%5D=asc`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching categories from Airtable: ${response.status} ${response.statusText}`, errorText);
        return [];
      }
      
      const data = await response.json();
      
      if (!data.records || data.records.length === 0) {
        console.log('No categories found in Airtable');
        return [];
      }
      
      console.log(`Retrieved ${data.records.length} categories from Airtable`);
      
      // Map Airtable records to our CategoryWithVotes interface
      const categories: CategoryWithVotes[] = data.records.map((record: any) => {
        const fields = record.fields;
        
        // Log the fields to debug the response
        console.log(`Category ${fields['Category Name']} field data:`, fields);
        
        return {
          code: fields['Category Code'] || '',
          name: fields['Category Name'] || '',
          description: fields['Category Description'] || '',
          voteCount: parseInt(fields['Total Games (Votes)'] || 0),
          totalGames: parseInt(fields['Total Games'] || 0)
        };
      });
      
      return categories;
    } catch (err) {
      console.error('Error fetching categories from Airtable:', err instanceof Error ? err.message : String(err));
      return [];
    }
  }
  
  /**
   * Converts VoteType enum to string values expected by Airtable
   */
  private getVoteTypeString(voteType: number): string {
    // Updated to match the exact values from Airtable screenshot
    switch (voteType) {
      case VoteType.WantToTry:
        return 'Want to try';
      case VoteType.PlayedWillPlayAgain:
        return 'Would play again';
      case VoteType.WouldJoinClub:
        return 'Would play regularly';
      case VoteType.WouldJoinTournament:
        return 'Would play again'; // Fallback to an existing option
      case VoteType.WouldTeach:
        return 'Would play regularly'; // Fallback to an existing option
      default:
        return 'Want to try';
    }
  }
}

export const airtableDirectService = new AirtableDirectService();