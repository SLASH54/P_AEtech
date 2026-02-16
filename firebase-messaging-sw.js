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

// ✅ 1. Manejador de clics (VITAL para iOS)
// Si no pones esto, el usuario toca la notificación y no pasa nada.
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // Cerramos la notificación
  
  // Abrimos la app o la enfocamos si ya está abierta
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/'); // Cambia '/' por tu URL si es necesario
    })
  );
});

// 📩 Recibir notificaciones en segundo plano
messaging.onBackgroundMessage(function (payload) {
  console.log('🔔 [Service Worker] Notificación recibida:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/img/logoAEtech.png',
    badge: '/img/logoAEtech.png', // Icono pequeño para la barra de estado
    vibrate: [200, 100, 200],     // Vibración para Android
    data: payload.data,           // Guardamos los datos extra (como tareaId)
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
