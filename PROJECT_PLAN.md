# TTL Game Voting - Project Plan

This document outlines the upcoming features and improvements for the Tabletop Library Game Voting application.

If I tell you one of these is complete you should delete it, and then add details of the implementation to PROJECT_LOG.md and any overall architecture changes or high level notes to readme.md

You should prioritize the first take, and only do one task at a time. When you start a project do not assume you know how it should be implemented or what I mean by it. Instead, write up a PRD of what you want to do and how, asking questions on areas that might be open to interpretation and lead to bugs. In general we want clean, isolated code.

## 📝 Key Reminders

### Development Notes:
- **Backend Endpoints**: All phone auth endpoints fully functional (`/api/auth/phone/*`)
- **Session Management**: Both auth types maintain separate but compatible session handling
- **Testing**: Use `/api/auth/phone/test-token` endpoint for development testing
- **Rate Limiting**: 3 SMS per phone per 15min, 5 verifications per IP per 5min
- **Magic Links**: Verification page at `/auth/verify` handles token processing
- **Login UI**: Dual-mode login dialog supports both phone (📱) and Replit (💻) authentication
- **SMS Integration**: Working with Twilio credentials for production magic links

## 🚨 CURRENT PRIORITY ISSUES


### 🔄 PRIORITY #1: Voting System Issues
**Status**: Critical bugs affecting core functionality  
**Estimate**: 1-2 days  

**Issues Identified**:
- **My Votes not loading from Airtable**: Vote retrieval failing
- **Votes not being recorded to Airtable**: Vote persistence broken
- **Missing Airtable fields on My Votes page**: Need plain text fields for Airtable integration

### 🔄 PRIORITY #2: Various Bugs
**Status**: Data visualization not working correctly  
**Estimate**: 1 day  

**Issues**:
- **Game Collection progress not loading properly from Airtable**: Progress bar data source failing

### Priority #2: Cross-device login flow from mobile one-click
If you try to login on desktop it sends you a mobile sms, if you click it logs you in on mobile, it should instead log you in on the desktop website that you initiated the login from.

### 🔄 PRIORITY #3: UI/UX Improvements
**Status**: User experience enhancements  
**Estimate**: 2-3 days  

**Issues**:
- **Bulk should be a button next to search**: Better UI integration
- **Game card UX updates from v0 - ask for new designs from v0 and implement
- **Game card should show Airtable rankings**: Replace current Ratings section with compact graphic format for Thematic Depth, Randomness, etc.
- **Game card should show TLCS category & subcategory**: Display category information when available
- **Game images need to be high resolution**: Improve image quality on game cards

## ✅ COMPLETED PROJECTS

### 🎉 Phone Authentication Migration - 100% COMPLETE
**Completion Date**: Current Session  
**Total Time**: ~6 hours  

**What Was Accomplished**:
- ✅ **Phase 1.1**: Phone Number Validation Fixed (30 minutes)
- ✅ **Phase 1.3**: Complete Verification Page (1.5 hours) 
- ✅ **Phase 2.1**: AuthContext Integration (1 hour)
- ✅ **Phase 2.2**: Frontend Login Component (1 hour)
- ✅ **Session Fix**: Resolved session persistence issue (30 minutes)

**Current Status**: Full dual authentication system working in production
- Phone authentication tried first, graceful fallback to Replit
- Real SMS magic links working with Twilio
- Complete frontend UI with phone input and magic link sending
- Session persistence working correctly
- User experience: formatted phone display with authentication indicators

### 🐛 Magic Link URL Bug Fix - COMPLETE
**Completion Date**: Current Session  
**Total Time**: 30 minutes  

**Issue**: SMS magic links were using `localhost:3000` in production instead of correct deployed domain  
**Solution**: Added smart base URL detection logic that:
- Uses `APP_URL` environment variable if set
- Detects development vs production environment correctly
- Uses `https://ttlibrary.replit.app` for production
- Uses `http://localhost:3000` for development
- Fixed in both `PhoneAuthService.sendMagicLink()` and test token endpoint

**Result**: Magic links now work correctly for users clicking them from their phones in production

### 🔧 Port Consistency Fix - COMPLETE
**Completion Date**: Current Session  
**Total Time**: 20 minutes  

**Issue**: Test scripts used mixed ports (5000/3000) causing confusion and deployment verification issues  
**Solution**: Updated ALL infrastructure to use consistent port 3000:
- Updated all test scripts: `test-vote.sh`, `test-summary.sh`, `test-create-and-verify.sh`, `test-new-game-vote.sh`, `test-delete-vote.sh`, `test-airtable-votes.sh`, `test-retrieve-votes.sh`
- Updated `server/replitAuth.ts` fallback `REPLIT_DOMAINS` to `localhost:3000`
- Updated `PHONE_AUTH_ENV_SETUP.md` documentation examples
- Improved test script output formatting and error handling

**Result**: All testing infrastructure now uses consistent port configuration matching current server setup

### 📚 Documentation File Structure Cleanup - COMPLETE  
**Completion Date**: Current Session  
**Total Time**: 1 hour  

**Issue**: Significant redundancy across documentation files (~70% overlap between README.md and CLAUDE.md)  
**Solution**: Restructured documentation into focused, purpose-driven files:
- **README.md**: Comprehensive public-facing project documentation
- **AI_CONTEXT.md**: Consolidated AI-specific guidelines, technical details, and development context
- **PROJECT_LOG.md**: Historical record of completed work, git commits, and lessons learned  
- **PROJECT_PLAN.md**: Active planning and current priorities (this file)

**Benefits Achieved**:
- ✅ Eliminated content redundancy between files
- ✅ Clear, distinct file purposes and responsibilities  
- ✅ Comprehensive AI context preserved for development assistance
- ✅ Historical institutional knowledge captured and organized
- ✅ Public documentation streamlined and user-friendly

**Files Created/Updated**:
- Created `AI_CONTEXT.md` with all development guidelines and technical architecture
- Created `PROJECT_LOG.md` with detailed implementation history and lessons learned
- Updated `README.md` with streamlined, comprehensive public documentation
- Removed redundant content while preserving all valuable information

## Other Priority Tasks

### 2. **Investigate BGG API Rate Limiting for Bulk Operations**
   - Research official BGG API rate limit documentation and best practices
   - Optimize batch processing for bulk game searches and updates
   - Implement more sophisticated queuing system for API requests
   - Add monitoring and logging for rate limit errors
   - Consider implementing circuit breaker pattern for API resilience

### 3. **Add "If You Like This You'll Like" Recommendation Engine**
   - After a user votes, show game recommendations
   - Base recommendations on game mechanics, categories, and other users' votes
   - Implement similarity algorithm for game recommendations

### 4. **Link TLCS Codes to Category Games**
   - Make TLCS codes clickable to show all games in that category
   - Allow voting directly from category view
   - Improve category navigation and discovery

### 5. **Enhance Rankings Page with Subcategory Drill-Down**
   - Make categories clickable to show subcategories from Airtable
   - Display hierarchical category structure
   - Maintain consistent voting functionality in subcategory views

## Implementation Notes

For each task, we will:
1. Analyze current implementation
2. Propose specific solution approach
3. Seek clarification before proceeding with coding
4. Implement changes
5. Test thoroughly
6. Document changes

## Current Status

We'll update this section as we complete tasks:
- ✅ **Phone Authentication Migration** (100% COMPLETE - All phases done)
- ✅ **Documentation File Structure Cleanup** (100% COMPLETE - All files organized)
- ✅ Fixed game name display issue in BGG API integration
- ✅ Implemented reliable fallback for hot games list
- ✅ Added error handling for BGG API rate limiting
- ✅ Added "Games on Order" Progress Graphic showing collection status
- ✅ Implemented Bulk Game Processing allowing users to input up to 10 game titles at once

## Next Steps

**IMMEDIATE**: Address Voting System Issues
- Debug My Votes page Airtable integration (1 hour)
- Fix vote recording to Airtable (1-2 hours)
- Add missing Airtable fields to My Votes page (30 minutes)
- Test complete voting flow end-to-end (30 minutes)

**AFTER VOTING FIX**: Address Game Collection Progress loading issues, then continue with UI/UX improvements and work through the remaining list in order, seeking clarification at each step.

