import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { BGGGame, VoteType, voteTypeInfo } from "@shared/schema";
import { getBGGtoTLCSWeight, getPrimaryGenre } from "../../lib/bgg-api";
import { LoginDialog } from "../auth/login-dialog";
import { submitVote } from "../../lib/airtable-api";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../contexts/AuthContext";
import { Dialog, DialogContent } from "../ui/dialog";

interface GameCardProps {
  game: BGGGame;
  onVoteSuccess?: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  onVoteSuccess,
}) => {
  // Get user from auth context
  const { user, setPendingVote: setAuthPendingVote } = useAuth();
  
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [votingType, setVotingType] = useState<VoteType | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const { toast } = useToast();

  const handleVoteClick = (voteType: VoteType) => {
    setVotingType(voteType);

    if (!user) {
      // Save the pending vote in AuthContext for after login
      setAuthPendingVote({ 
        gameId: game.gameId, 
        gameName: game.name, 
        voteType 
      });
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

      // Show toast notification
      toast({
        title: "Vote Registered!",
        description: "Your vote has been recorded successfully.",
        duration: 3000,
        className: "bg-[#f5f5dc]", // Beige background to match design
      });

      if (onVoteSuccess) {
        onVoteSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your vote. Please try again.",
        variant: "destructive",
      });
      console.error("Vote submission error:", error);
    } finally {
      setIsVoting(false);
    }
  };

  // This function is called when the login dialog is closed successfully
  const handleLoginSuccess = () => {
    // The auth context will handle the pending vote processing
    // Just close the dialog
    setIsLoginOpen(false);
  };

  const primaryGenre = getPrimaryGenre(game.categories || []);
  const weightClass = game.weightRating
    ? getBGGtoTLCSWeight(parseFloat(game.weightRating))
    : null;

  // More detailed debugging to check what data we have
  console.log(`Game ${game.name}:`, {
    bggId: game.gameId,
    tlcsCode: game.tlcsCode,
    subcategoryName: game.subcategoryName,
    inLibrary: game.inLibrary,
    forSale: game.forSale,
    toOrder: game.toOrder,
  });

  // Determine genre/category to display
  const displayCategory = game.subcategoryName || primaryGenre;

  // Determine genre color class
  let genreColorClass = "bg-vote-try/20 text-vote-try";

  // Use the displayCategory for color determination
  switch ((displayCategory || "").toLowerCase()) {
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
        {/* Game Image with status overlay */}
        <div className="relative">
          <img
            src={game.thumbnail || game.image}
            alt={`${game.name} board game`}
            className="game-image"
            onError={(e) => {
              // Fallback image if the thumbnail fails to load
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
            }}
          />

          {/* Availability Status Overlay */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {game.inLibrary === true && (
              <span className="text-xs px-2 py-1 border border-black bg-white bg-opacity-90">
                In Library
              </span>
            )}
            {game.forSale === true && (
              <span className="text-xs px-2 py-1 border border-black bg-white bg-opacity-90">
                For Sale
              </span>
            )}
            {game.toOrder === true && (
              <span className="text-xs px-2 py-1 border border-black bg-white bg-opacity-90">
                Backordered
              </span>
            )}
          </div>
        </div>

        {/* Game Header */}
        <div className="game-header">
          <div>
            <h2 className="game-title">{
              // Make sure even game names that contain "Game [id]" are displayed properly
              game.name.startsWith('Game ') && /Game \d+/.test(game.name) 
                ? `Untitled Game #${game.gameId}` 
                : game.name
            }</h2>
            <div className="game-genre">{displayCategory || "Board Game"}</div>
          </div>

          {/* TLCS code (Dewey decimal classification) */}
          {game.tlcsCode && <div className="game-dewey">{game.tlcsCode}</div>}
        </div>

        {/* Game Content */}
        <div className="game-content">
          <p className="game-description">
            {game.description ? (
              <span
                dangerouslySetInnerHTML={{
                  __html:
                    game.description.substring(0, 180) +
                    (game.description.length > 180 ? "..." : ""),
                }}
              />
            ) : (
              "No description available."
            )}
          </p>

          <a
            href={`https://boardgamegeek.com/boardgame/${game.gameId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="more-info"
          >
            More Information
          </a>
        </div>

        {/* Game Ratings */}
        <div className="game-ratings">
          <h3 className="rating-title">Ratings</h3>

          <div className="rating-grid">
            {/* Easy to Learn Rating */}
            <div className="rating-item">
              <div className="rating-stars">
                <div className="stars-outer">
                  <div
                    className="stars-inner"
                    style={{
                      width: `${game.weightRating ? ((5 - Math.min(parseFloat(game.weightRating), 5)) / 5) * 100 : 50}%`,
                    }}
                  ></div>
                </div>
              </div>
              <span className="rating-label">Easy to Learn</span>
            </div>

            {/* Popularity (based on BGG rank) */}
            <div className="rating-item">
              <div className="rating-stars">
                <div className="stars-outer">
                  <div
                    className="stars-inner"
                    style={{
                      width: `${game.bggRank ? Math.max(0, 100 - Math.min(game.bggRank, 2000) / 20) : 50}%`,
                    }}
                  ></div>
                </div>
              </div>
              <span className="rating-label">Popularity</span>
            </div>

            {/* BGG Rating */}
            <div className="rating-item">
              <div className="rating-stars">
                <div className="stars-outer">
                  <div
                    className="stars-inner"
                    style={{
                      width: `${game.bggRating ? (parseFloat(game.bggRating) / 10) * 100 : 70}%`,
                    }}
                  ></div>
                </div>
              </div>
              <span className="rating-label">BGG Rating</span>
            </div>
          </div>

          <div className="vote-buttons">
            <button
              onClick={() => handleVoteClick(VoteType.WantToTry)}
              className="vote-button"
              disabled={isVoting}
            >
              Want to try
            </button>
            <button
              onClick={() => handleVoteClick(VoteType.PlayedWillPlayAgain)}
              className="vote-button"
              disabled={isVoting}
            >
              Would play again
            </button>
            <button
              onClick={() => handleVoteClick(VoteType.WouldJoinClub)}
              className="vote-button"
              disabled={isVoting}
            >
              Would play regularly
            </button>
          </div>
        </div>
      </div>

      <LoginDialog
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </>
  );
};