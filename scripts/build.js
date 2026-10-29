import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import AdmZip from 'adm-zip';

async function runBuild() {
  const distDir = path.resolve('dist');

  let gameTitle = 'Escape From Zog';

  // Slugify game title for the zip filename (e.g., "My Awesome Game" -> "my-awesome-game.zip")
  const safeTitle = gameTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const zipFileName = `${safeTitle}.zip`;

  // 2. Remove files specified in the removeFiles array
  const removeFiles = [
    'dist/t.xcf',
    'dist/bgs.xcf',
    'dist/SfFedora.ttf',
  ];

  removeFiles.forEach(file => {
    const filePath = path.resolve(file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Clean] Removed: ${file}`);
    }
  });

  // 3. Compute BUILD and COMMIT info
  const DATE = new Date().toString().split('(')[0].trim();
  let COMMIT = 'unknown';
  try {
    COMMIT = execSync('git rev-parse --short HEAD').toString().trim();
  } catch (e) {
    console.warn('Git commit could not be retrieved.');
  }

  const indexPath = path.join(distDir, 'index.html');

  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');

    // Injection script containing BUILD and COMMIT constants
    const metaInjection = `<script>window.BUILD = "${DATE}"; window.COMMIT = "${COMMIT}";</script>`;

    // Inject right before game.js is loaded
    if (html.includes('game.js')) {
      html = html.replace(/<script[^>]*src="[^"]*game\.js"[^>]*><\/script>/, `${metaInjection}\n    $&`);
    } else {
      html = html.replace('</head>', `    ${metaInjection}\n</head>`);
    }

    // 4. Setup PWA Offline Support
    const distFiles = fs.readdirSync(distDir);
    const filesToCache = distFiles.filter(f => f !== 'sw.js' && f !== 'manifest.json' && f !== zipFileName).map(f => `./${f}`);

    // Generate Service Worker (sw.js)
    const swContent = `
const CACHE_NAME = '${safeTitle}-v-${COMMIT}';
const urlsToCache = ${JSON.stringify(filesToCache)};

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
    `.trim();

    fs.writeFileSync(path.join(distDir, 'sw.js'), swContent);

    // Generate manifest.json using the config title
    const manifest = {
      name: gameTitle,
      short_name: gameTitle,
      start_url: "./index.html",
      display: "standalone",
      orientation: "landscape",
      background_color: "#000000",
      theme_color: "#000000",
      icons: [
        {
          src: "apple-icon-180.png",
          sizes: "180x180",
          type: "image/png"
        }
      ]
    };
    fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    // Inject PWA Manifest link and Service Worker registration into index.html head
    const pwaInjection = `
    <link rel="manifest" href="manifest.json">
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed:', err));
        });
      }
    </script>
    `;

    html = html.replace('</head>', `${pwaInjection}\n</head>`);
    fs.writeFileSync(indexPath, html);
    console.log(`[PWA & Metadata] Injected BUILD (${DATE}), COMMIT (${COMMIT}), and title "${gameTitle}".`);
  }

  // Copy license into dist
  const licensePath = path.resolve('LICENSE.txt');
  const distLicensePath = path.join(distDir, 'LICENSE.txt');

  if (fs.existsSync(licensePath)) {
    fs.copyFileSync(licensePath, distLicensePath);
    console.log('[Build] Copied LICENSE.txt to dist/');
  } else {
    console.warn('[Build] LICENSE.txt not found.');
  }

  // 5. Create the Zip archive using the title name
  const zip = new AdmZip();
  zip.addLocalFolder(distDir);
  const zipPath = path.resolve(zipFileName);
  zip.writeZip(zipPath);
  console.log(`[Zip] Successfully created archive: ${zipFileName}`);
}

runBuild();
