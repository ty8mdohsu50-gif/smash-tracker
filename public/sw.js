/**
 * v1 は v2 (Vercel) へ移行済み。
 *
 * 旧 Service Worker が古いアプリをキャッシュから返し続けると、
 * 旧 URL を開いても新アプリへ転送されない。そのためこの SW は
 * 「自分自身とキャッシュを消して退場する」だけの内容に置き換えている。
 *
 * 既存の登録済みクライアントは次回アクセス時にこのファイルを取得し、
 * activate で自壊 → 再読み込みで v2 へ転送される。
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 旧キャッシュを全削除
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));

      // 自分自身の登録を解除
      await self.registration.unregister();

      // 開いているタブを再読み込みして転送を効かせる
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })(),
  );
});

// fetch は横取りしない（常にネットワークへ）
