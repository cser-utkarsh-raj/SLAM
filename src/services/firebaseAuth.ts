import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import appletConfig from '../../firebase-applet-config.json';
import { UserProfile, ApplicationRecord } from '../types';

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  idToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export function getFirebaseConfig() {
  return {
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || 'slam-705a3',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId || '1:971102605314:web:1fd8407a412211e725971b',
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || 'slam-705a3.firebaseapp.com',
    firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId || '(default)',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || 'slam-705a3.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || '971102605314',
  };
}

const AUTH_STORAGE_KEY = 'slam_auth_session';

export class AuthService {
  private static currentUser: AuthUser | null = null;
  private static listeners: ((user: AuthUser | null) => void)[] = [];
  private static refreshPromise: Promise<AuthUser | null> | null = null;

  public static init(): AuthUser | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
        this.notify();
      }
    } catch (e) {
      console.warn('Could not restore auth session:', e);
      this.currentUser = null;
    }
    return this.currentUser;
  }

  public static getUser(): AuthUser | null {
    if (!this.currentUser) this.init();
    return this.currentUser;
  }

  public static onAuthStateChanged(cb: (user: AuthUser | null) => void): () => void {
    this.listeners.push(cb);
    cb(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private static notify() {
    this.listeners.forEach((l) => l(this.currentUser));
  }

  private static persist(user: AuthUser) {
    this.currentUser = user;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    this.notify();
  }

  public static async getValidIdToken(forceRefresh = false): Promise<string | null> {
    const user = this.getUser();
    if (!user?.idToken) return null;

    const expiresAt = user.expiresAt || 0;
    const stillValid = expiresAt > Date.now() + 60_000;
    if (!forceRefresh && stillValid) return user.idToken;
    if (!user.refreshToken) return user.idToken;

    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        try {
          const cfg = getFirebaseConfig();
          const refreshUrl = `https://securetoken.googleapis.com/v1/token?key=${cfg.apiKey}`;
          const response = await fetch(refreshUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: user.refreshToken || '',
            }),
          });
          const data = await response.json();
          if (!response.ok || !data.id_token) {
            throw new Error(data?.error?.message || 'Firebase session refresh failed.');
          }
          const refreshed: AuthUser = {
            ...user,
            idToken: data.id_token,
            refreshToken: data.refresh_token || user.refreshToken,
            expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
          };
          this.persist(refreshed);
          return refreshed;
        } catch (error) {
          console.warn('Firebase session refresh failed:', error);
          return null;
        } finally {
          this.refreshPromise = null;
        }
      })();
    }

    const refreshed = await this.refreshPromise;
    return refreshed?.idToken || user.idToken;
  }

  public static async getIdToken(forceRefresh = false): Promise<string | null> {
    return this.getValidIdToken(forceRefresh);
  }

  public static async signInWithGoogle(): Promise<AuthUser> {
    try {
      const cfg = getFirebaseConfig();
      const app = !getApps().length ? initializeApp(cfg) : getApp();
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const token = await cred.user.getIdToken(true);
      const user: AuthUser = {
        uid: cred.user.uid,
        email: cred.user.email || '',
        displayName: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
        idToken: token,
        refreshToken: cred.user.refreshToken,
        expiresAt: Date.now() + 55 * 60 * 1000,
      };
      this.persist(user);
      return user;
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain') {
        const host = window.location.hostname;
        throw new Error(`Google sign-in is not enabled for ${host}. Add this domain in Firebase Console → Authentication → Settings → Authorized domains, then try again.`);
      }
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('closed-by-user')) {
        throw new Error('Google sign-in was cancelled.');
      }
      if (err?.code === 'auth/popup-blocked') {
        throw new Error('Sign-in popup was blocked by your browser. Please allow popups.');
      }
      throw new Error(err?.message || 'Google sign-in failed.');
    }
  }

  public static async signUp(email: string, pass: string, name?: string): Promise<AuthUser> {
    const cfg = getFirebaseConfig();
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${cfg.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, returnSecureToken: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(this.friendlyAuthError(data?.error?.message || 'Failed to create account.'));
    }
    const user: AuthUser = {
      uid: data.localId,
      email: data.email,
      displayName: name?.trim() || data.email?.split('@')[0] || 'User',
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + Number(data.expiresIn || 3600) * 1000,
    };
    this.persist(user);
    return user;
  }

  public static async signIn(email: string, pass: string): Promise<AuthUser> {
    const cfg = getFirebaseConfig();
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${cfg.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, returnSecureToken: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(this.friendlyAuthError(data?.error?.message || 'Authentication failed.'));
    }
    const user: AuthUser = {
      uid: data.localId,
      email: data.email,
      displayName: data.displayName || data.email?.split('@')[0] || 'User',
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + Number(data.expiresIn || 3600) * 1000,
    };
    this.persist(user);
    return user;
  }

  public static async anonymousSignIn(): Promise<AuthUser> {
    const cfg = getFirebaseConfig();
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${cfg.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Failed to start guest session.');
    const user: AuthUser = {
      uid: data.localId,
      email: 'guest@slam.local',
      displayName: 'Guest Candidate',
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + Number(data.expiresIn || 3600) * 1000,
    };
    this.persist(user);
    return user;
  }

  public static signOut() {
    this.currentUser = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.notify();
  }

  private static friendlyAuthError(code: string): string {
    if (code.includes('EMAIL_EXISTS')) return 'An account with this email address already exists. Please sign in.';
    if (code.includes('INVALID_PASSWORD') || code.includes('INVALID_LOGIN_CREDENTIALS')) return 'Invalid email or password.';
    if (code.includes('EMAIL_NOT_FOUND')) return 'No account found with this email. Please create an account.';
    if (code.includes('WEAK_PASSWORD')) return 'Password should be at least 6 characters long.';
    if (code.includes('INVALID_EMAIL')) return 'Please enter a valid email address.';
    if (code.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) return 'Too many failed login attempts. Please try again later.';
    return code || 'Authentication failed.';
  }
}

function toFirestoreFields(obj: any): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) fields[key] = { nullValue: null };
    else if (typeof value === 'boolean') fields[key] = { booleanValue: value };
    else if (typeof value === 'number') fields[key] = { doubleValue: value };
    else if (typeof value === 'string') fields[key] = { stringValue: value };
    else if (Array.isArray(value) || typeof value === 'object') fields[key] = { stringValue: JSON.stringify(value) };
  }
  return fields;
}

function fromFirestoreFields(fields: Record<string, any>): any {
  const result: Record<string, any> = {};
  if (!fields) return result;
  for (const [key, valObj] of Object.entries(fields)) {
    if ('stringValue' in valObj) {
      const s = valObj.stringValue;
      if (s.startsWith('[') || s.startsWith('{')) {
        try { result[key] = JSON.parse(s); continue; } catch { /* keep string */ }
      }
      result[key] = s;
    } else if ('doubleValue' in valObj || 'integerValue' in valObj) result[key] = Number(valObj.doubleValue ?? valObj.integerValue);
    else if ('booleanValue' in valObj) result[key] = Boolean(valObj.booleanValue);
    else if ('nullValue' in valObj) result[key] = null;
  }
  return result;
}

const getDbBaseUrl = () => {
  const cfg = getFirebaseConfig();
  return `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${cfg.firestoreDatabaseId}/documents`;
};

async function firestoreRequest(uid: string, token: string, path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const cfg = getFirebaseConfig();
  const url = `${getDbBaseUrl()}/users/${uid}/userData/${path}?key=${cfg.apiKey}`;
  const response = await fetch(url, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` },
  });
  if ((response.status === 401 || response.status === 403) && retry) {
    const refreshed = await AuthService.getValidIdToken(true);
    if (refreshed && refreshed !== token) return firestoreRequest(uid, refreshed, path, init, false);
  }
  return response;
}

export async function fetchFirestoreProfile(uid: string, token: string): Promise<UserProfile | null> {
  try {
    const valid = (await AuthService.getValidIdToken()) || token;
    const res = await firestoreRequest(uid, valid, 'profile');
    if (!res.ok) return null;
    const data = await res.json();
    return data.fields ? (fromFirestoreFields(data.fields) as UserProfile) : null;
  } catch (e) {
    console.warn('Failed to fetch profile from Firestore:', e);
    return null;
  }
}

export async function saveFirestoreProfile(uid: string, token: string, profile: UserProfile): Promise<boolean> {
  try {
    const valid = (await AuthService.getValidIdToken()) || token;
    const res = await firestoreRequest(uid, valid, 'profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(profile) }),
    });
    return res.ok;
  } catch (e) {
    console.warn('Failed to save profile to Firestore:', e);
    return false;
  }
}

export async function fetchFirestoreApplications(uid: string, token: string): Promise<ApplicationRecord[]> {
  try {
    const valid = (await AuthService.getValidIdToken()) || token;
    const res = await firestoreRequest(uid, valid, 'applications');
    if (!res.ok) return [];
    const data = await res.json();
    return data.fields?.items?.stringValue ? JSON.parse(data.fields.items.stringValue) as ApplicationRecord[] : [];
  } catch (e) {
    console.warn('Failed to fetch applications from Firestore:', e);
    return [];
  }
}

export async function saveFirestoreApplications(uid: string, token: string, apps: ApplicationRecord[]): Promise<boolean> {
  try {
    const valid = (await AuthService.getValidIdToken()) || token;
    const res = await firestoreRequest(uid, valid, 'applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { items: { stringValue: JSON.stringify(apps) }, updatedAt: { stringValue: new Date().toISOString() } } }),
    });
    return res.ok;
  } catch (e) {
    console.warn('Failed to save applications to Firestore:', e);
    return false;
  }
}

export async function fetchFirestoreSavedJobIds(uid: string, token: string): Promise<string[]> {
  try {
    const valid = (await AuthService.getValidIdToken()) || token;
    const res = await firestoreRequest(uid, valid, 'savedJobs');
    if (!res.ok) return [];
    const data = await res.json();
    return data.fields?.jobIds?.stringValue ? JSON.parse(data.fields.jobIds.stringValue) as string[] : [];
  } catch (e) {
    console.warn('Failed to fetch saved jobs from Firestore:', e);
    return [];
  }
}

export async function saveFirestoreSavedJobIds(uid: string, token: string, jobIds: string[]): Promise<boolean> {
  try {
    const valid = (await AuthService.getValidIdToken()) || token;
    const res = await firestoreRequest(uid, valid, 'savedJobs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { jobIds: { stringValue: JSON.stringify(jobIds) }, updatedAt: { stringValue: new Date().toISOString() } } }),
    });
    return res.ok;
  } catch (e) {
    console.warn('Failed to save saved jobs to Firestore:', e);
    return false;
  }
}
