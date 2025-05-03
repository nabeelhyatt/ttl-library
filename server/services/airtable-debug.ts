import Airtable from 'airtable';

/**
 * This utility file is for debugging the Airtable connection and understanding field structure
 */
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