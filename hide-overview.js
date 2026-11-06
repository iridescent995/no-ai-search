(() => {
  "use strict";
  const labels = new Set(["ai overview", "ai overviews"]);
  const headingSelector = 'h2, [role="heading"][aria-level="2"]';
  const normalize = element => element.textContent.replace(/\s+/g, " ").trim().toLowerCase();
  let enabled = false;
  let queued = false;
  let revision = 0;
  function updatePage() {
    queued = false;
    document.documentElement?.setAttribute("data-noai-search-enabled", String(enabled));
    const results = document.getElementById("rcnt");
    const sections = new Set();
    if (enabled && results) {
      for (const heading of results.querySelectorAll(headingSelector)) {
        if (!labels.has(normalize(heading))) continue;
        const section = heading.closest('[data-lhcontainer], .MjjYud, [data-aquarium]');
        if (!section || section === results || !results.contains(section)) continue;
        const mixed = Array.from(section.querySelectorAll(headingSelector))
          .some(item => !labels.has(normalize(item)));
        if (!mixed) sections.add(section);
      }
    }
    // Restore disabled or recycled result containers without changing inline styles.
    for (const section of document.querySelectorAll("[data-no-ai-overview-hidden]")) {
      if (!sections.has(section)) section.removeAttribute("data-no-ai-overview-hidden");
    }
    for (const section of sections) section.setAttribute("data-no-ai-overview-hidden", "");
  }
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(updatePage);
  }).observe(document, { childList: true, subtree: true, characterData: true });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.enabled) return;
    revision++;
    enabled = changes.enabled.newValue !== false;
    updatePage();
  });
  const initialRevision = revision;
  chrome.storage.local.get({ enabled: true }).then(settings => {
    if (initialRevision !== revision) return;
    enabled = settings.enabled !== false;
    updatePage();
  }).catch(() => { enabled = false; updatePage(); });
})();
