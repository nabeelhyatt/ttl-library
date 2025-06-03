// ABOUTME: Dialog component for login supporting both Replit and phone authentication
// ABOUTME: Displays login UI with Tufte styling and dual authentication options

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '../ui/dialog';
import { useAuth } from '../../contexts/AuthContext';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { pendingVote } = useAuth();
  const [authMethod, setAuthMethod] = useState<'phone' | 'replit'>('phone');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleReplitLogin = () => {
    // Redirect to the server-side login route
    window.location.href = '/api/login';
  };

  const handlePhoneLogin = async () => {
    if (!phone.trim()) {
      setMessage('Please enter a phone number');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await fetch('/api/auth/phone/send-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Magic link sent! Check your phone for a text message.');
        setMessageType('success');
        // Don't close dialog immediately - let user see the success message
        setTimeout(() => {
          onClose();
          setPhone('');
          setMessage('');
          setMessageType('');
        }, 3000);
      } else {
        // Handle specific error types
        switch (data.error) {
          case 'INVALID_PHONE':
            setMessage('Please enter a valid US phone number');
            break;
          case 'RATE_LIMITED':
            setMessage('Too many requests. Please wait a few minutes and try again.');
            break;
          case 'SMS_FAILED':
            setMessage('Failed to send text message. Please try again or use a different number.');
            break;
          default:
            setMessage(data.message || 'Failed to send magic link. Please try again.');
        }
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error. Please check your connection and try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Apply formatting: (555) 123-4567
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    // Clear any previous error messages when user starts typing
    if (message && messageType === 'error') {
      setMessage('');
      setMessageType('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-[#f5f5dc] border border-gray-300 shadow-sm p-6 font-serif">
        <DialogTitle className="text-xl text-center mb-4 mt-2">
          LOG IN TO THE TABLETOP LIBRARY
        </DialogTitle>
        
        <p className="text-center text-sm mb-6">
          Please login, ideally with the login you'll eventually use for your TTL membership.
        </p>

        {/* Authentication Method Selector */}
        <div className="flex justify-center mb-4">
          <div className="flex border border-gray-300 rounded">
            <button
              onClick={() => setAuthMethod('phone')}
              className={`px-4 py-2 text-sm ${
                authMethod === 'phone'
                  ? 'bg-[#f77213] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📱 Phone
            </button>
            <button
              onClick={() => setAuthMethod('replit')}
              className={`px-4 py-2 text-sm border-l border-gray-300 ${
                authMethod === 'replit'
                  ? 'bg-[#f77213] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              💻 Replit
            </button>
          </div>
        </div>

        {/* Phone Authentication */}
        {authMethod === 'phone' && (
          <div className="mb-4">
            <label className="block text-sm mb-2">
              Phone Number (US):
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded font-sans text-base"
              disabled={isLoading}
              maxLength={14} // (555) 123-4567 = 14 characters
            />
            <p className="text-xs text-gray-600 mt-1">
              We'll send you a magic link via text message
            </p>
          </div>
        )}

        {/* Replit Authentication */}
        {authMethod === 'replit' && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 text-center">
              Continue with your Replit account
            </p>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className={`text-center text-sm mb-4 ${
            messageType === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {message}
          </div>
        )}

        <DialogFooter className="flex justify-center gap-8 mt-4">
          <button
            onClick={onClose}
            className="px-6 py-1 border border-gray-300 hover:bg-[#f0f0d8]"
            disabled={isLoading}
          >
            CANCEL
          </button>
          
          <button 
            onClick={authMethod === 'phone' ? handlePhoneLogin : handleReplitLogin}
            className="px-6 py-1 border border-[#f77213] bg-[#f77213] text-white hover:bg-[#e56b12] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || (authMethod === 'phone' && !phone.trim())}
          >
            {isLoading ? 'SENDING...' : authMethod === 'phone' ? 'SEND MAGIC LINK' : 'LOG IN'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};