// ABOUTME: This component displays search results from the shared SearchContext.
// ABOUTME: It can be used consistently across different pages of the application.

import React, { useEffect, useRef } from 'react';
import { useSearch } from '@/contexts/SearchContext';
import { GameCard } from './game-card';
import { Loader2 } from 'lucide-react';

export const SearchResults: React.FC = () => {
  const { results, isSearching, query } = useSearch();
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Effect to ensure visibility when results change
  useEffect(() => {
    if (results.length > 0 && resultsRef.current) {
      // Make sure the results are visible
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [results]);

  // Don't render anything if there's no search query
  if (!query) {
    return null;
  }

  // Show loading state
  if (isSearching) {
    return (
      <div className="search-results-container">
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Show results or no results message
  return (
    <div ref={resultsRef} className="search-results-container">
      <h2 className="text-xl font-serif mb-4">
        {results.length > 0 
          ? `Search Results for "${query}" (${results.length} games found)`
          : `No results found for "${query}"`
        }
      </h2>
      
      {results.length > 0 ? (
        <div className="games-grid">
          {results.map((game) => (
            <GameCard 
              key={game.gameId} 
              game={game} 
              onVoteSuccess={() => {}} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p>Try adjusting your search terms or using quotes for exact matches.</p>
          <p className="text-sm mt-2 text-gray-500">Example: "Catan" for exact match</p>
        </div>
      )}
    </div>
  );
};
