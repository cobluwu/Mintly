import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { MintlyWorkspaceState } from '../shared/types';
import { sanitizeWorkspaceState } from './storage';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let connectionChecked = false;
let firestoreQuotaExhausted = false;

export function isFirestoreQuotaExhausted(): boolean {
  return firestoreQuotaExhausted;
}

function isQuotaOrRateError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /quota|resource-exhausted|rate|too many requests|429/i.test(msg);
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      out[k] = v.map((item) =>
        item && typeof item === 'object' && !Array.isArray(item)
          ? stripUndefined(item as Record<string, unknown>)
          : item
      );
    } else if (v && typeof v === 'object' && !(v instanceof Date)) {
      // Preserve Firestore FieldValue sentinels (e.g. serverTimestamp())
      if ('_methodName' in (v as Record<string, unknown>)) {
        out[k] = v;
      } else {
        out[k] = stripUndefined(v as Record<string, unknown>);
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function testFirestoreConnection(): Promise<void> {
  if (connectionChecked || firestoreQuotaExhausted) return;
  connectionChecked = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (isQuotaOrRateError(error)) {
      firestoreQuotaExhausted = true;
      console.warn('Firestore free-tier quota or rate limit reached; using local storage.');
      return;
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleAuthProvider);
}

export async function signOutFirebase() {
  return signOut(auth);
}

export async function loadOrSeedFirestoreWorkspace(
  uid: string,
  fallbackState: MintlyWorkspaceState
): Promise<MintlyWorkspaceState> {
  if (firestoreQuotaExhausted) {
    return fallbackState;
  }
  await testFirestoreConnection();
  if (firestoreQuotaExhausted) {
    return fallbackState;
  }

  const userDocRef = doc(db, 'users', uid);

  try {
    const profileSnap = await getDoc(userDocRef);
    if (!profileSnap.exists()) {
      const seeded: MintlyWorkspaceState = {
        ...fallbackState,
        profile: {
          ...fallbackState.profile,
          uid,
          email: auth.currentUser?.email || fallbackState.profile.email,
          displayName: auth.currentUser?.displayName || fallbackState.profile.displayName,
        },
      };
      await persistFullWorkspaceToFirestore(uid, seeded);
      return seeded;
    }

    const [accountsSnap, txSnap, budgetsSnap, vaultsSnap, recurringSnap, circlesSnap] =
      await Promise.all([
        getDocs(collection(db, 'users', uid, 'accounts')),
        getDocs(collection(db, 'users', uid, 'transactions')),
        getDocs(collection(db, 'users', uid, 'budgets')),
        getDocs(collection(db, 'users', uid, 'vaults')),
        getDocs(collection(db, 'users', uid, 'recurring')),
        getDocs(collection(db, 'users', uid, 'circles')),
      ]);

    const profileData = profileSnap.data();
    return sanitizeWorkspaceState(
      {
        profile: {
          ...fallbackState.profile,
          uid,
          displayName: String(
            profileData.displayName || fallbackState.profile.displayName || 'Student'
          ),
          email: profileData.email ? String(profileData.email) : fallbackState.profile.email,
          university: profileData.university
            ? String(profileData.university)
            : fallbackState.profile.university,
          currency: profileData.currency || 'INR',
          language: profileData.language || fallbackState.profile.language,
          allowanceAmountCents:
            profileData.allowanceAmountCents != null
              ? Number(profileData.allowanceAmountCents)
              : fallbackState.profile.allowanceAmountCents,
          nextAllowanceIso: profileData.nextAllowanceIso
            ? String(profileData.nextAllowanceIso)
            : fallbackState.profile.nextAllowanceIso,
          cycleDays:
            profileData.cycleDays != null
              ? Number(profileData.cycleDays)
              : fallbackState.profile.cycleDays,
          onboardingCompleted:
            typeof profileData.onboardingCompleted === 'boolean'
              ? profileData.onboardingCompleted
              : fallbackState.profile.onboardingCompleted,
        },
        accounts: accountsSnap.docs.map((d) => d.data()),
        transactions: txSnap.docs
          .map((d) => d.data() as MintlyWorkspaceState['transactions'][number])
          .sort(
            (a, b) =>
              new Date(b.occurredAtUtc).getTime() - new Date(a.occurredAtUtc).getTime()
          ),
        budgets: budgetsSnap.docs.map((d) => d.data()),
        vaults: vaultsSnap.docs.map((d) => d.data()),
        recurring: recurringSnap.docs.map((d) => d.data()),
        circles: circlesSnap.docs.map((d) => d.data()),
        roundUp: fallbackState.roundUp,
        rewards: fallbackState.rewards,
        auditLogs: fallbackState.auditLogs,
      },
      fallbackState
    );
  } catch (error) {
    if (isQuotaOrRateError(error)) {
      firestoreQuotaExhausted = true;
      console.warn('Firestore quota/rate limit reached during load; falling back to local state.');
      return fallbackState;
    }
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

export async function persistFullWorkspaceToFirestore(
  uid: string,
  state: MintlyWorkspaceState
): Promise<void> {
  if (firestoreQuotaExhausted) return;
  try {
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', uid);
    batch.set(
      userRef,
      stripUndefined({
        uid,
        displayName: state.profile.displayName.slice(0, 80),
        email: state.profile.email ? state.profile.email.slice(0, 120) : undefined,
        university: state.profile.university
          ? state.profile.university.slice(0, 100)
          : undefined,
        currency: 'INR',
        language: state.profile.language,
        allowanceAmountCents: Math.round(state.profile.allowanceAmountCents),
        nextAllowanceIso: state.profile.nextAllowanceIso,
        cycleDays: Math.round(state.profile.cycleDays),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );

    for (const acc of state.accounts) {
      batch.set(
        doc(db, 'users', uid, 'accounts', acc.id),
        stripUndefined({
          ...acc,
          ownerId: uid,
          updatedAt: serverTimestamp(),
        })
      );
    }
    for (const tx of state.transactions) {
      batch.set(
        doc(db, 'users', uid, 'transactions', tx.id),
        stripUndefined({
          ...tx,
          ownerId: uid,
          createdAt: serverTimestamp(),
        })
      );
    }
    for (const b of state.budgets) {
      batch.set(
        doc(db, 'users', uid, 'budgets', b.id),
        stripUndefined({
          ...b,
          ownerId: uid,
          updatedAt: serverTimestamp(),
        })
      );
    }
    for (const v of state.vaults) {
      batch.set(
        doc(db, 'users', uid, 'vaults', v.id),
        stripUndefined({
          ...v,
          ownerId: uid,
          updatedAt: serverTimestamp(),
        })
      );
    }
    for (const r of state.recurring) {
      batch.set(
        doc(db, 'users', uid, 'recurring', r.id),
        stripUndefined({
          ...r,
          ownerId: uid,
        })
      );
    }
    for (const c of state.circles) {
      batch.set(
        doc(db, 'users', uid, 'circles', c.id),
        stripUndefined({
          ...c,
          ownerId: uid,
          updatedAt: serverTimestamp(),
        })
      );
    }

    await batch.commit();
  } catch (error) {
    if (isQuotaOrRateError(error)) {
      firestoreQuotaExhausted = true;
      console.warn('Firestore quota/rate limit reached during sync; continuing with local storage.');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
}

export async function syncFirestoreDoc(
  uid: string,
  subcollection: 'accounts' | 'transactions' | 'budgets' | 'vaults' | 'recurring' | 'circles',
  docId: string,
  payload: Record<string, unknown>,
  timestampField: 'createdAt' | 'updatedAt' | null = 'updatedAt'
) {
  if (firestoreQuotaExhausted) return;
  const path = `users/${uid}/${subcollection}/${docId}`;
  try {
    const cleanPayload: Record<string, unknown> = stripUndefined({
      ...payload,
      ownerId: uid,
    });
    if (timestampField) {
      cleanPayload[timestampField] = serverTimestamp();
    }
    await setDoc(doc(db, 'users', uid, subcollection, docId), cleanPayload, { merge: true });
  } catch (error) {
    if (isQuotaOrRateError(error)) {
      firestoreQuotaExhausted = true;
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
