import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess?: () => void;
}

export function LoginDialog({ open, onOpenChange, onLoginSuccess }: LoginDialogProps) {
  const { login, directLoginWithReplit, isLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    
    try {
      setError("");
      await login(email, name);
      
      toast({
        title: "Login successful",
        description: "You are now logged in.",
      });
      
      onOpenChange(false);
      
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    }
  };

  const handleReplitLogin = () => {
    // Store pending action in local storage to restore after redirect
    if (window.localStorage) {
      localStorage.setItem("pendingLogin", "true");
    }
    directLoginWithReplit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg shadow-md font-serif">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">Sign in</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Login to vote and customize your board game experience.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleEmailLogin} className="space-y-4 pt-4">
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="h-9 px-3 py-2 text-sm"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="h-9 px-3 py-2 text-sm"
              disabled={isLoading}
            />
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={handleReplitLogin}
              disabled={isLoading}
            >
              Sign in with Replit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}