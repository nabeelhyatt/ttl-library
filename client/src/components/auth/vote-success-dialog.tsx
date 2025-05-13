import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface VoteSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameName: string;
  voteType: string;
}

export function VoteSuccessDialog({
  open,
  onOpenChange,
  gameName,
  voteType,
}: VoteSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg shadow-md font-serif">
        <DialogHeader className="flex flex-col items-center gap-2">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <DialogTitle className="text-xl font-medium text-center">Vote Recorded</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 text-center">
            Your vote for <span className="font-medium italic">{gameName}</span> has been recorded.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          <div className="text-center space-y-2">
            <p className="text-sm">You voted:</p>
            <p className="text-lg font-medium">{voteType}</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)} 
            className="w-full"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}