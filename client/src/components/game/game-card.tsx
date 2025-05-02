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
      
      // Add a small delay to ensure the session is properly set up on the server
      if (votingType && loggedInUser) {
        setTimeout(() => {
          submitVote(game.gameId, votingType)
            .then(() => {
              setIsVoteSuccessOpen(true);
              if (onVoteSuccess) {
                onVoteSuccess();
              }
            })
            .catch((err) => {
              console.error("Vote error after login:", err);
              toast({
                title: "Vote Failed",
                description: "We couldn't record your vote. Please try again.",
                variant: "destructive"
              });
            });
        }, 500);
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
  
  // More detailed debugging to check what data we have
  console.log(`Game ${game.name}:`, {
    bggId: game.gameId,
    tlcsCode: game.tlcsCode,
    subcategoryName: game.subcategoryName,
    forRent: game.forRent,
    forSale: game.forSale,
    toOrder: game.toOrder
  });
  
  // Determine genre/category to display
  const displayCategory = game.subcategoryName || primaryGenre;
  
  // Determine genre color class
  let genreColorClass = "bg-vote-try/20 text-vote-try";
  
  // Use the displayCategory for color determination
  switch ((displayCategory || '').toLowerCase()) {
    case "abstract":
      genreColorClass = "bg-vote-try/20 text-vote-try";
      break;
    case "party":
      genreColorClass = "bg-vote-played/20 text-vote-played";
      break;
    case "cooperative":
    case "adventure co-op":
    case "strategy co-op":
      genreColorClass = "bg-vote-club/20 text-vote-club";
      break;
    case "worker placement":
    case "engine building":
    case "deck building":
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
      <div className="game-card">
        {/* Game Image */}
        <img 
          src={game.thumbnail || game.image} 
          alt={`${game.name} board game`} 
          className="game-image"
          onError={(e) => {
            // Fallback image if the thumbnail fails to load
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
          }}
        />
        
        {/* Game Header */}
        <div className="game-header">
          <div>
            <h2 className="game-title">{game.name}</h2>
            <div className="game-genre">{displayCategory || 'Board Game'}</div>
          </div>
          
          {/* TLCS code (Dewey decimal classification) */}
          {game.tlcsCode && (
            <div className="game-dewey">{game.tlcsCode}</div>
          )}
        </div>
        
        {/* Game Content */}
        <div className="game-content">
          <p className="game-description">
            {game.description ? (
              <span dangerouslySetInnerHTML={{ __html: game.description.substring(0, 180) + (game.description.length > 180 ? '...' : '') }} />
            ) : (
              "No description available."
            )}
          </p>
          
          {/* Availability Status */}
          <div className="flex gap-2 mb-2">
            {(game.forRent === true) && (
              <span className="text-xs px-2 py-1 border border-black">TTL In House</span>
            )}
            {(game.forSale === true) && (
              <span className="text-xs px-2 py-1 border border-black">TTL In Stock</span>
            )}
            {(game.toOrder === true) && (
              <span className="text-xs px-2 py-1 border border-black">TTL Ordered</span>
            )}
          </div>
          
          <a href={`https://boardgamegeek.com/boardgame/${game.gameId}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="more-info">
            More Information
          </a>
        </div>
        
        {/* Game Ratings */}
        <div className="game-ratings">
          <h3 className="rating-title">Ratings</h3>
          
          <div className="rating-grid">
            {/* Easy to Learn Rating */}
            <div className="rating-item">
              <span className="rating-label">Easy to Learn</span>
              <div className="rating-stars">
                <div className="stars-outer">
                  <div className="stars-inner" style={{ width: `${(game.weightRating ? (5 - Math.min(parseFloat(game.weightRating), 5)) / 5 * 100 : 50)}%` }}></div>
                </div>
                <span className="rating-text">
                  {game.weightRating ? (5 - Math.min(parseFloat(game.weightRating), 5)).toFixed(1) : '3.0'}/5
                </span>
              </div>
            </div>
            
            {/* Popularity (based on BGG rank) */}
            <div className="rating-item">
              <span className="rating-label">Popularity</span>
              <div className="rating-stars">
                <div className="stars-outer">
                  <div className="stars-inner" style={{ width: `${game.bggRank ? Math.max(0, 100 - Math.min(game.bggRank, 2000) / 20) : 50}%` }}></div>
                </div>
                <span className="rating-text">
                  {game.bggRank ? (5 - Math.min(game.bggRank, 2000) / 400).toFixed(1) : '3.0'}/5
                </span>
              </div>
            </div>
            
            {/* BGG Rating */}
            <div className="rating-item">
              <span className="rating-label">BGG Rating</span>
              <div className="rating-stars">
                <div className="stars-outer">
                  <div className="stars-inner" style={{ width: `${game.bggRating ? parseFloat(game.bggRating) / 10 * 100 : 70}%` }}></div>
                </div>
                <span className="rating-text">
                  {game.bggRating ? (parseFloat(game.bggRating) / 2).toFixed(1) : '3.5'}/5
                </span>
              </div>
            </div>
          </div>
          
          <div className="vote-buttons">
            <button 
              onClick={() => handleVoteClick(VoteType.WantToTry)} 
              className="vote-button"
              disabled={isVoting}
            >
              I'd play this
            </button>
            <button 
              onClick={() => handleVoteClick(VoteType.PlayedWillPlayAgain)} 
              className="vote-button"
              disabled={isVoting}
            >
              I like this game
            </button>
            <button 
              onClick={() => handleVoteClick(VoteType.WouldJoinClub)} 
              className="vote-button"
              disabled={isVoting}
            >
              Can't get enough
            </button>
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
