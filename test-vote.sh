#!/bin/bash

# Login to get a session cookie
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -c cookies.txt -H "Content-Type: application/json" -X POST -d '{"email":"test@example.com"}' http://localhost:5000/api/auth/login)
echo "Login response: $LOGIN_RESPONSE"

# Get user info
echo -e "\nGetting user info..."
USER_INFO=$(curl -s -b cookies.txt http://localhost:5000/api/auth/me)
echo "User info: $USER_INFO"

# Create a vote for Ark Nova (BGG ID: 342942)
echo -e "\nCreating vote for Ark Nova..."
VOTE_RESPONSE=$(curl -s -b cookies.txt -H "Content-Type: application/json" -X POST -d '{"bggId":342942,"voteType":1}' http://localhost:5000/api/votes)
echo "Vote response: $VOTE_RESPONSE"

# Get user's votes
echo -e "\nGetting user votes..."
MY_VOTES=$(curl -s -b cookies.txt http://localhost:5000/api/votes/my-votes)
echo "My votes: $MY_VOTES"

# Extract vote ID from the response (requires jq)
echo -e "\nExtracting vote ID..."
if command -v jq &> /dev/null; then
  VOTE_ID=$(echo $MY_VOTES | jq -r '.[0].id')
  echo "Vote ID: $VOTE_ID"
  
  # Delete the vote
  echo -e "\nDeleting vote..."
  DELETE_RESPONSE=$(curl -s -b cookies.txt -X DELETE http://localhost:5000/api/votes/$VOTE_ID)
  echo "Delete response: $DELETE_RESPONSE"
else
  echo "jq is not installed, skipping vote deletion"
fi

# Clean up
echo -e "\nCleaning up..."
rm cookies.txt
echo "Done!"