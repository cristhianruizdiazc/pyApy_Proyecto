// server/firebaseAdmin.ts
// SERVER-SIDE ONLY: Firebase Admin SDK Initializer & Token Verifier
import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth, DecodedIdToken } from 'firebase-admin/auth';

export interface FirebaseAdminState {
  isConfigured: boolean;
  app: App | null;
  firestore: Firestore | null;
  auth: Auth | null;
  error?: string;
}

let adminState: FirebaseAdminState | null = null;

export function getFirebaseAdmin(): FirebaseAdminState {
  if (adminState) {
    return adminState;
  }

  const projectId = process.env.SERVER_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.SERVER_FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.SERVER_FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Handle escaped newlines from environment variable strings
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  // Check if emulator is active
  const isEmulator = Boolean(
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST
  );

  if (isEmulator) {
    try {
      const app = getApps().length > 0
        ? getApp()
        : initializeApp({
            projectId: projectId || 'pyapy-dev'
          });
      adminState = {
        isConfigured: true,
        app,
        firestore: getFirestore(app),
        auth: getAuth(app)
      };
      console.log('[Firebase Admin] Connected via Firebase Emulator Suite');
      return adminState;
    } catch (err: any) {
      console.error('[Firebase Admin] Error initializing emulator:', err);
      adminState = {
        isConfigured: false,
        app: null,
        firestore: null,
        auth: null,
        error: `Error initializing emulator: ${err.message}`
      };
      return adminState;
    }
  }

  if (projectId && clientEmail && privateKey) {
    try {
      const app = getApps().length > 0
        ? getApp()
        : initializeApp({
            credential: cert({
              projectId,
              clientEmail,
              privateKey
            })
          });

      adminState = {
        isConfigured: true,
        app,
        firestore: getFirestore(app),
        auth: getAuth(app)
      };
      console.log('[Firebase Admin] Successfully initialized with service account');
      return adminState;
    } catch (err: any) {
      console.error('[Firebase Admin] Initialization failed with provided credentials:', err);
      adminState = {
        isConfigured: false,
        app: null,
        firestore: null,
        auth: null,
        error: `Firebase Admin initialization error: ${err.message}`
      };
      return adminState;
    }
  }

  // Graceful unconfigured state (Fails fast without hardcoded fake keys)
  adminState = {
    isConfigured: false,
    app: null,
    firestore: null,
    auth: null,
    error: 'Firebase Admin credentials not configured (SERVER_FIREBASE_PROJECT_ID, SERVER_FIREBASE_CLIENT_EMAIL, SERVER_FIREBASE_PRIVATE_KEY are required).'
  };
  return adminState;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<{
  valid: boolean;
  decodedToken?: DecodedIdToken;
  error?: string;
}> {
  const adminInst = getFirebaseAdmin();
  if (!adminInst.isConfigured || !adminInst.auth) {
    return {
      valid: false,
      error: adminInst.error || 'Firebase Admin Auth is not configured on the server.'
    };
  }

  try {
    const decodedToken = await adminInst.auth.verifyIdToken(idToken);
    return { valid: true, decodedToken };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Invalid or expired Firebase ID token.' };
  }
}
