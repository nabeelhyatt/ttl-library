#!/bin/bash

# Login to get a session cookie
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -c cookies.txt -H "Content-Type: application/json" -X POST -d '{"email":"test@example.com"}' http://localhost:3000/api/auth/login)
echo "Login response: $LOGIN_RESPONSE"

# Directly test the Airtable API by making calls through our new endpoint
echo -e "\nDirectly querying Airtable for my votes..."
AIRTABLE_VOTES=$(curl -s -b cookies.txt http://localhost:3000/api/airtable/my-votes)
echo "Airtable votes response:"
echo $AIRTABLE_VOTES

# Clean up
rm cookies.txt
echo -e "\nDone!"

echo ""
echo "=== SUMMARY ==="
echo "Local votes should be synced to Airtable for user visibility"