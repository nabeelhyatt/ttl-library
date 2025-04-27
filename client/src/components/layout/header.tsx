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
    <header className="border-b border-gray-800 py-4">
      <div className="tufte-container flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-4xl font-tufte text-foreground">
            <Link href="/" className="no-underline text-foreground hover:text-accent transition duration-200">
              The Tabletop Library
            </Link>
          </h1>
        </div>
        <nav>
          <div className="flex space-x-6">
            <a 
              href="https://www.tabletoplibrary.com/membership" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-lg font-tufte text-muted-foreground hover:text-accent transition duration-200"
            >
              Become a member
            </a>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/my-votes" 
                  className={`text-lg font-tufte ${location === '/my-votes' ? 'text-accent' : 'text-muted-foreground hover:text-accent'} transition duration-200`}
                >
                  My Votes
                </Link>
                <button 
                  onClick={onLogout}
                  className="text-lg font-tufte text-muted-foreground hover:text-accent transition duration-200"
                >
                  Log out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="text-lg font-tufte text-muted-foreground hover:text-accent transition duration-200"
              >
                Log in
              </button>
            )}
          </div>
        </nav>
      </div>

      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <LoginDialog onClose={() => setIsLoginOpen(false)} />
      </Dialog>
    </header>
  );
};
