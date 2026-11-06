(() => {
  "use strict";
  const toggle = document.getElementById("enabled");
  const status = document.getElementById("status");
  const render = enabled => {
    toggle.checked = enabled;
    status.textContent = enabled ? "On · Cleaner results" : "Off · Original results";
  };
  let revision = 0;
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.enabled) {
      revision++;
      render(changes.enabled.newValue !== false);
    }
  });
  const initialRevision = revision;
  chrome.storage.local.get({ enabled: true }).then(settings => {
    if (initialRevision === revision) render(settings.enabled !== false);
    toggle.disabled = false;
  }).catch(() => { status.textContent = "Couldn’t load your setting. Reopen to retry."; });
  toggle.addEventListener("change", async () => {
    const desired = toggle.checked;
    toggle.disabled = true;
    try {
      await chrome.storage.local.set({ enabled: desired });
      render(desired);
    } catch {
      render(!desired);
      status.textContent = "Couldn’t save. Try again.";
    } finally { toggle.disabled = false; }
  });
})();
