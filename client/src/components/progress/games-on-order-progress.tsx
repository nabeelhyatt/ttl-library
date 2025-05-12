import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface GamesOnOrderProgressData {
  count: number;
  target: number;
  percentage: number;
}

export function GamesOnOrderProgress() {
  const [progressData, setProgressData] = useState<GamesOnOrderProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGamesOnOrderCount = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/airtable/games-on-order-count');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch games on order count: ${response.status}`);
        }
        
        const data = await response.json();
        setProgressData(data);
      } catch (error) {
        console.error('Error fetching games on order count:', error);
        toast({
          title: "Error loading progress data",
          description: "We couldn't load the games on order progress data. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGamesOnOrderCount();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="games-on-order-progress-skeleton animate-pulse">
        <div className="h-4 w-full bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!progressData) {
    return null;
  }

  return (
    <div className="games-on-order-progress p-4 mb-4 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-lg">Games on Order Progress</h3>
        <span className="text-sm font-semibold">
          {progressData.count} / {progressData.target}
        </span>
      </div>
      
      <Progress value={progressData.percentage} className="h-3 mb-2" />
      
      <p className="text-sm text-gray-600">
        We're {progressData.percentage}% of the way to our goal of {progressData.target} games on order! 
        {progressData.percentage < 100 
          ? ' Your votes help us decide which games to order next.'
          : ' Thanks for helping us reach our goal!'}
      </p>
    </div>
  );
}