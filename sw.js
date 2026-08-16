const CACHE_NAME = 'currx-v2';

// 1. 本地核心檔案（這些必須 100% 成功）
const CORE_ASSETS = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/js/app.js',
  './assets/js/currencies.js',
  './manifest.json'
];

// 2. 外部第三方資源（採取逐個下載，失敗不影響 SW 安裝）
const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Poppins:wght@400;500;600&display=swap',
  'https://unpkg.com/lucide@latest',
  'https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.0/math.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 先強制成功快取核心本地檔案
      await cache.addAll(CORE_ASSETS);
      
      // 外部資源使用 Promise.allSettled 逐一快取，就算失敗也不中斷 install
      await Promise.allSettled(
        EXTERNAL_ASSETS.map((url) => 
          fetch(url, { mode: 'cors' })
            ? cache.add(url)
            : Promise.reject()
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 快取有就回傳快取，沒有就發起網路請求
      return response || fetch(event.request);
    })
  );
});
