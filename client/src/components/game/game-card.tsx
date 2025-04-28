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
      <div className="game-card bg-zinc-900 rounded overflow-hidden border border-zinc-800 flex flex-col h-full">
        {/* Main content area with image, title, and description */}
        <div className="p-4 pb-6">
          <div className="relative">
            {/* TLCS code in the upper right corner */}
            <div className="absolute top-0 right-0 bg-zinc-800 text-white px-4 py-1 rounded font-mono">
              {game.tlcsCode || (weightClass ? `${weightClass}0.2` : '—.—')}
            </div>
            
            <div className="flex flex-col md:flex-row gap-5 pt-2">
              {/* Game image in the top left */}
              <div className="w-full md:w-[180px] flex-shrink-0 overflow-hidden rounded">
                <img 
                  src={game.thumbnail || game.image} 
                  alt={`${game.name} board game`} 
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    // Fallback image if the thumbnail fails to load
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
                  }}
                />
              </div>
              
              {/* Game information to the right of the image */}
              <div className="flex-grow flex flex-col justify-between">
                {/* Title and description at the top */}
                <div>
                  <h3 className="font-tufte text-xl font-medium text-white mb-2">{game.name}</h3>
                  
                  <p className="text-zinc-400 text-sm line-clamp-3">
                    {game.description ? (
                      <span dangerouslySetInnerHTML={{ __html: game.description.substring(0, 180) + (game.description.length > 180 ? '...' : '') }} />
                    ) : (
                      "No description available."
                    )}
                  </p>
                </div>
                
                {/* Availability Status */}
                <div className="flex flex-wrap gap-2 mt-3 mb-2">
                  {game.forRent === true && (
                    <span className="text-white text-xs bg-green-700/80 px-3 py-1 rounded-md flex items-center">
                      <FontAwesomeIcon icon={"check-circle" as any} className="mr-1" /> TTL In House
                    </span>
                  )}
                  {game.forSale === true && (
                    <span className="text-white text-xs bg-blue-700/80 px-3 py-1 rounded-md flex items-center">
                      <FontAwesomeIcon icon={"tag" as any} className="mr-1" /> TTL In Stock
                    </span>
                  )}
                  {game.toOrder === true && (
                    <span className="text-white text-xs bg-amber-600/80 px-3 py-1 rounded-md flex items-center">
                      <FontAwesomeIcon icon={"shopping-cart" as any} className="mr-1" /> TTL Ordered
                    </span>
                  )}
                </div>

                {/* Game info (links, genre, weight, BGG rank) at the bottom of this section */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <a 
                    href={`https://boardgamegeek.com/boardgame/${game.gameId}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-accent text-xs hover:underline flex items-center bg-zinc-800 px-3 py-1 rounded"
                  >
                    <FontAwesomeIcon icon={"external-link-alt" as any} className="mr-1" /> More information
                  </a>
                  
                  <span className={`${genreColorClass} text-xs px-3 py-1 rounded whitespace-nowrap`}>
                    {primaryGenre}
                  </span>
                  
                  {game.bggRank && (
                    <span className="text-zinc-300 text-xs flex items-center bg-zinc-800 px-3 py-1 rounded">
                      #{game.bggRank} on BGG
                    </span>
                  )}
                  
                  {game.weightRating && (
                    <span className="text-zinc-300 text-xs flex items-center bg-zinc-800 px-3 py-1 rounded">
                      <FontAwesomeIcon icon={"weight-hanging" as any} className="mr-1" /> {game.weightRating}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Vote buttons section */}
        <div className="mt-auto border-t border-zinc-800 p-4 bg-zinc-950">
          <p className="text-xs text-zinc-400 mb-3">Vote for this game:</p>
          <div className="flex flex-wrap gap-2 justify-center">
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
                    className={`vote-button px-4 py-2 text-sm rounded-md ${info.bgColor} ${info.textColor} ${info.hoverBgColor} transition ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <FontAwesomeIcon icon={info.icon as any} className="mr-2" /> {info.label}
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
