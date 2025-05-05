# Setting Up Environment Variables for Deployment

To ensure the Airtable integration works properly in the deployed version of your application, you'll need to add the Airtable API key and Base ID as environment variables in the Replit deployment settings.

## Steps to Add Environment Variables in Replit Deployment

1. Open the project in Replit
2. Click on the "Deployment" tab in the left sidebar
3. Click on "Settings" within the Deployment section
4. Scroll to the "Environment Variables" section
5. Add the following environment variables:

```
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_airtable_base_id_here
```

6. Replace `your_airtable_api_key_here` with your actual Airtable API key
7. Replace `your_airtable_base_id_here` with your actual Airtable Base ID
8. Click "Save Changes"

## Troubleshooting

If you continue to experience issues with Airtable integration after adding the environment variables:

1. Check the deployment logs for any error messages related to Airtable
2. Verify that the API key and Base ID are correctly entered without any extra spaces
3. Ensure that the Airtable API key has the necessary permissions to read/write to the Base

## Local Development

For local development, these environment variables are already set up in your Replit Secrets. The application should continue to work as expected in the development environment.