# Chiriya Urri on mobile

One web codebase, wrapped by [Capacitor](https://capacitorjs.com) into two
native app shells — `android/` and `ios/`. There is no separate mobile UI to
maintain: both platforms load the exact same `dist/` build the web version
ships, including the PeerJS online multiplayer, unchanged.

## Why Capacitor instead of a React Native rewrite

The game already existed as a complete, tested React/Vite web app before
this work started. Capacitor loads that build in a thin native WebView
shell per platform — no component rewrite, no separate UI to keep in sync,
and WebRTC (what the online mode runs on) works in both platforms' system
WebViews without any native plugin. React Native would mean re-implementing
every component in RN's own primitives (`View`/`Text` instead of HTML,
`StyleSheet` instead of CSS) — a second UI to maintain, for a smaller
practical benefit than it sounds: RN's own WebRTC story (`react-native-webrtc`)
is a native module, not "free" either.

## What was added for mobile

- `capacitor.config.ts` — app id `com.chiriyaurri.app`, `webDir: dist`
- `android/`, `ios/` — the native shell projects Capacitor generates; these
  are real project source (Gradle/Xcode files, manifests, icons) and are
  committed, aside from build output and copied web assets (see
  `.gitignore`)
- `resources/*.svg` — the source app icon and splash screen art (a simple
  two-wing bird mark on the same sky-blue gradient as the web app)
- `scripts/generate-mobile-assets.mjs` — renders those SVGs into every
  exact file/size both platforms expect (`npm run mobile:assets`). It
  deliberately doesn't use the official `@capacitor/assets` generator,
  because that tool depends on `sharp`, which needs a prebuilt native
  binary download that's blocked in some sandboxed/offline environments;
  this script only needs Playwright, which normal environments already
  have a browser installed for
- Hardware back button (Android): steps back to the menu first; only exits
  the app from the menu (`src/App.tsx`)
- Safe-area insets, `touch-action: manipulation`, disabled overscroll/pull-
  to-refresh and text-selection-on-tap (`src/index.css`) — small things
  that stop a wrapped web app from feeling like a wrapped web app
- Auto-pause on backgrounding for solo/team games
  (`src/game/useBackgroundPause.ts`) — a phone call or notification
  shouldn't silently cost you a round while the screen is off. Online
  games don't need this: the existing host-authoritative reconnect/rejoin
  design (see `docs/DESIGN.md`) already handles a backgrounded tab or app
  gracefully on both web and mobile

## Compatibility

- **Android**: `minSdkVersion 24` (Android 7.0+, Capacitor's default —
  covers the large majority of active devices). System WebView has
  supported WebRTC since long before that floor.
- **iOS**: deployment target `15.0` (Capacitor's default). WKWebView has
  supported WebRTC since iOS 14.3, so this is comfortably covered.
- Neither platform needed a lower floor raised or a WebRTC polyfill.

## Local development

```bash
npm install
npm run mobile:sync      # vite build + capacitor sync (copies dist/ into both platforms)
npm run android:open     # opens the Android Studio project
npm run ios:open         # opens the Xcode project (macOS only)
```

Re-run `npm run mobile:sync` after any change to `src/` before rebuilding
natively — Capacitor doesn't watch the web build automatically.

### Android

Requires [Android Studio](https://developer.android.com/studio) (bundles
the Android SDK and a compatible Gradle). Open the project with
`npm run android:open`, then Run on an emulator or a USB-connected device.
This repo's sandbox has Java and Gradle but no Android SDK or emulator, so
none of this could be exercised end-to-end here — the native project is
scaffolded and configured correctly, but a real device/emulator run should
be your first check after pulling this branch.

### iOS

Requires a **Mac with Xcode** — there's no way around this, it's Apple's
own tooling requirement, not a limitation of this setup. Interesting
scaffolding detail: this Capacitor version wires plugins through Swift
Package Manager rather than CocoaPods, so `npx cap add ios` completed
without needing a Mac at all (no `pod install` step) — but *building and
running* the project still needs Xcode. Open with `npm run ios:open`
(from a Mac) and run on the Simulator or a device.

## Releasing to the stores

### Android (Google Play)

1. One-time: a [Google Play Console](https://play.google.com/console)
   developer account ($25 one-time fee).
2. Generate a release signing key (once, keep it forever — losing it means
   you can never update the app again under the same listing):
   ```bash
   keytool -genkey -v -keystore chiriya-urri-release.keystore \
     -alias chiriya-urri -keyalg RSA -keysize 2048 -validity 10000
   ```
   Store it outside the repo. Wire it into
   `android/app/build.gradle`'s `signingConfigs` (Android Studio's
   Build → Generate Signed Bundle/APK wizard does this for you
   interactively the first time).
3. Build → Generate Signed App Bundle (`.aab`, Play's required format).
4. Create the app listing in Play Console: title, description, screenshots
   (phone at minimum; tablet/Wear optional), the icon in this repo is
   already the right shape/size, a privacy policy URL (this app collects
   no personal data or analytics — a one-line policy page saying so
   satisfies the requirement), content rating questionnaire, and the data
   safety form (answer "no data collected" — local room history and player
   names live only in the device's `localStorage`, never sent anywhere but
   directly between players over WebRTC).
5. Upload the `.aab` to a testing track first (internal testing is
   instant), then promote to production when ready.

### iOS (Apple App Store)

1. One-time: an
   [Apple Developer Program](https://developer.apple.com/programs/)
   membership ($99/year) — required to submit any app, no exceptions.
2. In Xcode: select the `App` target → Signing & Capabilities → enable
   "Automatically manage signing" and pick your team; Xcode provisions
   certificates for you.
3. Create the app record in
   [App Store Connect](https://appstoreconnect.apple.com) with the same
   bundle id (`com.chiriyaurri.app`, or change it first in
   `capacitor.config.ts` and re-run `npx cap sync` if you'd rather use your
   own reverse-DNS id).
4. Product → Archive, then use the Organizer window's "Distribute App" flow
   to upload to App Store Connect.
5. Fill in the listing (description, screenshots per required device size,
   the App Privacy questionnaire — answer "data not collected", since
   nothing here is gathered or transmitted to a server you run), then
   submit for review. TestFlight lets you send builds to testers before
   that, without a review.

### Keeping both stores' builds current

Both platforms read from the same `dist/` build — there's no drift to
manage between them beyond re-running `npm run mobile:sync` before each
native build. Bump `capacitor.config.ts`'s implicit version (Android's
`versionCode`/`versionName` in `android/app/build.gradle`, iOS's
version/build number in Xcode) on each release the way you would for any
native app.

## Known limitations

- The host's device is the multiplayer "server" for a room (see
  `docs/DESIGN.md`) — this is unchanged on mobile. A host force-quitting
  the app (not just backgrounding it) ends the room the same way it would
  on the web.
- No push notifications, deep links, or native share sheet integration yet
  — none of these are needed for the game to work, but they'd be natural
  next steps (e.g., "share this room code" via the native share sheet
  instead of copy-paste).
