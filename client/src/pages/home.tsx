// ABOUTME: Home page component that displays hot games and search functionality.
// ABOUTME: Uses shared SearchContext for consistent search across the application.

import { useState, useEffect } from 'react';
import { BGGGame } from '@shared/schema';
import { HexagonIcon } from '@/components/ui/hexagon-icon';
import { GameSearch } from '@/components/game/game-search';
import { GameFilters } from '@/components/game/game-filters';
import { GameCard } from '@/components/game/game-card';
import { SearchResults } from '@/components/game/search-results';
import { GamesOnOrderProgress } from '@/components/progress/games-on-order-progress';
import { fetchHotGames, getBGGtoTLCSWeight, getPrimaryGenre } from '@/lib/new-bgg-api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSearch } from '@/contexts/SearchContext';

const Home = () => {
  // Get user from Auth Context
  const { user } = useAuth();
  const [games, setGames] = useState<BGGGame[]>([]);
  const [filteredGames, setFilteredGames] = useState<BGGGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weightFilter, setWeightFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const { toast } = useToast();
  
  // Get search context
  const { query, results, isSearching } = useSearch();
  
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
    
    // Only load hot games if we're not searching
    if (!query) {
      loadHotGames();
    }
  }, [query, weightFilter, genreFilter]);
  
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
  
  // Handle weight filter change
  const handleWeightFilterChange = (value: string) => {
    setWeightFilter(value);
    applyFilters(query ? [] : games, value, genreFilter);
  };
  
  // Handle genre filter change
  const handleGenreFilterChange = (value: string) => {
    setGenreFilter(value);
    applyFilters(query ? [] : games, weightFilter, value);
  };
  
  // Refresh games after vote
  const handleVoteSuccess = () => {
    // Optionally refresh data after voting
  };
  
  return (
    <main>
      <div className="container">
        {/* Game Collection Progress */}
        <GamesOnOrderProgress />
        
        {/* Search Section */}
        <GameSearch />
        
        {/* Weight and Genre Filters */}
        <GameFilters 
          weightFilter={weightFilter}
          onWeightFilterChange={handleWeightFilterChange} 
          genreFilter={genreFilter}
          onGenreFilterChange={handleGenreFilterChange} 
          disabled={isSearching}
        />
        
        {/* Search Results (only shown when searching) */}
        {query && <SearchResults />}
        
        {/* Hot Games (only shown when not searching) */}
        {!query && (
          isLoading ? (
            <div className="flex justify-center items-center py-12">
              <HexagonIcon className="animate-spin h-12 w-12 text-gray-400" />
            </div>
          ) : (
            filteredGames.length > 0 ? (
              <div>
                <h2 className="text-xl font-serif mb-4">Hot Games</h2>
                <div className="games-grid">
                  {filteredGames.map(game => (
                    <GameCard 
                      key={game.gameId} 
                      game={game} 
                      onVoteSuccess={handleVoteSuccess} 
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg">No games found matching your filters.</p>
                <p className="text-sm text-gray-500 mt-2">Try adjusting your filter settings.</p>
              </div>
            )
          )
        )}
      </div>
    </main>
  );
};

export default Home;
