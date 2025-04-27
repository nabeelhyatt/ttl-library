import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { BGGGame, User, VoteType, voteTypeInfo } from '@shared/schema';
import { getBGGtoTLCSWeight, getPrimaryGenre } from '@/lib/bgg-api';
import { Dialog } from '@/components/ui/dialog';
import { LoginDialog } from '@/components/auth/login-dialog';
import { VoteSuccessDialog } from '@/components/auth/vote-success-dialog';
import { submitVote } from '@/lib/airtable-api';
import { useToast } from '@/hooks/use-toast';

interface GameCardProps {
  game: BGGGame;
  user: User | null;
  onLogin: (email: string) => Promise<User>;
  onVoteSuccess?: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ 
  game, 
  user, 
  onLogin,
  onVoteSuccess 
}) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isVoteSuccessOpen, setIsVoteSuccessOpen] = useState(false);
  const [votingType, setVotingType] = useState<VoteType | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const { toast } = useToast();
  
  const handleVoteClick = (voteType: VoteType) => {
    setVotingType(voteType);
    
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    
    processVote(voteType);
  };
  
  const processVote = async (voteType: VoteType) => {
    if (!user) return;
    
    setIsVoting(true);
    try {
      await submitVote(game.gameId, voteType);
      setIsVoteSuccessOpen(true);
      if (onVoteSuccess) {
        onVoteSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your vote. Please try again.",
        variant: "destructive"
      });
      console.error("Vote submission error:", error);
    } finally {
      setIsVoting(false);
    }
  };
  
  const handleLoginSuccess = async (email: string) => {
    try {
      const loggedInUser = await onLogin(email);
      setIsLoginOpen(false);
      if (votingType && loggedInUser) {
        processVote(votingType);
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Could not log in with this email. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const primaryGenre = getPrimaryGenre(game.categories || []);
  const weightClass = game.weightRating ? getBGGtoTLCSWeight(parseFloat(game.weightRating)) : null;
  
  // Determine genre color class
  let genreColorClass = "bg-vote-try/20 text-vote-try";
  switch (primaryGenre.toLowerCase()) {
    case "abstract":
      genreColorClass = "bg-vote-try/20 text-vote-try";
      break;
    case "party":
      genreColorClass = "bg-vote-played/20 text-vote-played";
      break;
    case "cooperative":
      genreColorClass = "bg-vote-club/20 text-vote-club";
      break;
    case "worker placement":
    case "engine building":
      genreColorClass = "bg-vote-tournament/20 text-vote-tournament";
      break;
    case "strategy":
      genreColorClass = "bg-vote-teach/20 text-vote-teach";
      break;
    default:
      genreColorClass = "bg-vote-try/20 text-vote-try";
  }
  
  return (
    <>
      <div className="game-card bg-secondary rounded-lg overflow-hidden border border-gray-800 flex flex-col h-full">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img 
            src={game.thumbnail || game.image} 
            alt={`${game.name} board game`} 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback image if the thumbnail fails to load
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
            }}
          />
          {game.bggRank && (
            <div className="absolute top-2 right-2 bg-background text-xs text-muted-foreground px-2 py-1 rounded-full">
              #{game.bggRank} on BGG
            </div>
          )}
        </div>
        
        <div className="p-5 flex-grow">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-tufte text-lg font-medium text-foreground">{game.name}</h3>
            <span className={`${genreColorClass} text-xs px-2 py-1 rounded`}>
              {primaryGenre}
            </span>
          </div>
          
          <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
            {game.description ? (
              <span dangerouslySetInnerHTML={{ __html: game.description.substring(0, 120) + (game.description.length > 120 ? '...' : '') }} />
            ) : (
              "No description available."
            )}
          </p>
          
          <div className="flex justify-between items-center">
            <a 
              href={`https://boardgamegeek.com/boardgame/${game.gameId}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-accent text-sm hover:underline flex items-center"
            >
              More information <FontAwesomeIcon icon="external-link-alt" className="ml-1 text-xs" />
            </a>
            
            {game.weightRating && (
              <span className="text-muted-foreground text-sm flex items-center">
                <FontAwesomeIcon icon="weight-hanging" className="mr-1 text-xs" /> {game.weightRating}
              </span>
            )}
          </div>
        </div>
        
        <div className="p-5 pt-0">
          <p className="text-xs text-muted-foreground mb-2">Vote for this game:</p>
          <div className="flex flex-wrap gap-2">
            {Object.values(VoteType)
              .filter(v => !isNaN(Number(v)))
              .map(voteType => {
                const voteTypeNumber = Number(voteType);
                const info = voteTypeInfo[voteTypeNumber];
                return (
                  <button 
                    key={voteTypeNumber}
                    onClick={() => handleVoteClick(voteTypeNumber)}
                    disabled={isVoting}
                    className={`vote-button px-3 py-1 text-xs rounded-full ${info.bgColor} ${info.textColor} ${info.hoverBgColor} transition ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <FontAwesomeIcon icon={info.icon} className="mr-1" /> {info.label}
                  </button>
                );
              })}
          </div>
        </div>
      </div>
      
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <LoginDialog onClose={() => setIsLoginOpen(false)} onSubmit={handleLoginSuccess} />
      </Dialog>
      
      <Dialog open={isVoteSuccessOpen} onOpenChange={setIsVoteSuccessOpen}>
        <VoteSuccessDialog onClose={() => setIsVoteSuccessOpen(false)} />
      </Dialog>
    </>
  );
};
