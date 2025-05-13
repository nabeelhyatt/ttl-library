import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import MyVotes from "@/pages/my-votes";
import Rankings from "@/pages/rankings";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useState, useEffect } from "react";
import { apiRequest } from "./lib/queryClient";
import { User } from "@shared/schema";
import { AuthProvider } from "./contexts/AuthContext";

// Go back to using the original implementation for now
function Router() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("GET", "/api/auth/me");
      const userData = await res.json();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, name: string) => {
    try {
      const res = await apiRequest("POST", "/api/auth/login", { email, name });
      const userData = await res.json();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <div className="app-wrapper">
      <Header user={user} onLogout={logout} />
      {isLoading ? (
        <main>
          <div className="container">
            <div className="loading-indicator">Loading...</div>
          </div>
        </main>
      ) : (
        <Switch>
          <Route path="/" component={() => <Home user={user} onLogin={login} />} />
          <Route path="/my-votes" component={() => <MyVotes user={user} />} />
          <Route path="/rankings" component={Rankings} />
          <Route component={NotFound} />
        </Switch>
      )}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
