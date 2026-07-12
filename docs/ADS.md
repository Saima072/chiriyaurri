# Ads plan (AdMob)

Status: **plan only — nothing implemented yet.** This documents the agreed
placement rules, the platform picture, and the step-by-step integration
path so implementation is a mechanical follow-through.

## The platform answer, up front

**One integration does NOT cover web + iOS + Android. It's two systems:**

| Platform | Product | Covered by |
| --- | --- | --- |
| Android app | AdMob | One Capacitor plugin integration (shared with iOS) |
| iOS app | AdMob | Same plugin, same JS code — but its own AdMob app registration + native config |
| Website | **not AdMob** — Google AdSense (or Ad Manager) | Entirely separate product, account setup, and `<script>`/DOM integration |

What "one integration" *does* get us: the Capacitor plugin
(`@capacitor-community/admob`) exposes a single JavaScript API that drives
the native AdMob SDKs on **both** Android and iOS — the game code is
written once. But even there, the AdMob **console** requires registering
two separate apps (one per platform), each with its own App ID and its own
ad-unit IDs, and each native project needs a small config addition.

The web version cannot show AdMob ads at all; AdMob only serves mobile
apps. If the website should earn too, that's a separate Google AdSense
integration later — or the website simply stays ad-free (a fine launch
choice: it doubles as the "try before you install" funnel).

## Placement rules (agreed earlier — the game is never interrupted)

- **Never during a round or reveal.** The game is a reflex game; nothing
  may cover or move the play area mid-game. This also protects online
  rooms: an ad stealing one player's screen mid-round would desync the
  shared rhythm.
- **Interstitial** only between games: after the "Khel Khatam!" score
  screen, before returning to setup — and frequency-capped (every 2nd or
  3rd game, minimum N minutes apart), so it never feels like a toll booth.
- **Banner** only on menu/setup/lobby screens, never on the play screen.
  Reserve the banner's height in the layout (fixed slot) so it appearing
  or failing to load NEVER shifts the UI — same discipline as the
  layout-shift fixes.
- **Rewarded video (later, opt-in)**: "watch an ad to unlock a call pack"
  — monetizes only players who choose it and pairs naturally with
  regional/dialect call packs.

## Architecture: one ads facade, per-platform backends

```
src/ads/
  index.ts        // the facade the game calls; decides backend at runtime
  types.ts        // AdsBackend interface: init, showInterstitialMaybe,
                  // showBanner(screen), hideBanner, gameFinished(counter)
  admob.ts        // native backend via @capacitor-community/admob
  noop.ts         // web backend (default): does nothing
```

Game code only ever calls the facade (e.g. `ads.gameFinished()` from the
game-over screens; the facade owns the frequency cap). Backend selection
via `Capacitor.isNativePlatform()` — the web bundle ships the no-op, so
the website's behavior and bundle stay clean. If AdSense is added later it
becomes a third backend behind the same interface.

## Step-by-step

1. **Accounts** (owner: you — requires your Google account)
   - Create an [AdMob](https://admob.google.com) account.
   - Register **two apps**: "Chiriya Urri (Android)" and "Chiriya Urri
     (iOS)" → two App IDs (`ca-app-pub-…~…`).
   - Create ad units per app: 1 interstitial each, 1 banner each
     (4 ad-unit IDs total). Rewarded units later.
   - Link to the Play Console / App Store Connect listings once live
     (improves fill/eCPM).
2. **Plugin**: `npm install @capacitor-community/admob && npx cap sync`.
3. **Native config**
   - Android: `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID"
     android:value="ca-app-pub-…~…"/>` in `AndroidManifest.xml`.
   - iOS: `GADApplicationIdentifier` in `Info.plist`, plus Google's
     current `SKAdNetworkItems` list.
4. **Consent & privacy (not optional)**
   - Use AdMob's bundled **UMP consent flow** (GDPR/EEA + US states) via
     the plugin before requesting ads.
   - iOS **App Tracking Transparency**: either show the ATT prompt or
     configure non-personalized ads only; the plugin supports both.
   - Update store declarations — adding the ads SDK changes the honest
     answer from "no data collected": Play Console Data Safety and Apple
     App Privacy must both declare advertising data collection.
5. **Facade + game hooks**: implement `src/ads/`, call `ads.init()` from
   `App` on native, `ads.gameFinished()` from the three game-over
   screens, banner mount/unmount on menu/lobby screens with a reserved
   layout slot.
6. **Test** with Google's published test ad-unit IDs and test-device
   registration — never click real ads from dev builds (account ban
   risk). Verify: no banner on play screens, interstitial only after
   game over and only at the capped frequency, zero layout shift from
   banner load/fail, online rounds never interrupted.
7. **Ship** behind a config flag so ads can be disabled per build while
   testing store review.

## Explicitly deferred

- AdSense for the website (separate product; decide after mobile launch).
- Rewarded videos + call-pack unlocks (needs the pack content first).
- "Remove ads" in-app purchase (needs a billing plugin; natural follow-up
  once interstitials exist).
