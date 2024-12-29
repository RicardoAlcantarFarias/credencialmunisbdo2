import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'credencialDigital',
  webDir: 'www',
  server: {
    cleartext: true, // Permitir tráfico HTTP
    url: 'http://190.215.38.222:9595', // URL del servidor backend en red local
    androidScheme: 'http' // Configurar el esquema como HTTP en Android
  },
  android: {
    allowMixedContent: true, // Permitir contenido mixto en Android (HTTP en HTTPS)
    webContentsDebuggingEnabled: true // Habilitar la depuración de contenido web en Android
  }
};

export default config;
