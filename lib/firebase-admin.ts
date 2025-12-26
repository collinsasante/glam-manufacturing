import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;

// Initialize Firebase Admin SDK (server-side only)
if (getApps().length === 0) {
  try {
    // For local development, you can use a service account JSON file
    // For production (Cloudflare), set environment variables
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    // Initialization will fail on client-side, which is expected
    // Only log errors on server-side
    if (typeof window === 'undefined') {
      console.error('Firebase Admin initialization error:', error);
    }
  }
}

export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminDb = adminApp ? getFirestore(adminApp) : null;

export async function verifyIdToken(token: string) {
  if (!adminAuth) {
    throw new Error('Firebase Admin not initialized');
  }
  return adminAuth.verifyIdToken(token);
}

export async function getUserRole(uid: string): Promise<string> {
  if (!adminDb) {
    throw new Error('Firestore not initialized');
  }

  const userDoc = await adminDb.collection('users').doc(uid).get();

  if (!userDoc.exists) {
    // Return default role for new users
    return 'viewer';
  }

  return userDoc.data()?.role || 'viewer';
}

export async function setUserRole(uid: string, role: string, email: string) {
  if (!adminDb) {
    throw new Error('Firestore not initialized');
  }

  await adminDb.collection('users').doc(uid).set({
    email,
    role,
    createdAt: new Date(),
  }, { merge: true });
}
