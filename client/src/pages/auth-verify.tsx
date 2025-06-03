// ABOUTME: Phone authentication verification page that handles magic link token verification
// ABOUTME: Manages the complete verification flow with loading states, error handling, and redirects

import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface VerificationState {
  status: 'loading' | 'success' | 'error';
  message: string;
  user?: {
    id: string;
    phone: string;
    fullName?: string;
    email?: string;
  };
}

const AuthVerify: React.FC = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [verificationState, setVerificationState] = useState<VerificationState>({
    status: 'loading',
    message: 'Verifying your authentication...'
  });

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Get token from URL search params
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
          setVerificationState({
            status: 'error',
            message: 'No verification token found in the link. Please try requesting a new magic link.'
          });
          return;
        }

        // Call verification endpoint
        const response = await axios.get(`/api/auth/phone/verify?token=${encodeURIComponent(token)}`);

        if (response.data.success) {
          setVerificationState({
            status: 'success',
            message: 'Authentication successful! Redirecting you to the app...',
            user: response.data.user
          });

          // Use window.location.href for full page reload to ensure AuthContext refreshes
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else {
          setVerificationState({
            status: 'error',
            message: response.data.message || 'Verification failed. Please try again.'
          });
        }

      } catch (error: any) {
        console.error('Verification error:', error);
        
        let errorMessage = 'Verification failed. Please try again.';
        
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.status === 401) {
          errorMessage = 'This magic link has expired or is invalid. Please request a new one.';
        } else if (error.response?.status === 429) {
          errorMessage = 'Too many verification attempts. Please wait a few minutes and try again.';
        } else if (!navigator.onLine) {
          errorMessage = 'No internet connection. Please check your connection and try again.';
        }

        setVerificationState({
          status: 'error',
          message: errorMessage
        });
      }
    };

    verifyToken();
  }, [setLocation]);

  const handleReturnHome = () => {
    // Use window.location.href to ensure full page reload
    window.location.href = '/';
  };

  const handleTryAgain = () => {
    // For now, just redirect to home where they can try authentication again
    // In the future, this could redirect to a phone input page
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {verificationState.status === 'loading' && 'Verifying...'}
            {verificationState.status === 'success' && 'Welcome!'}
            {verificationState.status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            Phone Authentication
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status Icon */}
          <div className="flex justify-center">
            {verificationState.status === 'loading' && (
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            )}
            {verificationState.status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {verificationState.status === 'error' && (
              <AlertCircle className="h-12 w-12 text-red-600" />
            )}
          </div>

          {/* Message */}
          <div className="text-center">
            <p className="text-gray-700 mb-4">
              {verificationState.message}
            </p>

            {/* User Info (on success) */}
            {verificationState.status === 'success' && verificationState.user && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm">
                <p className="font-medium text-green-800">
                  {verificationState.user.fullName || `User ${verificationState.user.id}`}
                </p>
                <p className="text-green-600">
                  {verificationState.user.phone}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {verificationState.status === 'loading' && (
              <div className="text-center text-sm text-gray-500">
                This usually takes just a few seconds...
              </div>
            )}

            {verificationState.status === 'success' && (
              <Button 
                onClick={handleReturnHome}
                className="w-full"
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to App Now
              </Button>
            )}

            {verificationState.status === 'error' && (
              <div className="space-y-2">
                <Button 
                  onClick={handleTryAgain}
                  className="w-full"
                  variant="default"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={handleReturnHome}
                  className="w-full"
                  variant="outline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Home
                </Button>
              </div>
            )}
          </div>

          {/* Help Text */}
          {verificationState.status === 'error' && (
            <div className="text-xs text-gray-500 text-center border-t pt-4">
              <p>Having trouble? Make sure you're clicking the link from the same device that received the SMS, and that the link hasn't expired (links are valid for 10 minutes).</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthVerify; 