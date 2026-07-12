import React from 'react';
import type { Action } from '../types';
import { urriVerb } from '../game/engine';

type FlyStayButtonsProps = {
  /** The current call — button labels echo its gendered verb (Urra/Urri). */
  prompt: string;
  onAction: (action: Action) => void;
  disabled?: boolean;
};

const FlyStayButtons: React.FC<FlyStayButtonsProps> = ({ prompt, onAction, disabled }) => {
  const verb = urriVerb(prompt);
  return (
    <div className="fly-stay">
      <button
        className="btn-fly"
        disabled={disabled}
        onClick={() => onAction('fly')}
      >
        🕊️ <span className="verb-slot">{verb}</span>! (Fly)
      </button>
      <button
        className="btn-stay"
        disabled={disabled}
        onClick={() => onAction('stay')}
      >
        ✋ Nahi <span className="verb-slot">{verb}</span> (Stay)
      </button>
    </div>
  );
};

export default FlyStayButtons;
