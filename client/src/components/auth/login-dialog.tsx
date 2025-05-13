// ABOUTME: Dialog component for login with Replit Auth
// ABOUTME: Displays login UI with Tufte styling

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
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
  title = 'Log In Required',
  description = 'Please log in to continue. Your vote will be saved and applied after you log in.',
}) => {
  const { pendingVote } = useAuth();

  const handleLogin = () => {
    // Redirect to the server-side login route
    window.location.href = '/api/login';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-white border border-gray-300 shadow-md p-6">
        <DialogTitle className="text-xl font-serif border-b border-gray-200 pb-2 mb-4">
          {title}
        </DialogTitle>
        
        <DialogDescription className="text-base mb-6 font-serif">
          {description}
          
          {pendingVote && (
            <div className="mt-4 p-3 border border-gray-200 bg-gray-50 rounded">
              <p className="font-medium">Pending vote:</p>
              <p className="italic">{pendingVote.gameName}</p>
            </div>
          )}
        </DialogDescription>

        <DialogFooter className="flex gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </Button>
          
          <Button 
            onClick={handleLogin}
            className="bg-blue-700 hover:bg-blue-800 text-white"
          >
            Log In with Replit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};