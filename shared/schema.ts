import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User model updated for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(), // Replit user ID from OpenID
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  name: text("name"), // Display name (can be set separately from firstName/lastName)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  name: true,
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
  userId: varchar("user_id").notNull(), // Updated to varchar to match new user ID type
  gameId: integer("game_id").notNull(),
  voteType: integer("vote_type").notNull(), // 1-5 vote types
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  airtableId: varchar("airtable_id"), // To track votes synced with Airtable
});

// Pending votes for users that are not yet logged in
export const pendingVotes = pgTable("pending_votes", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").notNull(), // Track by session before login
  gameId: integer("game_id").notNull(),
  voteType: integer("vote_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVoteSchema = createInsertSchema(votes).pick({
  userId: true,
  gameId: true,
  voteType: true,
});

export const insertPendingVoteSchema = createInsertSchema(pendingVotes).pick({
  sessionId: true,
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

export type PendingVote = typeof pendingVotes.$inferSelect;
export type InsertPendingVote = z.infer<typeof insertPendingVoteSchema>;

// Type for storing a temporary vote while logging in
export interface TempVote {
  gameId: number;
  voteType: VoteType;
}

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
