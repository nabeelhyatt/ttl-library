import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import MyVotes from "@/pages/my-votes";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useState, useEffect } from "react";
import { apiRequest } from "./lib/queryClient";
import { User } from "@shared/schema";

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
    const res = await apiRequest("POST", "/api/auth/login", { email, name });
    const userData = await res.json();
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    setUser(null);
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
