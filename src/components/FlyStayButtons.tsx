import React from 'react';
import type { Action } from '../types';

type FlyStayButtonsProps = {
  onAction: (action: Action) => void;
  disabled?: boolean;
};

const FlyStayButtons: React.FC<FlyStayButtonsProps> = ({ onAction, disabled }) => (
  <div className="fly-stay">
    <button
      className="btn-fly"
      disabled={disabled}
      onClick={() => onAction('fly')}
    >
      🕊️ Urri! (Fly)
    </button>
    <button
      className="btn-stay"
      disabled={disabled}
      onClick={() => onAction('stay')}
    >
      ✋ Nahi Urri (Stay)
    </button>
  </div>
);

export default FlyStayButtons;
