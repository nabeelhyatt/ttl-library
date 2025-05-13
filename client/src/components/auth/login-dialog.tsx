// ABOUTME: Dialog component for login with Replit Auth
// ABOUTME: Displays login UI with Tufte styling

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
      <DialogContent className="sm:max-w-[425px] bg-white border border-gray-200 shadow-sm p-6 font-serif">
        <h2 className="text-xl text-center mb-6 mt-2">
          LOG IN TO THE TABLETOP LIBRARY
        </h2>

        <DialogFooter className="flex justify-center gap-8 mt-4">
          <button
            onClick={onClose}
            className="px-6 py-1 border border-gray-300 hover:bg-gray-50"
          >
            CANCEL
          </button>
          
          <button 
            onClick={handleLogin}
            className="px-6 py-1 border border-gray-800 bg-gray-800 text-white hover:bg-gray-900"
          >
            LOG IN
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};