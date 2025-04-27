import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface VoteSuccessDialogProps {
  onClose: () => void;
}

export const VoteSuccessDialog: React.FC<VoteSuccessDialogProps> = ({ onClose }) => {
  return (
    <DialogContent className="bg-secondary rounded-lg p-8 max-w-md w-full mx-4">
      <div className="flex justify-center mb-6">
        <div className="h-16 w-16 rounded-full bg-vote-played/20 flex items-center justify-center mb-4">
          <FontAwesomeIcon icon="check" className="text-vote-played text-2xl" />
        </div>
      </div>
      
      <DialogHeader>
        <DialogTitle className="font-tufte text-center text-xl text-foreground mb-2">
          Vote Registered!
        </DialogTitle>
        <DialogDescription className="text-muted-foreground text-center">
          Your vote has been successfully recorded. Thank you for your contribution!
        </DialogDescription>
      </DialogHeader>
      
      <DialogFooter className="mt-6">
        <Button 
          onClick={onClose} 
          className="w-full bg-accent text-background py-3 rounded-lg hover:bg-accent/90 transition duration-200 font-medium"
        >
          Continue Exploring
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
