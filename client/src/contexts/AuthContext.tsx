
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  pendingVote: { gameId: number; voteType: number } | null;
  setPendingVote: (vote: { gameId: number; voteType: number } | null) => void;
  processPendingVote: () => Promise<boolean>;
  login: (email: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
  directLoginWithReplit: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingVote, setPendingVote] = useState<{ gameId: number; voteType: number } | null>(null);

  // Process any pending votes after login
  const processPendingVote = async (): Promise<boolean> => {
    if (!user || !pendingVote) return false;
    
    try {
      // Submit the vote
      await apiRequest("POST", "/api/votes", {
        gameId: pendingVote.gameId,
        voteType: pendingVote.voteType
      });
      
      // Clear the pending vote after successful submission
      setPendingVote(null);
      return true;
    } catch (error) {
      console.error("Failed to process pending vote:", error);
      return false;
    }
  };
  
  // Check if user is logged in on initial load
  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("GET", "/api/auth/me");
      const userData = await res.json();
      setUser(userData);
      
      // If we have a pending vote and user just logged in, process it
      if (pendingVote && userData) {
        await processPendingVote();
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Login with email/name (existing flow)
  const login = async (email: string, name: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", { email, name });
      const userData = await res.json();
      setUser(userData);
      
      // Process any pending votes after successful login
      if (pendingVote) {
        await processPendingVote();
      }
      
      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Direct login with Replit (to be used when we switch to Replit Auth)
  const directLoginWithReplit = () => {
    // For future implementation - will redirect to Replit OAuth flow
    window.location.href = "/api/login";
  };

  const logout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    setUser(null);
    // Clear any pending votes on logout
    setPendingVote(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        pendingVote, 
        setPendingVote, 
        processPendingVote, 
        login, 
        logout, 
        directLoginWithReplit 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
