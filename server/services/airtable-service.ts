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
      console.log('Creating user in Airtable:', {
        email: user.email,
        lastLogin: user.lastLogin
      });
      
      // In Airtable, the table might be named "Members" instead of "Users"
      // And the fields might be named differently
      const fields: any = {
        // Try both possible field names for email
        'Email': user.email,
        // Add Full Name field if available
        'Full Name': user.name || '',
      };
      
      // Add Last Login field if available
      if (user.lastLogin) {
        fields['Last Login'] = user.lastLogin.toISOString();
      }
      
      console.log('Airtable user creation payload:', fields);
      
      const record = await this.usersTable.create(fields);
      
      // Handle the case where getId() might not exist
      return typeof record.getId === 'function' ? record.getId() : record.id;
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
          'Full Name': user.name || '',
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
      
      return typeof record.getId === 'function' ? record.getId() : record.id;
    } catch (error) {
      console.error('Error creating game in Airtable:', error);
      // Continue without Airtable if it fails
      return '';
    }
  }
  
  async getGameByBGGId(bggId: number): Promise<{
    tlcsCode?: string;
    subcategoryName?: string;
    forRent?: boolean;
    forSale?: boolean;
    toOrder?: boolean;
    categories?: string[];
  } | null> {
    try {
      console.log(`Looking for game with BGG ID ${bggId} in Airtable`);
      
      // Using the exact field name as shown in Airtable
      const desiredFields = [
        'BGG ID', 
        'TLCS Code', 
        'to Order', 
        '# for Rent', 
        '# for Sale', 
        'Title',
        'TLCS Subcategory',
        'Subcategory Name (from TLCS Subcategory)'
      ];
      
      console.log(`Requesting fields: ${desiredFields.join(', ')}`);
      
      const records = await this.gamesTable.select({
        filterByFormula: `{BGG ID} = ${bggId}`,
        fields: desiredFields
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
      console.log(`Checking for subcategory name in fields:`, Object.keys(fields));
      
      const exactFieldName = 'Subcategory Name (from TLCS Subcategory)';
      
      if (fields[exactFieldName]) {
        // This field returns an array - either use the first value or join them with commas
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
  
  // Helper method to convert numeric vote types to string values expected by Airtable
  // Based on the attached content, Airtable expects specific string values
  private getVoteTypeString(voteType: number): string {
    // Maps the VoteType enum to the string values expected by Airtable
    // based on the actual options from the Airtable screenshot
    switch (voteType) {
      case 1: // WantToTry
        return "Want to try";
      case 2: // PlayedWillPlayAgain
        return "Would play again";
      case 3: // WouldJoinClub
        return "Would play regularly";
      case 4: // WouldJoinTournament
        return "Would play again"; // Fallback to existing option
      case 5: // WouldTeach
        return "Would play regularly"; // Fallback to existing option
      default:
        return "Want to try"; // Default value
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
      
      // Log detailed information for debugging
      console.log('Creating vote in Airtable:');
      console.log(`- User: ${user.id} (${user.email})`);
      console.log(`- Game: ${game.id} (${game.name}, BGG ID: ${game.bggId})`);
      console.log(`- Vote Type: ${vote.voteType}`);
      
      // Create or update user in Airtable - this is optional, continue if it fails
      try {
        await this.updateUser(user);
      } catch (err) {
        const userError = err instanceof Error ? err : new Error(String(err));
        console.log('Warning: Could not update user in Airtable:', userError.message);
        // Continue anyway
      }
      
      // Find game in Airtable - this is optional, continue if it fails
      let gameAirtableId = '';
      try {
        const gameRecords = await this.gamesTable.select({
          filterByFormula: `{BGG ID} = ${game.bggId}`,
        }).firstPage();
        
        if (gameRecords.length > 0) {
          gameAirtableId = gameRecords[0].id;
          console.log(`Found game in Airtable with ID: ${gameAirtableId}`);
        } else {
          console.log('Game not found in Airtable, skipping vote creation in Airtable');
          return '';
        }
      } catch (err) {
        const gameError = err instanceof Error ? err : new Error(String(err));
        console.log('Warning: Could not find game in Airtable:', gameError.message);
        return '';
      }
      
      // Find user record in Airtable
      try {
        const userRecords = await this.usersTable.select({
          filterByFormula: `{Email} = "${user.email}"`,
        }).firstPage();
        
        if (userRecords.length === 0) {
          console.log('User not found in Airtable, attempting to create user');
          try {
            await this.createUser(user);
            // Try to find user again
            const newUserRecords = await this.usersTable.select({
              filterByFormula: `{Email} = "${user.email}"`,
            }).firstPage();
            
            if (newUserRecords.length > 0) {
              // Create vote record with newly created user
              console.log('Successfully created user, creating vote');
              // Based on the Airtable documentation, the field names might be different
              // The field names for linked records could be "Member" instead of "User"
              // and the vote type might have specific string values
              const votePayload: any = {
                // Try both possible field names for linked records
                'Member': [newUserRecords[0].id],  // This might be the correct field name
                'Game': [gameAirtableId],
                // Add vote type - this might need to be converted to a string value
                'Vote Type': this.getVoteTypeString(vote.voteType),
              };
              
              // Add creation date with both possible field names
              const creationDate = vote.createdAt ? vote.createdAt.toISOString() : new Date().toISOString();
              votePayload['Created At'] = creationDate;
              votePayload['Created'] = creationDate;  // Alternative field name
              
              console.log('Vote creation payload:', JSON.stringify(votePayload));
              
              const voteRecord = await this.votesTable.create(votePayload);
              
              console.log('Successfully created vote in Airtable');
              return typeof voteRecord.getId === 'function' ? voteRecord.getId() : voteRecord.id;
            } else {
              console.log('Created user but could not find it in Airtable');
              return '';
            }
          } catch (err) {
            const createUserError = err instanceof Error ? err : new Error(String(err));
            console.log('Could not create user in Airtable:', createUserError.message);
            return '';
          }
        }
        
        // Create vote record with existing user
        console.log('Found user in Airtable, creating vote');
        
        // Based on the Airtable documentation, the field names might be different
        const votePayload: any = {
          // Try both possible field names for linked records
          'Member': [userRecords[0].id],  // Primary field name based on the attached content
          'User': [userRecords[0].id],    // Alternative field name
          'Game': [gameAirtableId],
          // Add vote type - this might need to be converted to a string value
          'Vote Type': this.getVoteTypeString(vote.voteType),
        };
        
        // Add creation date with both possible field names
        const creationDate = vote.createdAt ? vote.createdAt.toISOString() : new Date().toISOString();
        votePayload['Created At'] = creationDate;
        votePayload['Created'] = creationDate;  // Alternative field name
        
        console.log('Vote creation payload:', JSON.stringify(votePayload));
        
        const voteRecord = await this.votesTable.create(votePayload);
        
        console.log('Successfully created vote in Airtable');
        return typeof voteRecord.getId === 'function' ? voteRecord.getId() : voteRecord.id;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Error creating vote in Airtable:', error.message);
        return '';
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Error creating vote in Airtable:', error.message);
      // Continue without Airtable if it fails
      return '';
    }
  }
  
  async updateVote(vote: Vote): Promise<void> {
    try {
      console.log(`Updating vote in Airtable: Vote ID ${vote.id}, User ID ${vote.userId}, Game ID ${vote.gameId}`);
      
      // Get user and game details
      const user = await storage.getUser(vote.userId);
      const game = await storage.getGame(vote.gameId);
      
      if (!user || !game) {
        console.log('User or game not found, cannot update vote in Airtable');
        return;
      }
      
      console.log(`Updating vote for user ${user.email} and game ${game.name} (BGG ID: ${game.bggId})`);
      
      // Find user and game records in Airtable
      try {
        const userRecords = await this.usersTable.select({
          filterByFormula: `{Email} = "${user.email}"`,
        }).firstPage();
        
        const gameRecords = await this.gamesTable.select({
          filterByFormula: `{BGG ID} = ${game.bggId}`,
        }).firstPage();
        
        if (userRecords.length === 0 || gameRecords.length === 0) {
          console.log('User or game not found in Airtable, cannot update vote');
          return;
        }
        
        // Try to find existing vote - we need to check both possible field names
        console.log(`Looking for existing vote with Member=${userRecords[0].id} and Game=${gameRecords[0].id}`);
        
        // First try with "Member" field
        let voteRecords = await this.votesTable.select({
          filterByFormula: `AND({Member} = "${userRecords[0].id}", {Game} = "${gameRecords[0].id}")`,
        }).firstPage();
        
        // If not found, try with "User" field
        if (voteRecords.length === 0) {
          console.log(`No vote found with Member field, trying User field instead`);
          voteRecords = await this.votesTable.select({
            filterByFormula: `AND({User} = "${userRecords[0].id}", {Game} = "${gameRecords[0].id}")`,
          }).firstPage();
        }
        
        if (voteRecords.length > 0) {
          // Update existing vote
          console.log(`Found existing vote in Airtable (ID: ${voteRecords[0].id}), updating Vote Type to ${vote.voteType}`);
          await this.votesTable.update(voteRecords[0].id, {
            'Vote Type': this.getVoteTypeString(vote.voteType),
          });
          console.log('Successfully updated vote in Airtable');
        } else {
          // Create new vote if not found
          console.log('No existing vote found in Airtable, creating new vote');
          await this.createVote(vote);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Error finding vote in Airtable:', error.message);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Error updating vote in Airtable:', error.message);
      // Continue without Airtable if it fails
    }
  }
  
  async deleteVote(voteId: number): Promise<void> {
    try {
      console.log(`Deleting vote from Airtable: Vote ID ${voteId}`);
      
      // Find the vote in our storage first
      const vote = await storage.getVote(voteId);
      if (!vote) {
        console.log(`Vote with ID ${voteId} not found in local storage`);
        return;
      }
      
      // Get user and game details
      const user = await storage.getUser(vote.userId);
      const game = await storage.getGame(vote.gameId);
      
      if (!user || !game) {
        console.log('User or game not found, cannot delete vote from Airtable');
        return;
      }
      
      console.log(`Deleting vote for user ${user.email} and game ${game.name} (BGG ID: ${game.bggId})`);
      
      try {
        // Find the vote in Airtable
        const userRecords = await this.usersTable.select({
          filterByFormula: `{Email} = "${user.email}"`,
        }).firstPage();
        
        if (userRecords.length === 0) {
          console.log(`User with email ${user.email} not found in Airtable`);
          return;
        }
        
        const gameRecords = await this.gamesTable.select({
          filterByFormula: `{BGG ID} = ${game.bggId}`,
        }).firstPage();
        
        if (gameRecords.length === 0) {
          console.log(`Game with BGG ID ${game.bggId} not found in Airtable`);
          return;
        }
        
        console.log(`Looking for vote with Member=${userRecords[0].id} and Game=${gameRecords[0].id}`);
        
        // First try with "Member" field
        let voteRecords = await this.votesTable.select({
          filterByFormula: `AND({Member} = "${userRecords[0].id}", {Game} = "${gameRecords[0].id}")`,
        }).firstPage();
        
        // If not found, try with "User" field
        if (voteRecords.length === 0) {
          console.log(`No vote found with Member field, trying User field instead`);
          voteRecords = await this.votesTable.select({
            filterByFormula: `AND({User} = "${userRecords[0].id}", {Game} = "${gameRecords[0].id}")`,
          }).firstPage();
        }
        
        if (voteRecords.length > 0) {
          // Delete the vote
          console.log(`Found vote in Airtable (ID: ${voteRecords[0].id}), deleting it`);
          await this.votesTable.destroy(voteRecords[0].id);
          console.log('Successfully deleted vote from Airtable');
        } else {
          console.log('No matching vote found in Airtable');
        }
      } catch (error) {
        console.error('Error finding vote in Airtable:', error instanceof Error ? error.message : String(error));
      }
    } catch (error) {
      console.error('Error deleting vote from Airtable:', error instanceof Error ? error.message : String(error));
      // Continue without Airtable if it fails
    }
  }
}

export const airtableService = new AirtableService();
