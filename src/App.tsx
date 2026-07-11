import React, { useState } from 'react';
import SoloGame from './components/SoloGame';
import TeamGame from './components/TeamGame';
import OnlineGame from './components/online/OnlineGame';
import { loadResume } from './multiplayer/resume';

type Mode = 'menu' | 'solo' | 'teams' | 'online';

const BIRDS = ['🐦', '🕊️', '🦅', '🦜', '🦋', '🪁'];

const Sky: React.FC = () => (
  <div className="sky" aria-hidden="true">
    {Array.from({ length: 10 }).map((_, i) => (
      <span
        key={i}
        className="flying-bird"
        style={{
          top: `${(i * 37 + 5) % 90}%`,
          animationDelay: `${i * 1.9}s`,
          animationDuration: `${10 + (i % 5) * 4}s`,
          fontSize: `${16 + ((i * 7) % 22)}px`,
        }}
      >
        {BIRDS[i % BIRDS.length]}
      </span>
    ))}
  </div>
);

const App: React.FC = () => {
  // A reload mid-game should land back in the room, not on the menu.
  const [mode, setMode] = useState<Mode>(() => (loadResume() ? 'online' : 'menu'));
  const backToMenu = () => setMode('menu');

  return (
    <div className="App">
      <Sky />
      <h1>Chiriya Urri 🐦</h1>
      {mode === 'menu' && (
        <div className="panel menu">
          <p className="tagline">
            The classic Pakistani street game — raise your finger only when it really flies!
          </p>
          <button className="primary" onClick={() => setMode('solo')}>
            🎯 Solo
          </button>
          <button className="primary" onClick={() => setMode('teams')}>
            👥 Teams (one device)
          </button>
          <button className="primary" onClick={() => setMode('online')}>
            🌍 Play Online
          </button>
          <div className="rules">
            <h3>How to play</h3>
            <p>
              The caller shouts “<em>Chiriya urri!</em>” — the sparrow flew! If the thing
              named can fly, press <strong>Urri</strong>. If it can’t, press{' '}
              <strong>Nahi Urri</strong> or simply stay still. The caller gets faster and
              sneakier — watch out for the shutar murgh!
            </p>
          </div>
        </div>
      )}
      {mode === 'solo' && <SoloGame onExit={backToMenu} />}
      {mode === 'teams' && <TeamGame onExit={backToMenu} />}
      {mode === 'online' && <OnlineGame onExit={backToMenu} />}
    </div>
  );
};

export default App;
