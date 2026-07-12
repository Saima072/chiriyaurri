import React, { useState } from 'react';
import CountdownBar from './CountdownBar';
import FlyStayButtons from './FlyStayButtons';
import PauseCard from './PauseCard';
import PromptCard from './PromptCard';
import { useRoundRunner } from '../game/useRoundRunner';
import { useBackgroundPause } from '../game/useBackgroundPause';
import { ROUND_OPTIONS } from '../game/engine';
import type { RoundOutcome } from '../types';

// Round i belongs to team i % 2 — the device is passed around the circle.
const teamFor = (round: number) => round % 2;

const teamScores = (outcomes: RoundOutcome[]): [number, number] => {
  const scores: [number, number] = [0, 0];
  outcomes.forEach((o, i) => {
    scores[teamFor(i)] += o.points;
  });
  return scores;
};

const TeamRun: React.FC<{
  rounds: number;
  names: [string, string];
  onDone: () => void;
}> = ({ rounds, names, onDone }) => {
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
  const scores = teamScores(outcomes);

  if (phase === 'over') {
    const winner =
      scores[0] === scores[1] ? null : scores[0] > scores[1] ? names[0] : names[1];
    return (
      <div className="panel">
        <h2>Khel Khatam!</h2>
        <p className="final-score">
          {names[0]} {scores[0]} — {scores[1]} {names[1]}
        </p>
        <p>{winner ? `${winner} wins! 🏆` : 'It is a draw!'}</p>
        <button onClick={onDone}>Play again</button>
      </div>
    );
  }

  const turn = teamFor(round);
  return (
    <div className="panel">
      <div className="round-meta">
        <span>
          Round {round + 1}/{total}
        </span>
        <button className="pause-btn" onClick={pause} style={{ visibility: paused ? 'hidden' : 'visible' }}>
          ⏸ Pause
        </button>
        {/* Compact color-coded scores: full team names would overflow (and
            truncate a score) on narrow screens; the banner names the teams. */}
        <span>
          <span className="team-0-text">{scores[0]}</span>
          {' · '}
          <span className="team-1-text">{scores[1]}</span>
        </span>
      </div>
      <div className={`turn-banner team-${turn}`}>
        📣 {names[turn]} — your call! Pass the device!
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

const TeamGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [names, setNames] = useState<[string, string]>(['Team Chiriya', 'Team Baaz']);
  const [rounds, setRounds] = useState<number>(ROUND_OPTIONS[1]);
  const [runId, setRunId] = useState(0);
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="panel">
        <h2>Teams — Pass and Play</h2>
        <p>Two teams share one device and take turns, one call each.</p>
        <div className="name-inputs">
          <input
            value={names[0]}
            maxLength={20}
            onChange={(e) => setNames([e.target.value, names[1]])}
            aria-label="Team 1 name"
          />
          <span>vs</span>
          <input
            value={names[1]}
            maxLength={20}
            onChange={(e) => setNames([names[0], e.target.value])}
            aria-label="Team 2 name"
          />
        </div>
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
    <TeamRun
      key={runId}
      rounds={rounds}
      names={[names[0].trim() || 'Team 1', names[1].trim() || 'Team 2']}
      onDone={() => {
        setRunId((n) => n + 1);
        setStarted(false);
      }}
    />
  );
};

export default TeamGame;
