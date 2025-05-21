// ABOUTME: Rankings page component that displays most voted games and category rankings.
// ABOUTME: Uses shared SearchContext for consistent search across the application.

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { GameSearch } from '../components/game/game-search';
import { SearchResults } from '../components/game/search-results';
import { useToast } from '../hooks/use-toast';
import { useSearch } from '@/contexts/SearchContext';
import './rankings.css';

// Type definition for games with votes
interface GameWithVotes {
  id: number;
  bggId: number;
  name: string;
  subcategory: string | null;
  voteCount: number;
}

// Type definition for category with votes
interface CategoryWithVotes {
  id: number;
  name: string;
  description: string;
  voteCount: number;
  code: string;
  totalGames: number;
}

// Fallback category data for when API call fails
const fallbackCategories: CategoryWithVotes[] = [
  { id: 100, name: 'ABSTRACT STRATEGY', voteCount: 12, description: 'For games with deep strategic thinking and no theming', code: '100', totalGames: 15 },
  { id: 200, name: 'FAMILY FAVORITES', voteCount: 15, description: 'Accessible, widely appealing games', code: '200', totalGames: 22 },
  { id: 300, name: 'PARTY TIME', voteCount: 8, description: 'Social, high-interaction games', code: '300', totalGames: 12 },
  { id: 400, name: 'COOPERATIVE', voteCount: 10, description: 'Games where players work together', code: '400', totalGames: 18 },
  { id: 500, name: 'EURO STRATEGY', voteCount: 18, description: 'Resource management, optimization', code: '500', totalGames: 25 },
  { id: 600, name: 'CONFLICT & POLITICS', voteCount: 9, description: 'Direct competition, area control', code: '600', totalGames: 14 },
  { id: 700, name: 'THEMATIC ADVENTURES', voteCount: 14, description: 'Immersive storytelling and narrative-driven experiences', code: '700', totalGames: 20 },
  { id: 800, name: 'DEXTERITY & SKILL', voteCount: 7, description: 'Physical skill, precision, and hand-eye coordination', code: '800', totalGames: 10 },
];

// Fallback data for when API call fails
const fallbackGames = [
  { id: 1, bggId: 13, name: 'Catan', subcategory: 'Engine Builder', voteCount: 12 },
  { id: 2, bggId: 174430, name: 'Gloomhaven', subcategory: 'Campaign', voteCount: 10 },
  { id: 3, bggId: 266192, name: 'Wingspan', subcategory: 'Engine Builder', voteCount: 9 },
  { id: 4, bggId: 30549, name: 'Pandemic', subcategory: 'Cooperative', voteCount: 8 },
  { id: 5, bggId: 167791, name: 'Terraforming Mars', subcategory: 'Engine Builder', voteCount: 7 },
  { id: 6, bggId: 169786, name: 'Scythe', subcategory: 'Area Control', voteCount: 6 },
  { id: 7, bggId: 230802, name: 'Azul', subcategory: 'Abstract', voteCount: 5 },
  { id: 8, bggId: 68448, name: '7 Wonders', subcategory: 'Card Drafting', voteCount: 5 },
];

export default function Rankings() {
  const { toast } = useToast();
  const { performSearch, query, setQuery } = useSearch();

  // Fetch most voted games from API
  const { 
    data: mostVotedGames, 
    isLoading: isLoadingGames, 
    error: gamesError 
  } = useQuery<GameWithVotes[]>({
    queryKey: ['/api/rankings/most-voted'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch category votes from API
  const {
    data: categoryData,
    isLoading: isLoadingCategories,
    error: categoriesError
  } = useQuery<CategoryWithVotes[]>({
    queryKey: ['/api/rankings/category-votes'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Handle game click - performs search using the shared context
  const handleGameClick = (bggId: number, gameName: string) => {
    // First update the query in the context so UI components respond
    setQuery(gameName);
    
    toast({
      title: "Searching for game",
      description: `Looking for "${gameName}"...`,
    });
    
    // Then perform the search
    performSearch(gameName);
    
    // Force scroll to top to ensure search results are visible
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Handle category click - search for games in a specific category
  const handleCategoryClick = (categoryName: string) => {
    toast({
      title: "Searching by category",
      description: `Looking for ${categoryName} games...`,
    });
    
    performSearch(categoryName);
  };

  // Handle vote success
  const handleVoteSuccess = () => {
    // Refresh data after voting
    window.location.reload();
  };

  return (
    <div className="rankings-page min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <GameSearch />
        </div>
        
        {/* Search Results (only shown when searching) */}
        {query && (
          <div className="search-results-wrapper mb-8 p-4 border-2 border-accent-color rounded-md bg-accent-bg">
            <SearchResults />
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column - Most Voted Games */}
          <div className="border border-[#d1d5db] p-6">
            <div className="flex items-baseline mb-4">
              <span className="section-number">(01.1)</span>
              <h2 className="section-title">Most Voted Games</h2>
            </div>

            <div className="border-t border-[#d1d5db] pt-4">
              {/* Table Header */}
              <div className="flex justify-between mb-2">
                <div className="column-header">Name - Secondary Category</div>
                <div className="column-header">Votes</div>
              </div>

              {/* Games List */}
              <div className="space-y-2">
                {isLoadingGames ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : gamesError ? (
                  <div className="text-red-500 py-4">
                    Error loading most voted games. Please try again later.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(mostVotedGames?.length ? mostVotedGames : fallbackGames).map((game) => (
                      <div key={game.id} className="flex justify-between items-center py-2 border-b border-[#d1d5db] last:border-b-0">
                        <div className="flex-1">
                          <button 
                            onClick={() => handleGameClick(game.bggId, game.name)}
                            className="game-name hover:underline"
                          >
                            {game.name}
                          </button>
                          {game.subcategory && (
                            <span className="game-category ml-2">
                              - {game.subcategory}
                            </span>
                          )}
                        </div>
                        <div className="vote-count">{game.voteCount}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Categories */}
          <div className="border border-[#d1d5db] p-6">
            <div className="flex items-baseline mb-4">
              <span className="section-number">(01.2)</span>
              <h2 className="section-title">Categories</h2>
            </div>

            <div className="border-t border-[#d1d5db] pt-4">
              <p className="category-explanation">
                We organize games by category to encourage your curiosity in browsing 
                games. These are the current votes by game category.
              </p>
              <div className="flex justify-between text-sm text-gray-600 mb-3 italic">
                <div>Category # - Category Name</div>
                <div>Votes (In Stock)</div>
              </div>

              {/* Categories List */}
              <div className="space-y-4">
                {isLoadingCategories ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : categoriesError ? (
                  <div className="text-red-500 py-4">
                    Error loading categories. Please try again later.
                  </div>
                ) : (
                  (categoryData?.length ? categoryData : fallbackCategories).map((category) => (
                    <div key={category.code}>
                      <div className="flex justify-between mb-1">
                        <div>
                          <span className="category-number">{category.code}</span>
                          <button 
                            onClick={() => handleCategoryClick(category.name)}
                            className="category-name hover:underline hover:text-accent-color"
                          >
                            {category.name.toUpperCase()}:
                          </button>
                        </div>
                        <div className="vote-count">{category.voteCount} ({category.totalGames})</div>
                      </div>
                      <div className="category-description">
                        {category.description}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}