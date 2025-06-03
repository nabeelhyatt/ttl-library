#!/bin/bash

# Test for a random BGG ID that likely isn't in our database
BGG_ID=$(($RANDOM % 100000 + 200000))  # Random ID between 200000-300000

LOGIN_RESPONSE=$(curl -s -c cookies.txt -H "Content-Type: application/json" -X POST -d '{"email":"test@example.com"}' http://localhost:3000/api/auth/login)
echo "Login Response: $LOGIN_RESPONSE"

echo "Testing vote creation for random BGG ID: $BGG_ID"
echo "This should create a new game entry and vote..."

echo "Creating vote for BGG ID $BGG_ID..."
VOTE_RESPONSE=$(curl -s -b cookies.txt -H "Content-Type: application/json" -X POST -d "{\"bggId\":$BGG_ID,\"voteType\":1}" http://localhost:3000/api/votes)
echo "Vote Response: $VOTE_RESPONSE"

# Extract the vote ID from the response
VOTE_ID=$(echo $VOTE_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')

echo "Vote ID created: $VOTE_ID"

echo "Waiting 3 seconds for Airtable sync..."
sleep 3

echo "Fetching votes from Airtable to verify new game creation..."
AIRTABLE_VOTES=$(curl -s -b cookies.txt http://localhost:3000/api/airtable/my-votes)
echo "Airtable Votes Response: $AIRTABLE_VOTES"

echo ""
echo "=== SUMMARY ==="
echo "Vote for new game (BGG ID: $BGG_ID) should create game entry and be visible in Airtable"

# Clean up
rm cookies.txt
echo -e "\nDone!"