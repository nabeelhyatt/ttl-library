// ABOUTME: Provides authentication context for the application supporting both Replit and phone authentication
// ABOUTME: Manages user state and login/logout functionality with fallback between auth types

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';

// Define user type - supports both Replit and phone authentication
export interface User {
  id: string;
  // Replit authentication fields
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  // Phone authentication fields
  phone?: string | null;
  fullName?: string | null;
  // Authentication type identifier
  authType?: 'replit' | 'phone';
}

// Define pending vote type
export interface PendingVote {
  gameId: number;
  gameName: string;
  voteType: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  pendingVote: PendingVote | null;
  setPendingVote: (vote: PendingVote | null) => void;
  logout: () => void;
  getDisplayName: () => string;
  authType: 'replit' | 'phone' | null;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  pendingVote: null,
  setPendingVote: () => {},
  logout: () => {},
  getDisplayName: () => 'Guest',
  authType: null,
});

// Auth provider component
export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingVote, setPendingVote] = useState<PendingVote | null>(null);
  const [authType, setAuthType] = useState<'replit' | 'phone' | null>(null);
  const queryClient = useQueryClient();

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Try phone authentication first (new system)
        try {
          const phoneResponse = await axios.get('/api/auth/phone/user');
          if (phoneResponse.status === 200) {
            setUser({
              ...phoneResponse.data,
              authType: 'phone'
            });
            setAuthType('phone');
            return;
          }
        } catch (phoneError) {
          // Phone auth failed, try Replit auth (existing system)
          console.log('Phone auth not available, trying Replit auth...');
        }

        // Fallback to Replit authentication
        const replitResponse = await axios.get('/api/auth/user');
        if (replitResponse.status === 200) {
          setUser({
            ...replitResponse.data,
            authType: 'replit'
          });
          setAuthType('replit');
        }
      } catch (error) {
        console.log('No authentication available');
        // If both auth methods fail, user is not authenticated
        setUser(null);
        setAuthType(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Handle logout
  const logout = async () => {
    try {
      // Clear pendingVote when logging out
      setPendingVote(null);
      
      if (authType === 'phone') {
        // Use phone auth logout
        await axios.post('/api/auth/phone/logout');
        // Clear local state
        setUser(null);
        setAuthType(null);
        // Optionally reload to clear any cached state
        window.location.reload();
      } else {
        // Use Replit auth logout (redirect-based)
        window.location.href = '/api/logout';
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Force reload on error to ensure clean state
      window.location.reload();
    }
  };

  // Helper function to get display name
  const getDisplayName = (): string => {
    if (!user) return 'Guest';
    
    // Phone authentication display name
    if (user.authType === 'phone') {
      if (user.fullName && user.fullName !== 'New Member') {
        return user.fullName;
      } else if (user.phone) {
        // Format phone number for display (e.g., "+15551234567" -> "(555) 123-4567")
        const formatted = user.phone.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3');
        return formatted !== user.phone ? formatted : user.phone;
      } else {
        return `User ${user.id.substring(0, 8)}`;
      }
    }
    
    // Replit authentication display name (existing logic)
    if (user.firstName) {
      return user.firstName;
    } else if (user.email) {
      // Use part before @ in email
      return user.email.split('@')[0];
    } else {
      return `User ${user.id.substring(0, 8)}`;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        pendingVote,
        setPendingVote,
        logout,
        getDisplayName,
        authType,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Export the hook to access auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}