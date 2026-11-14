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
export async function testFirestoreConnection(): Promise<void> {
  if (connectionChecked) return;
  connectionChecked = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
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
  await testFirestoreConnection();
  const userDocRef = doc(db, 'users', uid);

  try {
    const profileSnap = await getDoc(userDocRef);
    if (!profileSnap.exists()) {
      await persistFullWorkspaceToFirestore(uid, {
        ...fallbackState,
        profile: {
          ...fallbackState.profile,
          uid,
          email: auth.currentUser?.email || fallbackState.profile.email,
          displayName: auth.currentUser?.displayName || fallbackState.profile.displayName,
        },
      });
      return {
        ...fallbackState,
        profile: {
          ...fallbackState.profile,
          uid,
          email: auth.currentUser?.email || fallbackState.profile.email,
          displayName: auth.currentUser?.displayName || fallbackState.profile.displayName,
        },
      };
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
    return {
      profile: {
        uid,
        displayName: String(profileData.displayName || 'Student'),
        email: profileData.email ? String(profileData.email) : undefined,
        university: profileData.university ? String(profileData.university) : undefined,
        currency: profileData.currency,
        language: profileData.language,
        allowanceAmountCents: Number(profileData.allowanceAmountCents),
        nextAllowanceIso: String(profileData.nextAllowanceIso),
        cycleDays: Number(profileData.cycleDays),
      },
      accounts: accountsSnap.docs.map((d) => d.data() as MintlyWorkspaceState['accounts'][number]),
      transactions: txSnap.docs
        .map((d) => d.data() as MintlyWorkspaceState['transactions'][number])
        .sort((a, b) => new Date(b.occurredAtUtc).getTime() - new Date(a.occurredAtUtc).getTime()),
      budgets: budgetsSnap.docs.map((d) => d.data() as MintlyWorkspaceState['budgets'][number]),
      vaults: vaultsSnap.docs.map((d) => d.data() as MintlyWorkspaceState['vaults'][number]),
      recurring: recurringSnap.docs.map((d) => d.data() as MintlyWorkspaceState['recurring'][number]),
      circles: circlesSnap.docs.map((d) => d.data() as MintlyWorkspaceState['circles'][number]),
      auditLogs: fallbackState.auditLogs,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

export async function persistFullWorkspaceToFirestore(
  uid: string,
  state: MintlyWorkspaceState
): Promise<void> {
  try {
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', uid);
    batch.set(
      userRef,
      {
        uid,
        displayName: state.profile.displayName.slice(0, 80),
        ...(state.profile.email ? { email: state.profile.email.slice(0, 120) } : {}),
        ...(state.profile.university ? { university: state.profile.university.slice(0, 100) } : {}),
        currency: state.profile.currency,
        language: state.profile.language,
        allowanceAmountCents: Math.round(state.profile.allowanceAmountCents),
        nextAllowanceIso: state.profile.nextAllowanceIso,
        cycleDays: Math.round(state.profile.cycleDays),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    for (const acc of state.accounts) {
      batch.set(doc(db, 'users', uid, 'accounts', acc.id), {
        ...acc,
        ownerId: uid,
        updatedAt: serverTimestamp(),
      });
    }
    for (const tx of state.transactions) {
      batch.set(doc(db, 'users', uid, 'transactions', tx.id), {
        ...tx,
        ownerId: uid,
        createdAt: serverTimestamp(),
      });
    }
    for (const b of state.budgets) {
      batch.set(doc(db, 'users', uid, 'budgets', b.id), {
        ...b,
        ownerId: uid,
        updatedAt: serverTimestamp(),
      });
    }
    for (const v of state.vaults) {
      batch.set(doc(db, 'users', uid, 'vaults', v.id), {
        ...v,
        ownerId: uid,
        updatedAt: serverTimestamp(),
      });
    }
    for (const r of state.recurring) {
      batch.set(doc(db, 'users', uid, 'recurring', r.id), {
        ...r,
        ownerId: uid,
      });
    }
    for (const c of state.circles) {
      batch.set(doc(db, 'users', uid, 'circles', c.id), {
        ...c,
        ownerId: uid,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
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
  const path = `users/${uid}/${subcollection}/${docId}`;
  try {
    const cleanPayload: Record<string, unknown> = { ...payload, ownerId: uid };
    if (timestampField) {
      cleanPayload[timestampField] = serverTimestamp();
    }
    await setDoc(doc(db, 'users', uid, subcollection, docId), cleanPayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
