import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Only initialize Firebase in browser environment with valid config
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let analytics: Analytics | undefined;

if (typeof window !== 'undefined') {
  if (firebaseConfig.apiKey) {
    try {
      // Initialize Firebase only if it hasn't been initialized
      const existingApps = getApps();
      app = existingApps.length === 0 ? initializeApp(firebaseConfig) : existingApps[0];
      auth = getAuth(app);

      // Initialize Analytics only if supported
      isSupported().then((supported) => {
        if (supported && app) {
          analytics = getAnalytics(app);
        }
      });
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }
}

export { app, auth, analytics };
