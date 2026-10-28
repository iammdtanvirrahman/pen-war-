import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tanvir.penwar',
  appName: 'Pen War',
  webDir: 'dist',
  backgroundColor: '#050505',
  android: {
    allowMixedContent: false
  }
};

export default config;
