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
    
    // Fetch tables in base
    console.log('Fetching tables in Airtable base...');
    
    // Access the Games table and fetch a few records
    const gamesTable = base('Games');
    const records = await gamesTable.select({
      maxRecords: 3,
      view: "Grid view" // Use the default view
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
    
    // Access the TLCS Subcategories table
    console.log('\nFetching TLCS Subcategories...');
    
    const subcategoriesTable = base('TLCS Subcategory');
    const subcategories = await subcategoriesTable.select({
      maxRecords: 5,
      view: "Grid view"
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
    
  } catch (error) {
    console.error('Error debugging Airtable:', error);
  }
}