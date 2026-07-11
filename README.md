# Chiriya Urri 🐦

A web version of **Chiriya Urri** (چڑیا اڑی — "the sparrow flew"), the classic
childhood game played in streets, classrooms, and drawing rooms across Pakistan.

## The original game

Everyone sits in a circle with a finger on the ground (or a table). The caller
chants "*Chiriya urri!*" — and everyone must raise their finger, because a
sparrow flies. Then, faster and faster: "*Kawwa urra! Titli urri! ...Billi
urri!*" — and whoever raises their finger for the cat is out, to a round of
laughter. The caller's job is to build a rhythm of flying things and then
slip in something that can't fly. Legendary trick calls include the
*shutar murgh* (ostrich — a bird that can't fly!), the *mor* (peacocks
actually can fly), and the two-faced *jahaz* (the hawai one flies, the pani
one floats).

## This version

- **85 calls** in Roman Urdu with correct gender grammar (*Urri*/*Urra*),
  meanings, and explanatory notes on the classic disputed calls.
- **Solo mode** — the caller speeds up every round, just like real life.
  Timing out counts as staying still: it never earns a point, and it costs
  one only if the thing actually flew.
- **Teams (pass and play)** — two teams share one device and alternate calls.
- **Play Online 🌍** — one player hosts a room and gets a 5-letter code;
  friends anywhere on the internet join with it. Free-for-all or two teams,
  synced rounds, live scoreboard. The host's browser is the authoritative
  game server; peers talk directly over WebRTC ([PeerJS](https://peerjs.com)),
  brokered through the free public PeerJS cloud, so there is no server to
  deploy.

## Run it

```bash
npm install
npm run dev
```

Build with `npm run build`, lint with `npm run lint`.

### Self-hosting the signalling server (optional)

Online rooms use the public PeerJS broker by default. To use your own
[PeerServer](https://github.com/peers/peerjs-server), set these at build time:

```bash
VITE_PEER_HOST=peers.example.com VITE_PEER_PORT=443 \
VITE_PEER_PATH=/peer VITE_PEER_SECURE=true npm run build
```

## How the code is laid out

| Path | What it is |
| --- | --- |
| `src/data/answers.ts` | The call pool (add your own gali's calls here!) |
| `src/game/engine.ts` | Pure rules: deck dealing, shrinking timers, scoring |
| `src/game/useRoundRunner.ts` | React hook driving local (solo/team) games |
| `src/multiplayer/` | Room protocol, authoritative host session, client session |
| `src/components/` | UI: menu, solo, teams, online lobby/game, scoreboard |
| `docs/DESIGN.md` | Design decisions and reasoning behind all of the above |
