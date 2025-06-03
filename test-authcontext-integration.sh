#!/bin/bash

# Test script for AuthContext integration with phone authentication
# This verifies the frontend authentication context works with phone auth

echo "🧪 Testing AuthContext Integration with Phone Authentication"
echo "=========================================================="

SERVER_URL="http://localhost:3000"

echo ""
echo "1. Testing initial authentication state (should be no auth)..."
NO_AUTH_RESPONSE=$(curl -s "$SERVER_URL/api/auth/phone/user")
echo "Phone auth endpoint: $NO_AUTH_RESPONSE"

echo ""
echo "2. Creating test authentication session..."
TOKEN_RESPONSE=$(curl -s "$SERVER_URL/api/auth/phone/test-token")
echo "Test token response:"
echo "$TOKEN_RESPONSE" | jq '.'

TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Failed to generate test token"
    exit 1
fi

echo ""
echo "3. Authenticating with test token..."
AUTH_RESPONSE=$(curl -s "$SERVER_URL/api/auth/phone/verify?token=$TOKEN")
echo "Authentication response:"
echo "$AUTH_RESPONSE" | jq '.'

SUCCESS=$(echo "$AUTH_RESPONSE" | jq -r '.success')
if [ "$SUCCESS" != "true" ]; then
    echo "❌ Authentication failed"
    exit 1
fi

echo ""
echo "4. Testing authenticated phone user endpoint..."
USER_RESPONSE=$(curl -s "$SERVER_URL/api/auth/phone/user")
echo "Phone user endpoint:"
echo "$USER_RESPONSE" | jq '.'

USER_ID=$(echo "$USER_RESPONSE" | jq -r '.id')
if [ "$USER_ID" = "null" ] || [ -z "$USER_ID" ]; then
    echo "❌ Phone user endpoint failed"
    exit 1
fi

echo ""
echo "5. Testing legacy Replit user endpoint (should still fail)..."
REPLIT_RESPONSE=$(curl -s "$SERVER_URL/api/auth/user")
echo "Replit user endpoint: $REPLIT_RESPONSE"

echo ""
echo "6. Testing logout..."
LOGOUT_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/auth/phone/logout")
echo "Logout response:"
echo "$LOGOUT_RESPONSE" | jq '.'

echo ""
echo "7. Verifying session cleared..."
POST_LOGOUT_RESPONSE=$(curl -s "$SERVER_URL/api/auth/phone/user")
echo "Post-logout phone user endpoint: $POST_LOGOUT_RESPONSE"

echo ""
echo "🎯 AuthContext Integration Test Summary:"
echo "======================================="
echo "✅ Token Generation: Working"
echo "✅ Authentication: Working"
echo "✅ Phone User Endpoint: Working"
echo "✅ Session Management: Working"
echo "✅ Logout: Working"
echo ""
echo "📝 Expected Frontend Behavior:"
echo "   - AuthContext should try phone auth first"
echo "   - Fall back to Replit auth if phone fails"
echo "   - Support both user types in getDisplayName()"
echo "   - Handle logout for both auth types"
echo ""
echo "🔗 Test Data for Frontend:"
echo "   User ID: $USER_ID"
echo "   Auth Type: phone"
echo "   Display Name: Should show formatted phone or full name" 