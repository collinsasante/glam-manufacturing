/**
 * Firebase Authentication for Cloudflare Workers Edge Runtime
 *
 * This implements Firebase ID token verification using only Web APIs
 * (no Node.js dependencies like crypto, http, fs)
 */

interface DecodedToken {
  uid: string;
  email?: string;
  [key: string]: any;
}

interface JWTHeader {
  alg: string;
  kid: string;
  typ: string;
}

interface JWTPayload {
  iss: string;
  aud: string;
  auth_time: number;
  user_id: string;
  sub: string;
  iat: number;
  exp: number;
  email?: string;
  email_verified?: boolean;
  firebase?: {
    identities?: Record<string, any>;
    sign_in_provider?: string;
  };
}

// Cache for Google's public keys
let cachedKeys: Record<string, CryptoKey> | null = null;
let cacheExpiry = 0;

/**
 * Fetch Google's public keys for Firebase token verification
 */
async function getPublicKeys(): Promise<Record<string, CryptoKey>> {
  const now = Date.now();

  // Return cached keys if still valid
  if (cachedKeys && now < cacheExpiry) {
    return cachedKeys;
  }

  const response = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Firebase public keys');
  }

  const cacheControl = response.headers.get('cache-control');
  const maxAgeMatch = cacheControl?.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) * 1000 : 3600000; // Default 1 hour

  const certsJson = await response.json() as Record<string, string>;
  const keys: Record<string, CryptoKey> = {};

  // Convert PEM certificates to CryptoKey objects
  for (const [kid, cert] of Object.entries(certsJson)) {
    keys[kid] = await importPublicKey(cert);
  }

  cachedKeys = keys;
  cacheExpiry = now + maxAge;

  return keys;
}

/**
 * Import PEM certificate as CryptoKey for verification
 */
async function importPublicKey(pem: string): Promise<CryptoKey> {
  // Remove PEM header/footer and whitespace
  const pemContents = pem
    .replace(/-----BEGIN CERTIFICATE-----/, '')
    .replace(/-----END CERTIFICATE-----/, '')
    .replace(/\s/g, '');

  // Base64 decode
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  // Import as X.509 certificate
  return await crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['verify']
  );
}

/**
 * Base64 URL decode (for JWT)
 */
function base64UrlDecode(str: string): Uint8Array {
  // Replace URL-safe characters
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const paddedBase64 = base64 + padding;

  // Decode base64 to binary
  const binary = atob(paddedBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Parse JWT without verification (to get header)
 */
function parseJWT(token: string): { header: JWTHeader; payload: JWTPayload } {
  const [headerB64, payloadB64] = token.split('.');

  const headerBytes = base64UrlDecode(headerB64);
  const payloadBytes = base64UrlDecode(payloadB64);

  const header = JSON.parse(new TextDecoder().decode(headerBytes)) as JWTHeader;
  const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as JWTPayload;

  return { header, payload };
}

/**
 * Verify Firebase ID token
 */
export async function verifyIdToken(idToken: string): Promise<DecodedToken> {
  if (!idToken) {
    throw new Error('No ID token provided');
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Firebase project ID not configured');
  }

  // Parse token to get header and payload
  const { header, payload } = parseJWT(idToken);

  // Validate header
  if (header.alg !== 'RS256') {
    throw new Error('Invalid algorithm. Expected RS256');
  }

  // Validate payload claims
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp < now) {
    throw new Error('Token has expired');
  }

  if (payload.iat > now) {
    throw new Error('Token issued in the future');
  }

  if (payload.aud !== projectId) {
    throw new Error('Token audience mismatch');
  }

  if (!payload.iss?.includes(`securetoken.google.com/${projectId}`)) {
    throw new Error('Token issuer mismatch');
  }

  if (!payload.sub) {
    throw new Error('Token missing subject claim');
  }

  // Get public keys and verify signature
  const publicKeys = await getPublicKeys();
  const publicKey = publicKeys[header.kid];

  if (!publicKey) {
    throw new Error('Public key not found for token');
  }

  // Verify signature
  const [headerB64, payloadB64, signatureB64] = idToken.split('.');
  const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(signatureB64);

  const isValid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    publicKey,
    signature,
    signedData
  );

  if (!isValid) {
    throw new Error('Invalid token signature');
  }

  // Return decoded token
  return {
    uid: payload.sub,
    email: payload.email,
    ...payload,
  };
}

/**
 * Get user role from Firestore (using REST API, not Firebase Admin SDK)
 */
export async function getUserRole(uid: string): Promise<string> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Firebase project ID not configured');
  }

  // Use Firestore REST API instead of Firebase Admin SDK
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('User not found in Firestore');
    }
    throw new Error('Failed to fetch user role from Firestore');
  }

  const data = await response.json();
  const role = data.fields?.role?.stringValue;

  if (!role) {
    throw new Error('User role not found');
  }

  return role;
}
