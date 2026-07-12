export interface AdsBackend {
  /** Run consent (UMP) + ATT + SDK init. Must be safe to call once at startup. */
  init(): Promise<void>;
  /** A game just ended; the backend decides (frequency cap, consent) whether to show an interstitial. */
  gameFinished(): Promise<void>;
  /** Whether regulations require offering a "privacy options" re-consent entry point. */
  privacyOptionsRequired(): boolean;
  /** Re-open the consent/privacy options form. */
  showPrivacyOptions(): Promise<void>;
}
