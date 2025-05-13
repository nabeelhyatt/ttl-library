import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess?: () => void;
}

export function LoginDialog({
  open,
  onOpenChange,
  onLoginSuccess,
}: LoginDialogProps) {
  const { login } = useAuth();

  const handleLogin = () => {
    // Use the login function from auth context
    login();
    // Notify parent component if needed
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#f5f5dc] border-gray-800 text-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">Login Required</DialogTitle>
          <DialogDescription className="font-serif text-base text-gray-700">
            You need to be logged in to vote for games in the Tabletop Library.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          <p className="font-serif text-gray-800">
            Sign in with your Replit account to track your game votes and preferences.
          </p>
          
          <p className="text-sm text-gray-700 italic">
            Your votes help us understand which games to add to the Tabletop Library.
          </p>
        </div>
        
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-800"
          >
            Cancel
          </Button>
          
          <Button 
            onClick={handleLogin}
            className="bg-gray-800 hover:bg-gray-700 text-white"
          >
            Log In with Replit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}