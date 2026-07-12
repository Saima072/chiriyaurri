import Peer, { DataConnection } from 'peerjs';
import { peerOptions } from './peerConfig';
import type { Action, UrriEntry } from '../types';
import { buildDeck, roundDuration, scoreRound, REVEAL_MS } from '../game/engine';
import { answers } from '../data/answers';
import { clearHostState, saveHostState, type HostSnapshot } from './hostState';
import {
  generateRoomCode,
  peerIdForRoom,
  sanitizeToken,
  type ClientMessage,
  type HostMessage,
  type LobbyState,
  type PlayerInfo,
  type RoomView,
  type RoundResult,
} from './protocol';

/** Extra time on top of the visible countdown to absorb network latency. */
const NETWORK_GRACE_MS = 700;
/** Pause between the reveal and the next call. */
const BETWEEN_ROUNDS_MS = 600;
const MAX_CODE_RETRIES = 3;
/** Reviving a room retries the SAME code — the broker needs a moment to free it. */
const REVIVE_RETRY_DELAY_MS = 1500;
const MAX_REVIVE_RETRIES = 4;
/** Hard cap so a stranger with the code can't flood the lobby with fake
 *  players and exhaust the host's memory and everyone's UI. */
const MAX_PLAYERS = 12;

function deckFromIds(ids: string[]): UrriEntry[] {
  const byId = new Map(answers.map((e) => [e.id, e]));
  return ids.map((id) => byId.get(id)).filter((e): e is UrriEntry => Boolean(e));
}

/**
 * The authoritative side of an online room. The host's browser owns the
 * deck, the deadlines, and the scores; clients only see broadcasts.
 */
export class HostSession {
  private peer: Peer | null = null;
  private connections = new Map<string, DataConnection>();
  private players: PlayerInfo[] = [];
  private code = '';
  private selfId = '';
  private teamsEnabled = false;
  private rounds = 15;
  private started = false;

  private deck: UrriEntry[] = [];
  private roundIndex = -1;
  /** Where a revival should resume: bumped past a round once its points are banked. */
  private resumeRoundIndex = -1;
  private roundAnswers = new Map<string, Action>();
  private roundDeadline = 0;
  private lastResult: RoundResult | undefined;
  private scores: Record<string, number> = {};
  private view: RoomView;
  private timer: number | undefined;
  // The armed timer is pausable: kind + callback + deadline let resume()
  // re-arm exactly what was interrupted, with only the remaining time.
  private timerKind: 'question' | 'advance' | null = null;
  private timerFn: (() => void) | null = null;
  private timerDeadline = 0;
  private paused = false;
  private pausedRemaining = 0;
  private codeRetries = 0;
  private destroyed = false;

  constructor(
    private hostName: string,
    private onView: (view: RoomView) => void,
    private revival?: HostSnapshot
  ) {
    this.view = {
      phase: 'connecting',
      selfId: '',
      isHost: true,
      lobby: null,
      scores: {},
      answered: false,
      paused: false,
    };
    this.openPeer();
  }

  private armTimer(kind: 'question' | 'advance', delayMs: number, fn: () => void) {
    window.clearTimeout(this.timer);
    this.timerKind = kind;
    this.timerFn = fn;
    this.timerDeadline = Date.now() + delayMs;
    this.timer = window.setTimeout(() => {
      this.timerKind = null;
      fn();
    }, delayMs);
  }

  private openPeer() {
    this.peer?.destroy();
    this.code = this.revival ? this.revival.code : generateRoomCode();
    const peer = new Peer(peerIdForRoom(this.code), peerOptions());
    this.peer = peer;

    peer.on('open', (id) => {
      if (this.destroyed) return;
      this.selfId = id;
      if (this.revival) {
        this.restoreFromSnapshot(this.revival, id);
      } else {
        this.players = [{ id, name: this.hostName, team: null, connected: true }];
        this.emit({ phase: 'lobby', selfId: id, lobby: this.lobbyState() });
        this.saveSnapshot();
      }
    });

    peer.on('connection', (conn) => this.acceptConnection(conn));

    // Keep the room joinable if the broker socket drops (e.g. host tab
    // was backgrounded); live game connections don't need the broker.
    peer.on('disconnected', () => {
      if (!this.destroyed && peer === this.peer) peer.reconnect();
    });

    peer.on('error', (err: Error & { type?: string }) => {
      if (this.destroyed) return;
      if (err.type === 'unavailable-id') {
        if (this.revival && this.codeRetries < MAX_REVIVE_RETRIES) {
          // Our own pre-reload registration usually clears within seconds.
          this.codeRetries++;
          window.setTimeout(() => this.openPeer(), REVIVE_RETRY_DELAY_MS);
          return;
        }
        if (!this.revival && this.codeRetries < MAX_CODE_RETRIES) {
          // Someone else holds this room code on the broker — roll a new one.
          this.codeRetries++;
          this.openPeer();
          return;
        }
      }
      this.emit({ phase: 'error', error: `Connection error: ${err.type ?? err.message}` });
    });
  }

  /** Rebuild the room a reloaded host browser left behind. */
  private restoreFromSnapshot(snap: HostSnapshot, selfId: string) {
    this.teamsEnabled = snap.teamsEnabled;
    this.rounds = snap.rounds;
    this.deck = deckFromIds(snap.deckIds);
    this.scores = { ...snap.scores };
    // Guests are "away" until their reconnect loops find the revived room.
    this.players = snap.players.map((p) => ({ ...p, connected: p.id === selfId }));
    if (!this.players.some((p) => p.id === selfId)) {
      this.players.unshift({ id: selfId, name: this.hostName, team: null, connected: true });
    }
    this.started = snap.started && this.deck.length > 0;
    this.emit({ phase: 'lobby', selfId, lobby: this.lobbyState(), scores: { ...this.scores } });
    if (this.started) {
      if (snap.roundIndex >= this.deck.length) {
        // Reloaded during the final reveal: the game is over.
        this.roundIndex = this.deck.length - 1;
        this.broadcast({ type: 'gameover', scores: { ...this.scores } });
        this.emit({ phase: 'over' });
        clearHostState();
      } else {
        // Replay the interrupted round; its points were never counted.
        this.startRound(Math.max(0, snap.roundIndex));
      }
    } else {
      this.saveSnapshot();
    }
  }

  private saveSnapshot() {
    saveHostState({
      code: this.code,
      hostName: this.hostName,
      teamsEnabled: this.teamsEnabled,
      rounds: this.rounds,
      started: this.started,
      deckIds: this.deck.map((e) => e.id),
      roundIndex: this.resumeRoundIndex,
      scores: { ...this.scores },
      players: this.players.map(({ id, name, team }) => ({ id, name, team })),
    });
  }

  private acceptConnection(conn: DataConnection) {
    // Players are keyed by the stable token they present in `hello`, not by
    // the PeerJS connection id — that's what lets a reconnect reclaim a seat.
    let playerId: string | null = null;

    conn.on('data', (data) => {
      const msg = data as ClientMessage;
      if (msg?.type === 'hello') {
        const requested = sanitizeToken(String(msg.token ?? '')) || conn.peer;
        const name = String(msg.name).slice(0, 20) || 'Player';
        const existing = this.players.find((p) => p.id === requested);
        if (!existing && this.started) {
          this.sendTo(conn, { type: 'rejected', reason: 'The game has already started.' });
          setTimeout(() => conn.close(), 500);
          return;
        }
        // Rejoins reclaim their seat even in a full room; only NEW seats count.
        if (!existing && this.players.length >= MAX_PLAYERS) {
          this.sendTo(conn, { type: 'rejected', reason: 'This room is full.' });
          setTimeout(() => conn.close(), 500);
          return;
        }
        playerId = requested;
        const previous = this.connections.get(requested);
        this.connections.set(requested, conn);
        if (previous && previous !== conn) previous.close();
        if (existing) {
          // Returning player: same seat, same score.
          this.players = this.players.map((p) =>
            p.id === requested ? { ...p, name, connected: true } : p
          );
        } else {
          this.players = [
            ...this.players,
            { id: requested, name, team: null, connected: true },
          ];
          this.reassignTeams();
        }
        this.sendTo(conn, { type: 'welcome', selfId: requested, lobby: this.lobbyState() });
        if (this.started) this.sendSync(conn, requested);
        this.broadcastLobby();
      } else if (msg?.type === 'answer' && playerId) {
        this.recordAnswer(playerId, msg.index, msg.action);
      }
    });

    conn.on('close', () => {
      if (playerId && this.connections.get(playerId) === conn) {
        this.dropPlayer(playerId);
      }
    });
    // ICE sees network trouble before 'close' does — but 'disconnected' is
    // often transient (backgrounded tab), so it only flags the player away.
    conn.on('iceStateChanged', (state) => {
      if (!playerId || this.connections.get(playerId) !== conn) return;
      if (state === 'failed' || state === 'closed') {
        this.dropPlayer(playerId);
      } else if (state === 'disconnected') {
        this.setPresence(playerId, false);
      } else if (state === 'connected' || state === 'completed') {
        this.setPresence(playerId, true);
      }
    });
  }

  private setPresence(playerId: string, connected: boolean) {
    if (!this.connections.has(playerId)) return;
    const player = this.players.find((p) => p.id === playerId);
    if (!player || player.connected === connected) return;
    this.players = this.players.map((p) =>
      p.id === playerId ? { ...p, connected } : p
    );
    this.broadcastLobby();
    if (!connected) this.maybeFinishEarly();
  }

  private dropPlayer(playerId: string) {
    if (!this.connections.delete(playerId)) return;
    if (this.started) {
      // Keep their score on the board and their seat free to reclaim.
      this.players = this.players.map((p) =>
        p.id === playerId ? { ...p, connected: false } : p
      );
    } else {
      this.players = this.players.filter((p) => p.id !== playerId);
      this.reassignTeams();
    }
    this.broadcastLobby();
    this.maybeFinishEarly();
  }

  /** Bring a (re)joining player up to the exact current game position. */
  private sendSync(conn: DataConnection, playerId: string) {
    const phase =
      this.view.phase === 'question' || this.view.phase === 'reveal' || this.view.phase === 'over'
        ? this.view.phase
        : 'lobby';
    const round =
      this.started && this.roundIndex >= 0 && this.roundIndex < this.deck.length
        ? {
            index: this.roundIndex,
            total: this.deck.length,
            prompt: this.deck[this.roundIndex].prompt,
            durationMs:
              phase === 'question'
                ? Math.max(
                    600,
                    this.paused
                      ? this.pausedRemaining - NETWORK_GRACE_MS
                      : this.roundDeadline - Date.now()
                  )
                : 0,
          }
        : undefined;
    this.sendTo(conn, {
      type: 'sync',
      selfId: playerId,
      lobby: this.lobbyState(),
      phase,
      round,
      result: phase === 'reveal' ? this.lastResult : undefined,
      scores: { ...this.scores },
      answered: this.roundAnswers.has(playerId),
      paused: this.paused,
    });
  }

  // ── Lobby controls (host UI) ─────────────────────────────────────
  setTeamsEnabled(enabled: boolean) {
    this.teamsEnabled = enabled;
    this.reassignTeams();
    this.broadcastLobby();
  }

  setRounds(rounds: number) {
    this.rounds = rounds;
    this.broadcastLobby();
  }

  private reassignTeams() {
    this.players = this.players.map((p, i) => ({
      ...p,
      team: this.teamsEnabled ? (i % 2 === 0 ? 'A' : 'B') : null,
    }));
  }

  // ── Game loop ────────────────────────────────────────────────────
  start() {
    if (this.started || this.players.length === 0) return;
    this.started = true;
    this.deck = buildDeck(this.rounds);
    this.scores = Object.fromEntries(this.players.map((p) => [p.id, 0]));
    this.startRound(0);
  }

  private startRound(index: number) {
    this.roundIndex = index;
    this.resumeRoundIndex = index;
    this.roundAnswers.clear();
    const durationMs = roundDuration(index, this.deck.length);
    this.roundDeadline = Date.now() + durationMs;
    const msg: HostMessage = {
      type: 'round',
      index,
      total: this.deck.length,
      prompt: this.deck[index].prompt,
      durationMs,
    };
    this.broadcast(msg);
    this.emit({
      phase: 'question',
      round: { index, total: this.deck.length, prompt: this.deck[index].prompt, durationMs },
      result: undefined,
      answered: false,
      paused: false,
    });
    this.armTimer('question', durationMs + NETWORK_GRACE_MS, () => this.finishRound());
    this.saveSnapshot();
  }

  /** The host plays too — answers go through the same path as everyone's. */
  answer(action: Action) {
    if (this.paused) return;
    this.recordAnswer(this.selfId, this.roundIndex, action);
    this.emit({ answered: true });
  }

  /** Freeze the clock for everyone; only the host can do this. */
  pause() {
    if (!this.started || this.paused || !this.timerKind) return;
    this.paused = true;
    window.clearTimeout(this.timer);
    this.pausedRemaining = Math.max(0, this.timerDeadline - Date.now());
    this.broadcast({ type: 'pause' });
    this.emit({ paused: true });
  }

  resume() {
    if (!this.paused || !this.timerKind || !this.timerFn) return;
    this.paused = false;
    if (this.timerKind === 'question') {
      this.roundDeadline = Date.now() + Math.max(0, this.pausedRemaining - NETWORK_GRACE_MS);
    }
    this.armTimer(this.timerKind, this.pausedRemaining, this.timerFn);
    this.broadcast({ type: 'resume' });
    this.emit({ paused: false });
  }

  /** Stop early: current scores become final for everyone. */
  endGame() {
    if (!this.started || this.view.phase === 'over') return;
    window.clearTimeout(this.timer);
    this.timerKind = null;
    this.paused = false;
    this.broadcast({ type: 'gameover', scores: { ...this.scores } });
    this.emit({ phase: 'over', paused: false });
    clearHostState();
  }

  private recordAnswer(playerId: string, index: number, action: Action) {
    if (this.paused) return;
    if (index !== this.roundIndex || this.view.phase !== 'question') return;
    if (this.roundAnswers.has(playerId)) return;
    this.roundAnswers.set(playerId, action);
    this.maybeFinishEarly();
  }

  private maybeFinishEarly() {
    if (this.paused) return;
    if (this.view.phase !== 'question' || !this.started) return;
    const active = this.players.filter((p) => p.connected);
    if (active.length > 0 && active.every((p) => this.roundAnswers.has(p.id))) {
      this.finishRound();
    }
  }

  private finishRound() {
    if (this.view.phase !== 'question') return;
    window.clearTimeout(this.timer);
    const entry = this.deck[this.roundIndex];
    const answers: Record<string, Action | null> = {};
    const points: Record<string, number> = {};
    for (const p of this.players) {
      const action = this.roundAnswers.get(p.id) ?? null;
      const outcome = scoreRound(entry, action);
      answers[p.id] = action;
      points[p.id] = outcome.points;
      this.scores[p.id] = (this.scores[p.id] ?? 0) + outcome.points;
    }
    const result = { entry, answers, points };
    this.lastResult = result;
    this.broadcast({
      type: 'result',
      index: this.roundIndex,
      result,
      scores: { ...this.scores },
    });
    this.emit({ phase: 'reveal', result, scores: { ...this.scores } });

    const isLast = this.roundIndex + 1 >= this.deck.length;
    // This round's points are banked: a revival must not replay it.
    this.resumeRoundIndex = this.roundIndex + 1;
    this.saveSnapshot();
    this.armTimer('advance', REVEAL_MS + BETWEEN_ROUNDS_MS, () => {
      if (isLast) {
        this.broadcast({ type: 'gameover', scores: { ...this.scores } });
        this.emit({ phase: 'over' });
        clearHostState();
      } else {
        this.startRound(this.roundIndex + 1);
      }
    });
  }

  // ── Plumbing ─────────────────────────────────────────────────────
  private lobbyState(): LobbyState {
    return {
      code: this.code,
      hostId: this.selfId,
      players: [...this.players],
      teamsEnabled: this.teamsEnabled,
      rounds: this.rounds,
    };
  }

  private broadcastLobby() {
    this.broadcast({ type: 'lobby', lobby: this.lobbyState() });
    this.emit({ lobby: this.lobbyState() });
    this.saveSnapshot();
  }

  private sendTo(conn: DataConnection, msg: HostMessage) {
    if (conn.open) conn.send(msg);
  }

  private broadcast(msg: HostMessage) {
    for (const conn of this.connections.values()) this.sendTo(conn, msg);
  }

  private emit(patch: Partial<RoomView>) {
    this.view = { ...this.view, ...patch };
    if (!this.view.lobby && this.view.phase !== 'connecting' && this.view.phase !== 'error') {
      this.view.lobby = this.lobbyState();
    }
    this.onView(this.view);
  }

  destroy() {
    this.destroyed = true;
    window.clearTimeout(this.timer);
    this.peer?.destroy();
  }
}
