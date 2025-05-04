import Airtable from 'airtable';

/**
 * This test file is specifically created based on the information
 * from the attached content to test the Airtable API with the correct field names
 */

export async function testAirtableMCP() {
  try {
    console.log('Starting Airtable MCP (Meta Control Panel) test...');
    
    // Initialize Airtable with API key
    const apiKey = process.env.AIRTABLE_API_KEY || '';
    if (!apiKey) {
      return { success: false, error: 'Airtable API key not provided' };
    }
    
    // Securely log part of the key for debugging
    const maskedKey = `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
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
    
    // Step 1: Create a test member
    console.log('\nStep 1: Creating a test member in Airtable...');
    try {
      const membersTable = base('Members');
      const testMember = {
        'Email': `test-${Date.now()}@example.com`,
      };
      console.log('Payload for member creation:', JSON.stringify(testMember));
      
      const memberRecord = await membersTable.create(testMember);
      const memberId = memberRecord.id;
      console.log('Successfully created member with ID:', memberId);
      
      // Step 2: Get a game record (or create a simple test one)
      console.log('\nStep 2: Finding a game to use for vote test...');
      let gameId = '';
      try {
        // Try to find an existing game first
        const gamesTable = base('Games');
        const games = await gamesTable.select({
          maxRecords: 1
        }).firstPage();
        
        if (games.length > 0) {
          gameId = games[0].id;
          console.log(`Found existing game with ID: ${gameId}`);
        } else {
          // Create a test game if none exists
          const testGame = {
            'Title': `Test Game ${Date.now()}`,
            'BGG ID': Math.floor(Math.random() * 1000000),
          };
          console.log('Creating test game:', JSON.stringify(testGame));
          
          const gameRecord = await gamesTable.create(testGame);
          gameId = gameRecord.id;
          console.log('Created test game with ID:', gameId);
        }
        
        // Step 3: Create a vote using the exact specification from the attached content
        console.log('\nStep 3: Creating a vote with the correct field structure...');
        try {
          const votesTable = base('Votes');
          
          // Based on the attached content: Member and Game must be arrays of record IDs
          const votePayload = {
            fields: {
              "Member": [memberId],      // Member record ID as an array
              "Game": [gameId],          // Game record ID as an array
              "Vote Type": "Want to try" // One of the predefined values
            }
          };
          
          console.log('Vote payload (exact format from attachment):', JSON.stringify(votePayload));
          
          // Use fetch API directly as described in the attachment
          const response = await fetch(`https://api.airtable.com/v0/${baseId}/Votes`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(votePayload)
          });
          
          const data = await response.json();
          console.log('Vote creation response:', JSON.stringify(data));
          
          if (response.ok) {
            return {
              success: true,
              results: {
                memberId,
                gameId,
                voteId: data.id
              },
              message: 'Successfully created vote using MCP approach'
            };
          } else {
            return {
              success: false,
              error: `Vote creation failed: ${JSON.stringify(data)}`,
              partialResults: { memberId, gameId }
            };
          }
        } catch (voteErr) {
          console.error('Error creating vote with MCP approach:', voteErr);
          return {
            success: false,
            error: `Vote error: ${voteErr instanceof Error ? voteErr.message : String(voteErr)}`,
            partialResults: { memberId, gameId }
          };
        }
      } catch (gameErr) {
        console.error('Error with game for vote test:', gameErr);
        return {
          success: false,
          error: `Game error: ${gameErr instanceof Error ? gameErr.message : String(gameErr)}`,
          partialResults: { memberId }
        };
      }
    } catch (memberErr) {
      console.error('Error creating test member:', memberErr);
      return {
        success: false,
        error: `Member error: ${memberErr instanceof Error ? memberErr.message : String(memberErr)}`
      };
    }
  } catch (err) {
    console.error('General error in Airtable MCP test:', err);
    return {
      success: false,
      error: `General error: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}