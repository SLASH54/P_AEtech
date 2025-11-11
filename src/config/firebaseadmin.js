// src/config/firebaseAdmin.js
const admin = require("firebase-admin");

// Archivo de credenciales que descargaste desde Firebase Console
const serviceAccount = require("../firebaseServiceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
