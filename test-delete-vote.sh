#!/bin/bash

# Login to get a session cookie
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -c cookies.txt -H "Content-Type: application/json" -X POST -d '{"email":"test@example.com"}' http://localhost:5000/api/auth/login)
echo "Login response: $LOGIN_RESPONSE"

# Check votes before deleting
echo -e "\nChecking votes before deletion..."
VOTES_BEFORE=$(curl -s -b cookies.txt http://localhost:5000/api/votes/my-votes)
echo "Votes before: $VOTES_BEFORE"

# Delete the first vote (typically ID 1)
echo -e "\nDeleting vote with ID 1..."
DELETE_RESPONSE=$(curl -s -b cookies.txt -X DELETE http://localhost:5000/api/votes/1)
echo "Delete response: $DELETE_RESPONSE"

# Wait for a few seconds to give Airtable time to process
echo -e "\nWaiting for 3 seconds for Airtable to process..."
sleep 3

# Check direct Airtable votes to verify sync
echo -e "\nChecking Airtable votes after deletion..."
AIRTABLE_VOTES=$(curl -s -b cookies.txt http://localhost:5000/api/airtable/my-votes)
echo "Airtable votes response:"
echo $AIRTABLE_VOTES

# Clean up
rm cookies.txt
echo -e "\nDone!"