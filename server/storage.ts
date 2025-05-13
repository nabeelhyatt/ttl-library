import { 
  User, InsertUser, Game, InsertGame, Vote, InsertVote, 
  PendingVote, InsertPendingVote, VoteType 
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: string): Promise<User>;
  
  // Game methods
  getGame(id: number): Promise<Game | undefined>;
  getGameByBGGId(bggId: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  
  // Vote methods
  getVote(id: number): Promise<Vote | undefined>;
  getUserVotes(userId: string): Promise<Vote[]>;
  getUserVoteForGame(userId: string, gameId: number): Promise<Vote | undefined>;
  createVote(vote: InsertVote): Promise<Vote>;
  updateVote(id: number, data: Partial<InsertVote>): Promise<Vote>;
  deleteVote(id: number): Promise<void>;

  // Pending vote methods
  createPendingVote(vote: InsertPendingVote): Promise<PendingVote>;
  getPendingVotesBySession(sessionId: string): Promise<PendingVote[]>;
  deletePendingVotesBySession(sessionId: string): Promise<void>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private games: Map<number, Game>;
  private votes: Map<number, Vote>;
  private pendingVotes: Map<number, PendingVote>;
  private gameIdCounter: number;
  private voteIdCounter: number;
  private pendingVoteIdCounter: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.votes = new Map();
    this.pendingVotes = new Map();
    this.gameIdCounter = 1;
    this.voteIdCounter = 1;
    this.pendingVoteIdCounter = 1;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    );
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    const now = new Date();
    
    // Check if user exists
    const existingUser = await this.getUser(userData.id);
    
    if (existingUser) {
      // Update existing user
      const updatedUser = {
        ...existingUser,
        ...userData,
        updatedAt: now,
        lastLogin: now
      };
      
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    } else {
      // Create new user
      const user: User = { 
        ...userData,
        createdAt: now,
        updatedAt: now,
        lastLogin: now
      };
      this.users.set(userData.id, user);
      return user;
    }
  }
  
  async updateUserLastLogin(id: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = {
      ...user,
      lastLogin: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Game methods
  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }
  
  async getGameByBGGId(bggId: number): Promise<Game | undefined> {
    return Array.from(this.games.values()).find(
      (game) => game.bggId === bggId
    );
  }
  
  async createGame(gameData: InsertGame): Promise<Game> {
    const id = this.gameIdCounter++;
    const game: Game = { id, ...gameData };
    this.games.set(id, game);
    return game;
  }
  
  // Vote methods
  async getVote(id: number): Promise<Vote | undefined> {
    return this.votes.get(id);
  }
  
  async getUserVotes(userId: string): Promise<Vote[]> {
    return Array.from(this.votes.values()).filter(
      (vote) => vote.userId === userId
    );
  }
  
  async getUserVoteForGame(userId: string, gameId: number): Promise<Vote | undefined> {
    return Array.from(this.votes.values()).find(
      (vote) => vote.userId === userId && vote.gameId === gameId
    );
  }
  
  async createVote(voteData: InsertVote): Promise<Vote> {
    const id = this.voteIdCounter++;
    const now = new Date();
    const vote: Vote = { 
      id, 
      ...voteData,
      createdAt: now,
      updatedAt: now,
      airtableId: null
    };
    this.votes.set(id, vote);
    return vote;
  }
  
  async updateVote(id: number, data: Partial<InsertVote>): Promise<Vote> {
    const vote = await this.getVote(id);
    if (!vote) {
      throw new Error(`Vote with ID ${id} not found`);
    }
    
    const updatedVote = {
      ...vote,
      ...data,
      updatedAt: new Date()
    };
    
    this.votes.set(id, updatedVote);
    return updatedVote;
  }
  
  async deleteVote(id: number): Promise<void> {
    this.votes.delete(id);
  }
  
  // Pending vote methods
  async createPendingVote(voteData: InsertPendingVote): Promise<PendingVote> {
    const id = this.pendingVoteIdCounter++;
    const now = new Date();
    const vote: PendingVote = { 
      id, 
      ...voteData,
      createdAt: now
    };
    this.pendingVotes.set(id, vote);
    return vote;
  }
  
  async getPendingVotesBySession(sessionId: string): Promise<PendingVote[]> {
    return Array.from(this.pendingVotes.values()).filter(
      (vote) => vote.sessionId === sessionId
    );
  }
  
  async deletePendingVotesBySession(sessionId: string): Promise<void> {
    const votesToDelete = await this.getPendingVotesBySession(sessionId);
    for (const vote of votesToDelete) {
      this.pendingVotes.delete(vote.id);
    }
  }
}

// Export storage instance
export const storage = new MemStorage();
