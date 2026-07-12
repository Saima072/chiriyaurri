import React, { useEffect, useRef, useState } from 'react';
import CountdownBar from '../CountdownBar';
import FlyStayButtons from '../FlyStayButtons';
import PauseCard from '../PauseCard';
import PromptCard from '../PromptCard';
import Scoreboard from './Scoreboard';
import { HostSession } from '../../multiplayer/host';
import { ClientSession } from '../../multiplayer/client';
import { teamTotals, type RoomView } from '../../multiplayer/protocol';
import {
  latestActiveRoom,
  listRooms,
  newToken,
  recordRoom,
  removeRoom,
  setRoomActive,
  type RoomRecord,
} from '../../multiplayer/history';
import { blankSnapshot, clearHostState, loadHostState } from '../../multiplayer/hostState';
import { scoreRound, ROUND_OPTIONS } from '../../game/engine';
import { ads } from '../../ads';
import type { Action } from '../../types';

type Session = HostSession | ClientSession;

const timeAgo = (t: number): string => {
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.round(mins / 60)} h ago`;
};

const OnlineGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [rooms, setRooms] = useState<RoomRecord[]>(() => listRooms());
  const [view, setView] = useState<RoomView | null>(null);
  const sessionRef = useRef<Session | null>(null);

  const rejoin = (room: RoomRecord) => {
    setName(room.name);
    setCode(room.code);
    setRoomActive(room.code, true);
    if (room.role === 'host') {
      // Revive the room with its saved game state, or re-open it empty.
      const snap = loadHostState();
      sessionRef.current = new HostSession(
        room.name,
        setView,
        snap && snap.code === room.code ? snap : blankSnapshot(room.code, room.name)
      );
    } else {
      sessionRef.current = new ClientSession(
        room.code,
        room.name,
        room.token ?? newToken(),
        setView
      );
    }
  };

  // If we were in a room before a reload, walk straight back into it —
  // as guest OR as host (the room itself is revived from its snapshot).
  useEffect(() => {
    const room = latestActiveRoom();
    if (room && !sessionRef.current) rejoin(room);
    return () => {
      sessionRef.current?.destroy();
      sessionRef.current = null;
    };
  }, []);

  // Once hosting, the room code is known — remember it for the rooms list.
  useEffect(() => {
    if (view?.isHost && view.lobby?.code) {
      const self = view.lobby.players.find((p) => p.id === view.lobby?.hostId);
      recordRoom({
        code: view.lobby.code,
        name: self?.name ?? 'Host',
        role: 'host',
        active: true,
      });
    }
  }, [view?.isHost, view?.lobby?.code, view?.lobby]);

  // A finished game is not worth resuming.
  useEffect(() => {
    if (view?.phase === 'over' && view.lobby?.code) {
      setRoomActive(view.lobby.code, false);
    }
  }, [view?.phase, view?.lobby?.code]);

  // Interstitials (when enabled) belong strictly between games.
  useEffect(() => {
    if (view?.phase === 'over') ads.gameFinished();
  }, [view?.phase]);

  const leave = () => {
    if (view?.lobby?.code) setRoomActive(view.lobby.code, false);
    if (view?.isHost) clearHostState();
    sessionRef.current?.destroy();
    sessionRef.current = null;
    setView(null);
    setRooms(listRooms());
  };

  const host = () => {
    sessionRef.current = new HostSession(name.trim() || 'Host', setView);
  };

  const join = () => {
    const roomCode = code.trim().toUpperCase();
    const playerName = name.trim() || 'Player';
    const token = newToken();
    recordRoom({ code: roomCode, name: playerName, role: 'guest', token, active: true });
    sessionRef.current = new ClientSession(roomCode, playerName, token, setView);
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
        {rooms.length > 0 && (
          <div className="recent-rooms">
            <h3>Recent rooms</h3>
            {rooms.map((room) => (
              <div className="room-row" key={room.code}>
                <span className="room-code">
                  {room.role === 'host' ? '👑' : '🎮'} {room.code}
                </span>
                <span className="room-sub">
                  {room.name} · {timeAgo(room.savedAt)}
                </span>
                <button className="room-join" onClick={() => rejoin(room)}>
                  {room.role === 'host' ? 'Re-open' : 'Rejoin'}
                </button>
                <button
                  className="link room-remove"
                  aria-label={`Forget room ${room.code}`}
                  onClick={() => {
                    removeRoom(room.code);
                    setRooms(listRooms());
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <button className="link" onClick={onExit}>
          ← Back
        </button>
      </div>
    );
  }

  if (view.phase === 'connecting' || view.phase === 'reconnecting') {
    return (
      <div className="panel">
        <h2>{view.phase === 'connecting' ? 'Connecting…' : 'Reconnecting…'}</h2>
        {view.phase === 'reconnecting' && (
          <p className="waiting-note">
            Connection hiccup — your seat and score are safe. Hang tight.
          </p>
        )}
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
  if (!view.round) {
    return (
      <div className="panel">
        <h2>Rejoining the game…</h2>
      </div>
    );
  }
  const round = view.round;
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
        {hostSession && (
          <button
            className="pause-btn"
            onClick={() => hostSession.pause()}
            style={{ visibility: view.paused ? 'hidden' : 'visible' }}
          >
            ⏸ Pause
          </button>
        )}
        <span>Room {lobby.code}</span>
      </div>
      <CountdownBar
        durationMs={round.durationMs}
        resetKey={round.index}
        paused={view.phase !== 'question' || view.answered || view.paused}
      />
      {view.paused ? (
        <PauseCard message={hostSession ? undefined : 'The host has paused the game.'}>
          {hostSession ? (
            <>
              <button className="primary" onClick={() => hostSession.resume()}>
                ▶ Resume
              </button>
              <button onClick={() => hostSession.endGame()}>End game</button>
            </>
          ) : (
            <button className="link" onClick={leave}>
              Leave room
            </button>
          )}
        </PauseCard>
      ) : (
        <PromptCard
          prompt={round.prompt}
          outcome={selfOutcome}
          hint={
            view.phase === 'question' && view.answered
              ? 'Locked in — waiting for the others…'
              : undefined
          }
        />
      )}
      {/* Always mounted: swapping these for a note made everything jump. */}
      <FlyStayButtons
        prompt={round.prompt}
        onAction={sendAnswer}
        disabled={view.phase !== 'question' || view.paused || view.answered}
      />

      <Scoreboard
        lobby={lobby}
        scores={view.scores}
        selfId={view.selfId}
        result={view.phase === 'reveal' ? view.result : undefined}
      />
      {!view.isHost && (
        <button className="link" onClick={leave}>
          Leave game
        </button>
      )}
    </div>
  );
};

export default OnlineGame;
