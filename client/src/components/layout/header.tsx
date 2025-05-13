import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const Header: React.FC = () => {
  const [location] = useLocation();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const handleLogout = () => {
    // Replit Auth handles logout through the API endpoint
    window.location.href = '/api/logout';
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

            {isLoading ? (
              <span className="px-4 py-2 text-sm opacity-50">Loading...</span>
            ) : isAuthenticated ? (
              <>
                <Link
                  href="/my-votes"
                  className={location === "/my-votes" ? "active" : ""}
                >
                  My Votes
                </Link>
                <button onClick={handleLogout} className="btn">
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
        />
      </Dialog>
    </header>
  );
};
