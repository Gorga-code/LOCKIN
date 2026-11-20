const channel = "lockin.tabs.v1";
const allowedOrigins = new Set(
  chrome.runtime
    .getManifest()
    .externally_connectable.matches.map((pattern) => pattern.slice(0, -2)),
);

function isSessionPage(sender) {
  const url = URL.parse(sender.url ?? "");
  return (
    Number.isInteger(sender.tab?.id) &&
    !sender.tab.incognito &&
    (sender.frameId === undefined || sender.frameId === 0) &&
    url !== null &&
    url.origin === sender.origin &&
    allowedOrigins.has(url.origin) &&
    (url.pathname === "/session/new" || url.pathname === "/session/new/")
  );
}

async function listTabs(senderTabId) {
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

        return {
          id: tab.id,
          title: tab.title ?? "",
          site: url?.hostname ?? "",
          revision,
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

async function closeTabs(selection, senderTabId) {
  const openTabs = await listTabs(senderTabId);
  const openById = new Map(openTabs.map((tab) => [tab.id, tab.revision]));
  const selectedById = new Map(selection.map((tab) => [tab.id, tab.revision]));
  const ids = [...selectedById.keys()].filter((id) => openById.get(id) === selectedById.get(id));

  const results = await Promise.allSettled(ids.map((id) => chrome.tabs.remove(id)));
  return ids.filter((_, index) => results[index].status === "fulfilled");
}

chrome.runtime.onMessageExternal.addListener((request, sender, reply) => {
  if (request?.channel !== channel || !isSessionPage(sender)) return;

  let result;
  if (request.action === "list") {
    result = listTabs(sender.tab.id).then((tabs) => ({ action: "list", tabs }));
  } else if (
    request.action === "close" &&
    Array.isArray(request.tabs) &&
    request.tabs.every(isTabSelection)
  ) {
    result = closeTabs(request.tabs, sender.tab.id).then((closedIds) => ({
      action: "close",
      closedIds,
    }));
  } else {
    return;
  }

  result.then(reply, () => reply({ action: "error" }));
  return true;
});
