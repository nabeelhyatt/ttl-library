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
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function Router() {
  const { user, login, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // We still need to handle loading state, but auth is managed by AuthContext
    setIsLoading(false);
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
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
