// Local history of rooms this browser hosted or joined, so a refresh (or a
// curious "what was that code again?") can get back into a room. This is
// per-device history — a global room directory would need a real server,
// which this serverless design deliberately avoids.

export type RoomRole = 'host' | 'guest';

export type RoomRecord = {
  code: string;
  name: string;
  role: RoomRole;
  /** Guest identity token; lets a rejoin reclaim the same seat and score. */
  token?: string;
  /** False after an explicit leave or a finished game — listed, but not auto-resumed. */
  active: boolean;
  savedAt: number;
};

const KEY = 'chiriya-urri-rooms';
const MAX_AGE_MS = 2 * 60 * 60 * 1000; // rooms older than this are long dead
const MAX_ROOMS = 6;

export function newToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function write(rooms: RoomRecord[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(rooms.slice(0, MAX_ROOMS)));
  } catch {
    // Private browsing without storage — history just won't survive reloads.
  }
}

export function listRooms(): RoomRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const rooms = (JSON.parse(raw) as RoomRecord[]).filter(
      (r) => r.code && Date.now() - r.savedAt <= MAX_AGE_MS
    );
    return rooms.sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

export function recordRoom(rec: Omit<RoomRecord, 'savedAt'>): void {
  const rest = listRooms().filter((r) => r.code !== rec.code);
  write([{ ...rec, savedAt: Date.now() }, ...rest]);
}

export function setRoomActive(code: string, active: boolean): void {
  write(listRooms().map((r) => (r.code === code ? { ...r, active } : r)));
}

export function removeRoom(code: string): void {
  write(listRooms().filter((r) => r.code !== code));
}

/** The room a fresh page load should walk straight back into, if any. */
export function latestActiveRoom(): RoomRecord | null {
  return listRooms().find((r) => r.active) ?? null;
}
