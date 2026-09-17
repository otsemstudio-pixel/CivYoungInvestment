self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "Rappel d'épargne";
  const options = {
    body: data.body || "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: { goalId: data.goalId },
    actions: [
      { action: "verse", title: "J'ai versé" },
      { action: "autre", title: "Autre" },
      { action: "skip", title: "Pas ce mois-ci" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const goalId = event.notification.data && event.notification.data.goalId;

  if (event.action === "verse") {
    event.waitUntil(
      fetch("/api/push/quick-verse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId }),
      }),
    );
    return;
  }

  let url = "/objectifs";
  if (event.action === "autre") url = `/objectifs?declare=${goalId}&stage=amount`;
  else if (event.action === "skip") url = `/objectifs?declare=${goalId}&stage=skip`;
  else if (goalId) url = `/objectifs?declare=${goalId}&stage=choice`;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if ("focus" in client) {
          if ("navigate" in client) client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
      return undefined;
    }),
  );
});
