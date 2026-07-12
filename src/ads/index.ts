import { Capacitor } from '@capacitor/core';
import { ADS_ENABLED } from './config';
import { NoopBackend } from './noop';
import type { AdsBackend } from './types';

// The facade the game talks to. Web always gets the no-op; native gets
// the AdMob backend only when ads are enabled — loaded dynamically so
// the plugin code never bloats the web bundle.
let backend: AdsBackend = new NoopBackend();
let initialized = false;

export const ads = {
  async init(): Promise<void> {
    if (initialized) return;
    initialized = true;
    if (ADS_ENABLED && Capacitor.isNativePlatform()) {
      const { AdMobBackend } = await import('./admob');
      backend = new AdMobBackend();
    }
    await backend.init();
  },

  /** Call from every game-over screen; the backend owns the frequency cap. */
  gameFinished(): void {
    void backend.gameFinished();
  },

  privacyOptionsRequired(): boolean {
    return backend.privacyOptionsRequired();
  },

  showPrivacyOptions(): void {
    void backend.showPrivacyOptions();
  },
};
