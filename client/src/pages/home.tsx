import { useState, useEffect } from 'react';
import { BGGGame, User } from '@shared/schema';
import { HexagonIcon } from '@/components/ui/hexagon-icon';
import { GameSearch } from '@/components/game/game-search';
import { GameFilters } from '@/components/game/game-filters';
import { GameCard } from '@/components/game/game-card';
import { fetchHotGames, searchGames, getBGGtoTLCSWeight, getPrimaryGenre } from '@/lib/bgg-api';
import { useToast } from '@/hooks/use-toast';

interface HomeProps {
  user: User | null;
  onLogin: (email: string) => Promise<User>;
}

const Home: React.FC<HomeProps> = ({ user, onLogin }) => {
  const [games, setGames] = useState<BGGGame[]>([]);
  const [filteredGames, setFilteredGames] = useState<BGGGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [weightFilter, setWeightFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const { toast } = useToast();
  
  // Fetch hot games on component mount
  useEffect(() => {
    const loadHotGames = async () => {
      try {
        setIsLoading(true);
        const hotGames = await fetchHotGames();
        setGames(hotGames);
        applyFilters(hotGames, weightFilter, genreFilter);
      } catch (error) {
        console.error('Failed to fetch hot games:', error);
        toast({
          title: "Error loading games",
          description: "We couldn't load the hottest games. Please try again later.",
          variant: "destructive"
        });
        setGames([]);
        setFilteredGames([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadHotGames();
  }, []);
  
  // Apply filters to games
  const applyFilters = (gamesList: BGGGame[], weightValue: string, genreValue: string) => {
    let filtered = [...gamesList];
    
    // Apply weight filter
    if (weightValue !== 'all') {
      filtered = filtered.filter(game => {
        if (!game.weightRating) return false;
        const tlcsWeight = getBGGtoTLCSWeight(parseFloat(game.weightRating));
        return tlcsWeight === weightValue;
      });
    }
    
    // Apply genre filter
    if (genreValue !== 'all') {
      filtered = filtered.filter(game => {
        const primaryGenre = getPrimaryGenre(game.categories || []);
        return primaryGenre.toLowerCase().includes(genreValue.toLowerCase());
      });
    }
    
    setFilteredGames(filtered);
  };
  
  // Handle search
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchMode(false);
      applyFilters(games, weightFilter, genreFilter);
      return;
    }
    
    // Prevent multiple concurrent searches
    if (isSearching) {
      return;
    }
    
    try {
      setIsSearching(true);
      setSearchMode(true);
      
      const searchResults = await searchGames(query);
      setFilteredGames(searchResults);
      
      if (searchResults.length === 0) {
        toast({
          title: "No results found",
          description: `We couldn't find any games matching "${query}". BGG API may be rate-limited, please try again in a moment.`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      // Set filtered games to empty so we show the no results message
      setFilteredGames([]);
      
      toast({
        title: "Search failed",
        description: "We couldn't complete your search. BGG API may be rate-limited, please try again in a moment.",
        variant: "destructive"
      });
      
      // If search fails, don't keep search mode active
      if (games.length > 0) {
        setSearchMode(false);
        applyFilters(games, weightFilter, genreFilter);
      }
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle weight filter change
  const handleWeightFilterChange = (value: string) => {
    setWeightFilter(value);
    applyFilters(searchMode ? filteredGames : games, value, genreFilter);
  };
  
  // Handle genre filter change
  const handleGenreFilterChange = (value: string) => {
    setGenreFilter(value);
    applyFilters(searchMode ? filteredGames : games, weightFilter, value);
  };
  
  // Refresh games after vote
  const handleVoteSuccess = () => {
    // Optionally refresh data after voting
  };
  
  return (
    <main className="container mx-auto py-8 px-4 bg-black min-h-screen text-white">
      {/* Page Title */}
      <div className="mb-12 md:mb-16 mt-4">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-16 w-16 flex items-center justify-center mb-6 text-accent">
            <HexagonIcon />
          </div>
          <h1 className="font-tufte text-3xl font-bold text-white mb-2">The Tabletop Library</h1>
          <h2 className="font-tufte text-xl text-accent mb-2">Game Voting Platform</h2>
          <p className="mt-4 max-w-2xl text-zinc-400">
            Help us choose which games to add to our collection. Search for games, vote on your favorites, 
            and see what others are excited about.
          </p>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="mb-12">
        <div className="bg-zinc-900 p-6 rounded border border-zinc-800 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <GameSearch onSearch={handleSearch} isSearching={isSearching} />
            </div>
            <GameFilters 
              weightFilter={weightFilter}
              onWeightFilterChange={handleWeightFilterChange}
              genreFilter={genreFilter}
              onGenreFilterChange={handleGenreFilterChange}
              disabled={isSearching}
            />
          </div>
        </div>
        
        {/* Games List Title */}
        <div className="mb-6">
          <h2 className="font-tufte text-2xl text-accent mb-2">
            {searchMode ? "Search Results" : "Hottest Games"}
          </h2>
          <p className="text-zinc-400 mt-2">
            {searchMode 
              ? "Games matching your search criteria. Vote on the ones you'd like to see at The Tabletop Library."
              : "These games are currently trending on BoardGameGeek. Vote on the ones you'd like to see at The Tabletop Library."
            }
          </p>
        </div>
      </div>
      
      {/* Games List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-lg text-muted-foreground">Loading games...</div>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="bg-zinc-900 rounded p-8 text-center">
          <h3 className="text-xl font-tufte text-white mb-3">No games found</h3>
          <p className="text-zinc-400">
            {searchMode 
              ? "We couldn't find any games matching your search criteria. Try a different search term or filters."
              : "We couldn't load any games at this time. Please try again later."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredGames.map(game => (
            <GameCard 
              key={game.gameId} 
              game={game} 
              user={user} 
              onLogin={onLogin}
              onVoteSuccess={handleVoteSuccess}
            />
          ))}
        </div>
      )}
    </main>
  );
};

export default Home;
