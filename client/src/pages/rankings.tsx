import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Header } from '../components/layout/header';
import { Footer } from '../components/layout/footer';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { Loader2 } from 'lucide-react';
import './rankings.css';

// Type definition for games with votes
interface GameWithVotes {
  id: number;
  bggId: number;
  name: string;
  subcategory: string | null;
  voteCount: number;
}

// Static categories data
const categories = [
  { id: 100, name: 'ABSTRACT STRATEGY', votes: 12, description: 'For games with deep strategic thinking and no theming' },
  { id: 200, name: 'FAMILY FAVORITES', votes: 15, description: 'Accessible, widely appealing games' },
  { id: 300, name: 'PARTY TIME', votes: 8, description: 'Social, high-interaction games' },
  { id: 400, name: 'COOPERATIVE', votes: 10, description: 'Games where players work together' },
  { id: 500, name: 'EURO STRATEGY', votes: 18, description: 'Resource management, optimization' },
  { id: 600, name: 'CONFLICT & POLITICS', votes: 9, description: 'Direct competition, area control' },
  { id: 700, name: 'THEMATIC ADVENTURES', votes: 14, description: 'Immersive storytelling and narrative-driven experiences' },
  { id: 800, name: 'DEXTERITY & SKILL', votes: 7, description: 'Physical skill, precision, and hand-eye coordination' },
];

// Fallback data for when API call fails
const fallbackGames = [
  { id: 1, bggId: 13, name: 'Catan', subcategory: 'Engine Builder', voteCount: 12 },
  { id: 2, bggId: 174430, name: 'Gloomhaven', subcategory: 'Campaign', voteCount: 10 },
  { id: 3, bggId: 266192, name: 'Wingspan', subcategory: 'Engine Builder', voteCount: 9 },
  { id: 4, bggId: 30549, name: 'Pandemic', subcategory: 'Cooperative', voteCount: 8 },
  { id: 5, bggId: 167791, name: 'Terraforming Mars', subcategory: 'Engine Builder', voteCount: 7 },
  { id: 6, bggId: 169786, name: 'Scythe', subcategory: 'Area Control', voteCount: 6 },
  { id: 7, bggId: 230802, name: 'Azul', subcategory: 'Abstract', voteCount: 5 },
  { id: 8, bggId: 68448, name: '7 Wonders', subcategory: 'Card Drafting', voteCount: 5 },
];

export default function Rankings() {
  // Fetch most voted games from API
  const { data: mostVotedGames, isLoading, error } = useQuery<GameWithVotes[]>({
    queryKey: ['/api/rankings/most-voted'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle game link click
  const handleGameClick = (bggId: number) => {
    // Navigate to game details or open BGG page
    window.open(`https://boardgamegeek.com/boardgame/${bggId}`, '_blank');
  };

  return (
    <div className="rankings-page min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column - Most Voted Games */}
          <div className="border border-[#d1d5db] p-6">
            <div className="flex items-baseline mb-4">
              <span className="section-number">(01.1)</span>
              <h2 className="section-title">Most Voted Games</h2>
            </div>
            
            <div className="border-t border-[#d1d5db] pt-4">
              {/* Table Header */}
              <div className="flex justify-between mb-2">
                <div className="column-header">Name - Secondary Category</div>
                <div className="column-header">Votes</div>
              </div>
              
              {/* Games List */}
              <div className="space-y-2">
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : error ? (
                  <div className="text-red-500 py-4">
                    Error loading most voted games. Please try again later.
                  </div>
                ) : (
                  (mostVotedGames?.length ? mostVotedGames : fallbackGames).map((game) => (
                    <div key={game.id} className="flex justify-between dotted-border">
                      <div>
                        <span 
                          className="game-name cursor-pointer hover:underline"
                          onClick={() => handleGameClick(game.bggId)}
                        >
                          {game.name}
                        </span>
                        {game.subcategory && (
                          <span className="game-category"> - {game.subcategory}</span>
                        )}
                      </div>
                      <div className="vote-count">{game.voteCount}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Right Column - Categories */}
          <div className="border border-[#d1d5db] p-6">
            <div className="flex items-baseline mb-4">
              <span className="section-number">(01.2)</span>
              <h2 className="section-title">Categories</h2>
            </div>
            
            <div className="border-t border-[#d1d5db] pt-4">
              <p className="category-explanation">
                We organize games by category to encourage your curiosity in browsing 
                games. These are the current votes by game category.
              </p>
              
              {/* Categories List */}
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category.id}>
                    <div className="flex justify-between mb-1">
                      <div>
                        <span className="category-number">{category.id}</span>
                        <span className="category-name">{category.name}:</span>
                      </div>
                      <div className="vote-count">{category.votes}</div>
                    </div>
                    <div className="category-description">
                      {category.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}