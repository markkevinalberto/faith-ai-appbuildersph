// Service worker for the installable web app (PWA), generated after `npm run export:web`.
// It keeps the app itself (HTML, JavaScript, WebAssembly runtimes, fonts, images) on the device so
// FAITH opens with no internet. The AI models are not in here: they are downloaded on request and
// kept in the browser's private storage (OPFS) by wllama. The online-assistant relay (/api) is never
// cached. A new deploy takes over on the next launch (skipWaiting + clientsClaim).
module.exports = {
  globDirectory: 'dist-web/',
  globPatterns: ['**/*.{html,js,css,json,wasm,ttf,otf,woff,woff2,png,jpg,jpeg,svg,ico}'],
  globIgnores: ['api/**', 'sw.js', 'workbox-*.js', 'vercel.json', 'metadata.json'],
  swDest: 'dist-web/sw.js',
  // The app bundle and the wasm runtimes are a few MB each.
  maximumFileSizeToCacheInBytes: 40 * 1024 * 1024,
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/api\//],
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  sourcemap: false,
};
