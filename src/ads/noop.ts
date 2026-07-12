import type { AdsBackend } from './types';

/** Web build (and native while ADS_ENABLED is false): ads do not exist. */
export class NoopBackend implements AdsBackend {
  async init(): Promise<void> {}
  async gameFinished(): Promise<void> {}
  privacyOptionsRequired(): boolean {
    return false;
  }
  async showPrivacyOptions(): Promise<void> {}
}
