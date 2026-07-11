import React, { useEffect, useRef, useState } from 'react';
import CountdownBar from '../CountdownBar';
import FlyStayButtons from '../FlyStayButtons';
import PromptCard from '../PromptCard';
import Scoreboard from './Scoreboard';
import { HostSession } from '../../multiplayer/host';
import { ClientSession } from '../../multiplayer/client';
import { teamTotals, type RoomView } from '../../multiplayer/protocol';
import { scoreRound, ROUND_OPTIONS } from '../../game/engine';
import type { Action } from '../../types';

type Session = HostSession | ClientSession;

const OnlineGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [view, setView] = useState<RoomView | null>(null);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => () => sessionRef.current?.destroy(), []);

  const leave = () => {
    sessionRef.current?.destroy();
    sessionRef.current = null;
    setView(null);
  };

  const host = () => {
    sessionRef.current = new HostSession(name.trim() || 'Host', setView);
  };

  const join = () => {
    sessionRef.current = new ClientSession(code.trim(), name.trim() || 'Player', setView);
  };

  const sendAnswer = (action: Action) => sessionRef.current?.answer(action);

  // ── Entry screen ─────────────────────────────────────────────────
  if (!view) {
    return (
      <div className="panel">
        <h2>Play Online</h2>
        <p>One player hosts and shares the room code; friends join from anywhere.</p>
        <input
          placeholder="Your name"
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          aria-label="Your name"
        />
        <button className="primary" onClick={host} disabled={!name.trim()}>
          🏠 Host a room
        </button>
        <div className="join-row">
          <input
            placeholder="Room code"
            value={code}
            maxLength={5}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            aria-label="Room code"
          />
          <button onClick={join} disabled={!name.trim() || code.trim().length < 4}>
            Join
          </button>
        </div>
        <button className="link" onClick={onExit}>
          ← Back
        </button>
      </div>
    );
  }

  if (view.phase === 'connecting') {
    return (
      <div className="panel">
        <h2>Connecting…</h2>
        <button className="link" onClick={leave}>
          Cancel
        </button>
      </div>
    );
  }

  if (view.phase === 'error') {
    return (
      <div className="panel">
        <h2>Kuch garbar hai 😕</h2>
        <p>{view.error}</p>
        <button onClick={leave}>Back</button>
      </div>
    );
  }

  const lobby = view.lobby!;
  const hostSession =
    view.isHost && sessionRef.current instanceof HostSession ? sessionRef.current : null;

  // ── Lobby ────────────────────────────────────────────────────────
  if (view.phase === 'lobby') {
    return (
      <div className="panel">
        <h2>Room {lobby.code}</h2>
        <p className="room-code-hint">
          Share this code — friends pick “Play Online → Join” and type{' '}
          <strong>{lobby.code}</strong>
        </p>
        <Scoreboard lobby={lobby} scores={{}} selfId={view.selfId} />
        {hostSession ? (
          <>
            <div className="option-row">
              <button
                className={!lobby.teamsEnabled ? 'selected' : ''}
                onClick={() => hostSession.setTeamsEnabled(false)}
              >
                Free for all
              </button>
              <button
                className={lobby.teamsEnabled ? 'selected' : ''}
                onClick={() => hostSession.setTeamsEnabled(true)}
              >
                Teams
              </button>
            </div>
            <div className="option-row">
              {ROUND_OPTIONS.map((n) => (
                <button
                  key={n}
                  className={lobby.rounds === n ? 'selected' : ''}
                  onClick={() => hostSession.setRounds(n)}
                >
                  {n} rounds
                </button>
              ))}
            </div>
            <button
              className="primary"
              onClick={() => hostSession.start()}
              disabled={lobby.players.length < 2}
            >
              {lobby.players.length < 2 ? 'Waiting for players…' : 'Start game'}
            </button>
          </>
        ) : (
          <p>Waiting for the host to start…</p>
        )}
        <button className="link" onClick={leave}>
          Leave room
        </button>
      </div>
    );
  }

  // ── Game over ────────────────────────────────────────────────────
  if (view.phase === 'over') {
    let winnerLine: string;
    if (lobby.teamsEnabled) {
      const totals = teamTotals(lobby, view.scores);
      winnerLine =
        totals.A === totals.B
          ? 'It is a draw between the teams!'
          : `${totals.A > totals.B ? '🐦 Team A' : '🦅 Team B'} wins! 🏆`;
    } else {
      const top = Math.max(...lobby.players.map((p) => view.scores[p.id] ?? 0));
      const champs = lobby.players.filter((p) => (view.scores[p.id] ?? 0) === top);
      winnerLine =
        champs.length === 1
          ? `${champs[0].name} wins! 🏆`
          : `Draw between ${champs.map((p) => p.name).join(' & ')}!`;
    }
    return (
      <div className="panel">
        <h2>Khel Khatam!</h2>
        <p className="final-score">{winnerLine}</p>
        <Scoreboard lobby={lobby} scores={view.scores} selfId={view.selfId} />
        <button onClick={leave}>Back to lobby screen</button>
      </div>
    );
  }

  // ── Question / reveal ────────────────────────────────────────────
  const round = view.round!;
  const selfOutcome =
    view.phase === 'reveal' && view.result
      ? scoreRound(view.result.entry, view.result.answers[view.selfId] ?? null)
      : null;

  return (
    <div className="panel">
      <div className="round-meta">
        <span>
          Round {round.index + 1}/{round.total}
        </span>
        <span>Room {lobby.code}</span>
      </div>
      {view.phase === 'question' && (
        <CountdownBar
          durationMs={round.durationMs}
          resetKey={round.index}
          paused={view.answered}
        />
      )}
      <PromptCard prompt={round.prompt} outcome={selfOutcome} />
      {view.phase === 'question' && view.answered ? (
        <p className="waiting-note">Answer locked in — waiting for the others…</p>
      ) : (
        <FlyStayButtons onAction={sendAnswer} disabled={view.phase !== 'question'} />
      )}
      <Scoreboard
        lobby={lobby}
        scores={view.scores}
        selfId={view.selfId}
        result={view.phase === 'reveal' ? view.result : undefined}
      />
    </div>
  );
};

export default OnlineGame;
