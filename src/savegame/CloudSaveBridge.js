let cloudModulePromise = null;
let pendingPayload = null;
let started = false;
let lastStatus = {
  started: false,
  ready: false,
  syncing: false,
  userId: null,
  error: null,
  hasPendingWrite: false
};

function loadCloudModule() {
  cloudModulePromise ||= import("./CloudSave.js");
  return cloudModulePromise;
}

function rememberError(error) {
  lastStatus = {
    ...lastStatus,
    error: error?.message || "Cloud save unavailable",
    hasPendingWrite: Boolean(pendingPayload)
  };
  return lastStatus;
}

export function scheduleCloudSave(payload) {
  pendingPayload = payload;
  lastStatus = { ...lastStatus, hasPendingWrite: true };
  if (!started) return;
  loadCloudModule()
    .then((cloud) => {
      if (pendingPayload) {
        cloud.scheduleCloudSave(pendingPayload);
        pendingPayload = null;
      }
      lastStatus = cloud.cloudSaveStatus();
    })
    .catch(rememberError);
}

export function cloudSaveStatus() {
  return lastStatus;
}

export function startCloudSaveSync(config) {
  started = true;
  lastStatus = { ...lastStatus, started: true };
  return loadCloudModule()
    .then(async (cloud) => {
      await cloud.startCloudSaveSync(config);
      if (pendingPayload) {
        cloud.scheduleCloudSave(pendingPayload);
        pendingPayload = null;
      }
      lastStatus = cloud.cloudSaveStatus();
      return lastStatus;
    })
    .catch(rememberError);
}
