import React, { useEffect, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import SoloGame from './components/SoloGame';
import TeamGame from './components/TeamGame';
import OnlineGame from './components/online/OnlineGame';
import { latestActiveRoom } from './multiplayer/history';
import { ads } from './ads';

type Mode = 'menu' | 'solo' | 'teams' | 'online';

const BIRDS = ['🐦', '🕊️', '🦅', '🦜', '🦋', '🪁'];

const Sky: React.FC = () => (
  <div className="sky" aria-hidden="true">
    {/* Slow clouds; negative delays scatter them mid-sky from the start. */}
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={`cloud-${i}`}
        className="cloud"
        style={{
          top: `${6 + i * 13}%`,
          width: `${110 + (i % 3) * 60}px`,
          height: `${26 + (i % 3) * 12}px`,
          animationDelay: `${-i * 27}s`,
          animationDuration: `${90 + i * 20}s`,
        }}
      />
    ))}
    {Array.from({ length: 6 }).map((_, i) => (
      <span
        key={`bird-${i}`}
        className="flying-bird"
        style={{
          top: `${(i * 37 + 5) % 90}%`,
          animationDelay: `${i * 3.1}s`,
          animationDuration: `${18 + (i % 5) * 6}s`,
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
  const [mode, setMode] = useState<Mode>(() => (latestActiveRoom() ? 'online' : 'menu'));
  const backToMenu = () => setMode('menu');

  // Consent (UMP/ATT) runs before any ad could ever load; a no-op on the
  // web and whenever ADS_ENABLED is false. See src/ads/ and docs/ADS.md.
  useEffect(() => {
    void ads.init();
  }, []);

  // Android's hardware/gesture back button: step back to the menu first,
  // only exit the app from there — otherwise it would quit mid-game.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = CapacitorApp.addListener('backButton', () => {
      setMode((current) => {
        if (current === 'menu') {
          CapacitorApp.exitApp();
          return current;
        }
        return 'menu';
      });
    });
    return () => {
      listener.then((l) => l.remove());
    };
  }, []);

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
              named can fly, press <strong>Urri!</strong> (or <strong>Urra!</strong> for
              muzakkar words — the buttons match the call). If it can’t, press{' '}
              <strong>Nahi Urri/Urra</strong> or simply stay still. The caller gets faster
              and sneakier — watch out for the shutar murgh!
            </p>
          </div>
          <div className="privacy-links">
            <a href="./privacy.html" target="_blank" rel="noreferrer">
              Privacy Policy
            </a>
            {ads.privacyOptionsRequired() && (
              <button className="link" onClick={() => ads.showPrivacyOptions()}>
                Privacy options
              </button>
            )}
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
