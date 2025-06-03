# TTL Game Voting - Project Plan

This document outlines the upcoming features and improvements for the Tabletop Library Game Voting application.

If I tell you one of these is complete you should delete it, and then add details of the implementation to readme.md

You should prioritize the first take, and only do one task at a time. When you start a project do not assume you know how it should be implemented or what I mean by it. Instead, write up a PRD of what you want to do and how, asking questions on areas that might be open to interpretation and lead to bugs. In general we want clean, isolated code.

## 📝 Key Reminders

### Phone Authentication System Status:
- **✅ MIGRATION COMPLETE**: Phone authentication system is 100% functional end-to-end
- **Dual Authentication Working**: Phone auth tries first, gracefully falls back to Replit auth
- **Complete Backend**: 100% functional phone authentication infrastructure  
- **AuthContext Integration**: Smart user display, logout handling, and type safety for both auth types
- **Production Ready**: System is working in production with both authentication types
- **User Experience**: Phone users see (555) 123-4567 format with 📱 indicator, Replit users see 💻 indicator
- **Frontend Login Component**: ✅ COMPLETED - Users can request magic links directly from the UI
- **Session Persistence**: ✅ FIXED - Sessions now persist correctly using MemoryStore fallback

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

## Other Priority Tasks

### 2. **Documentation File Structure Cleanup**
**Status**: Medium priority cleanup task  
**Estimate**: 1-2 hours  

**Current Issue**: Significant redundancy across documentation files
- README.md & CLAUDE.md have ~70% overlapping content
- guidelines.md & CLAUDE.md both contain development guidelines
- No historical record of completed implementations

**Proposed Solution**:
- **README.md**: Streamlined public-facing project documentation
- **AI_CONTEXT.md**: Consolidated AI-specific context, guidelines, and technical details
- **PROJECT_PLAN.md**: Keep as-is for active planning
- **PROJECT_LOG.md**: New file for historical record of completed work and learnings
- **Delete guidelines.md**: Merge into AI_CONTEXT.md

**Benefits**: No redundancy, clear file purposes, rich AI context, preserved institutional knowledge

### 3. **Investigate BGG API Rate Limiting for Bulk Operations**
   - Research official BGG API rate limit documentation and best practices
   - Optimize batch processing for bulk game searches and updates
   - Implement more sophisticated queuing system for API requests
   - Add monitoring and logging for rate limit errors
   - Consider implementing circuit breaker pattern for API resilience

### 4. **Add "If You Like This You'll Like" Recommendation Engine**
   - After a user votes, show game recommendations
   - Base recommendations on game mechanics, categories, and other users' votes
   - Implement similarity algorithm for game recommendations

### 5. **Link TLCS Codes to Category Games**
   - Make TLCS codes clickable to show all games in that category
   - Allow voting directly from category view
   - Improve category navigation and discovery

### 6. **Enhance Rankings Page with Subcategory Drill-Down**
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

