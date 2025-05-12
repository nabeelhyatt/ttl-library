import { useState, useEffect } from 'react';
import { BGGGame, User } from '@shared/schema';
import { HexagonIcon } from '@/components/ui/hexagon-icon';
import { GameSearch } from '@/components/game/game-search';
import { GameFilters } from '@/components/game/game-filters';
import { GameCard } from '@/components/game/game-card';
import { fetchHotGames, searchGames, getBGGtoTLCSWeight, getPrimaryGenre } from '@/lib/new-bgg-api';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface HomeProps {
  user: User | null;
  onLogin: (email: string, name: string) => Promise<User>;
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
  const [, setLocation] = useLocation();
  
  // Track the current search query from URL for the search box
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>('');
  
  // Fetch hot games on component mount and check for search parameter
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
    
    // Check if we have a search parameter in the URL
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get('search');
    
    if (searchQuery) {
      // Update the current search query for the search box
      setCurrentSearchQuery(decodeURIComponent(searchQuery));
      
      // If we have a search query, perform search instead of loading hot games
      handleSearch(searchQuery);
    } else {
      // Otherwise load hot games as usual
      loadHotGames();
    }
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
  
  // Handle search with improved error handling and user feedback
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchMode(false);
      applyFilters(games, weightFilter, genreFilter);
      // Clear search parameter from URL
      setLocation('/');
      return;
    }
    
    // Prevent multiple concurrent searches
    if (isSearching) {
      toast({
        title: "Search in progress",
        description: "A search is already in progress. Please wait a moment.",
      });
      return;
    }
    
    try {
      setIsSearching(true);
      setSearchMode(true);
      
      // Show search status to user
      toast({
        title: "Searching games",
        description: `Looking for games matching "${query}"...`,
      });
      
      // Update URL with search parameter (without page reload)
      setLocation(`/?search=${encodeURIComponent(query)}`, { replace: true });
      
      const searchResults = await searchGames(query);
      
      // Update game list
      setFilteredGames(searchResults);
      
      // Show appropriate message based on results
      if (searchResults.length === 0) {
        toast({
          title: "No results found",
          description: `We couldn't find any games matching "${query}". Try a different search term.`,
          variant: "default"
        });
      } else {
        toast({
          title: `Found ${searchResults.length} games`,
          description: `Search results for "${query}"`,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      // Set filtered games to empty so we show the no results message
      setFilteredGames([]);
      
      toast({
        title: "Search failed",
        description: "We couldn't complete your search. Please try again in a moment.",
        variant: "destructive"
      });
      
      // If search fails, don't keep search mode active
      if (games.length > 0) {
        setSearchMode(false);
        applyFilters(games, weightFilter, genreFilter);
        // Clear search parameter from URL
        setLocation('/');
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
    <main>
      <div className="container">
        {/* Search Section */}
        <GameSearch 
          onSearch={handleSearch} 
          isSearching={isSearching} 
          initialQuery={currentSearchQuery} 
        />
        
        {/* Games List */}
        {isLoading ? (
          <div className="loading-indicator">
            <div className="loading-message">Loading games from BoardGameGeek...</div>
            <div className="loading-spinner"></div>
            <div className="loading-note">
              This may take a moment due to API rate limits.
            </div>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="empty-state">
            <h3>No Games Found</h3>
            <p>
              {searchMode 
                ? "We couldn't find any games matching your search criteria. Try a different search term."
                : "We couldn't load any games at this time. The BoardGameGeek API may be rate-limited, please try again in a moment."
              }
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="btn"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="games-grid">
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
        
        {/* Optional Filters (can be added back if needed) */}
        <div className="hidden">
          <GameFilters 
            weightFilter={weightFilter}
            onWeightFilterChange={handleWeightFilterChange}
            genreFilter={genreFilter}
            onGenreFilterChange={handleGenreFilterChange}
            disabled={isSearching}
          />
        </div>
      </div>
    </main>
  );
};

export default Home;
