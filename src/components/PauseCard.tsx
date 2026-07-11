import React from 'react';

type PauseCardProps = {
  /** Extra line under the title, e.g. who paused the game. */
  message?: string;
  /** Action buttons (Resume / Quit / End game / Leave). */
  children?: React.ReactNode;
};

/** Shown INSTEAD of the prompt while paused — no free thinking time. */
const PauseCard: React.FC<PauseCardProps> = ({ message, children }) => (
  <div className="prompt-card paused">
    <div className="reveal-emoji">⏸️</div>
    <div className="prompt-call">Paused</div>
    {message && <div className="reveal-meaning">{message}</div>}
    <div className="pause-actions">{children}</div>
  </div>
);

export default PauseCard;
