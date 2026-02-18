// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBa6KYyhwI4scIblnOY_VKb-1kSwwO9_Ts",
  authDomain: "aetech-notificaciones.firebaseapp.com",
  projectId: "aetech-notificaciones",
  storageBucket: "aetech-notificaciones.firebasestorage.app",
  messagingSenderId: "742322294289",
  appId: "1:742322294289:web:5bd9e894ad92dbef4dabb0",
  measurementId: "G-ZLZ2LWQ1XE"
});

const messaging = firebase.messaging();

// ✅ ESTO ES LO QUE FALTA: Manejar el click
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    // Si la data trae la URL, úsala
    const urlToOpen = event.notification.data?.click_action || '/sistema.html?open=tareas';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                // Si ya está abierto el sistema, le mandamos la nueva URL con el parámetro
                if ('focus' in client) {
                    return client.navigate(urlToOpen).then(c => c.focus());
                }
            }
            // Si está cerrado, abre una ventana nueva
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Recibir en segundo plano
messaging.onBackgroundMessage(function (payload) {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/img/logoAEtech.png',
    vibrate: [200, 100, 200, 100, 200], 
    badge: '/img/logoAEtech.png',
    data: {
        // Guardamos la URL aquí para que el evento de arriba la lea
        click_action: payload.data?.click_action || '/sistema.html'
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});