// ABOUTME: Phone-based authentication service with magic link generation and verification
// ABOUTME: Handles SMS sending, token management, and authentication flow

import crypto from 'crypto';
import NodeCache from 'node-cache';
import twilio from 'twilio';
import { parsePhoneNumber } from 'libphonenumber-js';

interface TokenData {
  phone: string;
  createdAt: number;
}

export class PhoneAuthService {
  private tokenStore: NodeCache;
  private twilioClient: any;
  
  constructor() {
    this.tokenStore = new NodeCache({
      stdTTL: 600, // 10 minutes
      checkperiod: 120,
      deleteOnExpire: true,
      maxKeys: 10000
    });
    
    // Only initialize Twilio if credentials are provided
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    } else {
      console.warn('Twilio credentials not configured. SMS sending will not work.');
    }
  }
  
  // Validate and format phone number
  validatePhone(phoneInput: string): { isValid: boolean; formattedPhone?: string; error?: string } {
    try {
      const phoneNumber = parsePhoneNumber(phoneInput, 'US'); // Default to US if no country code
      
      // For authentication purposes, we're more permissive than strict telecom validation
      // We check if the phone number can be parsed and formatted, not if it's a valid service number
      if (!phoneNumber || !phoneNumber.number) {
        return { isValid: false, error: 'Invalid phone number format' };
      }
      
      // Basic sanity checks for US numbers
      const e164 = phoneNumber.format('E.164');
      if (!e164.startsWith('+1') || e164.length !== 12) {
        return { isValid: false, error: 'Please enter a valid US phone number' };
      }
      
      return { 
        isValid: true, 
        formattedPhone: e164 // Returns format like +12125551234
      };
    } catch (error) {
      return { isValid: false, error: 'Unable to parse phone number' };
    }
  }
  
  // Generate and store a magic link token
  async generateToken(phone: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('base64url');
    
    this.tokenStore.set(token, {
      phone,
      createdAt: Date.now()
    } as TokenData);
    
    return token;
  }
  
  // Send magic link via SMS
  async sendMagicLink(phone: string, token: string): Promise<{ success: boolean; error?: string }> {
    if (!this.twilioClient) {
      return { success: false, error: 'SMS service not configured' };
    }
    
    try {
      const magicLink = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;
      
      await this.twilioClient.messages.create({
        body: `Click to login to TTL Game Library: ${magicLink}\n\nExpires in 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });
      
      return { success: true };
    } catch (error) {
      console.error('SMS sending error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send SMS' 
      };
    }
  }
  
  // Verify token and return phone number if valid
  async verifyToken(token: string): Promise<string | null> {
    const data = this.tokenStore.take(token) as TokenData | undefined;
    if (!data) return null;
    
    return data.phone;
  }
  
  // Get token info without consuming it (for debugging)
  getTokenInfo(token: string): TokenData | null {
    const data = this.tokenStore.get(token) as TokenData | undefined;
    return data || null;
  }
  
  // Clear expired tokens manually (cache handles this automatically, but useful for testing)
  clearExpiredTokens(): number {
    const keys = this.tokenStore.keys();
    let cleared = 0;
    
    keys.forEach(key => {
      const data = this.tokenStore.get(key) as TokenData | undefined;
      if (data && Date.now() - data.createdAt > 600000) { // 10 minutes
        this.tokenStore.del(key);
        cleared++;
      }
    });
    
    return cleared;
  }
  
  // Get stats for monitoring
  getStats(): { activeTokens: number; totalKeys: number } {
    return {
      activeTokens: this.tokenStore.keys().length,
      totalKeys: this.tokenStore.keys().length
    };
  }
} 