import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface GameSearchProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

export const GameSearch: React.FC<GameSearchProps> = ({ onSearch, isSearching }) => {
  const [query, setQuery] = useState('');
  const { toast } = useToast();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (query.trim().length < 2) {
      toast({
        title: "Search query too short",
        description: "Please enter at least 2 characters to search.",
        variant: "destructive"
      });
      return;
    }
    
    onSearch(query);
  };
  
  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="search-container">
        <input 
          type="text" 
          value={query}
          onChange={handleInputChange}
          placeholder="Search for games..."
          disabled={isSearching}
        />
        <button 
          type="submit"
          disabled={isSearching || query.trim().length < 2}
        >
          Search
        </button>
      </div>
      {isSearching && (
        <p className="text-xs mt-2">
          Searching BoardGameGeek... This may take a moment due to API rate limits.
        </p>
      )}
    </form>
  );
};
