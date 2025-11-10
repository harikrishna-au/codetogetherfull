import admin from 'firebase-admin';
import { firebaseConfig } from './env.js';
import { logger } from '@/utils/logger.js';

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App;

export const initializeFirebase = (): admin.app.App | null => {
  try {
    // Check if we have valid Firebase credentials
    if (!firebaseConfig.private_key || firebaseConfig.private_key.includes('Your private key here')) {
      logger.warn('⚠️ Firebase credentials not configured - authentication will be disabled');
      return null;
    }

    if (!firebaseApp) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount),
        projectId: firebaseConfig.project_id,
      });
      
      logger.info('✅ Firebase Admin SDK initialized successfully', {
        projectId: firebaseConfig.project_id,
      });
    }
    
    return firebaseApp;
  } catch (error) {
    logger.error('❌ Failed to initialize Firebase Admin SDK:', error);
    logger.warn('⚠️ Continuing without Firebase - authentication will be disabled');
    return null;
  }
};

// Get Firebase Auth instance
export const getFirebaseAuth = (): admin.auth.Auth => {
  if (!firebaseApp) {
    const app = initializeFirebase();
    if (!app) {
      throw new Error('Firebase not initialized - authentication disabled');
    }
  }
  return admin.auth(firebaseApp);
};

// Verify Firebase ID token
export const verifyFirebaseToken = async (idToken: string): Promise<admin.auth.DecodedIdToken> => {
  try {
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    
    logger.debug('Firebase token verified successfully', {
      uid: decodedToken.uid,
      email: decodedToken.email,
    });
    
    return decodedToken;
  } catch (error) {
    logger.error('Firebase token verification failed:', error);
    throw error;
  }
};

// Get user by UID
export const getFirebaseUser = async (uid: string): Promise<admin.auth.UserRecord> => {
  try {
    const auth = getFirebaseAuth();
    const userRecord = await auth.getUser(uid);
    
    logger.debug('Firebase user retrieved successfully', {
      uid: userRecord.uid,
      email: userRecord.email,
    });
    
    return userRecord;
  } catch (error) {
    logger.error('Failed to get Firebase user:', error);
    throw error;
  }
};

// Create custom token
export const createCustomToken = async (uid: string, additionalClaims?: object): Promise<string> => {
  try {
    const auth = getFirebaseAuth();
    const customToken = await auth.createCustomToken(uid, additionalClaims);
    
    logger.debug('Custom token created successfully', { uid });
    
    return customToken;
  } catch (error) {
    logger.error('Failed to create custom token:', error);
    throw error;
  }
};

// Revoke refresh tokens for a user
export const revokeRefreshTokens = async (uid: string): Promise<void> => {
  try {
    const auth = getFirebaseAuth();
    await auth.revokeRefreshTokens(uid);
    
    logger.info('Refresh tokens revoked successfully', { uid });
  } catch (error) {
    logger.error('Failed to revoke refresh tokens:', error);
    throw error;
  }
};

// Set custom user claims
export const setCustomUserClaims = async (uid: string, customClaims: object): Promise<void> => {
  try {
    const auth = getFirebaseAuth();
    await auth.setCustomUserClaims(uid, customClaims);
    
    logger.info('Custom user claims set successfully', { uid, customClaims });
  } catch (error) {
    logger.error('Failed to set custom user claims:', error);
    throw error;
  }
};