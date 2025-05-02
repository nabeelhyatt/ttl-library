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
              <button onClick={() => setIsLoginOpen(true)} className="btn">
                Login
              </button>
            )}
          </nav>
        </div>
      </div>

      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <LoginDialog onClose={() => setIsLoginOpen(false)} />
      </Dialog>
    </header>
  );
};
