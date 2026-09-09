// Thin client for the Apps Script Web App backend (see /apps-script/Code.gs).
// Connection details live in localStorage, set once via the Settings screen —
// both Ali and Mohsen paste the same Script URL + shared token.

const STORAGE_KEY = "momken_config";

export function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.scriptUrl && parsed?.token ? parsed : null;
  } catch {
    return null;
  }
}

export function saveConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

async function call(config, action, body = {}) {
  if (!config?.scriptUrl || !config?.token) {
    throw new Error("Not connected — set the Script URL and token in Settings.");
  }

  let res;
  try {
    res = await fetch(config.scriptUrl, {
      method: "POST",
      body: JSON.stringify({ token: config.token, action, ...body }),
    });
  } catch {
    throw new Error("Couldn't reach the backend. Check the Script URL and your connection.");
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Backend returned an unexpected response (HTTP ${res.status}).`);
  }

  if (data.error === "unauthorized") throw new Error("Token rejected — check it matches Settings on the backend.");
  if (data.error) throw new Error(data.error);
  return data;
}

export function fetchTasks(config) {
  return call(config, "list").then((data) => data.tasks);
}

export function createTask(config, task) {
  return call(config, "create", { task }).then((data) => data.task);
}

export function updateTask(config, id, patch) {
  return call(config, "update", { id, patch }).then((data) => data.task);
}

export function deleteTask(config, id) {
  return call(config, "delete", { id }).then((data) => data.ok);
}
