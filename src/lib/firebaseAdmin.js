import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountJson) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountJson))
      });
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firebase Admin cannot initialize.");
    }
  } catch (error) {
    console.error("Firebase Admin initialization error", error.stack);
  }
}

export { admin };
