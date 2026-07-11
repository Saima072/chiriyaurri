// Shared types for the Chiriya Urri game.

/** What a player can do when a call is made. Staying put is the default
 *  in the traditional game — you only raise your finger when it flies. */
export type Action = 'fly' | 'stay';

export type UrriEntry = {
  /** Stable identifier, used to reference entries in multiplayer messages. */
  id: string;
  /** The call in Roman Urdu, e.g. "Chiriya Urri". */
  prompt: string;
  /** English meaning of the thing being called. */
  meaning: string;
  /** Shown only in the reveal — showing it with the prompt would spoil the answer. */
  emoji: string;
  canFly: boolean;
  /** Classic trick call the caller uses to catch people out. */
  trick?: boolean;
  /** Explanation shown in the reveal, mostly for disputed calls. */
  note?: string;
};

export type RoundOutcome = {
  entry: UrriEntry;
  action: Action | null; // null = ran out of time
  correct: boolean;
  points: number;
};

export type TeamId = 'A' | 'B';
