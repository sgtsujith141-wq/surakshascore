import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.surakshascore.pss',
  appName: 'SurakshaScore',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
