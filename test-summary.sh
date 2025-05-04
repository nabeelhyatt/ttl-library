#!/bin/bash

# Login to get a session cookie
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -c cookies.txt -H "Content-Type: application/json" -X POST -d '{"email":"test@example.com"}' http://localhost:5000/api/auth/login)
echo "Login response: $LOGIN_RESPONSE"

# Get local votes
echo -e "\nRetrieving local votes..."
LOCAL_VOTES=$(curl -s -b cookies.txt http://localhost:5000/api/votes/my-votes)
echo "Local votes:"
echo $LOCAL_VOTES

# Get Airtable votes
echo -e "\nRetrieving Airtable votes..."
AIRTABLE_VOTES=$(curl -s -b cookies.txt http://localhost:5000/api/airtable/my-votes)
MEMBER_VOTES=$(echo $AIRTABLE_VOTES | jq -r '.memberVotes')
echo "Airtable votes for current user:"
echo $MEMBER_VOTES

# Get total votes in Airtable
TOTAL_VOTES=$(echo $AIRTABLE_VOTES | jq -r '.allVotes | length')
USER_VOTES=$(echo $AIRTABLE_VOTES | jq -r '.memberVotes | length')
echo -e "\nFound $USER_VOTES votes for current user out of $TOTAL_VOTES total votes in Airtable."

# Clean up
rm cookies.txt
echo -e "\nDone!"