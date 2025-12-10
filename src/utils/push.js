const { getMessaging } = require('../config/fcm');
const { Usuario } = require('../models/relations');

async function sendPushToUser(userId, title, body, data = {}) {
  try {
    const user = await Usuario.findByPk(userId);
    const token = user?.fcmToken;
    if (!token) {
      console.log(`Usuario ${userId} sin fcmToken, no se envía push.`);
      return;
    }
    const messaging = getMessaging();
    if (!messaging) return;

    await messaging.send({
      token,
      notification: { title, body },
      data // opcional: puedes mandar tareaId, etc.
    });

    console.log(`Push enviado a usuario ${userId}`);
  } catch (e) {
    console.error('sendPushToUser error:', e.message);
  }
}

module.exports = { sendPushToUser };
