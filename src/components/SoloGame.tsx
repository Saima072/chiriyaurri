import React, { useState } from 'react';
import CountdownBar from './CountdownBar';
import FlyStayButtons from './FlyStayButtons';
import PauseCard from './PauseCard';
import PromptCard from './PromptCard';
import { useRoundRunner } from '../game/useRoundRunner';
import { useBackgroundPause } from '../game/useBackgroundPause';
import { bestStreak, totalPoints, ROUND_OPTIONS } from '../game/engine';

const SoloRun: React.FC<{ rounds: number; onDone: () => void }> = ({ rounds, onDone }) => {
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
  } = useRoundRunner(rounds);
  useBackgroundPause(phase === 'playing' && !paused, pause);

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
      <FlyStayButtons onAction={answer} disabled={phase !== 'playing' || paused} />
    </div>
  );
};

const SoloGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [rounds, setRounds] = useState<number>(ROUND_OPTIONS[1]);
  const [runId, setRunId] = useState(0); // bump to deal a fresh deck
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="panel">
        <h2>Solo Game</h2>
        <p>The caller speeds up every round. Timeout counts as staying still!</p>
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
      onDone={() => {
        setRunId((n) => n + 1);
        setStarted(false);
      }}
    />
  );
};

export default SoloGame;
