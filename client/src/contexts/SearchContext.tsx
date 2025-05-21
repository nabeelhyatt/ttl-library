// ABOUTME: This file provides a shared search context for consistent search functionality across pages.
// ABOUTME: It manages search state, results, and provides methods for searching games.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BGGGame } from '@shared/schema';
import { searchGames } from '@/lib/new-bgg-api';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface SearchContextType {
  query: string;
  setQuery: (query: string) => void;
  results: BGGGame[];
  isSearching: boolean;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BGGGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // Check for search parameter on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get('search');
    
    if (searchQuery) {
      setQuery(decodeURIComponent(searchQuery));
      performSearch(decodeURIComponent(searchQuery));
    }
  }, []);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      clearSearch();
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
      
      // Update URL with search parameter without page reload
      // Preserve the current path and just update the search parameter
      const currentPath = location.split('?')[0];
      setLocation(`${currentPath}?search=${encodeURIComponent(searchQuery)}`, { replace: true });
      
      // Show search status to user
      toast({
        title: "Searching games",
        description: `Looking for games matching "${searchQuery}"...`,
      });
      
      const searchResults = await searchGames(searchQuery);
      
      // Update results
      setResults(searchResults);
      
      // Show appropriate message based on results
      if (searchResults.length === 0) {
        toast({
          title: "No results found",
          description: `We couldn't find any games matching "${searchQuery}". Try a different search term.`,
          variant: "default"
        });
      } else {
        toast({
          title: `Found ${searchResults.length} games`,
          description: `Search results for "${searchQuery}"`,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      
      toast({
        title: "Search failed",
        description: "We couldn't complete your search. Please try again in a moment.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    
    // Remove search parameter from URL
    const currentPath = location.split('?')[0];
    setLocation(currentPath, { replace: true });
  };

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        results,
        isSearching,
        performSearch,
        clearSearch
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
