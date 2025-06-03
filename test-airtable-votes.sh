#!/bin/bash

# Login to get a session cookie
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -c cookies.txt -H "Content-Type: application/json" -X POST -d '{"email":"test@example.com"}' http://localhost:3000/api/auth/login)
echo "Login Response: $LOGIN_RESPONSE"

# Create a vote for Ark Nova (BGG ID: 342942)
echo -e "\nCreating vote for Ark Nova..."
VOTE_RESPONSE=$(curl -s -b cookies.txt -H "Content-Type: application/json" -X POST -d '{"bggId":342942,"voteType":1}' http://localhost:3000/api/votes)
echo "Vote Response: $VOTE_RESPONSE"

# Wait for a second to give Airtable time to process
echo -e "\nWaiting 5 seconds for Airtable sync..."
sleep 5

# Check direct Airtable votes to verify sync
echo -e "\nChecking Airtable votes..."
AIRTABLE_VOTES=$(curl -s -b cookies.txt http://localhost:3000/api/airtable/my-votes)
echo "Airtable Votes Response: $AIRTABLE_VOTES"

# Clean up
rm cookies.txt
echo -e "\nDone!"

echo ""
echo "=== SUMMARY ==="
echo "Vote should be synced to Airtable and visible in response"