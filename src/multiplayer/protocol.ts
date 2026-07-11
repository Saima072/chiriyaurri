import type { Action, TeamId, UrriEntry } from '../types';

// ── Room codes ─────────────────────────────────────────────────────
// Short codes players read out loud, so skip lookalikes (0/O, 1/I/L).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 5;

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** The PeerJS id a room's host registers on the public broker. */
export function peerIdForRoom(code: string): string {
  return `chiriya-urri-${code.toUpperCase()}`;
}

// ── Shared room state ──────────────────────────────────────────────
export type PlayerInfo = {
  id: string;
  name: string;
  team: TeamId | null;
  connected: boolean;
};

export type LobbyState = {
  code: string;
  hostId: string;
  players: PlayerInfo[];
  teamsEnabled: boolean;
  rounds: number;
};

export type RoundResult = {
  entry: UrriEntry;
  /** What each player did; null = timed out (implicit stay). */
  answers: Record<string, Action | null>;
  /** Points each player gained/lost this round. */
  points: Record<string, number>;
};

// ── Messages: host → client ────────────────────────────────────────
export type HostMessage =
  | { type: 'welcome'; selfId: string; lobby: LobbyState }
  | { type: 'lobby'; lobby: LobbyState }
  | { type: 'round'; index: number; total: number; prompt: string; durationMs: number }
  | { type: 'result'; index: number; result: RoundResult; scores: Record<string, number> }
  | { type: 'gameover'; scores: Record<string, number> }
  | { type: 'rejected'; reason: string };

// ── Messages: client → host ────────────────────────────────────────
export type ClientMessage =
  | { type: 'hello'; name: string }
  | { type: 'answer'; index: number; action: Action };

// ── The view both sessions expose to the UI ────────────────────────
export type RoomPhase = 'connecting' | 'lobby' | 'question' | 'reveal' | 'over' | 'error';

export type RoomView = {
  phase: RoomPhase;
  error?: string;
  selfId: string;
  isHost: boolean;
  lobby: LobbyState | null;
  round?: { index: number; total: number; prompt: string; durationMs: number };
  result?: RoundResult;
  scores: Record<string, number>;
  /** Whether we have already answered the current question. */
  answered: boolean;
};

export function teamTotals(
  lobby: LobbyState,
  scores: Record<string, number>
): Record<TeamId, number> {
  const totals: Record<TeamId, number> = { A: 0, B: 0 };
  for (const p of lobby.players) {
    if (p.team) totals[p.team] += scores[p.id] ?? 0;
  }
  return totals;
}
