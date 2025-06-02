// ABOUTME: Bulk game search page allowing users to input multiple game titles.
// ABOUTME: Processes up to 10 games at once and displays unified search results.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { GameCard } from "@/components/game/game-card";
import { searchGames } from "@/lib/new-bgg-api";
import { BGGGame } from "@shared/schema";

const MAX_GAMES = 10;

export default function Bulk() {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BGGGame[]>([]);
  const [notFound, setNotFound] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const parseGameTitles = (text: string): string[] => {
    const games = text
      .split(/[,\n;]/) // Split by comma, newline, or semicolon
      .map(game => game.trim()) // Remove whitespace
      .filter(game => game.length > 0) // Remove empty strings
      .map(game => game.replace(/^\d+[\.\)]\s*/, '')) // Remove leading numbers (1. or 1) )
      .filter(game => game.length > 0); // Remove empty strings again after number removal

    return games.slice(0, MAX_GAMES); // Limit to max games
  };

  const processBulkSearch = async () => {
    const gameTitles = parseGameTitles(input);
    
    if (gameTitles.length === 0) {
      setError("Please enter at least one game title.");
      return;
    }

    if (gameTitles.length > MAX_GAMES) {
      setError(`Too many games. Please limit to ${MAX_GAMES} games.`);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResults([]);
    setNotFound([]);
    setProgress(0);

    const foundGames: BGGGame[] = [];
    const notFoundGames: string[] = [];

    for (let i = 0; i < gameTitles.length; i++) {
      const gameTitle = gameTitles[i];
      setProgress(((i + 1) / gameTitles.length) * 100);

      try {
        const searchResults = await searchGames(gameTitle);
        if (searchResults.length > 0) {
          // Take the first (most relevant) result
          foundGames.push(searchResults[0]);
        } else {
          notFoundGames.push(gameTitle);
        }
        
        // Add a small delay to respect rate limits
        if (i < gameTitles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (err) {
        console.error(`Error searching for "${gameTitle}":`, err);
        notFoundGames.push(gameTitle);
      }
    }

    setResults(foundGames);
    setNotFound(notFoundGames);
    setIsProcessing(false);
  };

  const handleClear = () => {
    setInput("");
    setResults([]);
    setNotFound([]);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold title-font">Bulk Game Search</h1>
          <p className="text-gray-600">
            Enter up to {MAX_GAMES} game titles and we'll search for all of them at once
          </p>
        </div>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Game List</CardTitle>
            <CardDescription>
              Enter game titles separated by commas, line breaks, or semicolons. 
              We support numbered lists too (e.g., "1. Chess, 2. Catan").
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Chess, Settlers of Catan, Ticket to Ride&#10;Azul&#10;1. Wingspan&#10;2. Gloomhaven"
              className="min-h-32"
              disabled={isProcessing}
            />
            
            {input && (
              <div className="text-sm text-gray-600">
                {parseGameTitles(input).length} game(s) detected
                {parseGameTitles(input).length > MAX_GAMES && (
                  <span className="text-red-500 ml-2">
                    (only first {MAX_GAMES} will be processed)
                  </span>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={processBulkSearch}
                disabled={isProcessing || !input.trim()}
                className="flex-1"
              >
                {isProcessing ? "Searching..." : "Search Games"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClear}
                disabled={isProcessing}
              >
                Clear
              </Button>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-600 text-center">
                  Processing games... {Math.round(progress)}%
                </p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {(results.length > 0 || notFound.length > 0) && (
          <div className="space-y-6">
            {/* Found Games */}
            {results.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Found Games ({results.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((game) => (
                    <GameCard key={game.gameId} game={game} />
                  ))}
                </div>
              </div>
            )}

            {/* Not Found Games */}
            {notFound.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Games Not Found ({notFound.length})
                </h2>
                <Card>
                  <CardContent className="pt-6">
                    <ul className="space-y-2">
                      {notFound.map((game, index) => (
                        <li key={index} className="text-gray-600">
                          • {game}
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-gray-500 mt-4">
                      Try searching for these games individually with different spellings or keywords.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}