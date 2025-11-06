importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBa6KYyhwI4scIblnOY_VKb-1kSwwO9_Ts",
  authDomain: "aetech-notificaciones.firebaseapp.com",
  projectId: "aetech-notificaciones",
  storageBucket: "aetech-notificaciones.firebasestorage.app",
  messagingSenderId: "742322294289",
  appId: "1:742322294289:web:5bd9e894ad92dbef4dabb0"
});

const messaging = firebase.messaging();

// Notificaciones cuando la app está en segundo plano
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'AEtech';
  const options = {
    body: payload.notification?.body || '',
    icon: '/img/logoAEtech.png'
  };
  self.registration.showNotification(title, options);
});
