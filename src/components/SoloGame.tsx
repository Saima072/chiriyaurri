import React, { useEffect, useState } from 'react';
import CountdownBar from './CountdownBar';
import FlyStayButtons from './FlyStayButtons';
import PauseCard from './PauseCard';
import PromptCard from './PromptCard';
import { useRoundRunner } from '../game/useRoundRunner';
import { useBackgroundPause } from '../game/useBackgroundPause';
import { bestStreak, totalPoints, ROUND_OPTIONS, type Speed } from '../game/engine';
import { ads } from '../ads';

const SoloRun: React.FC<{ rounds: number; speed: Speed; onDone: () => void }> = ({
  rounds,
  speed,
  onDone,
}) => {
  const {
    total,
    round,
    entry,
    durationMs,
    phase,
    paused,
    pause,
    resume,
    outcomes,
    lastOutcome,
    answer,
  } = useRoundRunner(rounds, speed);
  useBackgroundPause(phase === 'playing' && !paused, pause);

  // Interstitials (when enabled) belong strictly between games.
  useEffect(() => {
    if (phase === 'over') ads.gameFinished();
  }, [phase]);

  if (phase === 'over') {
    const score = totalPoints(outcomes);
    const correct = outcomes.filter((o) => o.correct).length;
    return (
      <div className="panel">
        <h2>Khel Khatam!</h2>
        <p className="final-score">{score} points</p>
        <p>
          {correct}/{total} correct · best streak {bestStreak(outcomes)}
        </p>
        <button onClick={onDone}>Play again</button>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="round-meta">
        <span>
          Round {round + 1}/{total}
        </span>
        <button className="pause-btn" onClick={pause} style={{ visibility: paused ? 'hidden' : 'visible' }}>
          ⏸ Pause
        </button>
        <span>Score: {totalPoints(outcomes)}</span>
      </div>
      <CountdownBar durationMs={durationMs} resetKey={round} paused={phase !== 'playing' || paused} />
      {paused ? (
        <PauseCard>
          <button className="primary" onClick={resume}>
            ▶ Resume
          </button>
          <button onClick={onDone}>Quit</button>
        </PauseCard>
      ) : (
        <PromptCard prompt={entry.prompt} outcome={phase === 'reveal' ? lastOutcome : null} />
      )}
      <FlyStayButtons
        prompt={entry.prompt}
        onAction={answer}
        disabled={phase !== 'playing' || paused}
      />
    </div>
  );
};

const SoloGame: React.FC<{ onExit: () => void; speed?: Speed }> = ({
  onExit,
  speed = 'classic',
}) => {
  const [rounds, setRounds] = useState<number>(ROUND_OPTIONS[1]);
  const [runId, setRunId] = useState(0); // bump to deal a fresh deck
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="panel">
        <h2>{speed === 'fast' ? '⚡ Fast Game' : 'Solo Game'}</h2>
        <p>
          {speed === 'fast'
            ? 'Rapid fire — the caller starts fast and only gets faster. Reflexes only!'
            : 'The caller speeds up every round. Timeout counts as staying still!'}
        </p>
        <div className="option-row">
          {ROUND_OPTIONS.map((n) => (
            <button
              key={n}
              className={n === rounds ? 'selected' : ''}
              onClick={() => setRounds(n)}
            >
              {n} rounds
            </button>
          ))}
        </div>
        <button className="primary" onClick={() => setStarted(true)}>
          Start
        </button>
        <button className="link" onClick={onExit}>
          ← Back
        </button>
      </div>
    );
  }

  return (
    <SoloRun
      key={runId}
      rounds={rounds}
      speed={speed}
      onDone={() => {
        setRunId((n) => n + 1);
        setStarted(false);
      }}
    />
  );
};

export default SoloGame;
