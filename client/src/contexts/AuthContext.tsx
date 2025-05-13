
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface AuthContextType {
  user: User | null;
  pendingVote: { gameId: number; voteType: number } | null;
  setPendingVote: (vote: { gameId: number; voteType: number } | null) => void;
  login: (email: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingVote, setPendingVote] = useState<{ gameId: number; voteType: number } | null>(null);

  const checkAuth = async () => {
    try {
      const res = await apiRequest("GET", "/api/auth/me");
      const userData = await res.json();
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, name: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { email, name });
    const userData = await res.json();
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, pendingVote, setPendingVote, login, logout }}>
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
