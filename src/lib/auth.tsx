import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { auth, db } from './firebase';
import type { User } from './types';

export type RegisterFields = { name: string; phone: string; address: string; email: string; password: string };

type AuthContextValue = {
  /** The signed-in person, or null for visitors who have not logged in. */
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (fields: RegisterFields) => Promise<void>;
  signOut: () => Promise<void>;
  sendReset: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Builds the app's user from three places:
 *  - Firebase Authentication (who they are)
 *  - users/{uid} in Firestore (name, phone, address)
 *  - admins/{uid} in Firestore (exists only for the shop owner; it can only be created in the Firebase console)
 */
async function loadUser(firebaseUser: FirebaseUser): Promise<User> {
  const email = firebaseUser.email ?? '';
  let profile: Record<string, unknown> = {};
  let isAdmin = false;
  try {
    const [profileSnap, adminSnap] = await Promise.all([
      getDoc(doc(db, 'users', firebaseUser.uid)),
      getDoc(doc(db, 'admins', firebaseUser.uid)),
    ]);
    profile = profileSnap.exists() ? profileSnap.data() : {};
    isAdmin = adminSnap.exists();
  } catch (error) {
    // Keep the person signed in even if the profile could not be read; they can still browse.
    console.error('Could not load the profile', error);
  }
  const text = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
  return {
    id: firebaseUser.uid,
    name: text(profile.name, firebaseUser.displayName || email.split('@')[0] || 'Customer'),
    phone: text(profile.phone),
    address: text(profile.address),
    email,
    role: isAdmin ? 'admin' : 'customer',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // While sign-in / registration is running we load the profile ourselves, so the listener below stays out of the way.
  const busy = useRef(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, async firebaseUser => {
        if (busy.current) return;
        setUser(firebaseUser ? await loadUser(firebaseUser) : null);
        setIsLoading(false);
      }),
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    busy.current = true;
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      setUser(await loadUser(credential.user));
    } finally {
      busy.current = false;
    }
  }, []);

  const register = useCallback(async (fields: RegisterFields) => {
    busy.current = true;
    try {
      const email = fields.email.trim().toLowerCase();
      const credential = await createUserWithEmailAndPassword(auth, email, fields.password);
      // Fields must match the rules in firestore.rules exactly.
      await setDoc(doc(db, 'users', credential.user.uid), {
        name: fields.name.trim(),
        phone: fields.phone.trim(),
        address: fields.address.trim(),
        email,
      });
      setUser(await loadUser(credential.user));
    } finally {
      busy.current = false;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } finally {
      // Even if the request fails, the screen must never look signed in.
      setUser(null);
    }
  }, []);

  const sendReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, signIn, register, signOut, sendReset }),
    [user, isLoading, signIn, register, signOut, sendReset],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

export function useLogout() {
  const { signOut } = useAuth();
  const [isPending, setPending] = useState(false);
  return {
    isPending,
    logout: (onDone?: () => void) => {
      setPending(true);
      void signOut().finally(() => {
        setPending(false);
        onDone?.();
      });
    },
  };
}
