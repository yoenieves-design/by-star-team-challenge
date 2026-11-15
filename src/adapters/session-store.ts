import type { Session } from '../domain/types.ts';

type Change = (session: Session) => Session;
const storeName = 'replays';

export interface SessionStore {
  readonly persistent: boolean;
  load: () => Promise<Session>;
  update: (change: Change) => Promise<Session>;
  subscribe: (callback: () => void) => void;
}

function memoryStore(initial: Session): SessionStore {
  let session = initial;
  return {
    persistent: false,
    load: async () => session,
    update: async change => (session = change(session)),
    subscribe: () => {},
  };
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('by-star-mission-demo', 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Browser storage is busy.'));
    request.onsuccess = () => resolve(request.result);
  });
}

export async function openSessionStore(namespace: string, initial: Session, crewIds: string[]): Promise<SessionStore> {
  const key = namespace + ':' + initial.scenarioId;
  function normalize(input: unknown): Session {
    const candidate = input as Partial<Session> | undefined;
    if (!candidate || candidate.version !== 1 || candidate.scenarioId !== initial.scenarioId
      || !crewIds.includes(candidate.crewId ?? '') || !Number.isFinite(candidate.anchorS)
      || (candidate.playingSince !== null && !Number.isFinite(candidate.playingSince))
      || ![1, 2, 4, 8].includes(candidate.speed ?? 0)
      || typeof candidate.simple !== 'boolean' || !Array.isArray(candidate.activity)) return initial;
    return candidate as Session;
  }

  try {
    const database = await openDatabase();
    database.onversionchange = () => database.close();
    let channel: BroadcastChannel | undefined;
    try {
      channel = new BroadcastChannel('by-star:' + key);
    } catch {
      // Storage still works when cross-tab notifications are unavailable.
    }
    function transact(change?: Change): Promise<Session> {
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, change ? 'readwrite' : 'readonly');
        const store = transaction.objectStore(storeName);
        const get = store.get(key);
        let session: Session;
        transaction.oncomplete = () => resolve(session);
        transaction.onabort = () => reject(transaction.error || new Error('The replay could not be saved.'));
        transaction.onerror = () => reject(transaction.error || new Error('Browser storage is unavailable.'));
        get.onsuccess = () => {
          try {
            session = normalize(get.result);
            if (change) {
              session = change(session);
              store.put(session, key);
            }
          } catch (error) {
            reject(error);
            transaction.abort();
          }
        };
      });
    }
    await transact();
    return {
      persistent: true,
      load: () => transact(),
      update: async change => {
        const saved = await transact(change);
        channel?.postMessage('updated');
        return saved;
      },
      subscribe: callback => channel?.addEventListener('message', callback),
    };
  } catch {
    return memoryStore(initial);
  }
}
