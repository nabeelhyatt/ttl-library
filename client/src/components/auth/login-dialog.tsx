// ABOUTME: Dialog component for login with Replit Auth
// ABOUTME: Displays login UI with Tufte styling

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '../ui/dialog';
import { useAuth } from '../../contexts/AuthContext';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { pendingVote } = useAuth();

  const handleLogin = () => {
    // Redirect to the server-side login route
    window.location.href = '/api/login';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-[#f5f5dc] border border-gray-300 shadow-sm p-6 font-serif">
        <DialogTitle className="text-xl text-center mb-4 mt-2">
          LOG IN TO THE TABLETOP LIBRARY
        </DialogTitle>
        
        <p className="text-center text-sm mb-6">
          Please login, ideally with the login you'll eventually use for your TTL membership.
        </p>

        <DialogFooter className="flex justify-center gap-8 mt-4">
          <button
            onClick={onClose}
            className="px-6 py-1 border border-gray-300 hover:bg-[#f0f0d8]"
          >
            CANCEL
          </button>
          
          <button 
            onClick={handleLogin}
            className="px-6 py-1 border border-[#f77213] bg-[#f77213] text-white hover:bg-[#e56b12]"
          >
            LOG IN
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};