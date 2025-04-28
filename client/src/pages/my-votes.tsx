import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { User, Vote, BGGGame, VoteType, voteTypeInfo } from '@shared/schema';
import { HexagonIcon } from '@/components/ui/hexagon-icon';
import { getUserVotes, deleteVote } from '@/lib/airtable-api';
import { getGameDetails } from '@/lib/bgg-api';
import { useToast } from '@/hooks/use-toast';
import { GameCard } from '@/components/game/game-card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface MyVotesProps {
  user: User | null;
}

interface VoteWithGame {
  vote: Vote;
  game: BGGGame;
}

const MyVotes: React.FC<MyVotesProps> = ({ user }) => {
  const [votesWithGames, setVotesWithGames] = useState<VoteWithGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      setLocation('/');
      return;
    }
    
    const loadVotes = async () => {
      try {
        setIsLoading(true);
        const votes = await getUserVotes();
        
        // Fetch game details for each vote
        const votesWithGameDetails: VoteWithGame[] = [];
        for (const vote of votes) {
          try {
            // First, get the game from storage to find its BGG ID
            const game = await fetch(`/api/games/${vote.gameId}`).then(res => res.json());
            if (game && game.bggId) {
              // Now use the BGG ID to get complete game details
              const gameDetails = await getGameDetails(game.bggId);
              votesWithGameDetails.push({ vote, game: gameDetails });
            }
          } catch (error) {
            console.error(`Failed to fetch game details for game ID ${vote.gameId}:`, error);
          }
        }
        
        setVotesWithGames(votesWithGameDetails);
      } catch (error) {
        console.error('Failed to fetch votes:', error);
        toast({
          title: "Error loading votes",
          description: "We couldn't load your votes. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadVotes();
  }, [user, setLocation]);
  
  const handleDeleteVote = async (voteId: number) => {
    try {
      await deleteVote(voteId);
      setVotesWithGames(votesWithGames.filter(item => item.vote.id !== voteId));
      toast({
        title: "Vote deleted",
        description: "Your vote has been successfully removed.",
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to delete vote:', error);
      toast({
        title: "Error deleting vote",
        description: "We couldn't delete your vote. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Group votes by vote type
  const groupedVotes: Record<VoteType, VoteWithGame[]> = {
    [VoteType.WantToTry]: [],
    [VoteType.PlayedWillPlayAgain]: [],
    [VoteType.WouldJoinClub]: [],
    [VoteType.WouldJoinTournament]: [],
    [VoteType.WouldTeach]: []
  };
  
  votesWithGames.forEach(voteWithGame => {
    const voteType = voteWithGame.vote.voteType as VoteType;
    if (groupedVotes[voteType]) {
      groupedVotes[voteType].push(voteWithGame);
    }
  });
  
  return (
    <main className="tufte-container py-8">
      {/* Page Title */}
      <div className="mb-12 md:mb-18 mt-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-16 w-16 flex items-center justify-center mb-6 text-accent">
            <HexagonIcon />
          </div>
          <h1 className="tufte-title font-tufte text-foreground mb-2">My Votes</h1>
          <h2 className="tufte-subtitle font-tufte text-accent">Your Game Preferences</h2>
          <p className="mt-4 tufte-body max-w-2xl text-muted-foreground">
            Review and manage the games you've voted for.
          </p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-lg text-muted-foreground">Loading your votes...</div>
        </div>
      ) : votesWithGames.length === 0 ? (
        <div className="bg-secondary rounded-lg p-8 text-center">
          <h3 className="text-xl font-tufte text-foreground mb-3">No votes yet</h3>
          <p className="text-muted-foreground mb-6">
            You haven't voted for any games yet. Start exploring and voting now!
          </p>
          <Button 
            onClick={() => setLocation('/')} 
            className="bg-accent text-background hover:bg-accent/90"
          >
            Explore Games
          </Button>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedVotes).map(([voteTypeStr, votes]) => {
            if (votes.length === 0) return null;
            
            const voteType = Number(voteTypeStr) as VoteType;
            const info = voteTypeInfo[voteType];
            
            return (
              <div key={voteTypeStr} className="space-y-6">
                <h2 className={`section-title tufte-subtitle font-tufte ${info.textColor}`}>
                  <FontAwesomeIcon icon={info.icon as any} className="mr-2" />
                  {info.label} ({votes.length})
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {votes.map(({ vote, game }) => (
                    <div key={vote.id} className="relative">
                      <GameCard game={game} user={user} onLogin={() => Promise.resolve(user!)} />
                      <Button
                        onClick={() => handleDeleteVote(vote.id)}
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 left-2 opacity-80 hover:opacity-100"
                      >
                        <FontAwesomeIcon icon={"times" as any} className="mr-1" /> Remove Vote
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default MyVotes;
