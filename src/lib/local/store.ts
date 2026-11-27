import type { LocalDatabase, LocalProfileRecord } from './types';

const STORAGE_KEY = 'strandpath.static.v1';

function emptyProfile(): LocalProfileRecord {
  return {
    gradeLevel: null,
    school: null,
    city: null,
    interests: null,
    strengths: null,
    goals: null,
    learningPreference: null,
    careerInterest: null,
    selectedStrand: null,
    consentAt: null,
    updatedAt: null
  };
}

function emptyDatabase(): LocalDatabase {
  return {
    version: 1,
    nextId: 1,
    users: [],
    profiles: {},
    assessments: [],
    programs: [],
    tickets: [],
    notifications: [],
    session: null
  };
}

/** Read the local database. Corrupt or partial data is replaced, never guessed at. */
export function readDb(): LocalDatabase {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDatabase();
    const parsed = JSON.parse(raw) as Partial<LocalDatabase>;
    if (!parsed || parsed.version !== 1) return emptyDatabase();
    return {
      ...emptyDatabase(),
      ...parsed,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      profiles: parsed.profiles && typeof parsed.profiles === 'object' ? parsed.profiles : {},
      assessments: Array.isArray(parsed.assessments) ? parsed.assessments : [],
      programs: Array.isArray(parsed.programs) ? parsed.programs : [],
      tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      session: parsed.session ?? null
    };
  } catch {
    return emptyDatabase();
  }
}

export function writeDb(db: LocalDatabase): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Quota or private-mode failures must not crash the application; callers
    // read the stored copy back, so a failed write simply does not persist.
  }
}

/** Read, mutate and persist in one step. */
export function updateDb<T>(mutate: (db: LocalDatabase) => T): T {
  const db = readDb();
  const result = mutate(db);
  writeDb(db);
  return result;
}

export function nextId(db: LocalDatabase): number {
  const id = db.nextId;
  db.nextId = id + 1;
  return id;
}

export function newProfile(consentAt: string | null): LocalProfileRecord {
  return { ...emptyProfile(), consentAt };
}

export function ensureProfile(db: LocalDatabase, userId: number): LocalProfileRecord {
  const key = String(userId);
  if (!db.profiles[key]) db.profiles[key] = newProfile(null);
  return db.profiles[key];
}

export function clearLocalDatabase(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing else to do if the browser refuses.
  }
}
