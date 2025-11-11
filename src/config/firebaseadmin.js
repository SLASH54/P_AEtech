// src/config/firebaseAdmin.js
const admin = require("firebase-admin");

let serviceAccount;

try {
  // Si se ejecuta en Render (producción)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Si se ejecuta localmente
    serviceAccount = require("../../firebaseServiceAccount.json");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin inicializado correctamente");
} catch (err) {
  console.error("❌ Error inicializando Firebase Admin:", err);
}

module.exports = admin;

