const channel = "lockin.tabs.v1";
const storageKey = "lockin.tabLock.v1";
const allowedOrigins = new Set(
  chrome.runtime
    .getManifest()
    .externally_connectable.matches.map((pattern) => pattern.slice(0, -2)),
);

const storageArea = chrome.storage.local;
let bounceTimer = null;

function getPageRole(sender) {
  const url = URL.parse(sender.url ?? "");
  if (
    !Number.isInteger(sender.tab?.id) ||
    sender.tab.incognito ||
    (sender.frameId !== undefined && sender.frameId !== 0) ||
    url === null ||
    url.origin !== sender.origin ||
    !allowedOrigins.has(url.origin)
  ) {
    return null;
  }

  if (url.pathname === "/session/new" || url.pathname === "/session/new/") {
    return { kind: "new", origin: url.origin };
  }
  if (url.pathname === "/session/solo" || url.pathname === "/session/solo/") {
    return { kind: "solo", origin: url.origin };
  }
  return null;
}

async function getLockState() {
  const stored = await storageArea.get(storageKey);
  const raw = stored[storageKey];
  if (!raw || typeof raw !== "object") {
    return {
      lockinTabId: null,
      lockinOrigin: "",
      lockedTabIds: [],
      lockedSites: [],
    };
  }
  return {
    lockinTabId: Number.isInteger(raw.lockinTabId) ? raw.lockinTabId : null,
    lockinOrigin: typeof raw.lockinOrigin === "string" ? raw.lockinOrigin : "",
    lockedTabIds: Array.isArray(raw.lockedTabIds) ? raw.lockedTabIds : [],
    lockedSites: Array.isArray(raw.lockedSites) ? raw.lockedSites : [],
  };
}

async function setLockState(state) {
  if (!state.lockedTabIds.length && !state.lockedSites.length) {
    await storageArea.remove(storageKey);
    return;
  }
  await storageArea.set({ [storageKey]: state });
}

function hasActiveLocks(state) {
  return state.lockedTabIds.length > 0 || state.lockedSites.length > 0;
}

function getTabHostname(tab) {
  const address = tab?.pendingUrl ?? tab?.url ?? "";
  return URL.parse(address)?.hostname ?? "";
}

function isLockinTab(tab, lockinOrigin) {
  if (!lockinOrigin) return false;
  const address = tab?.pendingUrl ?? tab?.url ?? "";
  return URL.parse(address)?.origin === lockinOrigin;
}

function isTabLocked(tab, state) {
  if (!tab || !Number.isInteger(tab.id) || tab.incognito) return false;
  if (tab.id === state.lockinTabId || isLockinTab(tab, state.lockinOrigin)) return false;

  if (state.lockedTabIds.includes(tab.id)) return true;
  const site = getTabHostname(tab);
  return Boolean(site && state.lockedSites.includes(site));
}

async function listTabs(senderTabId, state) {
  const tabs = await chrome.tabs.query({ windowType: "normal" });
  return Promise.all(
    tabs
      .filter((tab) => Number.isInteger(tab.id) && tab.id !== senderTabId && !tab.incognito)
      .map(async (tab) => {
        const address = tab.pendingUrl ?? tab.url ?? "";
        const url = URL.parse(address);
        const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(address));
        const revision = Array.from(new Uint8Array(hash), (byte) =>
          byte.toString(16).padStart(2, "0"),
        ).join("");
        const site = url?.hostname ?? "";

        return {
          id: tab.id,
          title: tab.title ?? "",
          site,
          revision,
          locked:
            state.lockedTabIds.includes(tab.id) ||
            Boolean(site && state.lockedSites.includes(site)),
        };
      }),
  );
}

function isTabSelection(tab) {
  return (
    Number.isInteger(tab?.id) &&
    tab.id >= 0 &&
    typeof tab.revision === "string" &&
    /^[0-9a-f]{64}$/.test(tab.revision)
  );
}

async function lockTabs(selection, senderTabId, lockinOrigin) {
  const state = await getLockState();
  const openTabs = await listTabs(senderTabId, state);
  const openById = new Map(openTabs.map((tab) => [tab.id, tab]));
  const selectedById = new Map(selection.map((tab) => [tab.id, tab.revision]));
  const lockinHost = URL.parse(lockinOrigin)?.hostname ?? "";

  const lockedIds = [];
  const nextTabIds = new Set(state.lockedTabIds);
  const nextSites = new Set(state.lockedSites);

  for (const [id, revision] of selectedById.entries()) {
    const tab = openById.get(id);
    if (!tab || tab.revision !== revision) continue;
    lockedIds.push(id);
    nextTabIds.add(id);
    if (tab.site && tab.site !== lockinHost) {
      nextSites.add(tab.site);
    }
  }

  const nextState = {
    lockinTabId: senderTabId,
    lockinOrigin,
    lockedTabIds: [...nextTabIds],
    lockedSites: [...nextSites],
  };
  await setLockState(nextState);

  return {
    lockedIds,
    lockedCount: Math.max(nextState.lockedTabIds.length, nextState.lockedSites.length),
  };
}

async function getStatus(senderTabId, pageRole) {
  const state = await getLockState();
  if (hasActiveLocks(state) && pageRole.kind === "solo") {
    state.lockinTabId = senderTabId;
    state.lockinOrigin = pageRole.origin;
    await setLockState(state);
  }
  return {
    lockedCount: Math.max(state.lockedTabIds.length, state.lockedSites.length),
  };
}

async function unlockTabs() {
  if (bounceTimer !== null) {
    clearTimeout(bounceTimer);
    bounceTimer = null;
  }
  await storageArea.remove(storageKey);
  return { unlocked: true };
}

async function findOrCreateLockinTab(state) {
  if (state.lockinTabId !== null) {
    try {
      const candidate = await chrome.tabs.get(state.lockinTabId);
      if (candidate && isLockinTab(candidate, state.lockinOrigin)) {
        return candidate;
      }
    } catch {
      // Tab no longer exists; fall through to search.
    }
  }

  if (state.lockinOrigin) {
    const allTabs = await chrome.tabs.query({ windowType: "normal" });
    const lockinTabs = allTabs.filter((tab) => isLockinTab(tab, state.lockinOrigin));
    const found =
      lockinTabs.find((tab) => URL.parse(tab.url ?? "")?.pathname.startsWith("/session/solo")) ??
      lockinTabs.find((tab) => URL.parse(tab.url ?? "")?.pathname.startsWith("/session/new")) ??
      lockinTabs[0] ??
      null;
    if (found) return found;

    return chrome.tabs.create({
      url: `${state.lockinOrigin}/session/solo`,
      active: true,
    });
  }

  return null;
}

// Chrome fires onActivated on mousedown while the tab strip is locked for drag tracking.
// Retry briefly until mouseup finishes so tabs.update succeeds reliably.
async function bounceToLockin(offendingTabId, attempt = 0) {
  const delays = [80, 120, 180, 250, 350, 500];
  try {
    const state = await getLockState();
    if (!hasActiveLocks(state)) return;

    if (attempt > 0 && Number.isInteger(offendingTabId)) {
      const current = await chrome.tabs.get(offendingTabId).catch(() => null);
      if (!current || !current.active || !isTabLocked(current, state)) return;
    }

    const target = await findOrCreateLockinTab(state);
    if (!target || !Number.isInteger(target.id)) return;

    if (state.lockinTabId !== target.id) {
      await setLockState({ ...state, lockinTabId: target.id });
    }
    await chrome.tabs.update(target.id, { active: true });
    if (Number.isInteger(target.windowId)) {
      await chrome.windows.update(target.windowId, { focused: true });
    }
  } catch (error) {
    if (attempt < delays.length) {
      if (bounceTimer !== null) clearTimeout(bounceTimer);
      bounceTimer = setTimeout(() => {
        bounceTimer = null;
        void bounceToLockin(offendingTabId, attempt + 1);
      }, delays[attempt]);
    } else {
      console.warn("LOCKIN tab bounce failed:", error);
    }
  }
}

async function enforceIfLocked(tab) {
  const state = await getLockState();
  if (!hasActiveLocks(state)) return;
  if (isTabLocked(tab, state)) {
    await bounceToLockin(tab.id, 0);
  }
}

// Clear any stale lock state when Chrome launches fresh.
chrome.runtime.onStartup.addListener(() => {
  void storageArea.remove(storageKey);
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const state = await getLockState();
    if (!hasActiveLocks(state) || tabId === state.lockinTabId) return;
    const tab = await chrome.tabs.get(tabId);
    if (isTabLocked(tab, state)) {
      await bounceToLockin(tabId, 0);
    }
  } catch (error) {
    console.warn("LOCKIN onActivated check failed:", error);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.url && changeInfo.status !== "loading") return;
  try {
    if (!tab.active) return;
    await enforceIfLocked(tab);
  } catch (error) {
    console.warn("LOCKIN onUpdated check failed:", error);
  }
});

chrome.tabs.onCreated.addListener(async (tab) => {
  try {
    if (!tab.active) return;
    await enforceIfLocked(tab);
  } catch (error) {
    console.warn("LOCKIN onCreated check failed:", error);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  try {
    const state = await getLockState();
    if (!hasActiveLocks(state)) return;
    const [activeTab] = await chrome.tabs.query({ active: true, windowId });
    if (activeTab && isTabLocked(activeTab, state)) {
      await bounceToLockin(activeTab.id, 0);
    }
  } catch (error) {
    console.warn("LOCKIN onFocusChanged check failed:", error);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  try {
    const state = await getLockState();
    if (!hasActiveLocks(state)) return;
    let changed = false;
    const nextTabIds = state.lockedTabIds.filter((id) => id !== tabId);
    if (nextTabIds.length !== state.lockedTabIds.length) changed = true;
    const nextLockinTabId = state.lockinTabId === tabId ? null : state.lockinTabId;
    if (nextLockinTabId !== state.lockinTabId) changed = true;
    if (changed) {
      await setLockState({
        ...state,
        lockinTabId: nextLockinTabId,
        lockedTabIds: nextTabIds,
      });
    }
  } catch (error) {
    console.warn("LOCKIN onRemoved cleanup failed:", error);
  }
});

chrome.runtime.onMessageExternal.addListener((request, sender, reply) => {
  const pageRole = getPageRole(sender);
  if (request?.channel !== channel || !pageRole) return;

  let result;
  if (request.action === "list" && pageRole.kind === "new") {
    result = getLockState()
      .then((state) => listTabs(sender.tab.id, state))
      .then((tabs) => ({ action: "list", tabs }));
  } else if (
    request.action === "lock" &&
    pageRole.kind === "new" &&
    Array.isArray(request.tabs) &&
    request.tabs.every(isTabSelection)
  ) {
    result = lockTabs(request.tabs, sender.tab.id, pageRole.origin).then(
      ({ lockedIds, lockedCount }) => ({
        action: "lock",
        lockedIds,
        lockedCount,
      }),
    );
  } else if (request.action === "status") {
    result = getStatus(sender.tab.id, pageRole).then(({ lockedCount }) => ({
      action: "status",
      lockedCount,
    }));
  } else if (request.action === "unlock" && pageRole.kind === "solo") {
    result = unlockTabs().then(({ unlocked }) => ({ action: "unlock", unlocked }));
  } else {
    return;
  }

  result.then(reply, () => reply({ action: "error" }));
  return true;
});
