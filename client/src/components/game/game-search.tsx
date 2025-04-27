import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface GameSearchProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

export const GameSearch: React.FC<GameSearchProps> = ({ onSearch, isSearching }) => {
  const [query, setQuery] = useState('');
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Debounce search to avoid too many requests
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (query.trim() === '') {
      return;
    }
    
    if (query.trim().length < 2) {
      return;
    }
    
    searchTimeout.current = setTimeout(() => {
      onSearch(query);
    }, 500);
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query, onSearch]);
  
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
      <div className="relative">
        <Input 
          type="text" 
          value={query}
          onChange={handleInputChange}
          placeholder="Search for board games..."
          className="w-full px-4 py-6 bg-background border border-gray-700 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition duration-200 text-lg"
          disabled={isSearching}
        />
        <button 
          type="submit"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground disabled:opacity-50"
          disabled={isSearching || query.trim().length < 2}
        >
          <FontAwesomeIcon icon="search" />
        </button>
      </div>
    </form>
  );
};
