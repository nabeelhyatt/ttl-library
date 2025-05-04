import React from 'react';
import { Link } from 'wouter';
import { Header } from '../components/layout/header';
import { Footer } from '../components/layout/footer';
import './rankings.css';

// Sample data for initial rendering - will be replaced with real data later
const mostVotedGames = [
  { name: 'Catan', category: 'Engine Builder', votes: 12 },
  { name: 'Gloomhaven', category: 'Campaign', votes: 10 },
  { name: 'Wingspan', category: 'Engine Builder', votes: 9 },
  { name: 'Pandemic', category: 'Cooperative', votes: 8 },
  { name: 'Terraforming Mars', category: 'Engine Builder', votes: 7 },
  { name: 'Scythe', category: 'Area Control', votes: 6 },
  { name: 'Azul', category: 'Abstract', votes: 5 },
  { name: '7 Wonders', category: 'Card Drafting', votes: 5 },
  { name: 'Ticket to Ride', category: 'Set Collection', votes: 4 },
  { name: 'Codenames', category: 'Party', votes: 4 },
  { name: 'Spirit Island', category: 'Cooperative', votes: 3 },
  { name: 'Brass: Birmingham', category: 'Economic', votes: 3 },
  { name: 'Root', category: 'Asymmetric', votes: 2 },
];

const categories = [
  { id: 100, name: 'ABSTRACT STRATEGY', votes: 12, description: 'For games with deep strategic thinking and no theming' },
  { id: 200, name: 'FAMILY FAVORITES', votes: 15, description: 'Accessible, widely appealing games' },
  { id: 300, name: 'PARTY TIME', votes: 8, description: 'Social, high-interaction games' },
  { id: 400, name: 'COOPERATIVE', votes: 10, description: 'Games where players work together' },
  { id: 500, name: 'EURO STRATEGY', votes: 18, description: 'Resource management, optimization' },
  { id: 600, name: 'CONFLICT & POLITICS', votes: 9, description: 'Direct competition, area control' },
];

export default function Rankings() {
  return (
    <div className="rankings-page min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Most Voted Games */}
          <div>
            <div className="flex items-baseline mb-4 mt-4">
              <span className="section-number">(01.1)</span>
              <h2 className="section-title">Most Voted Games</h2>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              {/* Table Header */}
              <div className="flex justify-between mb-2">
                <div className="column-header">Name - Secondary Category</div>
                <div className="column-header">Votes</div>
              </div>
              
              {/* Games List */}
              <div className="space-y-2">
                {mostVotedGames.map((game, index) => (
                  <div key={index} className="flex justify-between dotted-border">
                    <div>
                      <span className="game-name">{game.name}</span>
                      <span className="game-category"> - {game.category}</span>
                    </div>
                    <div className="vote-count">{game.votes}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Column - Categories */}
          <div>
            <div className="flex items-baseline mb-4 mt-4">
              <span className="section-number">(01.2)</span>
              <h2 className="section-title">Categories</h2>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
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