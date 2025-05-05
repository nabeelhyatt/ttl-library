import { Vote, VoteType } from "@shared/schema";
import { apiRequest } from "./queryClient";

export async function submitVote(gameId: number, voteType: VoteType): Promise<Vote> {
  const response = await apiRequest("POST", "/api/votes", { bggId: gameId, voteType });
  return response.json();
}

export async function getUserVotes(): Promise<Vote[]> {
  try {
    const response = await apiRequest("GET", "/api/votes/my-votes");
    return response.json();
  } catch (error) {
    console.error("Failed to get user votes:", error);
    // Rethrow to let the component handle the error
    throw error;
  }
}

export async function deleteVote(voteId: number): Promise<void> {
  await apiRequest("DELETE", `/api/votes/${voteId}`);
}
