import React, { useState } from 'react';
import { Footer } from '../components/layout/footer';
import { searchGames } from '@/lib/bgg-api';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { GameSearch } from '../components/game/game-search';
import { useToast } from '../hooks/use-toast';
import './rankings.css';
import { useLocation } from 'wouter';

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
}

// Fallback category data for when API call fails
const fallbackCategories: CategoryWithVotes[] = [
  { id: 100, name: 'ABSTRACT STRATEGY', voteCount: 12, description: 'For games with deep strategic thinking and no theming' },
  { id: 200, name: 'FAMILY FAVORITES', voteCount: 15, description: 'Accessible, widely appealing games' },
  { id: 300, name: 'PARTY TIME', voteCount: 8, description: 'Social, high-interaction games' },
  { id: 400, name: 'COOPERATIVE', voteCount: 10, description: 'Games where players work together' },
  { id: 500, name: 'EURO STRATEGY', voteCount: 18, description: 'Resource management, optimization' },
  { id: 600, name: 'CONFLICT & POLITICS', voteCount: 9, description: 'Direct competition, area control' },
  { id: 700, name: 'THEMATIC ADVENTURES', voteCount: 14, description: 'Immersive storytelling and narrative-driven experiences' },
  { id: 800, name: 'DEXTERITY & SKILL', voteCount: 7, description: 'Physical skill, precision, and hand-eye coordination' },
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
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

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

  // Get wouter location hook for navigation
  const [, setLocation] = useLocation();

  // Handle game link click - redirects to home page with search query
  const handleGameClick = (bggId: number, gameName: string) => {
    // Navigate to home page with search query
    handleSearch(gameName);
  };

  // Handle search directly on rankings page
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      return;
    }

    // Prevent multiple concurrent searches
    if (isSearching) {
      return;
    }

    try {
      setIsSearching(true);
      setLocation(`/rankings?search=${encodeURIComponent(query)}`, { replace: true });
      
      const searchResults = await searchGames(query);
      if (searchResults.length > 0) {
        toast({
          title: `Found ${searchResults.length} games`,
          description: `Search results for "${query}"`,
        });
      } else {
        toast({
          title: "No results found",
          description: `We couldn't find any games matching "${query}". Try a different search term.`,
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed", 
        description: "We couldn't complete your search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="rankings-page min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <GameSearch onSearch={handleSearch} isSearching={isSearching} />
        </div>

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
                  (mostVotedGames?.length ? mostVotedGames : fallbackGames).map((game) => (
                    <div key={game.id} className="flex justify-between dotted-border">
                      <div>
                        <span 
                          className="game-name cursor-pointer hover:underline"
                          onClick={() => handleGameClick(game.bggId, game.name)}
                        >
                          {game.name}
                        </span>
                        {game.subcategory && (
                          <div className="game-category mt-1 ml-6">
                            {game.subcategory}
                          </div>
                        )}
                      </div>
                      <div className="vote-count">{game.voteCount}</div>
                    </div>
                  ))
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
                          <span className="category-name">{category.name.toUpperCase()}:</span>
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