const admin = require('firebase-admin');

function initFCM() {
  if (admin.apps.length) return admin.app();
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!json) {
    console.warn('FIREBASE_SERVICE_ACCOUNT no configurado');
    return null;
  }
  const creds = JSON.parse(json);
  admin.initializeApp({
    credential: admin.credential.cert(creds)
  });
  return admin.app();
}

function getMessaging() {
  const app = initFCM();
  return app ? app.messaging() : null;
}

module.exports = { getMessaging };
