import Peer, { DataConnection } from 'peerjs';
import { peerOptions } from './peerConfig';
import type { Action } from '../types';
import {
  peerIdForRoom,
  type ClientMessage,
  type HostMessage,
  type RoomView,
} from './protocol';

/** A player who joined someone else's room. Renders whatever the host says. */
export class ClientSession {
  private peer: Peer;
  private conn: DataConnection | null = null;
  private view: RoomView;
  private currentRound = -1;
  private destroyed = false;

  constructor(
    code: string,
    private playerName: string,
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
    this.peer = new Peer(peerOptions()); // random id assigned by the broker

    this.peer.on('open', () => {
      if (this.destroyed) return;
      const conn = this.peer.connect(peerIdForRoom(code), { reliable: true });
      this.conn = conn;
      conn.on('open', () => this.send({ type: 'hello', name: this.playerName }));
      conn.on('data', (data) => this.handle(data as HostMessage));
      conn.on('close', () => {
        if (this.view.phase !== 'over' && this.view.phase !== 'error') {
          this.emit({ phase: 'error', error: 'Lost connection to the host.' });
        }
      });
    });

    this.peer.on('error', (err: Error & { type?: string }) => {
      if (this.destroyed) return;
      const message =
        err.type === 'peer-unavailable'
          ? 'No room found with that code. Check the code with your host.'
          : `Connection error: ${err.type ?? err.message}`;
      this.emit({ phase: 'error', error: message });
    });
  }

  private handle(msg: HostMessage) {
    switch (msg.type) {
      case 'welcome':
        this.emit({ phase: 'lobby', selfId: msg.selfId, lobby: msg.lobby });
        break;
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
    this.peer.destroy();
  }
}
