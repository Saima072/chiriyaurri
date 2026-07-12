import type { Action, RoundOutcome, UrriEntry } from '../types';
import { answers } from '../data/answers';

export const ROUND_OPTIONS = [10, 15, 20] as const;

/** Two pacings: classic gives you time to think; fast is rapid-fire —
 *  the caller starts quick and only gets quicker. */
export type Speed = 'classic' | 'fast';

export const SPEEDS: Record<Speed, { first: number; last: number; revealMs: number }> = {
  classic: { first: 5000, last: 2200, revealMs: 1800 },
  fast: { first: 2600, last: 1100, revealMs: 900 },
};

/** Online games always run classic pacing (network latency needs slack). */
export const REVEAL_MS = SPEEDS.classic.revealMs;

/** The caller speeds up: round time shrinks linearly over the game. */
export function roundDuration(
  round: number,
  totalRounds: number,
  speed: Speed = 'classic'
): number {
  const { first, last } = SPEEDS[speed];
  if (totalRounds <= 1) return first;
  const t = round / (totalRounds - 1);
  return Math.round(first + (last - first) * t);
}

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Deal a game's worth of calls, no repeats within a game. */
export function buildDeck(rounds: number): UrriEntry[] {
  return shuffle(answers).slice(0, Math.min(rounds, answers.length));
}

/**
 * Urdu gender agreement, read off the call itself: muzakkar (masculine)
 * calls end in "Urra", mo'annas (feminine) calls end in "Urri". Answer
 * buttons must echo the same form — "Kawwa Urra!" is answered "Urra!".
 */
export function urriVerb(prompt: string): 'Urra' | 'Urri' {
  return prompt.trim().endsWith('Urra') ? 'Urra' : 'Urri';
}

export function totalPoints(outcomes: RoundOutcome[]): number {
  return outcomes.reduce((sum, o) => sum + o.points, 0);
}

export function bestStreak(outcomes: RoundOutcome[]): number {
  let best = 0;
  let run = 0;
  for (const o of outcomes) {
    run = o.correct ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

/**
 * Score one round. Staying put is the default posture in the street game,
 * so a timeout counts as an implicit "stay": it never earns a point, but
 * it only costs one when the thing actually flew.
 */
export function scoreRound(entry: UrriEntry, action: Action | null): RoundOutcome {
  const effective: Action = action ?? 'stay';
  const correct = (effective === 'fly') === entry.canFly;
  let points: number;
  if (!correct) points = -1;
  else if (action === null) points = 0; // survived by standing still
  else points = 1;
  return { entry, action, correct, points };
}
