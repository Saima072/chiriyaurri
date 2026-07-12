import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chiriyaurri.app',
  appName: 'Chiriya Urri',
  webDir: 'dist',
  // https (not the default file://) so WebRTC/localStorage behave like a
  // real secure origin — PeerJS and the room-history/resume code assume one.
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#f3e9dc',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;
