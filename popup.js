(() => {
  "use strict";
  const options = [
    { key: "enabled", status: "status", fallback: true, on: "On · Cleaner results", off: "Off · Original results" },
    { key: "hideAiMode", status: "ai-mode-status", fallback: false, on: "On · Tab hidden", off: "Off · Tab visible" }
  ];
  for (const option of options) {
    const toggle = document.getElementById(option.key);
    const status = document.getElementById(option.status);
    const valueOf = value => typeof value === "boolean" ? value : option.fallback;
    const render = enabled => {
      toggle.checked = enabled;
      status.textContent = enabled ? option.on : option.off;
    };
    let revision = 0;
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes[option.key]) {
        revision++;
        render(valueOf(changes[option.key].newValue));
      }
    });
    const initialRevision = revision;
    chrome.storage.local.get({ [option.key]: option.fallback }).then(settings => {
      if (initialRevision === revision) render(valueOf(settings[option.key]));
      toggle.disabled = false;
    }).catch(() => { status.textContent = "Couldn’t load. Reopen to retry."; });
    toggle.addEventListener("change", async () => {
      const desired = toggle.checked;
      toggle.disabled = true;
      try {
        await chrome.storage.local.set({ [option.key]: desired });
        render(desired);
      } catch {
        render(!desired);
        status.textContent = "Couldn’t save. Try again.";
      } finally { toggle.disabled = false; }
    });
  }
})();
