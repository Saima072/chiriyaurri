import type { TeamId } from '../types';

// Snapshot of a hosted room, persisted on every state change. Because the
// host's PeerJS id is derived from the room code, a reloaded host browser
// can re-register the SAME code, restore this snapshot, and the guests'
// reconnect loops find the room again — the room survives a host refresh.

export type HostSnapshot = {
  code: string;
  hostName: string;
  teamsEnabled: boolean;
  rounds: number;
  started: boolean;
  /** Entry ids; the deck is rebuilt from the answers pool on revival. */
  deckIds: string[];
  roundIndex: number;
  scores: Record<string, number>;
  players: { id: string; name: string; team: TeamId | null }[];
  savedAt: number;
};

const KEY = 'chiriya-urri-host-state';
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

export function saveHostState(snapshot: Omit<HostSnapshot, 'savedAt'>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...snapshot, savedAt: Date.now() }));
  } catch {
    // Storage unavailable — host revival just won't work here.
  }
}

export function loadHostState(): HostSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw) as HostSnapshot;
    if (!snap.code || Date.now() - snap.savedAt > MAX_AGE_MS) {
      clearHostState();
      return null;
    }
    return snap;
  } catch {
    return null;
  }
}

export function clearHostState(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** For re-opening a known code as an empty lobby (no saved game state). */
export function blankSnapshot(code: string, hostName: string): HostSnapshot {
  return {
    code,
    hostName,
    teamsEnabled: false,
    rounds: 15,
    started: false,
    deckIds: [],
    roundIndex: -1,
    scores: {},
    players: [],
    savedAt: Date.now(),
  };
}
