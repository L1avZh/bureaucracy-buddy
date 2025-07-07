self.addEventListener("push", (event: PushEvent) => {
  const data = event.data?.json() || {};
  const title = "תזכורת ביורוקרטית 📄";
  const options = {
    body: data.body || "אל תשכח לחדש את המסמך שלך!",
    icon: "/icon-512.png",
    badge: "/badge-128.png",
    data,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
