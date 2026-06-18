import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, browserPopupRedirectResolver } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, setLogLevel, memoryLocalCache } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
import firebaseConfig from '@/firebase-applet-config.json';

// Quiet connection warnings/information to avoid pollution of the test logging frame
try {
  setLogLevel('error');
} catch (e) {
  console.warn('Could not set Firestore log level:', e);
}

console.log('Firebase Config Debug:', {
  projectId: firebaseConfig.projectId,
  apiKeyPrefix: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 8) : 'MISSING',
  authDomain: firebaseConfig.authDomain,
  databaseId: firebaseConfig.firestoreDatabaseId
});

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('remixed')) {
  console.error('CRITICAL: Firebase API Key is missing or invalid placeholder detected. Current key prefix:', firebaseConfig.apiKey?.substring(0, 5));
}

const app = initializeApp(firebaseConfig);

// Use initializeFirestore with memoryLocalCache to avoid IndexedDB issues in sandboxed iframes
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
}, firebaseConfig.firestoreDatabaseId || '(default)');

// Robust Auth initialization for iframes and cross-origin environments
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});

export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Detect Quota Exceeded / Resource Exhausted errors quietly to prevent UI popups and banners
  const isQuota = errorMessage.includes('Quota exceeded') || 
                  errorMessage.includes('Quota limit exceeded') || 
                  errorMessage.includes('Resource exhausted') ||
                  errorMessage.includes('quota') ||
                  errorMessage.includes('exhausted');
                  
  if (isQuota) {
    console.info('Firestore Quota: Handled gracefully and suppressed to prevent disruption.');
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Connectivity check
 * REMOVED: Initial connection test to save Firestore read quota.
 * Quota limit exceeded errors should be handled by the application UI.
 */
