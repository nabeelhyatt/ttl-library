import Airtable from 'airtable';

/**
 * This utility file is for debugging the Airtable connection and understanding field structure
 */

export async function testAirtableWrite() {
  try {
    console.log('Starting Airtable write test...');
    
    // Initialize Airtable with API key
    const apiKey = process.env.AIRTABLE_API_KEY || '';
    // Securely log part of the key for debugging
    const maskedKey = apiKey ? 
      `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 
      'not provided';
    console.log(`Using Airtable API key: ${maskedKey}`);
    
    Airtable.configure({
      apiKey: apiKey,
      requestTimeout: 30000, // 30 second timeout
    });
    
    const baseId = process.env.AIRTABLE_BASE_ID || '';
    if (!baseId) {
      console.error('AIRTABLE_BASE_ID environment variable is not set');
      return { success: false, error: 'Base ID not provided' };
    }
    console.log(`Using Airtable Base ID: ${baseId}`);
    
    const base = Airtable.base(baseId);
    
    // Try to write to Users table first
    try {
      console.log('\nAttempting to write to Users table...');
      const usersTable = base('Users');
      const testUser = {
        'Email': `test-${Date.now()}@example.com`,
        'Last Login': new Date().toISOString()
      };
      console.log('Payload for user creation:', JSON.stringify(testUser));
      
      const userRecord = await usersTable.create(testUser);
      console.log('Successfully created user with ID:', userRecord.getId());
      
      // Try to write to Games table
      try {
        console.log('\nAttempting to write to Games table...');
        const gamesTable = base('Games');
        const testGame = {
          'Title': `Test Game ${Date.now()}`,
          'BGG ID': Math.floor(Math.random() * 1000000),
        };
        console.log('Payload for game creation:', JSON.stringify(testGame));
        
        const gameRecord = await gamesTable.create(testGame);
        console.log('Successfully created game with ID:', gameRecord.getId());
        
        // Now try to write to Votes table
        try {
          console.log('\nAttempting to write to Votes table...');
          const votesTable = base('Votes');
          
          // Check if the Votes table structure uses User/Game or different field names
          const testVote = {
            'User': [userRecord.getId()],  // Link to user
            'Game': [gameRecord.getId()],  // Link to game
            'Vote Type': 1,
            'Created At': new Date().toISOString()
          };
          console.log('Payload for vote creation:', JSON.stringify(testVote));
          
          const voteRecord = await votesTable.create(testVote);
          console.log('Successfully created vote with ID:', voteRecord.getId());
          
          return { 
            success: true, 
            results: {
              user: userRecord.getId(),
              game: gameRecord.getId(),
              vote: voteRecord.getId()
            }
          };
        } catch (voteErr) {
          console.error('Error writing to Votes table:', voteErr);
          
          // Try alternative field names
          console.log('\nTrying alternative field names for Votes table...');
          try {
            const votesTable = base('Votes');
            const altTestVote = {
              'User ID': [userRecord.getId()],  // Try alternate name
              'Game ID': [gameRecord.getId()],  // Try alternate name 
              'Vote Type': 1,
              'Created': new Date().toISOString()  // Try alternate name
            };
            console.log('Alternative payload for vote creation:', JSON.stringify(altTestVote));
            
            const voteRecord = await votesTable.create(altTestVote);
            console.log('Successfully created vote with ID using alternative fields:', voteRecord.getId());
            
            return { 
              success: true, 
              results: {
                user: userRecord.getId(),
                game: gameRecord.getId(),
                vote: voteRecord.getId()
              }
            };
          } catch (altVoteErr) {
            console.error('Error writing to Votes table with alternative fields:', altVoteErr);
            return { 
              success: false, 
              partialResults: {
                user: userRecord.getId(),
                game: gameRecord.getId()
              },
              error: `Vote error: ${altVoteErr instanceof Error ? altVoteErr.message : String(altVoteErr)}`
            };
          }
        }
      } catch (gameErr) {
        console.error('Error writing to Games table:', gameErr);
        return { 
          success: false, 
          partialResults: {
            user: userRecord.getId()
          },
          error: `Game error: ${gameErr instanceof Error ? gameErr.message : String(gameErr)}`
        };
      }
    } catch (userErr) {
      console.error('Error writing to Users table:', userErr);
      return { 
        success: false, 
        error: `User error: ${userErr instanceof Error ? userErr.message : String(userErr)}`
      };
    }
  } catch (err) {
    console.error('General error in Airtable write test:', err);
    return { 
      success: false, 
      error: `General error: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}

export async function debugAirtableBase() {
  try {
    // Initialize Airtable with API key
    Airtable.configure({
      apiKey: process.env.AIRTABLE_API_KEY || '',
    });
    
    const baseId = process.env.AIRTABLE_BASE_ID || '';
    if (!baseId) {
      console.error('AIRTABLE_BASE_ID environment variable is not set');
      return;
    }
    
    const base = Airtable.base(baseId);
    
    // We can't directly list tables with the JavaScript SDK, so we'll 
    // try to access common table names and see what works
    console.log('Checking for common Airtable tables...');
    
    // Check for Members table (or Users table)
    console.log('\nAttempting to access Members table...');
    try {
      const membersTable = base('Members');
      const members = await membersTable.select({
        maxRecords: 3
      }).firstPage();
      
      console.log(`Found ${members.length} members in the Members table`);
      if (members.length > 0) {
        console.log('Sample member fields:');
        const fields = members[0].fields;
        Object.keys(fields).forEach(fieldName => {
          const value = fields[fieldName];
          const valueType = Array.isArray(value) ? 'array' : typeof value;
          console.log(`  ${fieldName}: ${JSON.stringify(value)} (${valueType})`);
        });
      }
    } catch (err) {
      console.log('Error accessing Members table:', err instanceof Error ? err.message : String(err));
      
      // Try Users table instead
      console.log('\nAttempting to access Users table instead...');
      try {
        const usersTable = base('Users');
        const users = await usersTable.select({
          maxRecords: 3
        }).firstPage();
        
        console.log(`Found ${users.length} users in the Users table`);
        if (users.length > 0) {
          console.log('Sample user fields:');
          const fields = users[0].fields;
          Object.keys(fields).forEach(fieldName => {
            const value = fields[fieldName];
            const valueType = Array.isArray(value) ? 'array' : typeof value;
            console.log(`  ${fieldName}: ${JSON.stringify(value)} (${valueType})`);
          });
        }
      } catch (userErr) {
        console.log('Error accessing Users table:', userErr instanceof Error ? userErr.message : String(userErr));
      }
    }
    
    // Check for Votes table
    console.log('\nAttempting to access Votes table...');
    try {
      const votesTable = base('Votes');
      const votes = await votesTable.select({
        maxRecords: 3
      }).firstPage();
      
      console.log(`Found ${votes.length} votes in the Votes table`);
      if (votes.length > 0) {
        console.log('Sample vote fields:');
        const fields = votes[0].fields;
        Object.keys(fields).forEach(fieldName => {
          const value = fields[fieldName];
          const valueType = Array.isArray(value) ? 'array' : typeof value;
          console.log(`  ${fieldName}: ${JSON.stringify(value)} (${valueType})`);
        });
      }
    } catch (err) {
      console.log('Error accessing Votes table:', err instanceof Error ? err.message : String(err));
    }
    
    // Access the Games table and fetch a few records
    console.log('\nFetching Games data...');
    try {
      const gamesTable = base('Games');
      const records = await gamesTable.select({
        maxRecords: 3
      }).firstPage();
      
      console.log(`Found ${records.length} games in Airtable`);
      
      // For each record, log all field names and their values
      records.forEach(record => {
        console.log(`\nGame: ${record.get('Title') || 'Unknown'} (Record ID: ${record.id})`);
        console.log('All fields:');
        
        const fields = record.fields;
        Object.keys(fields).forEach(fieldName => {
          const value = fields[fieldName];
          const valueType = Array.isArray(value) ? 'array' : typeof value;
          console.log(`  ${fieldName}: ${JSON.stringify(value)} (${valueType})`);
        });
        
        // Specifically check for subcategory fields
        console.log('\nChecking specific fields:');
        console.log(`  TLCS Subcategory: ${JSON.stringify(record.get('TLCS Subcategory'))}`);
        console.log(`  Subcategory Name (from TLCS Subcategory): ${JSON.stringify(record.get('Subcategory Name (from TLCS Subcategory)'))}`);
      });
    } catch (err) {
      console.log('Error accessing Games table:', err instanceof Error ? err.message : String(err));
    }
    
    // Access the TLCS Subcategories table
    console.log('\nFetching TLCS Subcategories...');
    try {
      const subcategoriesTable = base('TLCS Subcategory');
      const subcategories = await subcategoriesTable.select({
        maxRecords: 5
      }).firstPage();
      
      console.log(`Found ${subcategories.length} subcategories in Airtable`);
      
      // For each subcategory, log its name and other fields
      subcategories.forEach(subcategory => {
        console.log(`\nSubcategory: ${subcategory.get('Name') || 'Unknown'} (Record ID: ${subcategory.id})`);
        console.log('All fields:');
        
        const fields = subcategory.fields;
        Object.keys(fields).forEach(fieldName => {
          const value = fields[fieldName];
          const valueType = Array.isArray(value) ? 'array' : typeof value;
          console.log(`  ${fieldName}: ${JSON.stringify(value)} (${valueType})`);
        });
      });
    } catch (err) {
      console.log('Error accessing TLCS Subcategory table:', err instanceof Error ? err.message : String(err));
    }
    
  } catch (err) {
    console.error('Error debugging Airtable:', err instanceof Error ? err.message : String(err));
  }
}