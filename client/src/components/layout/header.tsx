import { Link, useLocation } from "wouter";
import { useState } from "react";
import { LoginDialog } from "../auth/login-dialog";
import { useAuth } from "../../contexts/AuthContext";

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
            
            <div className="ml-4"></div> {/* Add extra spacing */}

            {user ? (
              <>
                <Link
                  href="/my-votes"
                  className={location === "/my-votes" ? "active" : ""}
                >
                  My Votes
                </Link>
                <button 
                  onClick={logout} 
                  className="font-serif border border-gray-300 px-3 py-1 rounded hover:bg-gray-50 transition-all"
                >
                  Log Out
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsLoginOpen(true)} 
                className="font-serif border border-gray-300 px-3 py-1 rounded hover:bg-gray-50 transition-all"
              >
                Log In
              </button>
            )}
          </nav>
        </div>
      </div>

      <LoginDialog 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)}
        title="Log In to The Tabletop Library"
        description="Log in with Replit to vote on games, track your votes, and contribute to our community collection."
      />
    </header>
  );
};
