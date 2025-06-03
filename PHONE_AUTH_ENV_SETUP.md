# Phone Authentication Environment Setup

This document outlines the environment variables required for the phone-based magic link authentication system.

## Required Environment Variables

### Existing Variables (Already Required)
```bash
# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_airtable_base_id_here

# Database Configuration (Optional for phone auth)
DATABASE_URL=your_database_url_here

# Session Configuration
SESSION_SECRET=tabletop-library-secret
```

### New Variables for Phone Authentication
```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

# Application Configuration
APP_URL=http://localhost:3000
NODE_ENV=development

# Feature Flags
PHONE_AUTH_ENABLED=false
```

## Setting Up Twilio

1. **Create a Twilio Account**
   - Go to https://www.twilio.com/
   - Sign up for a free trial account
   - You'll get $15 in free credits

2. **Get Your Credentials**
   - Account SID: Found on your Twilio Console Dashboard
   - Auth Token: Found on your Twilio Console Dashboard (click to reveal)

3. **Get a Phone Number**
   - In the Twilio Console, go to Phone Numbers > Manage > Buy a number
   - Choose a number with SMS capabilities
   - For testing, you can use the trial number

4. **Add Environment Variables**
   Create a `.env` file in your project root with:
   ```bash
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   APP_URL=http://localhost:3000
   ```

## Testing the Phone Authentication

### Phase 0 Testing (Current Phase)
Since we're in Phase 0 (Clean Slate Preparation), you can test the phone authentication system alongside the existing Replit authentication:

```bash
# Test phone number validation
curl -X POST http://localhost:3000/api/auth/phone/send-link \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'

# Check authentication stats
curl http://localhost:3000/api/auth/phone/stats
```

### Development vs Production

**Development (NODE_ENV=development)**
- SMS sending works if Twilio credentials are provided
- Graceful fallback if credentials are missing
- Detailed error logging

**Production (NODE_ENV=production)**
- Requires all Twilio credentials
- Enhanced security headers
- Rate limiting enforced

## Security Considerations

### Phone Number Storage
- Phone numbers are stored in E.164 format (+1234567890)
- Phone numbers are linked to Airtable Members records
- No sensitive data is stored in memory tokens

### Token Security
- Tokens expire after 10 minutes
- Tokens are single-use (consumed when verified)
- Cryptographically secure random generation
- In-memory storage only (no persistence)

### Rate Limiting
- 3 SMS requests per phone number per 15 minutes
- 5 token verification attempts per IP per 5 minutes
- Headers included for client-side rate limit awareness

## Troubleshooting

### Common Issues

1. **SMS Not Sending**
   - Check Twilio credentials are correct
   - Verify phone number format (must include country code)
   - Check Twilio account balance
   - Verify phone number is not blocked

2. **Token Verification Failing**
   - Tokens expire after 10 minutes
   - Tokens are single-use
   - Check for rate limiting

3. **Airtable Integration Issues**
   - Verify Airtable credentials are set
   - Check Members table exists with correct field names
   - Ensure Phone field exists in Members table

### Testing Without SMS
For development testing without actual SMS sending:

```bash
# The system gracefully handles missing Twilio credentials
# Check logs for token generation without SMS sending
# Use /api/auth/phone/stats to see active tokens
```

## Migration Progress

- ✅ Phase 0: Clean Slate Preparation
- ✅ Phase 1.2: Dependencies Installed
- ✅ Phase 1.3: Core Authentication Services Created
- ✅ Phase 1.4: Phone Authentication Routes Created
- ✅ Phase 1.5: Member Service Created
- 🔄 Phase 1: Integration Testing (Current)
- ⏳ Phase 2: Frontend Components
- ⏳ Phase 3: Integration and Testing
- ⏳ Phase 4: Testing and Quality Assurance
- ⏳ Phase 5: Deployment

## Next Steps

1. Test the current implementation with your Airtable setup
2. Add Twilio credentials for SMS testing
3. Create frontend components for phone authentication
4. Implement feature flag to switch between Replit and phone auth
5. Complete migration to phone-only authentication 

## Environment Variables for Phone Authentication

```bash
# Required for Airtable integration
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_airtable_base_id_here

# Required for SMS sending (production)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here  
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

# Optional: Override database connection (falls back to MemoryStore)
DATABASE_URL=your_database_url_here

# Optional: Set custom base URL for magic links (auto-detected otherwise)
APP_URL=http://localhost:3000

# Optional: Set environment explicitly
NODE_ENV=development

# ... existing code ...

### Example Usage

```bash
# Send magic link to phone number
curl -X POST http://localhost:3000/api/auth/phone/send-link \
  -H "Content-Type: application/json" \
  -d '{"phone": "+15551234567"}'

# Check authentication stats
curl http://localhost:3000/api/auth/phone/stats

# ... existing code ... 