import config from '../../firebase-applet-config.json';
import { UserProfile } from '../types';

type Session = { idToken: string; localId: string };
let session: Session | null = null;

async function getSession(): Promise<Session | null> {
  if (session) return session;
  try {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${config.apiKey}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({returnSecureToken:true}) });
    if (!r.ok) return null;
    session = await r.json();
    return session;
  } catch { return null; }
}

export async function saveProfile(profile: UserProfile): Promise<boolean> {
  const s = await getSession();
  if (!s) return false;
  try {
    const path = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/users/${s.localId}/profile?key=${config.apiKey}`;
    const fields: Record<string, unknown> = {};
    for (const [key,value] of Object.entries(profile)) {
      if (typeof value === 'string') fields[key] = { stringValue:value };
      else if (typeof value === 'number') fields[key] = { doubleValue:value };
      else if (typeof value === 'boolean') fields[key] = { booleanValue:value };
      else fields[key] = { stringValue:JSON.stringify(value) };
    }
    const r = await fetch(path, { method:'PATCH', headers:{'Content-Type':'application/json',Authorization:`Bearer ${s.idToken}`}, body:JSON.stringify({fields}) });
    return r.ok;
  } catch { return false; }
}
