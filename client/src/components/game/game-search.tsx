import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface GameSearchProps {
  onSearch: (query: string, options?: { exact?: boolean; sort?: string }) => void; // Added options
  isSearching: boolean;
}

export const GameSearch: React.FC<GameSearchProps> = ({ onSearch, isSearching }) => {
  const [query, setQuery] = useState('');
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (query.trim().length < 2) {
      toast({
        title: "Search query too short",
        description: "Please enter at least 2 characters to search.",
        variant: "destructive"
      });
      return;
    }

    // Added options for exact match and sorting
    const exactMatch = query.startsWith('"') && query.endsWith('"');
    const searchQuery = exactMatch ? query.substring(1, query.length - 1) : query;
    const sort = 'rank'; // Default sort by rank

    onSearch(searchQuery, { exact: exactMatch, sort });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="search-container">
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search for games..."
          disabled={isSearching}
        />
        <Button type="submit" disabled={isSearching || query.trim().length < 2}>
          Search
        </Button>
      </div>
      {isSearching && (
        <p className="text-xs mt-2">
          Searching BoardGameGeek... This may take a moment due to API rate limits.
        </p>
      )}
    </form>
  );
};

// Added searchGames function -  This is a placeholder and needs actual implementation based on your BGG API interaction
const searchGames = async (query: string, options?: { exact?: boolean; sort?: string }): Promise<any[]> => {
  // Simulate API call - Replace with your actual API call
  console.log("Searching BGG:", query, options);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

  //Example Results (replace with actual API response)
  const results = [
    {gameId: 1, name: "Game 1"},
    {gameId: 2, name: "Game 2"},
  ];
  return results;
};