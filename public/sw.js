/* Service worker แบบเรียบง่าย: ไม่แคชข้อมูลของผู้ใช้เด็ดขาด
   ทำแค่แสดงหน้า "ออฟไลน์" ตอนเปิดแอปโดยไม่มีอินเทอร์เน็ต */
const CACHE = "fit-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll([OFFLINE_URL, "/icons/icon-192.png"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode !== "navigate") return; // อย่างอื่นปล่อยผ่านไปที่เครือข่ายตามปกติ
  event.respondWith(
    fetch(req).catch(() => caches.match(OFFLINE_URL))
  );
});
