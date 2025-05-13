// ABOUTME: Provides authentication context for the application
// ABOUTME: Manages user state and login/logout functionality

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';

// Define user type
export interface User {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
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
}

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  pendingVote: null,
  setPendingVote: () => {},
  logout: () => {},
  getDisplayName: () => 'Guest',
});

// Auth provider component
export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingVote, setPendingVote] = useState<PendingVote | null>(null);
  const queryClient = useQueryClient();

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/auth/user');
        if (response.status === 200) {
          setUser(response.data);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        // If error, user is not authenticated
        setUser(null);
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
      
      // Redirect to logout endpoint
      window.location.href = '/api/logout';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Helper function to get display name
  const getDisplayName = (): string => {
    if (!user) return 'Guest';
    
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