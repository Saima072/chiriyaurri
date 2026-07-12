// ─── Ads configuration ──────────────────────────────────────────────
// Everything an owner must touch before shipping ads lives in this file,
// plus the AdMob App IDs in AndroidManifest.xml and Info.plist.

/**
 * Master switch. While false, the ads module never initializes the AdMob
 * SDK, never runs the consent flow, and never shows anything — on any
 * platform. Flip to true only after replacing the placeholder IDs here
 * and in both native configs with real ones from your AdMob console.
 */
export const ADS_ENABLED = false;

/**
 * OWNER ACTION: replace with your real ad unit IDs from the AdMob console.
 * These are Google's PUBLISHED TEST IDs — safe to click, they never pay.
 * Android and iOS are separate AdMob apps, so each needs its own unit.
 */
export const INTERSTITIAL_AD_UNIT = {
  android: 'ca-app-pub-3940256099942544/1033173712', // Google test id
  ios: 'ca-app-pub-3940256099942544/4411468910', // Google test id
};

/** Show an interstitial only after every Nth finished game… */
export const INTERSTITIAL_EVERY_N_GAMES = 3;
/** …and never more often than this, regardless of games played. */
export const INTERSTITIAL_MIN_INTERVAL_MS = 3 * 60 * 1000;
