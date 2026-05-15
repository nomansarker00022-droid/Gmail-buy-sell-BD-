importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDm7cdIYMuuLtuIOXjpFOEwSxkaOYxc7_U",
  authDomain: "ai-studio-applet-webapp-505a9.firebaseapp.com",
  projectId: "ai-studio-applet-webapp-505a9",
  storageBucket: "ai-studio-applet-webapp-505a9.firebasestorage.app",
  messagingSenderId: "944944055499",
  appId: "1:944944055499:web:ebd57b0297c2e9a932474e"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Only show if browser doesn't show it automatically (usually for data-only messages)
  if (!payload.notification && payload.data) {
    const notificationTitle = payload.data.title || "New Notification";
    const notificationOptions = {
        body: payload.data.body || "You have a new message",
        icon: '/logo.png',
        badge: '/logo.png',
        data: payload.data
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action) {
     // Handle specific actions
     const paymentId = event.notification.data?.paymentId;
     const adminUid = event.notification.data?.adminUid;
     
     if (event.action === 'approve_payment' || event.action === 'reject_payment') {
        event.waitUntil(
            fetch('/api/admin/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: event.action,
                    paymentId,
                    adminUid
                })
            }).then(response => {
                if (!response.ok) throw new Error('Action failed');
                console.log('Action performed successfully');
            }).catch(err => console.error('Push action error:', err))
        );
        return;
     }
  }

  const urlToOpen = event.notification.data?.link || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
