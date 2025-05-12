import { BGGGame } from "@shared/schema";
import { apiRequest } from "./queryClient";

/**
 * Fetches hot games from BoardGameGeek via the new BGG service
 */
export async function fetchHotGames(): Promise<BGGGame[]> {
  const response = await apiRequest("GET", "/api/bgg/hot");
  return response.json();
}

/**
 * Searches for games on BoardGameGeek via the new BGG service
 * 
 * @param query The search query
 */
export async function searchGames(query: string): Promise<BGGGame[]> {
  console.log(`🔍 Searching for games matching: "${query}"`);
  const startTime = Date.now();
  
  const params = new URLSearchParams({ query });
  
  try {
    const response = await apiRequest("GET", `/api/bgg/search?${params}`);
    const games = await response.json();
    
    const endTime = Date.now();
    console.log(`🔍 Search completed in ${endTime - startTime}ms, found ${games.length} results`);
    
    return games;
  } catch (error) {
    console.error('🔍 Search failed:', error);
    // Return empty array on error to prevent UI crashes
    return [];
  }
}

/**
 * Gets details for a specific game
 * 
 * @param gameId The BoardGameGeek game ID
 */
export async function getGameDetails(gameId: number): Promise<BGGGame> {
  const response = await apiRequest("GET", `/api/bgg/game/${gameId}`);
  return response.json();
}

/**
 * Clears all BGG caches on the server
 */
export async function clearBGGCaches(): Promise<void> {
  await apiRequest("POST", "/api/bgg/clear-cache");
}

/**
 * Convert BGG weight to TLCS decimal system
 */
export function getBGGtoTLCSWeight(weight: number): string {
  if (weight < 1.5) return ".1"; // Light/Gateway
  if (weight < 2.2) return ".2"; // Medium-Light
  if (weight < 3.0) return ".3"; // Medium
  if (weight < 3.8) return ".4"; // Medium-Heavy
  return ".5"; // Heavy
}

/**
 * Get primary genre from categories
 */
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