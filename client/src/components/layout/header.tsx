import { Link, useLocation } from "wouter";
import { useState } from "react";
import { LoginDialog } from "../auth/login-dialog";
import { useAuth } from "../../contexts/AuthContext";
import { useSearch } from "../../contexts/SearchContext";

export const Header = () => {
  const { user, logout, getDisplayName, authType } = useAuth();
  const [location] = useLocation();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { clearSearch } = useSearch();

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
              onClick={clearSearch}
            >
              Hot
            </Link>
            <Link
              href="/bulk"
              className={location === "/bulk" ? "active" : ""}
              onClick={clearSearch}
            >
              Bulk
            </Link>
            <Link
              href="/rankings"
              className={location === "/rankings" ? "active" : ""}
              onClick={clearSearch}
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-serif">
                    {getDisplayName()}
                    {authType === 'phone' && (
                      <span className="text-xs text-green-600 ml-1">📱</span>
                    )}
                    {authType === 'replit' && (
                      <span className="text-xs text-blue-600 ml-1">💻</span>
                    )}
                  </span>
                  <button 
                    onClick={logout} 
                    className="font-serif border border-gray-300 px-3 py-1 rounded hover:bg-gray-50 transition-all"
                    title={`Logout from ${authType === 'phone' ? 'phone' : 'Replit'} authentication`}
                  >
                    Log Out
                  </button>
                </div>
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
      />
    </header>
  );
};
