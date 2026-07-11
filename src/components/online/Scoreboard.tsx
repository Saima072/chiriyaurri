import React from 'react';
import type { LobbyState, RoundResult } from '../../multiplayer/protocol';
import { teamTotals } from '../../multiplayer/protocol';

type ScoreboardProps = {
  lobby: LobbyState;
  scores: Record<string, number>;
  selfId: string;
  /** When present, show what everyone did this round. */
  result?: RoundResult;
};

const TEAM_LABELS = { A: '🐦 Team A', B: '🦅 Team B' } as const;

const Scoreboard: React.FC<ScoreboardProps> = ({ lobby, scores, selfId, result }) => {
  const players = [...lobby.players].sort(
    (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0)
  );
  const totals = lobby.teamsEnabled ? teamTotals(lobby, scores) : null;

  return (
    <div className="scoreboard">
      {totals && (
        <div className="team-totals">
          <span className="team-a">
            {TEAM_LABELS.A}: {totals.A}
          </span>
          <span className="team-b">
            {TEAM_LABELS.B}: {totals.B}
          </span>
        </div>
      )}
      <ul>
        {players.map((p) => {
          const action = result?.answers[p.id];
          const points = result?.points[p.id];
          return (
            <li key={p.id} className={p.connected ? '' : 'disconnected'}>
              <span className="player-name">
                {p.team && <span className={`badge team-${p.team.toLowerCase()}`}>{p.team}</span>}
                {p.name}
                {p.id === selfId && ' (you)'}
                {p.id === lobby.hostId && ' 👑'}
                {!p.connected && ' (left)'}
              </span>
              {result && (
                <span className={`round-action ${points !== undefined && points < 0 ? 'bad' : 'good'}`}>
                  {action === 'fly' ? '🕊️ flew' : action === 'stay' ? '✋ stayed' : '💤 froze'}
                  {points !== undefined && ` (${points > 0 ? '+' : ''}${points})`}
                </span>
              )}
              <span className="player-score">{scores[p.id] ?? 0}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Scoreboard;
