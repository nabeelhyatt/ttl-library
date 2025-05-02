import { BGGGame } from "@shared/schema";
import { apiRequest } from "./queryClient";

export async function fetchHotGames(): Promise<BGGGame[]> {
  const response = await apiRequest("GET", "/api/bgg/hot");
  return response.json();
}

export async function searchGames(query: string): Promise<BGGGame[]> {
  const response = await apiRequest("GET", `/api/bgg/search?query=${encodeURIComponent(query)}`);
  return response.json();
}

export async function getGameDetails(gameId: number): Promise<BGGGame> {
  const response = await apiRequest("GET", `/api/bgg/game/${gameId}`);
  return response.json();
}

// Convert BGG weight to TLCS decimal system
export function getBGGtoTLCSWeight(weight: number): string {
  if (weight < 1.5) return ".1"; // Light/Gateway
  if (weight < 2.2) return ".2"; // Medium-Light
  if (weight < 3.0) return ".3"; // Medium
  if (weight < 3.8) return ".4"; // Medium-Heavy
  return ".5"; // Heavy
}

// Get primary genre from categories
export function getPrimaryGenre(categories: string[]): string {
  const genrePriority = [
    "Abstract Strategy", 
    "Party Game", 
    "Strategy", 
    "Family Game", 
    "Cooperative", 
    "Card Game", 
    "Worker Placement", 
    "Social Deduction", 
    "Engine Building"
  ];
  
  // Find the first matching genre from the priority list
  for (const genre of genrePriority) {
    if (categories.some(cat => cat.includes(genre))) {
      return genre.replace(' Game', '').replace(' Strategy', '');
    }
  }
  
  // Default to first category or "Strategy" if no categories
  return categories.length > 0 ? categories[0] : "Strategy";
}
