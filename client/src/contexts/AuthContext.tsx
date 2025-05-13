import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, VoteType } from '@shared/schema';
import { submitVote } from '@/lib/airtable-api';
import { useToast } from '@/hooks/use-toast';

// Define the shape of our pending vote
type PendingVote = {
  gameId: number;
  voteType: VoteType;
};

// Define the shape of our auth context
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  pendingVote: PendingVote | null;
  setPendingVote: (vote: PendingVote | null) => void;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  pendingVote: null,
  setPendingVote: () => {},
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [pendingVote, setPendingVote] = useState<PendingVote | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch the current user using TanStack Query
  const { data: user = null, isLoading, error } = useQuery<User | null>({
    queryKey: ['/api/auth/user'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Authentication state
  const isAuthenticated = !!user;
  
  // Redirect to Replit auth login
  const login = () => {
    window.location.href = '/api/login';
  };
  
  // Redirect to Replit auth logout
  const logout = () => {
    window.location.href = '/api/logout';
  };

  // Process pending vote when user becomes authenticated
  useEffect(() => {
    const processPendingVote = async () => {
      if (pendingVote && user) {
        try {
          // Submit the vote that was pending
          await submitVote(pendingVote.gameId, pendingVote.voteType);
          
          // Show success toast
          toast({
            title: 'Vote Registered!',
            description: 'Your vote has been recorded successfully.',
            duration: 3000,
            className: 'bg-[#f5f5dc]', // Beige background to match design
          });
          
          // Clear the pending vote
          setPendingVote(null);
          
          // Invalidate any relevant queries
          queryClient.invalidateQueries({
            queryKey: ['/api/votes'],
          });
        } catch (error) {
          console.error('Failed to process pending vote:', error);
          toast({
            title: 'Vote Failed',
            description: 'We couldn\'t record your vote. Please try again.',
            variant: 'destructive',
          });
        }
      }
    };
    
    processPendingVote();
  }, [user, pendingVote, toast, queryClient]);

  // If there's an error fetching the user, log it
  useEffect(() => {
    if (error) {
      console.error('Error fetching user:', error);
    }
  }, [error]);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    pendingVote,
    setPendingVote,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};