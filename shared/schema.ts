import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  lastLogin: timestamp("last_login"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
});

// Game model
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  bggId: integer("bgg_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  thumbnail: text("thumbnail"),
  yearPublished: integer("year_published"),
  minPlayers: integer("min_players"),
  maxPlayers: integer("max_players"),
  playingTime: integer("playing_time"),
  minPlayTime: integer("min_play_time"),
  maxPlayTime: integer("max_play_time"),
  minAge: integer("min_age"),
  bggRating: text("bgg_rating"),
  bggRank: integer("bgg_rank"),
  weightRating: text("weight_rating"),
  categories: text("categories").array(),
  mechanics: text("mechanics").array(),
  designers: text("designers").array(),
  publishers: text("publishers").array(),
});

export const insertGameSchema = createInsertSchema(games).pick({
  bggId: true,
  name: true,
  description: true,
  image: true,
  thumbnail: true,
  yearPublished: true,
  minPlayers: true,
  maxPlayers: true,
  playingTime: true,
  minPlayTime: true,
  maxPlayTime: true,
  minAge: true,
  bggRating: true,
  bggRank: true,
  weightRating: true,
  categories: true,
  mechanics: true,
  designers: true,
  publishers: true,
});

// Vote model
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameId: integer("game_id").notNull(),
  voteType: integer("vote_type").notNull(), // 1-5 vote types
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVoteSchema = createInsertSchema(votes).pick({
  userId: true,
  gameId: true,
  voteType: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;

export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;

// Type for BoardGameGeek API responses
export interface BGGGame {
  gameId: number;
  name: string;
  description: string;
  image: string;
  thumbnail: string;
  yearPublished?: number;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
  minPlayTime?: number;
  maxPlayTime?: number;
  minAge?: number;
  bggRating?: string;
  bggRank?: number;
  weightRating?: string;
  categories: string[];
  mechanics: string[];
  designers: string[];
  publishers: string[];
  // Airtable-specific fields
  tlcsCode?: string | null;
  subcategoryName?: string | null;
  forRent?: boolean;
  forSale?: boolean;
  toOrder?: boolean;
}

// Vote Type Enumeration
export enum VoteType {
  WantToTry = 1,
  PlayedWillPlayAgain = 2,
  WouldJoinClub = 3,
  WouldJoinTournament = 4,
  WouldTeach = 5
}

// Vote label and colors - updated to match Airtable options exactly
export const voteTypeInfo = {
  [VoteType.WantToTry]: { 
    label: "Want to try", 
    icon: "dice-one",
    bgColor: "bg-vote-try/20", 
    hoverBgColor: "hover:bg-vote-try/30", 
    textColor: "text-vote-try" 
  },
  [VoteType.PlayedWillPlayAgain]: { 
    label: "Would play again", 
    icon: "dice-two",
    bgColor: "bg-vote-played/20", 
    hoverBgColor: "hover:bg-vote-played/30", 
    textColor: "text-vote-played" 
  },
  [VoteType.WouldJoinClub]: { 
    label: "Would play regularly", 
    icon: "dice-three",
    bgColor: "bg-vote-club/20", 
    hoverBgColor: "hover:bg-vote-club/30", 
    textColor: "text-vote-club" 
  },
  [VoteType.WouldJoinTournament]: { 
    label: "Would play again", // Fallback to existing option
    icon: "dice-four",
    bgColor: "bg-vote-tournament/20", 
    hoverBgColor: "hover:bg-vote-tournament/30", 
    textColor: "text-vote-tournament" 
  },
  [VoteType.WouldTeach]: { 
    label: "Would play regularly", // Fallback to existing option
    icon: "dice-five",
    bgColor: "bg-vote-teach/20", 
    hoverBgColor: "hover:bg-vote-teach/30", 
    textColor: "text-vote-teach" 
  }
};
