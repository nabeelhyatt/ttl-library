#!/bin/bash

# This script tests whether the system can handle voting on a game that doesn't exist in Airtable yet

# Login to get a session cookie
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -c cookies.txt -H "Content-Type: application/json" -X POST -d '{"email":"test@example.com"}' http://localhost:5000/api/auth/login)
echo "Login response: $LOGIN_RESPONSE"

# Use a specific game ID that's less likely to be in Airtable
# Lifeboat BGG ID: 4174 - We've already verified this doesn't exist in the Airtable in our logs
BGG_ID=4174
GAME_NAME="Lifeboat"
echo -e "\nUsing game: $GAME_NAME (BGG ID: $BGG_ID)"

# Try to cast a vote for this game
echo -e "\nVoting for game that should be auto-created in Airtable..."
VOTE_RESPONSE=$(curl -s -b cookies.txt -H "Content-Type: application/json" -X POST -d "{\"bggId\":$BGG_ID,\"voteType\":1}" http://localhost:5000/api/votes)
echo "Vote response: $VOTE_RESPONSE"

# Wait for a few seconds to give Airtable time to process
echo -e "\nWaiting for 3 seconds for Airtable to process..."
sleep 3

# Check direct Airtable votes to verify sync
echo -e "\nChecking Airtable votes to verify..."
AIRTABLE_VOTES=$(curl -s -b cookies.txt http://localhost:5000/api/airtable/my-votes)
echo "Filtered Airtable votes for current user:"
echo $AIRTABLE_VOTES | jq -r '.memberVotes'

# Clean up
rm cookies.txt
echo -e "\nDone!"