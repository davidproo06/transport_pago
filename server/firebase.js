const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firestore = null;
let firebaseInitialized = false;

function initFirebase() {
  if (firebaseInitialized) return firestore;

  try {
    // 1. Check for serviceAccountKey.json in server directory or root
    const keyPathInServer = path.join(__dirname, 'serviceAccountKey.json');
    const keyPathInRoot = path.join(__dirname, '..', 'serviceAccountKey.json');

    let serviceAccount = null;

    if (fs.existsSync(keyPathInServer)) {
      serviceAccount = JSON.parse(fs.readFileSync(keyPathInServer, 'utf8'));
    } else if (fs.existsSync(keyPathInRoot)) {
      serviceAccount = JSON.parse(fs.readFileSync(keyPathInRoot, 'utf8'));
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firestore = admin.firestore();
      firebaseInitialized = true;
      console.log(`[Firebase] Conectado exitosamente a Firestore (Proyecto: ${serviceAccount.project_id})`);
      return firestore;
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp();
      firestore = admin.firestore();
      firebaseInitialized = true;
      console.log('[Firebase] Conectado exitosamente a Firestore usando credenciales por defecto');
      return firestore;
    } else {
      console.log('[Firebase] No se detectó serviceAccountKey.json. Usando base de datos local SQLite con soporte listo para Firebase.');
      return null;
    }
  } catch (err) {
    console.error('[Firebase] Error al inicializar Firebase Admin SDK:', err.message);
    return null;
  }
}

function getFirestore() {
  if (!firebaseInitialized) {
    return initFirebase();
  }
  return firestore;
}

function isFirebaseConfigured() {
  return !!getFirestore();
}

module.exports = {
  initFirebase,
  getFirestore,
  isFirebaseConfigured,
  admin,
};

