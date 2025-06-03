// ABOUTME: Express routes for phone-based authentication endpoints
// ABOUTME: Handles magic link sending, verification, and cross-device session management

import express from 'express';
import rateLimit from 'express-rate-limit';
import { PhoneAuthService } from '../services/phone-auth-service.js';
import { MemberService } from '../services/member-service.js';

const router = express.Router();
const phoneAuthService = new PhoneAuthService();
const memberService = new MemberService();

// Helper function to get the correct base URL for magic links
function getBaseUrl(): string {
  // If APP_URL is explicitly set, use it
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  
  // Check if we're running on localhost (development)
  if (process.env.NODE_ENV === 'development' || 
      !process.env.NODE_ENV || 
      process.env.PORT === '3000') {
    return 'http://localhost:3000';
  }
  
  // In production on Replit, use the known production URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://ttlibrary.replit.app';
  }
  
  // Default to localhost for development
  return 'http://localhost:3000';
}

// Rate limiting for auth requests
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per phone number per 15 minutes
  keyGenerator: (req) => req.body.phone || req.ip || 'unknown',
  message: { error: 'RATE_LIMITED', message: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for token verification
const verifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 verification attempts per IP per 5 minutes
  keyGenerator: (req) => req.ip || 'unknown',
  message: { error: 'RATE_LIMITED', message: 'Too many verification attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/phone/send-link
// Send magic link to phone number
router.post('/phone/send-link', authLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ 
        error: 'INVALID_INPUT', 
        message: 'Phone number is required' 
      });
    }
    
    // Validate and format phone number
    const validation = phoneAuthService.validatePhone(phone);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'INVALID_PHONE', 
        message: validation.error || 'Invalid phone number' 
      });
    }
    
    const formattedPhone = validation.formattedPhone!;
    
    // Generate token
    const token = await phoneAuthService.generateToken(formattedPhone);
    
    // Send SMS
    const smsResult = await phoneAuthService.sendMagicLink(formattedPhone, token);
    
    if (!smsResult.success) {
      return res.status(500).json({ 
        error: 'SMS_FAILED', 
        message: smsResult.error || 'Failed to send SMS' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Magic link sent to your phone',
      phone: formattedPhone 
    });
    
  } catch (error) {
    console.error('Send magic link error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR', 
      message: 'Failed to process request' 
    });
  }
});

// GET /api/auth/phone/verify
// Verify magic link token and authenticate user
router.get('/phone/verify', verifyLimiter, async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ 
        error: 'INVALID_TOKEN', 
        message: 'Valid token is required' 
      });
    }
    
    // Verify token
    const phone = await phoneAuthService.verifyToken(token);
    
    if (!phone) {
      return res.status(401).json({ 
        error: 'TOKEN_EXPIRED', 
        message: 'Token is invalid or expired' 
      });
    }
    
    // Find or create member in Airtable
    const member = await memberService.findOrCreateMember(phone);
    
    // Create session
    (req.session as any).memberId = member.id;
    (req.session as any).phone = phone;
    
    res.json({ 
      success: true, 
      message: 'Authentication successful',
      user: {
        id: member.id,
        phone: member.phone,
        fullName: member.fullName,
        email: member.email
      }
    });
    
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR', 
      message: 'Failed to verify token' 
    });
  }
});

// GET /api/auth/phone/user
// Get current authenticated user
router.get('/phone/user', async (req, res) => {
  try {
    const session = req.session as any;
    
    if (!session.memberId) {
      return res.status(401).json({ 
        error: 'NOT_AUTHENTICATED', 
        message: 'User not authenticated' 
      });
    }
    
    // Check if member still exists in Airtable
    const memberExists = await memberService.memberExists(session.memberId);
    if (!memberExists) {
      // Clear invalid session
      req.session.destroy(() => {});
      return res.status(401).json({ 
        error: 'INVALID_SESSION', 
        message: 'Session is no longer valid' 
      });
    }
    
    // Get fresh member data
    const member = await memberService.findMemberByPhone(session.phone);
    if (!member) {
      req.session.destroy(() => {});
      return res.status(401).json({ 
        error: 'MEMBER_NOT_FOUND', 
        message: 'Member not found' 
      });
    }
    
    res.json({
      id: member.id,
      phone: member.phone,
      fullName: member.fullName,
      email: member.email
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR', 
      message: 'Failed to get user data' 
    });
  }
});

// POST /api/auth/phone/logout
// Logout user and clear session
router.post('/phone/logout', async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ 
          error: 'LOGOUT_FAILED', 
          message: 'Failed to logout' 
        });
      }
      
      res.clearCookie('connect.sid');
      res.json({ 
        success: true, 
        message: 'Logged out successfully' 
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR', 
      message: 'Failed to logout' 
    });
  }
});

// GET /api/auth/phone/stats
// Get statistics about active tokens (for monitoring)
router.get('/phone/stats', async (req, res) => {
  try {
    const stats = phoneAuthService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR', 
      message: 'Failed to get stats' 
    });
  }
});

// GET /api/auth/phone/test-token (Development only)
// Generate a test token for development/testing purposes
router.get('/phone/test-token', async (req, res) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Endpoint not available' });
    }

    const testPhone = '+15551234567';
    const token = await phoneAuthService.generateToken(testPhone);
    const magicLink = `${getBaseUrl()}/auth/verify?token=${token}`;
    
    res.json({ 
      success: true, 
      token,
      magicLink,
      phone: testPhone,
      message: 'Test token generated for development'
    });
    
  } catch (error) {
    console.error('Generate test token error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR', 
      message: 'Failed to generate test token' 
    });
  }
});

export default router; 