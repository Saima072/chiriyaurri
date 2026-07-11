import React from 'react';
import type { RoundOutcome } from '../types';

type PromptCardProps = {
  prompt: string;
  /** When set, the round is over and we show the reveal instead of the call. */
  outcome?: RoundOutcome | null;
};

const PromptCard: React.FC<PromptCardProps> = ({ prompt, outcome }) => {
  if (!outcome) {
    return (
      <div className="prompt-card">
        <div className="prompt-call">{prompt}</div>
        <div className="prompt-hint">Does it fly?</div>
      </div>
    );
  }

  const { entry, action, correct, points } = outcome;
  return (
    <div className={`prompt-card reveal ${correct ? 'good' : 'bad'}`}>
      <div className="reveal-emoji">{entry.emoji}</div>
      <div className="prompt-call">{entry.prompt}</div>
      <div className="reveal-meaning">
        {entry.meaning} — {entry.canFly ? 'it flies!' : 'it does not fly.'}
      </div>
      <div className="reveal-verdict">
        {action === null
          ? correct
            ? 'You stayed still and survived. (+0)'
            : 'Too slow — it flew away without you! (−1)'
          : correct
            ? `Shabash! +${points}`
            : 'Pakray gaye! −1'}
      </div>
      {entry.note && <div className="reveal-note">{entry.note}</div>}
    </div>
  );
};

export default PromptCard;
