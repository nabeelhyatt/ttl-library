import Airtable from 'airtable';
import { Vote, User, Game } from '@shared/schema';
import { storage } from '../storage';

class AirtableService {
  private base: Airtable.Base;
  private usersTable: Airtable.Table<any>;
  private gamesTable: Airtable.Table<any>;
  private votesTable: Airtable.Table<any>;
  
  constructor() {
    // Initialize Airtable with API key
    Airtable.configure({
      apiKey: process.env.AIRTABLE_API_KEY || '',
    });
    
    const baseId = process.env.AIRTABLE_BASE_ID || '';
    this.base = Airtable.base(baseId);
    
    // Define tables
    this.usersTable = this.base('Users');
    this.gamesTable = this.base('Games');
    this.votesTable = this.base('Votes');
  }
  
  // User methods
  async createUser(user: User): Promise<string> {
    try {
      const record = await this.usersTable.create({
        'Email': user.email,
        'Last Login': user.lastLogin ? user.lastLogin.toISOString() : null,
      });
      
      return record.getId();
    } catch (error) {
      console.error('Error creating user in Airtable:', error);
      // Continue without Airtable if it fails
      return '';
    }
  }
  
  async updateUser(user: User): Promise<void> {
    try {
      // Find user record in Airtable by email
      const records = await this.usersTable.select({
        filterByFormula: `{Email} = "${user.email}"`,
      }).firstPage();
      
      if (records.length > 0) {
        await this.usersTable.update(records[0].id, {
          'Last Login': user.lastLogin ? user.lastLogin.toISOString() : null,
        });
      } else {
        // Create if not exists
        await this.createUser(user);
      }
    } catch (error) {
      console.error('Error updating user in Airtable:', error);
      // Continue without Airtable if it fails
    }
  }
  
  // Game methods
  async createGame(game: Game): Promise<string> {
    try {
      const record = await this.gamesTable.create({
        'BGG ID': game.bggId,
        'Name': game.name,
        'Description': game.description || '',
        'Image URL': game.image || '',
        'Thumbnail URL': game.thumbnail || '',
        'Year Published': game.yearPublished || null,
        'Min Players': game.minPlayers || null,
        'Max Players': game.maxPlayers || null,
        'Playing Time': game.playingTime || null,
        'BGG Rating': game.bggRating || null,
        'BGG Rank': game.bggRank || null,
        'Weight Rating': game.weightRating || null,
        'Categories': (game.categories || []).join(', '),
        'Mechanics': (game.mechanics || []).join(', '),
        'Designers': (game.designers || []).join(', '),
        'Publishers': (game.publishers || []).join(', '),
      });
      
      return record.getId();
    } catch (error) {
      console.error('Error creating game in Airtable:', error);
      // Continue without Airtable if it fails
      return '';
    }
  }
  
  async getGameByBGGId(bggId: number): Promise<{
    tlcsCode?: string;
    forRent?: boolean;
    forSale?: boolean;
    toOrder?: boolean;
    categories?: string[];
  } | null> {
    try {
      console.log(`Looking for game with BGG ID ${bggId} in Airtable`);
      
      const records = await this.gamesTable.select({
        filterByFormula: `{BGG ID} = ${bggId}`,
        fields: [
          'BGG ID', 
          'TLCS Code', 
          'to Order', 
          '# for Rent', 
          '# for Sale', 
          'Title',
          'TLCS Subcategory',
          'Subcategory Name (from TLCS Subcategory)'
        ]
      }).firstPage();
      
      if (records.length === 0) {
        console.log(`No game found with BGG ID ${bggId} in Airtable`);
        return null;
      }
      
      const record = records[0];
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
        result.tlcsCode = fields['TLCS Code'] as string;
      }
      
      // Add subcategory name if available (using the correct field name)
      if (fields['Subcategory Name (from TLCS Subcategory)']) {
        // This field returns an array - either use the first value or join them with commas
        const subcategoryNames = fields['Subcategory Name (from TLCS Subcategory)'] as string[];
        if (Array.isArray(subcategoryNames) && subcategoryNames.length > 0) {
          result.subcategoryName = subcategoryNames.join(', ');
        } else if (typeof subcategoryNames === 'string') {
          result.subcategoryName = subcategoryNames;
        }
        console.log('Found subcategory name:', result.subcategoryName);
      }
      
      // Add availability information with correct Airtable field names
      // Check if numeric fields are > 0, treat as boolean fields otherwise
      const toOrderValue = fields['to Order'];
      const forRentValue = fields['# for Rent'];
      const forSaleValue = fields['# for Sale'];
      
      // Log the values to help with debugging
      console.log('Availability data:', {
        toOrder: toOrderValue,
        forRent: forRentValue,
        forSale: forSaleValue
      });
      
      // Convert to numbers if possible, otherwise use Boolean conversion
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
      
      // Just use an empty array for categories since we don't have them in Airtable
      result.categories = [];
      
      console.log('Game data from Airtable:', JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error('Error retrieving game from Airtable:', error);
      return null;
    }
  }
  
  // Vote methods
  async createVote(vote: Vote): Promise<string> {
    try {
      // Get user and game details
      const user = await storage.getUser(vote.userId);
      const game = await storage.getGame(vote.gameId);
      
      if (!user || !game) {
        throw new Error('User or game not found');
      }
      
      // Create or update user in Airtable
      await this.updateUser(user);
      
      // Create or update game in Airtable
      let gameAirtableId = '';
      const gameRecords = await this.gamesTable.select({
        filterByFormula: `{BGG ID} = ${game.bggId}`,
      }).firstPage();
      
      if (gameRecords.length > 0) {
        gameAirtableId = gameRecords[0].id;
      } else {
        gameAirtableId = await this.createGame(game);
      }
      
      // Find user record in Airtable
      const userRecords = await this.usersTable.select({
        filterByFormula: `{Email} = "${user.email}"`,
      }).firstPage();
      
      if (userRecords.length === 0 || !gameAirtableId) {
        throw new Error('User or game not found in Airtable');
      }
      
      // Create vote record
      const voteRecord = await this.votesTable.create({
        'User': [userRecords[0].id],
        'Game': [gameAirtableId],
        'Vote Type': vote.voteType,
        'Created At': vote.createdAt ? vote.createdAt.toISOString() : new Date().toISOString(),
      });
      
      return voteRecord.getId();
    } catch (error) {
      console.error('Error creating vote in Airtable:', error);
      // Continue without Airtable if it fails
      return '';
    }
  }
  
  async updateVote(vote: Vote): Promise<void> {
    try {
      // Get all votes for this user-game combination
      const voteRecords = await this.votesTable.select({
        filterByFormula: `AND({User Record ID} = "${vote.userId}", {Game Record ID} = "${vote.gameId}")`,
      }).firstPage();
      
      if (voteRecords.length > 0) {
        // Update existing vote
        await this.votesTable.update(voteRecords[0].id, {
          'Vote Type': vote.voteType,
        });
      } else {
        // Create new vote if not found
        await this.createVote(vote);
      }
    } catch (error) {
      console.error('Error updating vote in Airtable:', error);
      // Continue without Airtable if it fails
    }
  }
  
  async deleteVote(voteId: number): Promise<void> {
    try {
      // Find the vote in our storage first
      const vote = await storage.getVote(voteId);
      if (!vote) {
        throw new Error('Vote not found');
      }
      
      // Get user and game details
      const user = await storage.getUser(vote.userId);
      const game = await storage.getGame(vote.gameId);
      
      if (!user || !game) {
        throw new Error('User or game not found');
      }
      
      // Find the vote in Airtable
      const userRecords = await this.usersTable.select({
        filterByFormula: `{Email} = "${user.email}"`,
      }).firstPage();
      
      const gameRecords = await this.gamesTable.select({
        filterByFormula: `{BGG ID} = ${game.bggId}`,
      }).firstPage();
      
      if (userRecords.length === 0 || gameRecords.length === 0) {
        // Skip if we can't find the records
        return;
      }
      
      const voteRecords = await this.votesTable.select({
        filterByFormula: `AND({User} = "${userRecords[0].id}", {Game} = "${gameRecords[0].id}")`,
      }).firstPage();
      
      if (voteRecords.length > 0) {
        // Delete the vote
        await this.votesTable.destroy(voteRecords[0].id);
      }
    } catch (error) {
      console.error('Error deleting vote in Airtable:', error);
      // Continue without Airtable if it fails
    }
  }
}

export const airtableService = new AirtableService();
