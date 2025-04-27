import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GameFiltersProps {
  weightFilter: string;
  onWeightFilterChange: (value: string) => void;
  genreFilter: string;
  onGenreFilterChange: (value: string) => void;
  disabled?: boolean;
}

export const GameFilters: React.FC<GameFiltersProps> = ({ 
  weightFilter, 
  onWeightFilterChange, 
  genreFilter, 
  onGenreFilterChange,
  disabled = false
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Weight Filter */}
      <div className="relative">
        <Select
          value={weightFilter}
          onValueChange={onWeightFilterChange}
          disabled={disabled}
        >
          <SelectTrigger className="px-4 py-3 bg-background border border-gray-700 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition duration-200 min-w-[140px]">
            <SelectValue placeholder="All Weights" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Weights</SelectItem>
            <SelectItem value=".1">Light/Gateway</SelectItem>
            <SelectItem value=".2">Medium-Light</SelectItem>
            <SelectItem value=".3">Medium</SelectItem>
            <SelectItem value=".4">Medium-Heavy</SelectItem>
            <SelectItem value=".5">Heavy</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Genre Filter */}
      <div className="relative">
        <Select
          value={genreFilter}
          onValueChange={onGenreFilterChange}
          disabled={disabled}
        >
          <SelectTrigger className="px-4 py-3 bg-background border border-gray-700 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition duration-200 min-w-[140px]">
            <SelectValue placeholder="All Genres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            <SelectItem value="Abstract">Abstract</SelectItem>
            <SelectItem value="Party">Party</SelectItem>
            <SelectItem value="Strategy">Strategy</SelectItem>
            <SelectItem value="Family">Family</SelectItem>
            <SelectItem value="Cooperative">Cooperative</SelectItem>
            <SelectItem value="Card Game">Card Game</SelectItem>
            <SelectItem value="Worker Placement">Worker Placement</SelectItem>
            <SelectItem value="Social Deduction">Social Deduction</SelectItem>
            <SelectItem value="Engine Building">Engine Building</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
