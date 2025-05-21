// ABOUTME: This component provides a search interface for finding games across the application.
// ABOUTME: It uses the shared SearchContext to maintain consistent search functionality.

import { useState, useEffect } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSearch } from '@/contexts/SearchContext';

export const GameSearch: React.FC = () => {
  const { query: contextQuery, setQuery: setContextQuery, isSearching, performSearch, clearSearch } = useSearch();
  const [localQuery, setLocalQuery] = useState(contextQuery);
  const { toast } = useToast();

  // Effect to update the local query input if context query changes
  useEffect(() => {
    setLocalQuery(contextQuery);
  }, [contextQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedQuery = localQuery.trim();
    
    // Validation
    if (trimmedQuery.length < 2) {
      toast({
        title: "Search query too short",
        description: "Please enter at least 2 characters to search.",
        variant: "destructive"
      });
      return;
    }

    // Handle exact match queries (in quotes)
    const exactMatch = localQuery.startsWith('"') && localQuery.endsWith('"');
    const searchQuery = exactMatch ? localQuery.substring(1, localQuery.length - 1) : localQuery;
    
    // Update context query
    setContextQuery(searchQuery);
    
    // Perform the search
    performSearch(searchQuery);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Escape key should clear the input
    if (e.key === 'Escape') {
      setLocalQuery('');
      clearSearch();
    }
  };

  // Handle clear button click
  const handleClear = () => {
    setLocalQuery('');
    clearSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="search-container relative">
        <div className="relative flex items-center w-full">
          <Input
            type="text"
            value={localQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search for games..."
            disabled={isSearching}
            className="pr-10" // Make room for the icon
            autoFocus // Focus on the search box when component mounts
          />
          <div className="absolute right-3 opacity-50">
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : localQuery ? (
              <X className="h-4 w-4 cursor-pointer" onClick={handleClear} />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </div>
        </div>
        <Button 
          type="submit" 
          disabled={isSearching || localQuery.trim().length < 2}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </div>
      {isSearching && (
        <p className="text-xs mt-2 text-center">
          Searching BoardGameGeek... This may take a moment.
        </p>
      )}
    </form>
  );
};