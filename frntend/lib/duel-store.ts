// lib/duel-store.ts

type Submission = {
  name: string;
  textSnippet: string;
  length: number;
  uploadedAt: number;
};

export type DuelScores = { quality: number; performance: number; style: number };
export type DuelResult = {
  user1: { name: string; scores: DuelScores; total: number };
  user2: { name: string; scores: DuelScores; total: number };
  decision: "User 1" | "User 2" | "Tie";
};

type MatchState = {
  user1?: Submission;
  user2?: Submission;
  result?: DuelResult;
};

// Extend the NodeJS.Global interface to include our in-memory store
declare global {
  var duelStore: Map<string, MatchState>;
}

// Use the global store if it exists, otherwise create a new one
const store = global.duelStore || (global.duelStore = new Map<string, MatchState>());

export function upsertSubmission(matchId: string, role: "user1" | "user2", submission: Submission) {
  const s = store.get(matchId) ?? {};
  s[role] = submission;
  store.set(matchId, s);
}

export function getMatch(matchId: string): MatchState | undefined {
  return store.get(matchId);
}

export function setResult(matchId: string, result: DuelResult) {
  const s = store.get(matchId) ?? {};
  s.result = result;
  store.set(matchId, s);
}