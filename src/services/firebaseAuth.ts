import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import config from '../../firebase-applet-config.json';
import { UserProfile, ApplicationRecord, ApplicationAnswer } from '../types';

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  idToken: string;
  refreshToken?: string;
}

const AUTH_STORAGE_KEY = 'slam_auth_session';

export class AuthService {
  private static currentUser: AuthUser | null = null;
  private static listeners: ((user: AuthUser | null) => void)[] = [];

  public static init(): AuthUser | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
        this.notify();
      }
    } catch (e) {
      console.warn('Could not restore auth session:', e);
    }
    return this.currentUser;
  }

  public static getUser(): AuthUser | null {
    if (!this.currentUser) {
      this.init();
    }
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

  public static async signInWithGoogle(): Promise<AuthUser> {
    try {
      const app = !getApps().length ? initializeApp(config) : getApp();
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const token = await cred.user.getIdToken();
      const user: AuthUser = {
        uid: cred.user.uid,
        email: cred.user.email || '',
        displayName: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
        idToken: token,
        refreshToken: cred.user.refreshToken,
      };

      this.currentUser = user;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      this.notify();
      return user;
    } catch (err: any) {
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
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${config.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: pass,
        returnSecureToken: true,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error?.message || 'Failed to create account.';
      throw new Error(this.friendlyAuthError(msg));
    }

    const user: AuthUser = {
      uid: data.localId,
      email: data.email,
      displayName: name || data.email?.split('@')[0] || 'User',
      idToken: data.idToken,
      refreshToken: data.refreshToken,
    };

    this.currentUser = user;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    this.notify();
    return user;
  }

  public static async signIn(email: string, pass: string): Promise<AuthUser> {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${config.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: pass,
        returnSecureToken: true,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error?.message || 'Authentication failed.';
      throw new Error(this.friendlyAuthError(msg));
    }

    const user: AuthUser = {
      uid: data.localId,
      email: data.email,
      displayName: data.displayName || data.email?.split('@')[0] || 'User',
      idToken: data.idToken,
      refreshToken: data.refreshToken,
    };

    this.currentUser = user;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    this.notify();
    return user;
  }

  public static async anonymousSignIn(): Promise<AuthUser> {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${config.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error('Failed to start guest session.');
    }

    const user: AuthUser = {
      uid: data.localId,
      email: 'guest@slam.local',
      displayName: 'Guest Candidate',
      idToken: data.idToken,
      refreshToken: data.refreshToken,
    };

    this.currentUser = user;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    this.notify();
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

// REST helper to encode plain JS objects into Firestore document format
function toFirestoreFields(obj: any): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (typeof value === 'number') {
      fields[key] = { doubleValue: value };
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = { stringValue: JSON.stringify(value) };
    } else if (typeof value === 'object') {
      fields[key] = { stringValue: JSON.stringify(value) };
    }
  }
  return fields;
}

// REST helper to decode Firestore document fields to plain JS object
function fromFirestoreFields(fields: Record<string, any>): any {
  const result: Record<string, any> = {};
  if (!fields) return result;
  for (const [key, valObj] of Object.entries(fields)) {
    if ('stringValue' in valObj) {
      const s = valObj.stringValue;
      if (s.startsWith('[') || s.startsWith('{')) {
        try {
          result[key] = JSON.parse(s);
          continue;
        } catch {
          // fallback to string
        }
      }
      result[key] = s;
    } else if ('doubleValue' in valObj || 'integerValue' in valObj) {
      result[key] = Number(valObj.doubleValue ?? valObj.integerValue);
    } else if ('booleanValue' in valObj) {
      result[key] = Boolean(valObj.booleanValue);
    } else if ('nullValue' in valObj) {
      result[key] = null;
    }
  }
  return result;
}

// Firestore Database operations
const getDbBaseUrl = () => {
  return `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents`;
};

export async function fetchFirestoreProfile(uid: string, token: string): Promise<UserProfile | null> {
  try {
    const url = `${getDbBaseUrl()}/users/${uid}/userData/profile?key=${config.apiKey}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.fields) return null;
    return fromFirestoreFields(data.fields) as UserProfile;
  } catch (e) {
    console.warn('Failed to fetch profile from Firestore:', e);
    return null;
  }
}

export async function saveFirestoreProfile(uid: string, token: string, profile: UserProfile): Promise<boolean> {
  try {
    const url = `${getDbBaseUrl()}/users/${uid}/userData/profile?key=${config.apiKey}`;
    const fields = toFirestoreFields(profile);
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fields }),
    });
    return res.ok;
  } catch (e) {
    console.warn('Failed to save profile to Firestore:', e);
    return false;
  }
}

export async function fetchFirestoreApplications(uid: string, token: string): Promise<ApplicationRecord[]> {
  try {
    const url = `${getDbBaseUrl()}/users/${uid}/userData/applications?key=${config.apiKey}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.fields?.items?.stringValue) return [];
    return JSON.parse(data.fields.items.stringValue) as ApplicationRecord[];
  } catch (e) {
    console.warn('Failed to fetch applications from Firestore:', e);
    return [];
  }
}

export async function saveFirestoreApplications(uid: string, token: string, apps: ApplicationRecord[]): Promise<boolean> {
  try {
    const url = `${getDbBaseUrl()}/users/${uid}/userData/applications?key=${config.apiKey}`;
    const fields = {
      items: { stringValue: JSON.stringify(apps) },
      updatedAt: { stringValue: new Date().toISOString() },
    };
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fields }),
    });
    return res.ok;
  } catch (e) {
    console.warn('Failed to save applications to Firestore:', e);
    return false;
  }
}

export async function fetchFirestoreSavedJobIds(uid: string, token: string): Promise<string[]> {
  try {
    const url = `${getDbBaseUrl()}/users/${uid}/userData/savedJobs?key=${config.apiKey}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.fields?.jobIds?.stringValue) return [];
    return JSON.parse(data.fields.jobIds.stringValue) as string[];
  } catch (e) {
    return [];
  }
}

export async function saveFirestoreSavedJobIds(uid: string, token: string, jobIds: string[]): Promise<boolean> {
  try {
    const url = `${getDbBaseUrl()}/users/${uid}/userData/savedJobs?key=${config.apiKey}`;
    const fields = {
      jobIds: { stringValue: JSON.stringify(jobIds) },
      updatedAt: { stringValue: new Date().toISOString() },
    };
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fields }),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}
