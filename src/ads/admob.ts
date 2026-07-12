import { Capacitor } from '@capacitor/core';
import { AdMob, AdmobConsentStatus } from '@capacitor-community/admob';
import type { AdsBackend } from './types';
import {
  INTERSTITIAL_AD_UNIT,
  INTERSTITIAL_EVERY_N_GAMES,
  INTERSTITIAL_MIN_INTERVAL_MS,
} from './config';

/**
 * Native (Android/iOS) backend. GDPR-compliant order of operations, per
 * Google's UMP requirements:
 *
 *   1. iOS App Tracking Transparency prompt (must come before any ad SDK
 *      work that could touch the IDFA; no-ops on Android)
 *   2. UMP consent: request info, and show Google's consent form whenever
 *      it's required (EEA/UK users see it on first launch)
 *   3. Only if UMP says ads may be requested do we initialize and ever
 *      load an ad — consent failure means the game simply runs ad-free
 *
 * The UMP form itself is configured in the AdMob console under
 * Privacy & messaging — without that console setup, no form exists to
 * show and EEA users get no ads.
 */
export class AdMobBackend implements AdsBackend {
  private canRequestAds = false;
  private privacyOptionsNeeded = false;
  private gamesFinished = 0;
  private lastInterstitialAt = 0;

  async init(): Promise<void> {
    try {
      await AdMob.requestTrackingAuthorization();
      const consent = await AdMob.requestConsentInfo();
      if (
        consent.isConsentFormAvailable &&
        consent.status === AdmobConsentStatus.REQUIRED
      ) {
        const updated = await AdMob.showConsentForm();
        this.canRequestAds = updated.canRequestAds;
        // The plugin doesn't re-export the enum; its values are strings.
        this.privacyOptionsNeeded =
          String(updated.privacyOptionsRequirementStatus) === 'REQUIRED';
      } else {
        this.canRequestAds = consent.canRequestAds;
        this.privacyOptionsNeeded =
          String(consent.privacyOptionsRequirementStatus) === 'REQUIRED';
      }
      if (this.canRequestAds) {
        await AdMob.initialize();
      }
    } catch (err) {
      // Ads must never break the game: any failure = play ad-free.
      console.warn('AdMob init/consent failed; continuing without ads', err);
      this.canRequestAds = false;
    }
  }

  async gameFinished(): Promise<void> {
    if (!this.canRequestAds) return;
    this.gamesFinished++;
    const now = Date.now();
    if (this.gamesFinished % INTERSTITIAL_EVERY_N_GAMES !== 0) return;
    if (now - this.lastInterstitialAt < INTERSTITIAL_MIN_INTERVAL_MS) return;
    try {
      const adId =
        Capacitor.getPlatform() === 'ios'
          ? INTERSTITIAL_AD_UNIT.ios
          : INTERSTITIAL_AD_UNIT.android;
      await AdMob.prepareInterstitial({ adId });
      await AdMob.showInterstitial();
      this.lastInterstitialAt = now;
    } catch (err) {
      // No fill / load error: skip silently, never block the game.
      console.warn('Interstitial skipped', err);
    }
  }

  privacyOptionsRequired(): boolean {
    return this.privacyOptionsNeeded;
  }

  async showPrivacyOptions(): Promise<void> {
    try {
      await AdMob.showPrivacyOptionsForm();
      // Re-read status: the user may have withdrawn consent just now.
      const consent = await AdMob.requestConsentInfo();
      this.canRequestAds = consent.canRequestAds;
    } catch (err) {
      console.warn('Privacy options form failed', err);
    }
  }
}
