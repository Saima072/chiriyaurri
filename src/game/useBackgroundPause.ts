import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * On native builds, freeze a local (solo/team) round the instant the app
 * loses focus — a phone call or notification shouldn't silently cost you a
 * point via the round timer while the screen is off. No-op on the web
 * build, where there's no equivalent "the phone rang" interruption to
 * guard against and the existing multiplayer reconnect handling already
 * covers backgrounded tabs.
 */
export function useBackgroundPause(active: boolean, pause: () => void): void {
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !active) return;
    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) pause();
    });
    return () => {
      listener.then((l) => l.remove());
    };
  }, [active, pause]);
}
