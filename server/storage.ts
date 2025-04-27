import { 
  User, InsertUser, Game, InsertGame, Vote, InsertVote, VoteType 
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: number): Promise<User>;
  
  // Game methods
  getGame(id: number): Promise<Game | undefined>;
  getGameByBGGId(bggId: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  
  // Vote methods
  getVote(id: number): Promise<Vote | undefined>;
  getUserVotes(userId: number): Promise<Vote[]>;
  getUserVoteForGame(userId: number, gameId: number): Promise<Vote | undefined>;
  createVote(vote: InsertVote): Promise<Vote>;
  updateVote(id: number, data: Partial<InsertVote>): Promise<Vote>;
  deleteVote(id: number): Promise<void>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private votes: Map<number, Vote>;
  private userIdCounter: number;
  private gameIdCounter: number;
  private voteIdCounter: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.votes = new Map();
    this.userIdCounter = 1;
    this.gameIdCounter = 1;
    this.voteIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      id, 
      ...userData,
      lastLogin: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserLastLogin(id: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = {
      ...user,
      lastLogin: new Date()
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
  
  async getUserVotes(userId: number): Promise<Vote[]> {
    return Array.from(this.votes.values()).filter(
      (vote) => vote.userId === userId
    );
  }
  
  async getUserVoteForGame(userId: number, gameId: number): Promise<Vote | undefined> {
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
      createdAt: now
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
      ...data
    };
    
    this.votes.set(id, updatedVote);
    return updatedVote;
  }
  
  async deleteVote(id: number): Promise<void> {
    this.votes.delete(id);
  }
}

// Export storage instance
export const storage = new MemStorage();
