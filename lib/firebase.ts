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

console.log('=== Firebase Configuration Debug ===');
console.log('Environment:', typeof window !== 'undefined' ? 'Browser' : 'Server');
console.log('API Key exists:', !!firebaseConfig.apiKey);
console.log('API Key value:', firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'undefined');
console.log('Auth Domain:', firebaseConfig.authDomain);
console.log('Project ID:', firebaseConfig.projectId);
console.log('All config keys:', Object.keys(firebaseConfig).filter(key => !!firebaseConfig[key as keyof typeof firebaseConfig]));

// Only initialize Firebase in browser environment with valid config
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let analytics: Analytics | undefined;

if (typeof window !== 'undefined') {
  console.log('Running in browser...');

  if (!firebaseConfig.apiKey) {
    console.error('❌ Firebase API Key is missing! Check your environment variables.');
    console.log('Make sure NEXT_PUBLIC_FIREBASE_API_KEY is set in your .env file or Cloudflare environment variables.');
  } else {
    console.log('✅ Firebase API Key found, initializing...');

    try {
      // Initialize Firebase only if it hasn't been initialized
      const existingApps = getApps();
      console.log('Existing Firebase apps:', existingApps.length);

      app = existingApps.length === 0 ? initializeApp(firebaseConfig) : existingApps[0];
      console.log('✅ Firebase app initialized');

      auth = getAuth(app);
      console.log('✅ Firebase Auth initialized');

      // Initialize Analytics only if supported
      isSupported().then((supported) => {
        if (supported && app) {
          analytics = getAnalytics(app);
          console.log('✅ Firebase Analytics initialized');
        } else {
          console.log('ℹ️ Firebase Analytics not supported in this environment');
        }
      });
    } catch (error) {
      console.error('❌ Firebase initialization error:', error);
    }
  }
} else {
  console.log('ℹ️ Running on server - Firebase will not be initialized');
}

export { app, auth, analytics };
