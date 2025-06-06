#!/bin/bash

# Login to get a session cookie
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -c cookies.txt -H "Content-Type: application/json" -X POST -d '{"email":"test@example.com"}' http://localhost:3000/api/auth/login)
echo "Login response: $LOGIN_RESPONSE"

# Create a vote for Spirit Island (BGG ID: 162886) with vote type 3 (Would Join Club)
echo -e "\nCreating vote for Spirit Island with vote type 3 (Would Join Club)..."
VOTE_RESPONSE=$(curl -s -b cookies.txt -H "Content-Type: application/json" -X POST -d '{"bggId":162886,"voteType":3}' http://localhost:3000/api/votes)
echo "Vote response: $VOTE_RESPONSE"

# Extract the vote ID from the response (you might need to adjust this depending on your response format)
VOTE_ID=$(echo $VOTE_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')

echo "Vote ID created: $VOTE_ID"

# Wait for a few seconds to give Airtable time to process
echo -e "\nWaiting for 3 seconds for Airtable to process..."
sleep 3

# Check direct Airtable votes to verify sync
echo -e "\nChecking Airtable votes directly..."
AIRTABLE_VOTES=$(curl -s -b cookies.txt http://localhost:3000/api/airtable/my-votes)
echo "Airtable votes response:"
echo $AIRTABLE_VOTES

# Clean up
rm cookies.txt
echo -e "\nDone!"

echo ""
echo "=== SUMMARY ==="
echo "Vote created and should be visible in Airtable"