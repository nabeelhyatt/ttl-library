// ABOUTME: Main application component that sets up providers and routing.
// ABOUTME: Includes authentication, search context, and query client providers.

import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import MyVotes from "@/pages/my-votes";
import Rankings from "@/pages/rankings";
import Bulk from "@/pages/bulk";
import AuthVerify from "@/pages/auth-verify";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "./contexts/AuthContext";
import { SearchProvider } from "./contexts/SearchContext";

// Updated implementation using AuthContext
function Router() {
  // We'll use the useAuth hook inside the components that need it, not here
  return (
    <div className="app-wrapper">
      <Header />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/bulk" component={Bulk} />
        <Route path="/my-votes" component={MyVotes} />
        <Route path="/rankings" component={Rankings} />
        <Route path="/auth/verify" component={AuthVerify} />
        <Route component={NotFound} />
      </Switch>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <SearchProvider>
            <Toaster />
            <Router />
          </SearchProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
