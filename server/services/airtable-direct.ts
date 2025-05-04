/**
 * This service implements direct API calls to Airtable based on the successful MCP approach
 * that worked in our tests.
 */

import { Vote, User, Game } from '@shared/schema';
import { storage } from '../storage';
import { VoteType } from '@shared/schema';

export class AirtableDirectService {
  private apiKey: string;
  private baseId: string;

  constructor() {
    this.apiKey = process.env.AIRTABLE_API_KEY || '';
    this.baseId = process.env.AIRTABLE_BASE_ID || '';
    
    if (!this.apiKey) {
      console.error('AIRTABLE_API_KEY environment variable is not set');
    }
    
    if (!this.baseId) {
      console.error('AIRTABLE_BASE_ID environment variable is not set');
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
      
      // Convert to boolean values
      if (typeof toOrderValue === 'number') {
        result.toOrder = toOrderValue > 0;
      } else {
        result.toOrder = Boolean(toOrderValue);
      }
      
      if (typeof forRentValue === 'number') {
        result.forRent = forRentValue > 0;
      } else {
        result.forRent = Boolean(forRentValue);
      }
      
      if (typeof forSaleValue === 'number') {
        result.forSale = forSaleValue > 0;
      } else {
        result.forSale = Boolean(forSaleValue);
      }
      
      // Just use an empty array for categories
      result.categories = [];
      
      console.log('Game data from Airtable:', JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('Error retrieving game from Airtable:', error);
      return null;
    }
  }
  
  // Helper functions
  
  /**
   * Finds a member in Airtable by email
   */
  private async findMember(email: string): Promise<string | null> {
    try {
      const encodedFormula = encodeURIComponent(`{Email}="${email}"`);
      const url = `https://api.airtable.com/v0/${this.baseId}/Members?filterByFormula=${encodedFormula}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        console.error(`Error finding member: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      
      if (!data.records || data.records.length === 0) {
        console.log(`No member found with email ${email}`);
        return null;
      }
      
      console.log(`Found member with ID: ${data.records[0].id}`);
      return data.records[0].id;
    } catch (err) {
      console.error('Error finding member:', err instanceof Error ? err.message : String(err));
      return null;
    }
  }
  
  /**
   * Finds or creates a member in Airtable
   */
  private async findOrCreateMember(user: User): Promise<string | null> {
    // First try to find existing member
    const memberId = await this.findMember(user.email);
    if (memberId) {
      // If member exists and they have a name, update their Full Name field
      if (user.name) {
        await this.updateMemberName(memberId, user.name);
      }
      return memberId;
    }
    
    // If not found, create a new member
    try {
      console.log(`Creating member with email ${user.email} and name ${user.name || 'N/A'}`);
      
      const payload = {
        fields: {
          "Email": user.email,
          "Full Name": user.name || '' // Add the Full Name field
        }
      };
      
      const response = await fetch(`https://api.airtable.com/v0/${this.baseId}/Members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating member:', JSON.stringify(errorData));
        return null;
      }
      
      const data = await response.json();
      console.log(`Created member with ID: ${data.id}`);
      return data.id;
    } catch (err) {
      console.error('Error creating member:', err instanceof Error ? err.message : String(err));
      return null;
    }
  }
  
  /**
   * Finds a game in Airtable by BGG ID
   */
  private async findGame(bggId: number): Promise<string | null> {
    try {
      const encodedFormula = encodeURIComponent(`{BGG ID}=${bggId}`);
      const url = `https://api.airtable.com/v0/${this.baseId}/Games?filterByFormula=${encodedFormula}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        console.error(`Error finding game: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      
      if (!data.records || data.records.length === 0) {
        console.log(`No game found with BGG ID ${bggId}`);
        return null;
      }
      
      console.log(`Found game with ID: ${data.records[0].id}`);
      return data.records[0].id;
    } catch (err) {
      console.error('Error finding game:', err instanceof Error ? err.message : String(err));
      return null;
    }
  }
  
  /**
   * Creates a game in Airtable with data from BGG
   */
  private async createGameInAirtable(game: Game): Promise<string | null> {
    try {
      console.log(`Creating new game record in Airtable for ${game.name} (BGG ID: ${game.bggId})`);
      
      // Use only the most essential fields that we know are safe
      const payload = {
        fields: {
          "Title": game.name || "",
          "BGG ID": game.bggId,
          "Year Published": game.yearPublished || null,
          "Player Count Min": game.minPlayers || null,
          "Player Count Max": game.maxPlayers || null,
          "Play Time": game.playingTime || null,
          "BGG Rating": parseFloat(game.bggRating || '0'),
          "Complexity": parseFloat(game.weightRating || '0'),
          "Thumbnail": game.thumbnail || ""
        }
      };
      
      console.log('Game creation payload:', JSON.stringify(payload));
      
      const response = await fetch(`https://api.airtable.com/v0/${this.baseId}/Games`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating game in Airtable:', JSON.stringify(errorData));
        return null;
      }
      
      const data = await response.json();
      console.log(`Successfully created game in Airtable with ID: ${data.id}`);
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
      const encodedFormula = encodeURIComponent(`AND({Member}="${memberId}", {Game}="${gameId}")`);
      const url = `https://api.airtable.com/v0/${this.baseId}/Votes?filterByFormula=${encodedFormula}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        console.error(`Error finding vote: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      
      if (!data.records || data.records.length === 0) {
        console.log(`No vote found for member ${memberId} and game ${gameId}`);
        return null;
      }
      
      console.log(`Found vote with ID: ${data.records[0].id}`);
      return data.records[0].id;
    } catch (err) {
      console.error('Error finding vote:', err instanceof Error ? err.message : String(err));
      return null;
    }
  }
  
  /**
   * Updates a member's name in Airtable
   */
  private async updateMemberName(memberId: string, name: string): Promise<void> {
    try {
      console.log(`Updating member ${memberId} with name: "${name}"`);
      
      const payload = {
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
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error updating member name in Airtable:', JSON.stringify(errorData));
        return;
      }
      
      console.log(`Successfully updated name for member ${memberId}`);
    } catch (err) {
      console.error('Error updating member name:', err instanceof Error ? err.message : String(err));
    }
  }
  
  /**
   * Converts VoteType enum to string values expected by Airtable
   */
  private getVoteTypeString(voteType: number): string {
    switch (voteType) {
      case VoteType.WantToTry:
        return "Want to try";
      case VoteType.PlayedWillPlayAgain:
        return "Played, again!";
      case VoteType.WouldJoinClub:
        return "Join club";
      case VoteType.WouldJoinTournament:
        return "Tournament";
      case VoteType.WouldTeach:
        return "Would teach";
      default:
        return "Want to try"; // Default value
    }
  }
}

export const airtableDirectService = new AirtableDirectService();