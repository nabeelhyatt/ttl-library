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
        <div className="p-5">
          {/* Main content area */}
          <div className="relative">
            {/* TLCS code placeholder - will be replaced with actual data later */}
            <div className="absolute top-0 right-0 bg-zinc-700 text-white px-3 py-1 rounded">
              {weightClass ? `${weightClass}0.2` : '—.—'}
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              {/* Game image with fixed width of 200px */}
              <div className="relative w-full md:w-[180px] md:flex-shrink-0 overflow-hidden rounded-md">
                <img 
                  src={game.thumbnail || game.image} 
                  alt={`${game.name} board game`} 
                  className="w-full h-auto object-cover aspect-[1/1]"
                  onError={(e) => {
                    // Fallback image if the thumbnail fails to load
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
                  }}
                />
              </div>
              
              {/* Game information */}
              <div className="flex-grow">
                <h3 className="font-tufte text-xl font-medium text-foreground mb-2">{game.name}</h3>
                
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {game.description ? (
                    <span dangerouslySetInnerHTML={{ __html: game.description.substring(0, 180) + (game.description.length > 180 ? '...' : '') }} />
                  ) : (
                    "No description available."
                  )}
                </p>
                
                {/* Bottom info area aligned with the bottom of the image */}
                <div className="mt-auto pt-2 flex flex-wrap items-center gap-2">
                  <a 
                    href={`https://boardgamegeek.com/boardgame/${game.gameId}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-accent text-xs hover:underline flex items-center"
                  >
                    <FontAwesomeIcon icon="external-link-alt" className="mr-1" /> More information
                  </a>
                  
                  <span className={`${genreColorClass} text-xs px-2 py-1 rounded whitespace-nowrap`}>
                    {primaryGenre}
                  </span>
                  
                  {game.weightRating && (
                    <span className="text-muted-foreground text-xs flex items-center bg-gray-800/30 px-2 py-1 rounded">
                      <FontAwesomeIcon icon="weight-hanging" className="mr-1" /> {game.weightRating}
                    </span>
                  )}
                  
                  {game.bggRank && (
                    <span className="text-muted-foreground text-xs flex items-center bg-gray-800/30 px-2 py-1 rounded">
                      #{game.bggRank} on BGG
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Vote buttons section */}
        <div className="mt-auto p-5 pt-2 border-t border-gray-800">
          <p className="text-xs text-muted-foreground mb-2">Vote for this game:</p>
          <div className="flex flex-wrap gap-2">
            {Object.values(VoteType)
              .filter(v => !isNaN(Number(v)))
              .map(voteType => {
                const voteTypeNumber = Number(voteType);
                const info = voteTypeInfo[voteTypeNumber as keyof typeof voteTypeInfo];
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
