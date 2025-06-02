import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { boardGameGeekService } from "./services/bgg-service";
import { airtableService } from "./services/airtable-service";
import { airtableDirectService } from "./services/airtable-direct";
import { debugAirtableBase, testAirtableWrite } from "./services/airtable-debug";
import { testAirtableMCP } from "./services/airtable-mcp-test";
import { newBoardGameGeekService } from "./services/new-bgg-service";
import * as z from "zod";
import { insertUserSchema, insertVoteSchema, VoteType, Vote } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import { setupAuth, isAuthenticated } from "./replitAuth";

// Extend the express-session SessionData interface
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

// Import modular routes
import bggRoutes from "./routes/bgg-routes";

const MemoryStoreSession = MemoryStore(session);

// Define the interface explicitly to include subcategoryName
/**
 * Interface for game information returned from Airtable
 */
interface AirtableGameInfo {
  tlcsCode?: string;
  subcategoryName?: string;
  inLibrary?: boolean;
  forRent?: boolean; // Added forRent property
  forSale?: boolean;
  toOrder?: boolean;
  categories?: string[];
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth (includes session middleware)
  await setupAuth(app);

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      // Validate the email and name
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid format for name or email" });
      }

      const { email, name } = result.data;

      // Check if user exists
      let user = await storage.getUserByEmail(email);

      // If not, create a new user
      if (!user) {
        user = await storage.createUser({ email, name });
      } else {
        // Existing users might not have a name yet, update it if it's missing
        if (!user.name) {
          // Update the user with the name field
          user = await storage.updateUserNameAndLogin(user.id, name);
        } else {
          // Just update last login
          user = await storage.updateUserLastLogin(user.id);
        }
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

  // User endpoint for the new authentication system
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const replitId = req.user.claims.sub;
      
      // Get the user from storage
      const user = await storage.getUserByReplitId(replitId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching authenticated user:", error);
      return res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  // Keep existing endpoint for backward compatibility
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        // Try to recover session from storage
        const sessionToken = req.headers['x-session-token'];
        if (sessionToken && typeof sessionToken === 'string') {
          const user = await storage.getUserBySessionToken(sessionToken);
          if (user) {
            req.session.userId = user.id;
            return res.status(200).json(user);
          }
        }
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

  // Use the new BGG routes
  app.use("/api/bgg", bggRoutes);
  
  // Endpoint to get game statistics including games in library and on order
  app.get("/api/airtable/game-stats", async (req, res) => {
    try {
      console.log("Fetching game statistics from Airtable...");
      const stats = await airtableDirectService.getGameStats();
      
      // Set target for total games (in library + on order)
      const target = 200;
      
      return res.status(200).json({ 
        ...stats,
        target, 
        // Calculate percentages
        inLibraryPercentage: Math.min(100, Math.round((stats.gamesInLibrary / target) * 100)),
        orderPercentage: Math.min(100, Math.round((stats.gamesOnOrder / target) * 100)),
        totalPercentage: Math.min(100, Math.round((stats.totalGames / target) * 100)),
        // Keep backward compatibility
        gamesInStock: stats.gamesInLibrary,
        stockPercentage: Math.min(100, Math.round((stats.gamesInLibrary / target) * 100))
      });
    } catch (error) {
      console.error(`Error fetching game statistics:`, error);
      return res.status(500).json({ 
        message: "Failed to retrieve game statistics from Airtable",
        error: error instanceof Error ? error.message : String(error)
      });
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

  // Debug endpoint for Airtable integration
  app.get("/api/airtable/debug", async (req, res) => {
    try {
      console.log("Starting Airtable debug...");
      await debugAirtableBase();
      return res.status(200).json({ message: "Airtable debug completed, check console logs" });
    } catch (error) {
      console.error(`Error debugging Airtable:`, error);
      return res.status(500).json({ message: "Failed to debug Airtable connection" });
    }
  });

  // Debug endpoint to inspect Games table structure
  app.get("/api/airtable/debug-games", async (req, res) => {
    try {
      console.log("Inspecting Games table structure...");
      const result = await airtableDirectService.debugGamesTable();
      return res.status(200).json(result);
    } catch (error) {
      console.error(`Error inspecting Games table:`, error);
      return res.status(500).json({ 
        message: "Failed to inspect Games table",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Advanced debug endpoint for field name diagnosis
  app.get("/api/airtable/diagnose-fields", async (req, res) => {
    try {
      const diagnosis = await airtableDirectService.diagnoseFields();
      return res.status(200).json(diagnosis);
    } catch (error) {
      console.error(`Error diagnosing fields:`, error);
      return res.status(500).json({ 
        message: "Failed to diagnose fields",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Debug endpoint for testing Airtable write operations
  app.post("/api/airtable/test-write", async (req, res) => {
    try {
      console.log("Starting Airtable write test...");
      const result = await testAirtableWrite();
      return res.status(200).json(result);
    } catch (error) {
      console.error(`Error testing Airtable write:`, error);
      return res.status(500).json({ 
        message: "Failed to test Airtable write operations",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Debug endpoint for testing Airtable with MCP approach
  app.post("/api/airtable/test-mcp", async (req, res) => {
    try {
      console.log("Starting Airtable MCP test...");
      const result = await testAirtableMCP();
      return res.status(200).json(result);
    } catch (error) {
      console.error(`Error testing Airtable MCP:`, error);
      return res.status(500).json({ 
        message: "Failed to test Airtable MCP approach",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint to get most voted games from Airtable for Rankings page
  app.get("/api/rankings/most-voted", async (req, res) => {
    try {
      // Get limit parameter from query string or default to 15
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 15;

      console.log(`Fetching most voted games (limit: ${limit})...`);
      const games = await airtableDirectService.getMostVotedGames(limit);

      return res.status(200).json(games);
    } catch (error) {
      console.error(`Error fetching most voted games:`, error);
      return res.status(500).json({ 
        message: "Failed to retrieve most voted games from Airtable",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint to verify Airtable votes for the current user
  // Debug endpoint to check if a game exists in Airtable by BGG ID
  app.get("/api/airtable/game-by-bgg-id/:bggId", async (req, res) => {
    try {
      const bggId = parseInt(req.params.bggId);
      if (isNaN(bggId)) {
        return res.status(400).json({ message: 'Invalid BGG ID' });
      }

      const baseId = process.env.AIRTABLE_BASE_ID;
      const apiKey = process.env.AIRTABLE_API_KEY;

      if (!baseId || !apiKey) {
        return res.status(500).json({ message: 'Airtable credentials not configured' });
      }

      const encodedFormula = encodeURIComponent(`{BGG ID}=${bggId}`);
      const url = `https://api.airtable.com/v0/${baseId}/Games?filterByFormula=${encodedFormula}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({
          message: `Airtable error: ${response.statusText}`
        });
      }

      const data = await response.json();

      if (!data.records || data.records.length === 0) {
        return res.status(404).json({ message: `Game with BGG ID ${bggId} not found in Airtable` });
      }

      // Return the first game's record
      const gameRecord = data.records[0];

      return res.json({
        bggId,
        id: gameRecord.id,
        fields: gameRecord.fields
      });
    } catch (error) {
      console.error('Error checking game by BGG ID:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({ message: 'Error checking game by BGG ID', error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/airtable/my-votes", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.session.userId) {
        return res.status(401).json({ message: "You must be logged in to view your votes in Airtable" });
      }

      // Get user details
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(500).json({ message: "Airtable configuration is incomplete" });
      }

      // Find the member in Airtable
      const encodedFormula = encodeURIComponent(`{Email}="${user.email}"`);
      const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Members?filterByFormula=${encodedFormula}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json({
          message: "Error connecting to Airtable",
          error: errorData
        });
      }

      const data = await response.json();

      if (!data.records || data.records.length === 0) {
        return res.status(404).json({ message: "Member not found in Airtable" });
      }

      const memberId = data.records[0].id;

      // Get all votes for debugging purposes
      const votesUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Votes`;

      console.log(`Checking for votes in Airtable for member: ${memberId}`);

      const votesResponse = await fetch(votesUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
        }
      });

      if (!votesResponse.ok) {
        const errorData = await votesResponse.json();
        return res.status(votesResponse.status).json({
          message: "Error retrieving votes from Airtable",
          error: errorData
        });
      }

      const votesData = await votesResponse.json();

      // Filter votes for this member for more clarity
      const memberVotes = votesData.records?.filter((record: any) => {
        // Check if the record has Member field and if it's an array containing memberId
        return record.fields.Member && 
               Array.isArray(record.fields.Member) && 
               record.fields.Member.includes(memberId);
      }) || [];

      console.log(`Found ${memberVotes.length} votes for member ${memberId} out of ${votesData.records?.length || 0} total votes`);

      return res.status(200).json({
        member: {
          id: memberId,
          email: user.email
        },
        allVotes: votesData.records || [],
        memberVotes: memberVotes
      });
    } catch (error) {
      console.error(`Error in Airtable my-votes endpoint:`, error);
      return res.status(500).json({ 
        message: "Failed to retrieve votes from Airtable",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Debug endpoint for specific game with Airtable data
  app.get("/api/airtable/test-game", async (req, res) => {
    try {
      // Use Ark Nova as a test case since it has subcategory data in Airtable
      const bggId = 342942;

      // Get full game details from BGG
      const game = await boardGameGeekService.getGameDetails(bggId);

      // Get Airtable-specific data
      const airtableData = await airtableService.getGameByBGGId(bggId);

      // Create a combined object for debugging
      const debugData = {
        game: game,
        airtableData: airtableData,
        combined: {
          ...game,
          tlcsCode: airtableData?.tlcsCode || null,
          subcategoryName: airtableData?.subcategoryName || null,
          inLibrary: airtableData?.inLibrary || false,
          forRent: airtableData?.forRent || false,
          forSale: airtableData?.forSale || false,
          toOrder: airtableData?.toOrder || false
        }
      };

      return res.status(200).json(debugData);
    } catch (error) {
      console.error(`Error in test-game endpoint:`, error);
      return res.status(500).json({ 
        message: "Test game endpoint failed", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Votes routes
  app.post("/api/votes", isAuthenticated, async (req: any, res) => {
    try {
      // User is authenticated with Replit Auth at this point
      // Get the user from our storage using the Replit ID
      const replitId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(replitId);
      
      if (!user) {
        return res.status(404).json({ 
          message: "User account not found. Please try logging out and in again."
        });
      }
      
      // Store the user ID in the session for compatibility with old code
      req.session.userId = user.id;

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

        // Update in Airtable using the direct service that works
        try {
          await airtableDirectService.updateVote(updatedVote);
        } catch (airtableError) {
          console.error("Airtable update error:", airtableError);
          // Continue even if Airtable fails - local storage is our source of truth
        }

        return res.status(200).json(updatedVote);
      }

      // Create new vote
      const vote = await storage.createVote({
        userId: req.session.userId,
        gameId: game.id,
        voteType
      });

      // Save to Airtable using the direct service that works
      try {
        await airtableDirectService.createVote(vote);
      } catch (airtableError) {
        console.error("Airtable create error:", airtableError);
        // Continue even if Airtable fails - local storage is our source of truth
      }

      return res.status(201).json(vote);
    } catch (error) {
      console.error("Vote submission error:", error);
      return res.status(500).json({ message: "Failed to submit vote" });
    }
  });

  app.get("/api/votes/my-votes", isAuthenticated, async (req: any, res) => {
    try {
      // Log Airtable configuration status
      const airtableConfigured = process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID;
      console.log(`Airtable configuration status: ${airtableConfigured ? 'Configured' : 'Not configured'}`);

      // Get user from Replit auth
      const replitId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(replitId);
      
      if (!user) {
        console.log(`User not found with Replit ID: ${replitId}`);
        return res.status(404).json({ message: "User account not found. Please try logging out and in again." });
      }
      
      // Store in session for compatibility with existing code
      req.session.userId = user.id;

      // First, get votes from local storage
      console.log(`Fetching votes from local storage for user ID: ${req.session.userId}`);
      const localVotes = await storage.getUserVotes(req.session.userId);
      console.log(`Retrieved ${localVotes.length} votes from local storage`);
      
      // Next, try to fetch votes from Airtable if configured
      let airtableVotes: Vote[] = [];
      if (airtableConfigured) {
        try {
          console.log(`Fetching votes from Airtable for user: ${user.email}`);
          
          // Find user's member ID in Airtable
          const baseId = process.env.AIRTABLE_BASE_ID as string;
          const apiKey = process.env.AIRTABLE_API_KEY as string;
          
          // First try to find the member in Members table
          const encodedFormula = encodeURIComponent(`{Email}="${user.email}"`);
          const url = `https://api.airtable.com/v0/${baseId}/Members?filterByFormula=${encodedFormula}`;
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`
            }
          });
          
          if (!response.ok) {
            console.error("Error connecting to Airtable:", response.statusText);
            // Continue with local votes only
          } else {
            const data = await response.json();
            
            if (data.records && data.records.length > 0) {
              const memberId = data.records[0].id;
              console.log(`Found member in Airtable with ID: ${memberId}`);
              
              // Get all votes for this member
              const votesUrl = `https://api.airtable.com/v0/${baseId}/Votes`;
              
              const votesResponse = await fetch(votesUrl, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${apiKey}`
                }
              });
              
              if (votesResponse.ok) {
                const votesData = await votesResponse.json();
                
                // Filter votes for this member
                const memberVotes = votesData.records?.filter((record: any) => {
                  return record.fields.Member && 
                         Array.isArray(record.fields.Member) && 
                         record.fields.Member.includes(memberId);
                }) || [];
                
                console.log(`Found ${memberVotes.length} votes for member in Airtable`);
                
                // Convert Airtable votes to our format and sync with local storage
                for (const record of memberVotes) {
                  try {
                    if (record.fields.Game && Array.isArray(record.fields.Game) && record.fields.Game.length > 0) {
                      // Get the game info using Airtable Game ID
                      const gameId = record.fields.Game[0];
                      const gameUrl = `https://api.airtable.com/v0/${baseId}/Games/${gameId}`;
                      
                      const gameResponse = await fetch(gameUrl, {
                        method: 'GET',
                        headers: {
                          'Authorization': `Bearer ${apiKey}`
                        }
                      });
                      
                      if (gameResponse.ok) {
                        const gameData = await gameResponse.json();
                        
                        if (gameData.fields && gameData.fields['BGG ID']) {
                          const bggId = parseInt(gameData.fields['BGG ID']);
                          
                          // Check if this game exists in our local storage
                          let game = await storage.getGameByBGGId(bggId);
                          
                          // If game doesn't exist locally, create it
                          if (!game) {
                            console.log(`Game with BGG ID ${bggId} not found locally, creating it`);
                            
                            // Get basic info from BGG
                            try {
                              // Create a basic game entry
                              game = await storage.createGame({
                                bggId: bggId,
                                name: gameData.fields.Title || `Game #${bggId}`,
                                description: '',
                                image: '',
                                thumbnail: '',
                                categories: [],
                                mechanics: []
                              });
                              console.log(`Created game with ID ${game.id}`);
                            } catch (err) {
                              console.error(`Error creating game: ${err}`);
                              continue; // Skip this vote
                            }
                          }
                          
                          // Check if we already have this vote locally
                          const existingVote = await storage.getUserVoteForGame(user.id, game.id);
                          
                          if (!existingVote) {
                            // Create the vote locally
                            let voteType = 1; // Default to Want to Try
                            
                            // Parse vote type from Airtable
                            if (record.fields['Vote Type'] === 'Want to Try') {
                              voteType = 1;
                            } else if (record.fields['Vote Type'] === 'Played and Will Play Again') {
                              voteType = 2;
                            } else if (record.fields['Vote Type'] === 'Would Join a Club') {
                              voteType = 3; 
                            } else if (record.fields['Vote Type'] === 'Would Join a Tournament') {
                              voteType = 4;
                            } else if (record.fields['Vote Type'] === 'Would Teach') {
                              voteType = 5;
                            }
                            
                            try {
                              const newVote = await storage.createVote({
                                userId: user.id,
                                gameId: game.id,
                                voteType: voteType
                              });
                              
                              airtableVotes.push(newVote);
                              console.log(`Created vote for game ${game.name} from Airtable`);
                            } catch (err) {
                              console.error(`Error creating vote: ${err}`);
                            }
                          }
                        }
                      }
                    }
                  } catch (err) {
                    console.error(`Error processing Airtable vote: ${err}`);
                  }
                }
              }
            } else {
              console.log(`Member not found in Airtable with email: ${user.email}`);
            }
          }
        } catch (airtableError) {
          console.error("Error syncing with Airtable:", airtableError);
          // Continue with local votes only
        }
      }
      
      // Get the updated votes from storage after syncing with Airtable
      const updatedVotes = await storage.getUserVotes(req.session.userId);
      console.log(`Returning ${updatedVotes.length} total votes to client`);
      return res.status(200).json(updatedVotes);
    } catch (error) {
      console.error("Error fetching user votes:", error);
      return res.status(500).json({ 
        message: "Failed to fetch your votes", 
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined 
      });
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

  // Debug endpoint to check Airtable game fields
  app.get("/api/airtable/game-fields", async (req, res) => {
    try {
      const game = req.query.game as string || "Spirit Island"; // Use provided game name or default
      const baseId = process.env.AIRTABLE_BASE_ID;
      const apiKey = process.env.AIRTABLE_API_KEY;

      if (!baseId || !apiKey) {
        return res.status(500).json({ message: 'Airtable credentials not configured' });
      }

      const encodedFormula = encodeURIComponent(`{Title}="${game}"`);
      const url = `https://api.airtable.com/v0/${baseId}/Games?filterByFormula=${encodedFormula}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({
          message: `Airtable error: ${response.statusText}`
        });
      }

      const data = await response.json();

      if (!data.records || data.records.length === 0) {
        return res.status(404).json({ message: `Game '${game}' not found in Airtable` });
      }

      // Return the first game's record to examine its fields
      const gameRecord = data.records[0];

      // Return all field names available in the record
      const fieldNames = Object.keys(gameRecord.fields);

      return res.json({
        game,
        id: gameRecord.id,
        fieldNames,
        fields: gameRecord.fields
      });
    } catch (error) {
      console.error('Error checking game fields:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({ message: 'Error checking game fields', error: error instanceof Error ? error.message : String(error) });
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

      // Delete from Airtable using the direct service that works
      try {
        await airtableDirectService.deleteVote(voteId);
      } catch (airtableError) {
        console.error("Airtable delete error:", airtableError);
        // Continue even if Airtable fails - local storage is our source of truth
      }

      return res.status(200).json({ message: "Vote deleted successfully" });
    } catch (error) {
      console.error("Vote deletion error:", error);
      return res.status(500).json({ message: "Failed to delete vote" });
    }
  });

  // Endpoint to get category votes from Airtable for Rankings page
  app.get("/api/rankings/category-votes", async (req, res) => {
    try {
      console.log("Fetching category votes...");
      const categories = await airtableDirectService.getCategoryVotes();

      return res.status(200).json(categories);
    } catch (error) {
      console.error(`Error fetching category votes:`, error);
      return res.status(500).json({ 
        message: "Failed to retrieve category votes from Airtable",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}