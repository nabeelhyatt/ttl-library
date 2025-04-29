import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { boardGameGeekService } from "./services/bgg-service";
import { airtableService } from "./services/airtable-service";
import * as z from "zod";
import { insertUserSchema, insertVoteSchema, VoteType } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";

const MemoryStoreSession = MemoryStore(session);

// Define the interface explicitly to include subcategoryName
interface AirtableGameInfo {
  tlcsCode?: string;
  subcategoryName?: string;
  forRent?: boolean;
  forSale?: boolean;
  toOrder?: boolean;
  categories?: string[];
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "tabletop-library-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === "production",
      },
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      // Validate the email
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      const { email } = result.data;
      
      // Check if user exists
      let user = await storage.getUserByEmail(email);
      
      // If not, create a new user
      if (!user) {
        user = await storage.createUser({ email });
      } else {
        // Update last login
        user = await storage.updateUserLastLogin(user.id);
      }
      
      // Set user in session
      req.session.userId = user.id;
      
      return res.status(200).json(user);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Failed to log in" });
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to log out" });
      }
      
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      return res.status(200).json(user);
    } catch (error) {
      console.error("Auth check error:", error);
      return res.status(500).json({ message: "Failed to check authentication status" });
    }
  });
  
  // BoardGameGeek API routes
  app.get("/api/bgg/hot", async (req, res) => {
    try {
      // Get basic hot games list
      const hotGames = await boardGameGeekService.getHotGames();
      
      // Enrich with Airtable data (in parallel)
      const enrichedGames = await Promise.all(
        hotGames.map(async (game) => {
          try {
            // Check if game exists in Airtable
            const airtableGameInfo = await airtableService.getGameByBGGId(game.gameId);
            
            if (airtableGameInfo) {
              // Determine if Airtable categories are record IDs
              let useAirtableCategories = false;
              if (airtableGameInfo.categories?.length) {
                useAirtableCategories = airtableGameInfo.categories.some(
                  cat => typeof cat === 'string' && !cat.startsWith('rec')
                );
              }
              
              // Return enriched game with Airtable data
              return {
                ...game,
                tlcsCode: airtableGameInfo.tlcsCode || null,
                subcategoryName: airtableGameInfo.subcategoryName || null,
                forRent: airtableGameInfo.forRent || false,
                forSale: airtableGameInfo.forSale || false,
                toOrder: airtableGameInfo.toOrder || false,
                categories: useAirtableCategories ? airtableGameInfo.categories : game.categories
              };
            }
            
            return game;
          } catch (error) {
            console.error(`Error enriching game ${game.gameId} with Airtable data:`, error);
            return game;
          }
        })
      );
      
      return res.status(200).json(enrichedGames);
    } catch (error) {
      console.error("Error fetching hot games:", error);
      return res.status(500).json({ message: "Failed to fetch hot games" });
    }
  });
  
  app.get("/api/bgg/search", async (req, res) => {
    try {
      const query = req.query.query as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      // Get basic search results
      const results = await boardGameGeekService.searchGames(query);
      
      // Enrich with Airtable data (in parallel)
      const enrichedResults = await Promise.all(
        results.map(async (game) => {
          try {
            // Check if game exists in Airtable
            const airtableGameInfo = await airtableService.getGameByBGGId(game.gameId);
            
            if (airtableGameInfo) {
              // Determine if Airtable categories are record IDs
              let useAirtableCategories = false;
              if (airtableGameInfo.categories?.length) {
                useAirtableCategories = airtableGameInfo.categories.some(
                  cat => typeof cat === 'string' && !cat.startsWith('rec')
                );
              }
              
              // Return enriched game with Airtable data
              return {
                ...game,
                tlcsCode: airtableGameInfo.tlcsCode || null,
                subcategoryName: airtableGameInfo.subcategoryName || null,
                forRent: airtableGameInfo.forRent || false,
                forSale: airtableGameInfo.forSale || false,
                toOrder: airtableGameInfo.toOrder || false,
                categories: useAirtableCategories ? airtableGameInfo.categories : game.categories
              };
            }
            
            return game;
          } catch (error) {
            console.error(`Error enriching game ${game.gameId} with Airtable data:`, error);
            return game;
          }
        })
      );
      
      // Sort results by BGG rank if available (games with ranks come first, sorted by rank)
      const sortedResults = enrichedResults.sort((a, b) => {
        // If both games have a rank, sort by rank (lower rank is better)
        if (a.bggRank && b.bggRank) {
          return a.bggRank - b.bggRank;
        }
        // If only one game has a rank, prioritize the ranked game
        if (a.bggRank) return -1;
        if (b.bggRank) return 1;
        // If neither has a rank, sort alphabetically by name
        return a.name.localeCompare(b.name);
      });
      
      return res.status(200).json(sortedResults);
    } catch (error) {
      console.error("Error searching games:", error);
      return res.status(500).json({ message: "Failed to search games" });
    }
  });
  
  app.get("/api/bgg/game/:id", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }
      
      const game = await boardGameGeekService.getGameDetails(gameId);
      
      // Check if game exists in Airtable and get additional information
      const airtableGameInfo = await airtableService.getGameByBGGId(gameId);
      
      // Determine if Airtable categories are record IDs (they start with "rec")
      let useAirtableCategories = false;
      if (airtableGameInfo?.categories?.length) {
        // Check if any categories don't start with "rec" (indicating they're not record IDs)
        useAirtableCategories = airtableGameInfo.categories.some(cat => typeof cat === 'string' && !cat.startsWith('rec'));
      }
      
      // Merge Airtable data with BGG data
      const enrichedGame = {
        ...game,
        tlcsCode: airtableGameInfo?.tlcsCode || null,
        subcategoryName: airtableGameInfo?.subcategoryName || null,
        forRent: airtableGameInfo?.forRent || false,
        forSale: airtableGameInfo?.forSale || false,
        toOrder: airtableGameInfo?.toOrder || false,
        // Use Airtable categories only if they're not record IDs
        categories: useAirtableCategories ? airtableGameInfo.categories : game.categories
      };
      
      return res.status(200).json(enrichedGame);
    } catch (error) {
      console.error(`Error fetching game details:`, error);
      return res.status(500).json({ message: "Failed to fetch game details" });
    }
  });
  
  // New endpoint to check if a game exists in Airtable by BGG ID
  app.get("/api/airtable/game/:bggId", async (req, res) => {
    try {
      const bggId = parseInt(req.params.bggId);
      if (isNaN(bggId)) {
        return res.status(400).json({ message: "Invalid BGG ID" });
      }
      
      const airtableGameInfo = await airtableService.getGameByBGGId(bggId);
      
      if (!airtableGameInfo) {
        return res.status(404).json({ message: "Game not found in Airtable" });
      }
      
      return res.status(200).json(airtableGameInfo);
    } catch (error) {
      console.error(`Error fetching game from Airtable:`, error);
      return res.status(500).json({ message: "Failed to fetch game from Airtable" });
    }
  });
  
  // Votes routes
  app.post("/api/votes", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.session.userId) {
        return res.status(401).json({ message: "You must be logged in to vote" });
      }
      
      // Validate vote data
      const voteSchema = z.object({
        bggId: z.number(),
        voteType: z.nativeEnum(VoteType)
      });
      
      const result = voteSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid vote data", errors: result.error.errors });
      }
      
      const { bggId, voteType } = result.data;
      
      // Check if game exists in our database, if not, fetch it from BGG and save it
      let game = await storage.getGameByBGGId(bggId);
      if (!game) {
        const gameDetails = await boardGameGeekService.getGameDetails(bggId);
        game = await storage.createGame({
          bggId: gameDetails.gameId,
          name: gameDetails.name,
          description: gameDetails.description,
          image: gameDetails.image,
          thumbnail: gameDetails.thumbnail,
          yearPublished: gameDetails.yearPublished,
          minPlayers: gameDetails.minPlayers,
          maxPlayers: gameDetails.maxPlayers,
          playingTime: gameDetails.playingTime,
          minPlayTime: gameDetails.minPlayTime,
          maxPlayTime: gameDetails.maxPlayTime,
          minAge: gameDetails.minAge,
          bggRating: gameDetails.bggRating,
          bggRank: gameDetails.bggRank,
          weightRating: gameDetails.weightRating,
          categories: gameDetails.categories,
          mechanics: gameDetails.mechanics,
          designers: gameDetails.designers,
          publishers: gameDetails.publishers
        });
      }
      
      // Check if user already voted for this game
      const existingVote = await storage.getUserVoteForGame(req.session.userId, game.id);
      if (existingVote) {
        // Update the existing vote
        const updatedVote = await storage.updateVote(existingVote.id, { voteType });
        
        // Update in Airtable
        await airtableService.updateVote(updatedVote);
        
        return res.status(200).json(updatedVote);
      }
      
      // Create new vote
      const vote = await storage.createVote({
        userId: req.session.userId,
        gameId: game.id,
        voteType
      });
      
      // Save to Airtable
      await airtableService.createVote(vote);
      
      return res.status(201).json(vote);
    } catch (error) {
      console.error("Vote submission error:", error);
      return res.status(500).json({ message: "Failed to submit vote" });
    }
  });
  
  app.get("/api/votes/my-votes", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.session.userId) {
        return res.status(401).json({ message: "You must be logged in to view your votes" });
      }
      
      const votes = await storage.getUserVotes(req.session.userId);
      return res.status(200).json(votes);
    } catch (error) {
      console.error("Error fetching user votes:", error);
      return res.status(500).json({ message: "Failed to fetch your votes" });
    }
  });
  
  app.get("/api/games/:id", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }
      
      // Get game from storage
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      return res.status(200).json(game);
    } catch (error) {
      console.error("Error fetching game:", error);
      return res.status(500).json({ message: "Failed to fetch game details" });
    }
  });

  app.delete("/api/votes/:id", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.session.userId) {
        return res.status(401).json({ message: "You must be logged in to delete votes" });
      }
      
      const voteId = parseInt(req.params.id);
      if (isNaN(voteId)) {
        return res.status(400).json({ message: "Invalid vote ID" });
      }
      
      // Check if vote exists and belongs to the user
      const vote = await storage.getVote(voteId);
      if (!vote) {
        return res.status(404).json({ message: "Vote not found" });
      }
      
      if (vote.userId !== req.session.userId) {
        return res.status(403).json({ message: "You can only delete your own votes" });
      }
      
      // Delete from storage
      await storage.deleteVote(voteId);
      
      // Delete from Airtable
      await airtableService.deleteVote(voteId);
      
      return res.status(200).json({ message: "Vote deleted successfully" });
    } catch (error) {
      console.error("Vote deletion error:", error);
      return res.status(500).json({ message: "Failed to delete vote" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
