import * as admin from 'firebase-admin';
import { env } from './env';

let initialized = false;

export function initFirebase() {
  if (initialized || admin.apps.length > 0) return;
  try {
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: env.FIREBASE_PROJECT_ID,
    });
    initialized = true;
    console.log('Firebase Admin initialized');
  } catch (e) {
    console.warn('Firebase Admin not initialized (missing service account key)');
  }
}

initFirebase();

export const db = admin.apps.length > 0 ? admin.firestore() : null;
export const adminAuth = admin.apps.length > 0 ? admin.auth() : null;
export default admin;
