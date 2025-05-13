import { Link, useLocation } from "wouter";
import { useState } from "react";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useAuth } from "@/contexts/AuthContext";

export const Header = () => {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

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
                <button onClick={logout} className="btn">
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

      <LoginDialog 
        open={isLoginOpen} 
        onOpenChange={setIsLoginOpen}
        onLoginSuccess={() => {
          // Refresh the page or navigate to a specific location if needed
        }}
      />
    </header>
  );
};
