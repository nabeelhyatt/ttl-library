import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface GameStatsData {
  gamesInStock: number; // For backward compatibility
  gamesInLibrary: number;
  gamesOnOrder: number; 
  totalGames: number;
  votedGames: number;
  target: number;
  stockPercentage: number; // For backward compatibility
  inLibraryPercentage: number;
  orderPercentage: number;
  totalPercentage: number;
  categories: {
    id: string;
    name: string;
    description: string;
    totalGames: number;
    votedGames: number;
  }[];
}

export function GamesOnOrderProgress() {
  const [statsData, setStatsData] = useState<GameStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGameStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/airtable/game-stats');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch game stats: ${response.status}`);
        }
        
        const data = await response.json();
        setStatsData(data);
      } catch (error) {
        console.error('Error fetching game stats:', error);
        toast({
          title: "Error loading progress data",
          description: "We couldn't load the game collection progress data. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGameStats();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="games-progress-skeleton animate-pulse">
        <div className="h-5 w-full bg-gray-200 rounded mb-1"></div>
        <div className="h-10 w-full bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!statsData) {
    return null;
  }

  // Calculate the voted percentage (but not yet in library or on order)
  const votedOnlyCount = statsData.votedGames;
  const votedOnlyPercentage = Math.min(100, Math.round((votedOnlyCount / statsData.target) * 100));
  
  // Calculate remaining percentage
  const remainingPercentage = 100 - statsData.inLibraryPercentage - statsData.orderPercentage - votedOnlyPercentage;
  
  return (
    <div className="games-collection-progress p-4 mb-4 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-lg">Game Collection Progress</h3>
        <span className="text-sm font-semibold">
          {statsData.totalGames} / {statsData.target}
        </span>
      </div>
      
      {/* Custom progress bar with four sections */}
      <div className="relative h-5 rounded bg-gray-200 overflow-hidden mb-2">
        {/* In Library Games (Black) */}
        <div 
          className="absolute left-0 top-0 h-full bg-black" 
          style={{ width: `${statsData.inLibraryPercentage}%` }}
        />
        
        {/* On Order Games (Dark Gray) */}
        <div 
          className="absolute h-full bg-gray-600" 
          style={{ 
            left: `${statsData.inLibraryPercentage}%`, 
            width: `${statsData.orderPercentage}%` 
          }}
        />
        
        {/* Voted Only Games (Light Gray) */}
        <div 
          className="absolute h-full bg-gray-400" 
          style={{ 
            left: `${statsData.inLibraryPercentage + statsData.orderPercentage}%`, 
            width: `${votedOnlyPercentage}%` 
          }}
        />
        
        {/* Remaining Games (Light) */}
        <div 
          className="absolute h-full bg-gray-100" 
          style={{ 
            left: `${statsData.inLibraryPercentage + statsData.orderPercentage + votedOnlyPercentage}%`, 
            width: `${remainingPercentage}%` 
          }}
        />
        
        {/* Count labels on the progress bar */}
        <div className="relative z-10 flex items-center h-full">
          <span className="text-xs font-medium text-white pl-2">
            In Library: {statsData.gamesInLibrary}
          </span>
          <span className="text-xs font-medium text-white absolute" style={{ left: `${Math.max(statsData.inLibraryPercentage + 2, 25)}%` }}>
            On Order: {statsData.gamesOnOrder}
          </span>
        </div>
      </div>
      
      {/* Progress description */}
      <div className="space-y-1 text-sm text-gray-700">
        <p>
          We're {statsData.totalPercentage}% of the way to our goal of {statsData.target} games.
        </p>
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-black rounded-sm"></span>
            <span>In Library: {statsData.gamesInLibrary}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-gray-600 rounded-sm"></span>
            <span>On Order: {statsData.gamesOnOrder}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-gray-400 rounded-sm"></span>
            <span>Voted: {votedOnlyCount}</span>
          </div>
        </div>
        <p className="text-xs italic pt-1">
          Your votes help us decide which games to add to our collection!
        </p>
      </div>
    </div>
  );
}