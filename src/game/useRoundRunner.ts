import { useCallback, useEffect, useRef, useState } from 'react';
import type { Action, RoundOutcome } from '../types';
import { buildDeck, roundDuration, scoreRound, REVEAL_MS } from './engine';

export type RunnerPhase = 'playing' | 'reveal' | 'over';

/**
 * Drives a local game: shows each call for a shrinking time window,
 * scores the answer (timeout = implicit "stay"), shows a reveal,
 * then moves on until the deck runs out.
 */
export function useRoundRunner(totalRounds: number) {
  const [deck] = useState(() => buildDeck(totalRounds));
  const total = deck.length;
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<RunnerPhase>('playing');
  const [outcomes, setOutcomes] = useState<RoundOutcome[]>([]);
  const answered = useRef(false);

  const entry = deck[Math.min(round, total - 1)];
  const durationMs = roundDuration(round, total);

  useEffect(() => {
    answered.current = false;
  }, [round]);

  const answer = useCallback(
    (action: Action | null) => {
      if (answered.current) return;
      answered.current = true;
      setOutcomes((prev) => [...prev, scoreRound(entry, action)]);
      setPhase('reveal');
    },
    [entry]
  );

  // The caller's window: run out of time and you implicitly stayed.
  useEffect(() => {
    if (phase !== 'playing') return;
    const t = window.setTimeout(() => answer(null), durationMs);
    return () => window.clearTimeout(t);
  }, [phase, round, durationMs, answer]);

  // Brief reveal, then the next call (or the end of the game).
  useEffect(() => {
    if (phase !== 'reveal') return;
    const t = window.setTimeout(() => {
      if (round + 1 >= total) {
        setPhase('over');
      } else {
        setRound((r) => r + 1);
        setPhase('playing');
      }
    }, REVEAL_MS);
    return () => window.clearTimeout(t);
  }, [phase, round, total]);

  return {
    total,
    round,
    entry,
    durationMs,
    phase,
    outcomes,
    lastOutcome: outcomes[outcomes.length - 1],
    answer,
  };
}
