import { Vote, VoteType } from "@shared/schema";
import { apiRequest } from "./queryClient";

export async function submitVote(gameId: number, voteType: VoteType): Promise<Vote> {
  const response = await apiRequest("POST", "/api/votes", { bggId: gameId, voteType });
  return response.json();
}

export async function getUserVotes(): Promise<Vote[]> {
  const response = await apiRequest("GET", "/api/votes/my-votes");
  return response.json();
}

export async function deleteVote(voteId: number): Promise<void> {
  await apiRequest("DELETE", `/api/votes/${voteId}`);
}
