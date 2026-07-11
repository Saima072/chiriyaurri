import React from 'react';

type CountdownBarProps = {
  durationMs: number;
  /** Change this to restart the bar (e.g. the round number). */
  resetKey: React.Key;
  paused?: boolean;
};

/** Purely visual shrinking bar; the owner of the round enforces the deadline. */
const CountdownBar: React.FC<CountdownBarProps> = ({ durationMs, resetKey, paused }) => (
  <div className="countdown">
    <div
      key={resetKey}
      className="countdown-fill"
      style={{
        animationDuration: `${durationMs}ms`,
        animationPlayState: paused ? 'paused' : 'running',
      }}
    />
  </div>
);

export default CountdownBar;
