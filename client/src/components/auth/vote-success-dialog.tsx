import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BGGGame, VoteType, voteTypeInfo } from "@shared/schema";

interface VoteSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: BGGGame | null;
  voteType: VoteType | null;
}

export function VoteSuccessDialog({
  open,
  onOpenChange,
  game,
  voteType,
}: VoteSuccessDialogProps) {
  if (!game || !voteType) return null;

  const voteTypeText = voteTypeInfo[voteType]?.label || "Unknown vote type";
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#f5f5dc] border-gray-800 text-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">Vote Recorded</DialogTitle>
          <DialogDescription className="font-serif text-base text-gray-700">
            Your vote has been successfully added to our database.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-3">
          <p className="font-serif text-gray-800">
            <span className="font-semibold">Game:</span> {game.name}
          </p>
          
          <p className="font-serif text-gray-800">
            <span className="font-semibold">Your vote:</span> {voteTypeText}
          </p>
          
          <p className="text-sm text-gray-700 italic mt-4">
            Your vote helps us understand which games to prioritize in our collection.
          </p>
        </div>
        
        <div className="flex justify-end mt-6">
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-gray-800 hover:bg-gray-700 text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}