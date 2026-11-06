(() => {
  "use strict";
  const labels = new Set(["ai overview", "ai overviews"]);
  const headingSelector = 'h2, [role="heading"][aria-level="2"]';
  const normalize = element => element.textContent.replace(/\s+/g, " ").trim().toLowerCase();
  let enabled = false;
  let queued = false;
  let hideAiMode = false;
  const revisions = { enabled: 0, hideAiMode: 0 };
  function updatePage() {
    queued = false;
    document.documentElement?.setAttribute("data-noai-search-enabled", String(enabled));
    document.documentElement?.setAttribute("data-noai-search-hide-mode", String(hideAiMode));
    const modeItems = new Set();
    if (hideAiMode) {
      // Only search navigation, never ordinary result links to AI Mode.
      for (const link of document.querySelectorAll('#cnt [role="navigation"] a[href], #hdtb a[href], nav a[href]')) {
        if (link.closest("#rcnt, #rso")) continue;
        let url;
        try { url = new URL(link.getAttribute("href"), location.href); } catch { continue; }
        if (url.origin !== location.origin || url.pathname !== "/search" || url.searchParams.get("udm") !== "50") continue;
        modeItems.add(link.closest('[role="listitem"]') || link);
      }
    }
    for (const item of document.querySelectorAll("[data-noai-search-mode-hidden]")) {
      if (!modeItems.has(item)) item.removeAttribute("data-noai-search-mode-hidden");
    }
    for (const item of modeItems) item.setAttribute("data-noai-search-mode-hidden", "");
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
  }).observe(document, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["href"] });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    for (const key of Object.keys(revisions)) {
      if (!changes[key]) continue;
      revisions[key]++;
      const value = changes[key].newValue;
      if (key === "enabled") enabled = value !== false;
      else hideAiMode = value === true;
    }
    updatePage();
  });
  const initialRevisions = { ...revisions };
  chrome.storage.local.get({ enabled: true, hideAiMode: false }).then(settings => {
    if (initialRevisions.enabled === revisions.enabled) enabled = settings.enabled !== false;
    if (initialRevisions.hideAiMode === revisions.hideAiMode) hideAiMode = settings.hideAiMode === true;
    updatePage();
  }).catch(() => { enabled = false; hideAiMode = false; updatePage(); });
})();
