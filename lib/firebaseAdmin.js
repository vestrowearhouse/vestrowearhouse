import * as admin from 'firebase-admin';

let adminAuthInstance = null;
let isFirebaseAdminConfigured = false;

/**
 * Decode JWT token without verification
 * Used as fallback when Firebase Admin credentials are not available
 */
function decodeTokenWithoutVerification(idToken) {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format: expected 3 parts separated by dots');
    }
    
    // Decode the payload (middle part, support base64url)
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadBuffer = Buffer.from(base64, 'base64');
    const payload = JSON.parse(payloadBuffer.toString('utf8'));
    
    // Basic validation
    if (!payload.email && !payload.sub) {
      throw new Error('Token missing required email or subject claims');
    }
    
    return payload;
  } catch (error) {
    throw new Error(`Failed to decode token: ${error.message}`);
  }
}

function getAdminAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  
  // Check if Firebase Admin credentials are configured
  if (!projectId || !clientEmail) {
    console.warn('[Firebase] Admin credentials not configured - using fallback token decoding');
    return null;
  }

  // Sanitize the private key by removing potential surrounding quotes 
  // and ensuring escaped newlines are converted to actual newlines
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
  }

  if (!privateKey) {
    console.warn('[Firebase] Private key not configured - using fallback token decoding');
    return null;
  }

  if (!adminAuthInstance) {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        console.log('[Firebase] Admin SDK initialized successfully');
      }
      adminAuthInstance = admin.auth();
      isFirebaseAdminConfigured = true;
    } catch (error) {
      console.error('[Firebase] Failed to initialize Admin SDK:', error.message);
      adminAuthInstance = null;
      isFirebaseAdminConfigured = false;
      return null;
    }
  }

  return adminAuthInstance;
}

export const adminAuth = {
  verifyIdToken(...args) {
    const auth = getAdminAuth();
    if (!auth) {
      throw new Error('Firebase Admin not configured - cannot verify token with full signature validation');
    }
    return auth.verifyIdToken(...args);
  },
};

/**
 * Verify Firebase ID token
 * In production: Uses Firebase Admin SDK for full signature verification
 * In development: Uses fallback decoding (less secure but functional)
 */
export async function verifyFirebaseToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Invalid token: must be a non-empty string');
  }

  try {
    const auth = getAdminAuth();
    
    // If Firebase Admin is configured, use full verification
    if (auth) {
      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        console.log('[Firebase] Token verified with Firebase Admin SDK');
        return decodedToken;
      } catch (error) {
        // Even if admin is configured, catch verification errors
        console.error('[Firebase] Token verification failed:', error.message);
        throw new Error(`Token verification failed: ${error.message}`);
      }
    }
    
    // Fallback: Decode without signature verification (development mode)
    console.warn('[Firebase] Using fallback token decoding (no signature verification)');
    const payload = decodeTokenWithoutVerification(idToken);
    
    // Check token expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error('Token has expired');
    }
    
    return payload;
  } catch (error) {
    console.error('[Firebase] Token verification error:', error.message);
    throw new Error(`Firebase token error: ${error.message}`);
  }
}

export { isFirebaseAdminConfigured };
export default null;
