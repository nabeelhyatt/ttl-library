import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { LoginDialog } from "@/components/auth/login-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  user: User | null;
  onLogout: () => Promise<void>;
  onLogin: (email: string, name: string) => Promise<any>;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, onLogin }) => {
  const [location] = useLocation();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { toast } = useToast();
  
  const handleLogin = async (email: string, name: string) => {
    try {
      const loggedInUser = await onLogin(email, name);
      setIsLoginOpen(false);
      toast({
        title: "Success",
        description: `Welcome, ${name}!`,
      });
      return loggedInUser;
    } catch (error) {
      console.error("Login error in header:", error);
      toast({
        title: "Login Failed",
        description: "Unable to log in with those credentials.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <header>
      <div className="container">
        <div className="header-inner">
          <div className="logo">
            <Link href="/" className="no-underline title-font">
              The Tabletop Library
            </Link>
          </div>
          <nav>
            <Link
              href="/"
              className={location === "/" ? "active" : ""}
            >
              Hot
            </Link>
            <Link
              href="/rankings"
              className={location === "/rankings" ? "active" : ""}
            >
              Rankings
            </Link>

            {user ? (
              <>
                <Link
                  href="/my-votes"
                  className={location === "/my-votes" ? "active" : ""}
                >
                  My Votes
                </Link>
                <button onClick={onLogout} className="btn">
                  Log out
                </button>
              </>
            ) : (
              <button onClick={() => setIsLoginOpen(true)} className="login-btn">
                Login
              </button>
            )}
          </nav>
        </div>
      </div>

      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <LoginDialog 
          onClose={() => setIsLoginOpen(false)} 
          onSubmit={handleLogin}
        />
      </Dialog>
    </header>
  );
};
