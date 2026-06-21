/**
 * Vite — bundler y servidor de desarrollo del frontend.
 * En dev, las peticiones /api y /php-auth se redirigen al backend local.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'os';

/** Detecta IP LAN para probar la app desde el móvil en la misma Wi‑Fi. */
function getLanUrl(port) {
  const nets = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(nets)) {
    const lower = name.toLowerCase();
    if (lower.includes('vethernet') || lower.includes('virtualbox') || lower.includes('vmware') || lower.includes('hyper-v')) {
      continue;
    }
    for (const net of nets[name] || []) {
      if (net.family !== 'IPv4' || net.internal) continue;
      if (net.address.startsWith('192.168.56.')) continue;
      candidates.push(net.address);
    }
  }
  const ip = candidates.find((a) => a.startsWith('192.168.')) || candidates[0];
  return ip ? `http://${ip}:${port}/` : null;
}

export default defineConfig({
  plugins: [
    react(), // JSX + Fast Refresh
    {
      // Al arrancar dev, imprime URL accesible desde el teléfono
      name: 'log-lan-url',
      configureServer(server) {
        server.httpServer?.once('listening', () => {
          const lan = getLanUrl(5173);
          if (lan) {
            console.log(`\n  📱 Móvil (misma Wi‑Fi): ${lan}\n`);
          }
        });
      },
    },
  ],
  server: {
    port: 5173,
    host: '0.0.0.0', // escucha en todas las interfaces (LAN)
    strictPort: true,
    proxy: {
      // Frontend llama /api/* → backend Node en :4002 (diseños, clases, admin)
      '/api': {
        target: 'http://127.0.0.1:4002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // authApi usa /api/php-auth/* → Node reenvía a PHP (login, registro)
      '/php-auth': {
        target: process.env.VITE_PHP_TARGET || 'http://localhost',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/php-auth/, process.env.VITE_PHP_PATH || '/nuevonuevo/DiagramTec/php'),
      },
    },
  },
});
