// Service Worker cho Mẹ Thiên Hạ - cache để chạy offline
const CACHE = "me-thien-ha-v11";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./messages.js",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

// Cài đặt: cache toàn bộ tài nguyên
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

// Kích hoạt: xóa cache cũ
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: ưu tiên mạng, fallback cache (network-first cho HTML, cache-first cho còn lại)
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Không cache lời gọi API (vd OpenAI)
  if (url.origin !== self.location.origin) return;

  // Ưu tiên mạng: luôn lấy bản mới nhất khi online, lỗi mạng mới dùng cache
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
