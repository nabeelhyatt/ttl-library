import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { LoginDialog } from "@/components/auth/login-dialog";

interface HeaderProps {
  user: User | null;
  onLogout: () => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [location] = useLocation();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <header className="py-12 py-6 bg-transparent">
      <div className="container flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="logo">
            <Link href="/" className="no-underline text-black">
              Tabletop Library
            </Link>
          </h1>
        </div>
        <nav>
          <Link 
            href="/rankings" 
            className={`${location === '/rankings' ? 'font-bold' : ''}`}
          >
            Rankings
          </Link>
            
          {user ? (
            <>
              <Link 
                href="/my-votes" 
                className={`${location === '/my-votes' ? 'font-bold' : ''}`}
              >
                My Votes
              </Link>
              <button 
                onClick={onLogout}
              >
                Log out
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsLoginOpen(true)}
            >
              Login
            </button>
          )}
        </nav>
      </div>

      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <LoginDialog onClose={() => setIsLoginOpen(false)} />
      </Dialog>
    </header>
  );
};
