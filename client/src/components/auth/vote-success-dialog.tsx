// ABOUTME: Dialog component for displaying vote success confirmation
// ABOUTME: Shows a success message and options after a vote is submitted

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VoteType, voteTypeInfo } from '@shared/schema';
import { Link } from 'wouter';

interface VoteSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  gameName: string;
  voteType: VoteType;
}

export const VoteSuccessDialog: React.FC<VoteSuccessDialogProps> = ({
  isOpen,
  onClose,
  gameName,
  voteType
}) => {
  const voteTypeText = voteTypeInfo[voteType]?.label || 'Unknown vote type';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-white border border-gray-300 shadow-md p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif border-b border-gray-200 pb-2">
            Vote Recorded
          </DialogTitle>
        </DialogHeader>
        
        <DialogDescription className="py-4 text-base font-serif">
          <p className="mb-2">Your vote for <strong>{gameName}</strong> has been successfully recorded.</p>
          <p>Vote type: <em>{voteTypeText}</em></p>
        </DialogDescription>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            onClick={onClose}
            className="bg-blue-700 hover:bg-blue-800 text-white"
          >
            Continue Browsing
          </Button>
          
          <Link href="/my-votes">
            <Button 
              variant="outline"
              onClick={onClose}
              className="border-gray-300 hover:bg-gray-100"
            >
              View My Votes
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};