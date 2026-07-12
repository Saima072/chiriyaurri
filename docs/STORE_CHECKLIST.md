# Owner checklist — things ONLY YOU can do before release

Everything code-side is done: the consent flow (GDPR/UMP + iOS ATT) is
implemented, ads are wired but **disabled** (`ADS_ENABLED = false`), the
privacy policy page ships with the app, and the native configs carry
Google's *sample* IDs as placeholders. The items below need your
accounts, your keys, or store-console forms — none of them can be done
from the codebase.

## A. Ship WITHOUT ads first (simplest path)

Leave `ADS_ENABLED = false`. Then the only required items are:

- [ ] **A1. Host the privacy policy at a public URL.** The file is
      `public/privacy.html` (already shipped inside the app and at
      `/privacy.html` on the website). Both stores require a URL — any
      static host works (the deployed website's `/privacy.html`, or
      GitHub Pages).
- [ ] **A2. Android signing**: create a release keystore
      (`keytool -genkey -v -keystore chiriya-urri-release.keystore -alias chiriya-urri -keyalg RSA -keysize 2048 -validity 10000`),
      store it OUTSIDE the repo, never lose it. Enroll in Play App
      Signing during first upload. Build a signed `.aab` via Android
      Studio → Generate Signed App Bundle.
- [ ] **A3. Play Console listing** ($25 one-time): description,
      screenshots, content rating questionnaire, privacy policy URL
      (A1), and the **Data safety form — answer "No data collected /
      shared"** (true while ads are off: everything is on-device or
      peer-to-peer). Set "Contains ads: No".
- [ ] **A4. iOS signing**: Apple Developer Program ($99/yr); in Xcode,
      Signing & Capabilities → automatic signing with your team.
- [ ] **A5. App Store Connect listing**: app record with bundle id
      `com.chiriyaurri.app` (or change it in `capacitor.config.ts` +
      re-sync first), screenshots, privacy policy URL, and the **App
      Privacy questionnaire — "Data Not Collected"** (true while ads are
      off).
- [ ] **A6.** Archive/upload from Xcode; upload the `.aab` in Play
      Console (internal testing track first).

## B. When you turn ads ON (`ADS_ENABLED = true`)

Do ALL of section A, plus:

- [ ] **B1. AdMob account** at admob.google.com.
- [ ] **B2. Register TWO apps** in AdMob (Android and iOS are separate)
      → you get two App IDs (`ca-app-pub-…~…`). Replace the sample IDs:
      - Android: `android/app/src/main/AndroidManifest.xml` →
        `com.google.android.gms.ads.APPLICATION_ID` meta-data
      - iOS: `ios/App/App/Info.plist` → `GADApplicationIdentifier`
- [ ] **B3. Create ad units** (1 interstitial per app for now) → two
      unit IDs (`ca-app-pub-…/…`). Replace the test IDs in
      `src/ads/config.ts` (`INTERSTITIAL_AD_UNIT.android/.ios`).
- [ ] **B4. GDPR message in the AdMob console** — REQUIRED for the
      in-app consent form to exist at all: AdMob → Privacy & messaging →
      create/publish a **GDPR (EU consent)** message for both apps (add
      a US-states message too if you want personalized ads there). The
      code calls Google UMP; this console step is what it displays.
- [ ] **B5. iOS SKAdNetworkItems**: paste Google's current full list
      into `ios/App/App/Info.plist` (placeholder has only Google's own):
      https://developers.google.com/admob/ios/quick-start#update_your_infoplist
- [ ] **B6. Update BOTH store privacy forms** — "no data collected" is
      no longer true with the ads SDK active:
      - Play **Data safety**: collects Device/Advertising ID and coarse
        Diagnostics/Interaction data, purpose Advertising, shared with
        Google (AdMob); set "Contains ads: **Yes**".
      - Apple **App Privacy**: "Identifiers → Device ID" and "Usage
        Data → Advertising Data", declared as "used for Third-Party
        Advertising"; ATT prompt is already implemented app-side.
- [ ] **B7. Update the hosted privacy policy date** — the ads section in
      `public/privacy.html` is pre-written; bump its "Last updated" date
      when the first ads build ships.
- [ ] **B8. Link the AdMob apps** to the live Play/App Store listings
      (AdMob console → app settings) once published.
- [ ] **B9. Test on device BEFORE swapping in real IDs**: with the test
      IDs already in the repo, set `ADS_ENABLED = true`, build to a
      device, finish 3 games → a TEST interstitial must appear; to see
      the GDPR form outside the EEA, pass
      `debugGeography: AdmobConsentDebugGeography.EEA` + your test
      device ID to `requestConsentInfo` temporarily (see
      `src/ads/admob.ts`). **Never tap real ads from a dev build** —
      that's an AdMob account ban risk. Verify: no ads during rounds,
      interstitial only after game over at the capped frequency.

## C. Quick reference — every placeholder in the repo

| File | Key | Currently |
| --- | --- | --- |
| `src/ads/config.ts` | `ADS_ENABLED` | `false` (master switch) |
| `src/ads/config.ts` | `INTERSTITIAL_AD_UNIT` | Google test unit IDs |
| `android/…/AndroidManifest.xml` | `…ads.APPLICATION_ID` | Google sample App ID |
| `ios/App/App/Info.plist` | `GADApplicationIdentifier` | Google sample App ID |
| `ios/App/App/Info.plist` | `SKAdNetworkItems` | Google's own entry only |
| `public/privacy.html` | contact email + updated date | your email, 12 Jul 2026 |
