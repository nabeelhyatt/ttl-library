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
      <div className="flex">
        <Input 
          type="text" 
          value={query}
          onChange={handleInputChange}
          placeholder="Search for board games..."
          className="w-full px-4 py-6 bg-zinc-800 border border-zinc-700 rounded-l-lg text-white focus:outline-none focus:border-accent transition duration-200 text-lg placeholder:text-zinc-500"
          disabled={isSearching}
        />
        <Button 
          type="submit"
          variant="default"
          className="py-6 px-6 rounded-r-lg bg-accent hover:bg-accent/90 text-white"
          disabled={isSearching || query.trim().length < 2}
        >
          <FontAwesomeIcon icon="search" className="mr-2" />
          Search
        </Button>
      </div>
      {isSearching && (
        <p className="text-xs text-zinc-400 mt-2">
          Searching BoardGameGeek... This may take a moment due to API rate limits.
        </p>
      )}
    </form>
  );
};
