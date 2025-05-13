import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import MyVotes from "@/pages/my-votes";
import Rankings from "@/pages/rankings";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "./contexts/AuthContext";

function Router() {
  const { user, isLoading, logout } = useAuth();

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
          <Route path="/" component={Home} />
          <Route path="/my-votes" component={() => <MyVotes />} />
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