import Peer, { DataConnection } from 'peerjs';
import { peerOptions } from './peerConfig';
import type { Action } from '../types';
import {
  peerIdForRoom,
  type ClientMessage,
  type HostMessage,
  type RoomView,
} from './protocol';

const RECONNECT_DELAY_MS = 1500;
// Generous enough to ride out a host reloading and reviving the room.
const MAX_RECONNECT_ATTEMPTS = 20;

/**
 * A player who joined someone else's room. Renders whatever the host says.
 * A dropped connection (backgrounded tab, flaky network) is not fatal: the
 * session re-dials with the same token and the host restores its seat.
 */
export class ClientSession {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private view: RoomView;
  private currentRound = -1;
  private destroyed = false;
  private everConnected = false;
  private attempts = 0;
  private retryTimer: number | undefined;

  constructor(
    private code: string,
    private playerName: string,
    private token: string,
    private onView: (view: RoomView) => void
  ) {
    this.view = {
      phase: 'connecting',
      selfId: '',
      isHost: false,
      lobby: null,
      scores: {},
      answered: false,
    };
    this.onView(this.view);
    this.dial();
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  /** Coming back to the tab retries immediately instead of waiting out the backoff. */
  private onVisibility = () => {
    if (document.visibilityState === 'visible' && this.view.phase === 'reconnecting') {
      window.clearTimeout(this.retryTimer);
      this.attempts = 0;
      this.dial();
    }
  };

  private dial() {
    if (this.destroyed) return;
    this.peer?.destroy();
    const peer = new Peer(peerOptions());
    this.peer = peer;

    peer.on('open', () => {
      if (this.destroyed || peer !== this.peer) return;
      const conn = peer.connect(peerIdForRoom(this.code), { reliable: true });
      this.conn = conn;
      conn.on('open', () =>
        this.send({ type: 'hello', name: this.playerName, token: this.token })
      );
      conn.on('data', (data) => this.handle(data as HostMessage));
      conn.on('close', () => this.scheduleRetry());
      conn.on('error', () => this.scheduleRetry());
    });

    // Broker socket dropped (common for backgrounded tabs) — get it back.
    peer.on('disconnected', () => {
      if (!this.destroyed && peer === this.peer) peer.reconnect();
    });

    peer.on('error', (err: Error & { type?: string }) => {
      if (this.destroyed || peer !== this.peer) return;
      if (err.type === 'peer-unavailable' && !this.everConnected) {
        // First contact failed: the code is wrong or the room is gone.
        this.emit({
          phase: 'error',
          error: 'No room found with that code. Check the code with your host.',
        });
        return;
      }
      this.scheduleRetry();
    });
  }

  private scheduleRetry() {
    if (this.destroyed) return;
    if (this.view.phase === 'over' || this.view.phase === 'error') return;
    this.attempts++;
    if (this.attempts > MAX_RECONNECT_ATTEMPTS) {
      this.emit({
        phase: 'error',
        error: 'Could not reach the room. The host may have closed it.',
      });
      return;
    }
    this.emit({ phase: 'reconnecting' });
    window.clearTimeout(this.retryTimer);
    this.retryTimer = window.setTimeout(() => this.dial(), RECONNECT_DELAY_MS);
  }

  private handle(msg: HostMessage) {
    switch (msg.type) {
      case 'welcome':
        this.everConnected = true;
        this.attempts = 0;
        this.emit({ phase: 'lobby', selfId: msg.selfId, lobby: msg.lobby });
        break;
      case 'sync': {
        this.everConnected = true;
        this.attempts = 0;
        if (msg.round) this.currentRound = msg.round.index;
        this.emit({
          phase: msg.phase,
          selfId: msg.selfId,
          lobby: msg.lobby,
          round: msg.round ?? this.view.round,
          result: msg.result,
          scores: msg.scores,
          answered: msg.answered,
        });
        break;
      }
      case 'lobby':
        this.emit({ lobby: msg.lobby });
        break;
      case 'round':
        this.currentRound = msg.index;
        this.emit({
          phase: 'question',
          round: {
            index: msg.index,
            total: msg.total,
            prompt: msg.prompt,
            durationMs: msg.durationMs,
          },
          result: undefined,
          answered: false,
        });
        break;
      case 'result':
        this.emit({ phase: 'reveal', result: msg.result, scores: msg.scores });
        break;
      case 'gameover':
        this.emit({ phase: 'over', scores: msg.scores });
        break;
      case 'rejected':
        this.emit({ phase: 'error', error: msg.reason });
        break;
    }
  }

  answer(action: Action) {
    if (this.view.phase !== 'question' || this.view.answered) return;
    this.send({ type: 'answer', index: this.currentRound, action });
    this.emit({ answered: true });
  }

  private send(msg: ClientMessage) {
    if (this.conn?.open) this.conn.send(msg);
  }

  private emit(patch: Partial<RoomView>) {
    this.view = { ...this.view, ...patch };
    this.onView(this.view);
  }

  destroy() {
    this.destroyed = true;
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.clearTimeout(this.retryTimer);
    this.peer?.destroy();
  }
}
