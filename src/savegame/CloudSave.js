import { signInAnonymously } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "../services/FirebaseApp.js";

const COLLECTION = "saves";
const WRITE_DELAY_MS = 900;

const state = {
  started: false,
  ready: false,
  syncing: false,
  userId: null,
  error: null,
  pendingPayload: null,
  writeTimer: null,
  promise: null
};

function saveRef(userId) {
  return doc(firestore, COLLECTION, userId);
}

async function ensureAnonymousUser() {
  if (firebaseAuth.currentUser) return firebaseAuth.currentUser;
  const credential = await signInAnonymously(firebaseAuth);
  return credential.user;
}

async function writePayload(payload) {
  if (!state.userId || !payload) return false;
  await setDoc(saveRef(state.userId), {
    schemaVersion: 1,
    saveVersion: payload.version,
    clientUpdatedAt: payload.meta?.updatedAt || 0,
    save: payload,
    updatedAt: serverTimestamp()
  }, { merge: true });
  return true;
}

async function flushPending() {
  if (!state.ready || state.syncing || !state.pendingPayload) return;
  const payload = state.pendingPayload;
  state.pendingPayload = null;
  state.syncing = true;
  try {
    await writePayload(payload);
    state.error = null;
  } catch (error) {
    state.error = error;
    state.pendingPayload = payload;
  } finally {
    state.syncing = false;
    if (state.pendingPayload) scheduleCloudSave(state.pendingPayload);
  }
}

export function scheduleCloudSave(payload) {
  state.pendingPayload = payload;
  if (!state.ready) return;
  clearTimeout(state.writeTimer);
  state.writeTimer = setTimeout(() => {
    flushPending();
  }, WRITE_DELAY_MS);
}

export function cloudSaveStatus() {
  return {
    started: state.started,
    ready: state.ready,
    syncing: state.syncing,
    userId: state.userId,
    error: state.error?.message || null,
    hasPendingWrite: Boolean(state.pendingPayload)
  };
}

export function startCloudSaveSync({ loadLocalPayload, applyCloudPayload, shouldUseCloudPayload }) {
  if (state.started) return state.promise;
  state.started = true;
  state.promise = (async () => {
    const user = await ensureAnonymousUser();
    state.userId = user.uid;

    const snapshot = await getDoc(saveRef(user.uid));
    const localPayload = loadLocalPayload();
    const cloudPayload = snapshot.exists() ? snapshot.data()?.save : null;
    if (cloudPayload && shouldUseCloudPayload(cloudPayload, localPayload)) {
      applyCloudPayload(cloudPayload);
    }

    state.ready = true;
    await writePayload(loadLocalPayload());
    await flushPending();
    state.error = null;
    return cloudSaveStatus();
  })().catch((error) => {
    state.error = error;
    state.ready = false;
    return cloudSaveStatus();
  });
  return state.promise;
}
