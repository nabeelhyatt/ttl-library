import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface GameSearchProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
  initialQuery?: string;
}

export const GameSearch: React.FC<GameSearchProps> = ({ 
  onSearch, 
  isSearching,
  initialQuery = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const { toast } = useToast();

  // Effect to update the query input if initialQuery changes
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedQuery = query.trim();
    
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
    const exactMatch = query.startsWith('"') && query.endsWith('"');
    const searchQuery = exactMatch ? query.substring(1, query.length - 1) : query;
    
    // Perform the search
    onSearch(searchQuery);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Escape key should clear the input
    if (e.key === 'Escape') {
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="search-container relative">
        <div className="relative flex items-center w-full">
          <Input
            type="text"
            value={query}
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
            ) : (
              <Search className="h-4 w-4" />
            )}
          </div>
        </div>
        <Button 
          type="submit" 
          disabled={isSearching || query.trim().length < 2}
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