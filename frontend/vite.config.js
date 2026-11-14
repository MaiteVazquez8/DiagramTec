import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'os';

/** IP de Wi‑Fi/LAN (evita 192.168.56.x de VirtualBox que el móvil no alcanza). */
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
    react(),
    {
      // `vite preview` (build de producción): los archivos de /assets llevan un hash en el
      // nombre, así que el navegador puede guardarlos un año sin volver a pedirlos.
      // index.html siempre se revalida para que los cambios se vean al publicar.
      name: 'static-cache-headers',
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/assets/')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else if (/\.(webp|png|svg|ico)$/.test(req.url || '')) {
            res.setHeader('Cache-Control', 'public, max-age=604800');
          } else {
            res.setHeader('Cache-Control', 'no-cache');
          }
          next();
        });
      },
    },
    {
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
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/php-auth': {
        target: process.env.VITE_PHP_TARGET || 'http://localhost',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/php-auth/, process.env.VITE_PHP_PATH || '/nuevonuevo/DiagramTec/php'),
      },
    },
  },
});
