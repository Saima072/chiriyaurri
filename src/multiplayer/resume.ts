// Lets a player who reloaded the page (or whose phone evicted the tab)
// walk straight back into their room with their seat and score intact.

export type ResumeInfo = {
  code: string;
  name: string;
  token: string;
  savedAt: number;
};

const KEY = 'chiriya-urri-resume';
const MAX_AGE_MS = 2 * 60 * 60 * 1000; // stale rooms are long gone anyway

export function newToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function saveResume(info: Omit<ResumeInfo, 'savedAt'>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...info, savedAt: Date.now() }));
  } catch {
    // Private browsing without storage — resume just won't survive reloads.
  }
}

export function loadResume(): ResumeInfo | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const info = JSON.parse(raw) as ResumeInfo;
    if (!info.code || !info.token || Date.now() - info.savedAt > MAX_AGE_MS) {
      clearResume();
      return null;
    }
    return info;
  } catch {
    return null;
  }
}

export function clearResume(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
