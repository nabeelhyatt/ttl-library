import fs from 'fs';
import path from 'path';
import { BGGGame } from '@shared/schema';
import { boardGameGeekService } from './bgg-service';

// Constants for the cache file
const CACHE_DIR = './server-cache';
const HOT_GAMES_CACHE_FILE = path.join(CACHE_DIR, 'hot-games-cache.json');
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Cache data structure with timestamp
interface HotGamesCache {
  timestamp: number;
  games: BGGGame[];
}

/**
 * Ensures the cache directory exists
 */
function ensureCacheDirectory(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    console.log(`Creating cache directory: ${CACHE_DIR}`);
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Writes data to the cache file
 */
async function writeCache(data: HotGamesCache): Promise<void> {
  ensureCacheDirectory();
  try {
    await fs.promises.writeFile(
      HOT_GAMES_CACHE_FILE,
      JSON.stringify(data, null, 2),
      'utf8'
    );
    console.log(`Hot games cache updated at ${new Date(data.timestamp).toLocaleString()}`);
  } catch (error) {
    console.error('Error writing hot games cache:', error);
  }
}

/**
 * Reads data from the cache file
 */
async function readCache(): Promise<HotGamesCache | null> {
  try {
    if (!fs.existsSync(HOT_GAMES_CACHE_FILE)) {
      return null;
    }
    
    const data = await fs.promises.readFile(HOT_GAMES_CACHE_FILE, 'utf8');
    return JSON.parse(data) as HotGamesCache;
  } catch (error) {
    console.error('Error reading hot games cache:', error);
    return null;
  }
}

/**
 * Checks if the cache is valid (exists and not expired)
 */
function isCacheValid(cache: HotGamesCache | null): boolean {
  if (!cache || !cache.games || !cache.timestamp) {
    console.log('Cache not found or invalid format');
    return false;
  }
  
  const now = Date.now();
  const cacheAge = now - cache.timestamp;
  
  if (cacheAge > CACHE_EXPIRY_MS) {
    console.log(`Cache expired (${Math.round(cacheAge / 60000)} minutes old)`);
    return false;
  }
  
  const minutesRemaining = Math.round((CACHE_EXPIRY_MS - cacheAge) / 60000);
  console.log(`Using cached hot games (expires in ${minutesRemaining} minutes)`);
  return true;
}

/**
 * Gets hot games from BGG and updates the cache
 */
async function fetchAndCacheHotGames(): Promise<BGGGame[]> {
  console.log('Fetching hot games from BGG API and updating cache...');
  try {
    const startTime = Date.now();
    const hotGames = await boardGameGeekService.getHotGames();
    const endTime = Date.now();
    
    console.log(`BGG API returned ${hotGames.length} hot games in ${endTime - startTime}ms`);
    
    // Update the cache with fresh data
    await writeCache({
      timestamp: Date.now(),
      games: hotGames
    });
    
    return hotGames;
  } catch (error) {
    console.error('Error fetching hot games from BGG:', error);
    throw error;
  }
}

/**
 * Public API: Get hot games (from cache if valid, or fetch fresh data)
 */
export async function getHotGames(): Promise<BGGGame[]> {
  // Try to get cached data first
  const cache = await readCache();
  
  // If cache is valid, return cached data
  if (cache && isCacheValid(cache)) {
    // We know cache is not null here because isCacheValid checks it
    return cache.games;
  }
  
  // Otherwise, fetch fresh data and update cache
  return fetchAndCacheHotGames();
}

/**
 * Public API: Force refresh of hot games cache
 */
export async function refreshHotGamesCache(): Promise<BGGGame[]> {
  return fetchAndCacheHotGames();
}