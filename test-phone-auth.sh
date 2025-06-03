#!/bin/bash

# Test script for phone authentication system
# This tests the phone auth endpoints without requiring actual SMS

echo "🧪 Testing Phone Authentication System"
echo "======================================"

SERVER_URL="http://localhost:3000"

echo ""
echo "1. Testing phone authentication stats endpoint..."
curl -s "$SERVER_URL/api/auth/phone/stats" | jq '.' || echo "Stats endpoint failed or jq not installed"

echo ""
echo "2. Testing phone number validation (invalid phone)..."
RESPONSE=$(curl -s -X POST "$SERVER_URL/api/auth/phone/send-link" \
  -H "Content-Type: application/json" \
  -d '{"phone": "invalid"}')
echo "$RESPONSE" | jq '.' || echo "$RESPONSE"

echo ""
echo "3. Testing phone number validation (valid phone)..."
RESPONSE=$(curl -s -X POST "$SERVER_URL/api/auth/phone/send-link" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+15551234567"}')
echo "$RESPONSE" | jq '.' || echo "$RESPONSE"

echo ""
echo "4. Testing token verification with invalid token..."
RESPONSE=$(curl -s "$SERVER_URL/api/auth/phone/verify?token=invalid")
echo "$RESPONSE" | jq '.' || echo "$RESPONSE"

echo ""
echo "5. Testing phone auth user endpoint (should be unauthorized)..."
RESPONSE=$(curl -s "$SERVER_URL/api/auth/phone/user")
echo "$RESPONSE" | jq '.' || echo "$RESPONSE"

echo ""
echo "6. Testing logout endpoint..."
RESPONSE=$(curl -s -X POST "$SERVER_URL/api/auth/phone/logout")
echo "$RESPONSE" | jq '.' || echo "$RESPONSE"

echo ""
echo "✅ Phone authentication system tests completed!"
echo ""
echo "💡 To test with actual SMS:"
echo "   1. Add Twilio credentials to your .env file"
echo "   2. Use a real phone number in the send-link test"
echo "   3. Check your phone for the magic link"
echo ""
echo "📝 Next steps:"
echo "   - Add your Airtable credentials to .env"
echo "   - Test with actual phone numbers if Twilio is configured"
echo "   - Continue with Phase 2: Frontend Components" 