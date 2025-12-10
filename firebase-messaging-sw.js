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

// 📩 Recibir notificaciones en segundo plano
messaging.onBackgroundMessage(function (payload) {
  console.log('🔔 [Service Worker] Notificación recibida:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/img/logoAEtech.png'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
