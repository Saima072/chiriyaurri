# Design notes — how this version came together

This documents the reasoning behind the rebuild, decision by decision.

## What was here before

A single `Game` component: show a random prompt from a list of 15, two
buttons (whose props were confusingly named `onCorrect`/`onIncorrect` but
actually meant fly/stay), score ±1, repeat forever. No timer, no rounds, no
end state, single player only.

## Researching the real game

Chiriya Urri is a reflex-and-trickery game. Three properties define it:

1. **Staying still is the default.** You only act when the thing flies.
2. **The caller speeds up** to break your rhythm.
3. **The fun is in the trick calls** — ostrich, peacock, chicken, cloud,
   "jahaz" — and in the argument that follows.

Every design decision below traces back to one of these.

## Data model (`src/data/answers.ts`)

- Replaced `correctAction: 'fly' | 'stay'` with `canFly: boolean` — the data
  should state a fact about the world, not a UI instruction.
- Grew the pool from 15 to 85 entries with correct Urdu gender agreement
  (feminine → *Urri*, masculine → *Urra*).
- Each entry has a `meaning` and `emoji` shown **only in the reveal** —
  showing 🐧 alongside "Penguin Urra" would spoil the answer.
- Disputed calls carry a `note` (e.g. peacocks really do fly; gliding
  squirrels don't) so a "gotcha" teaches instead of frustrating. Where a
  call is genuinely contested in real play (murghi, badal) we pick a house
  rule and say so explicitly in the note.

## Rules engine (`src/game/engine.ts`)

- **Timeout = implicit "stay"** (property 1). Scoring:
  - explicit correct answer: **+1**
  - any wrong answer, including freezing when it flew: **−1**
  - surviving a non-flyer by simply not answering: **0** — in the street you
    don't earn anything for sitting still, you just don't lose.
- **Round timer shrinks** linearly from 5s to 2.2s over the game
  (property 2).
- Deck is a shuffle of the pool with no repeats within a game.
- Everything here is pure functions so the same rules drive solo, team, and
  online play identically.

## Local modes

- `useRoundRunner` — a hook that owns the question→reveal→next loop with
  timeouts. A ref guards against double-answering (also protects against
  React StrictMode double-invoking updaters).
- **Teams on one device**: round *i* belongs to team *i mod 2* — exactly how
  turns pass around a circle. No extra state machine needed.

## Online multiplayer (`src/multiplayer/`)

**Why PeerJS/WebRTC instead of a game server:** the repo is a static Vite
site with nowhere to host a backend. PeerJS brokers WebRTC data channels
through its free public cloud, so the game works from a static host (GitHub
Pages, Netlify...) with zero deployment. A `VITE_PEER_*` build-time override
exists for self-hosting a PeerServer.

**Host-authoritative:** the host's browser owns the deck, deadlines, and
scores. Clients only ever render what the host broadcasts, so a client
can't cheat by fiddling with local state, and clock skew doesn't matter —
the host adds a ~700ms network grace period past the visible countdown.

**Room codes:** the host registers PeerJS id `chiriya-urri-<CODE>` where
CODE is 5 characters from an alphabet without lookalikes (no 0/O, 1/I/L) —
codes get read out loud over calls. Collisions on the broker surface as
`unavailable-id` and the host silently rolls a new code.

**Protocol** (`protocol.ts`): `hello`/`answer` upstream; `welcome`, `lobby`,
`round`, `result`, `gameover`, `rejected` downstream. Both `HostSession` and
`ClientSession` emit the same `RoomView` shape, so one React component
renders both sides of the room.

**Edge cases handled:**
- Rounds end early once every connected player has answered.
- Timed-out players are scored as implicit "stay" — same rule as solo.
- Mid-game joins are rejected politely; lobby joins after a disconnect
  reuse the seat.
- A player closing their tab often never fires the PeerJS `close` event, so
  `iceStateChanged` (failed/closed/disconnected) also drops them; their
  score stays on the board flagged "(left)", and the game continues.
- Teams auto-assign alternately as players arrive; free-for-all is one click.

## Verification

Playwright smoke tests (kept out of the repo; run against `vite preview`)
exercised: solo correct/timeout/progression paths, the teams setup screen,
and a full two-browser online game against a local PeerServer — room
creation, join by code, lobby sync, team badges, synced round, early reveal,
per-player scoring, and mid-game disconnect. The public-broker path can't be
reached from the CI sandbox (proxy blocks WebSocket tunnels), which is also
why the smoke test uses a local PeerServer.

## Ideas for later

- Elimination mode (three strikes and you're out — closest to the street rules).
- Let players submit their own calls to the room's deck in the lobby.
- Sound effects and Urdu script (نستعلیق) rendering alongside Roman Urdu.
- A tiny relay fallback (TURN) for networks where WebRTC fails.
