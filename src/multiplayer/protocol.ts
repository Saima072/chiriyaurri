import type { Action, TeamId, UrriEntry } from '../types';

// ── Room codes ─────────────────────────────────────────────────────
// Short codes players read out loud, so skip lookalikes (0/O, 1/I/L).
// Six characters ≈ 887M combinations — small enough to say on a call,
// large enough that scanning the public broker for live rooms is futile.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 6;

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

/** Player tokens travel over the wire and become object keys on the
 *  host; keep them boring and never a prototype-chain name. */
const RESERVED_TOKENS = new Set(['__proto__', 'constructor', 'prototype']);

export function sanitizeToken(raw: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
  return RESERVED_TOKENS.has(cleaned) ? '' : cleaned;
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
  | { type: 'rejected'; reason: string }
  | { type: 'pause' }
  | { type: 'resume' }
  /** Full game position, so a reconnecting player lands exactly where the room is. */
  | {
      type: 'sync';
      selfId: string;
      lobby: LobbyState;
      phase: 'lobby' | 'question' | 'reveal' | 'over';
      /** During a question, durationMs is the REMAINING time, not the full window. */
      round?: { index: number; total: number; prompt: string; durationMs: number };
      result?: RoundResult;
      scores: Record<string, number>;
      answered: boolean;
      paused?: boolean;
    };

// ── Messages: client → host ────────────────────────────────────────
export type ClientMessage =
  /** token is a stable per-player identity that survives reconnects and reloads. */
  | { type: 'hello'; name: string; token: string }
  | { type: 'answer'; index: number; action: Action };

// ── The view both sessions expose to the UI ────────────────────────
export type RoomPhase =
  | 'connecting'
  | 'reconnecting'
  | 'lobby'
  | 'question'
  | 'reveal'
  | 'over'
  | 'error';

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
  /** Whether the host has paused the game. */
  paused: boolean;
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
