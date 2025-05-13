import { useState } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Define component props
interface LoginDialogProps {
  onClose: () => void;
  // The pendingVote property will store information about a vote that was
  // attempted before login, so it can be processed after authentication
  pendingVoteId?: number;
  gameId?: number;
  voteType?: number;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({ 
  onClose, 
  pendingVoteId,
  gameId,
  voteType 
}) => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { toast } = useToast();

  const handleLogin = () => {
    setIsRedirecting(true);
    
    // Construct login URL with any pending vote information
    let loginUrl = '/api/login';
    const params = new URLSearchParams();
    
    // Add return URL to current page
    params.append('returnTo', window.location.pathname);
    
    // Add any pending vote information
    if (gameId && voteType) {
      params.append('gameId', gameId.toString());
      params.append('voteType', voteType.toString());
    }
    
    // Redirect to the Replit Auth login endpoint
    window.location.href = `${loginUrl}?${params.toString()}`;
  };

  return (
    <DialogContent className="bg-[#f5f5dc] rounded-lg p-8 max-w-md w-full mx-4 shadow-lg">
      <DialogHeader>
        <div className="flex justify-between items-center mb-2">
          <DialogTitle className="font-tufte text-xl text-foreground">Log In / Register</DialogTitle>
        </div>
        <DialogDescription className="text-muted-foreground">
          Sign in with your Replit account for seamless authentication. No password needed!
        </DialogDescription>
      </DialogHeader>

      <div className="my-8 text-center">
        <p className="mb-6 text-muted-foreground">
          Click below to securely log in with Replit. We'll only access your basic profile information.
        </p>
        
        {pendingVoteId && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
            <p>You have a pending vote that will be applied after login.</p>
          </div>
        )}
        
        <Button 
          onClick={handleLogin} 
          className="w-full bg-accent text-background py-3 rounded-lg hover:bg-accent/90 transition duration-200 font-medium"
          disabled={isRedirecting}
        >
          {isRedirecting ? 'Redirecting...' : 'Continue with Replit'}
        </Button>
      </div>

      <div className="text-muted-foreground text-xs mt-6">
        By continuing, you agree to our terms and conditions and privacy policy.
      </div>
    </DialogContent>
  );
};