# Contributing

Use Chrome’s Load unpacked workflow. No package installation or build step is required.

For a selector change, verify:

1. A supported AI Overview is hidden when enabled.
2. Switching off restores it without reloading.
3. Switching back on hides it again, including across multiple open search tabs.
4. The saved off preference survives a page reload and a popup reopen.
5. Delayed AI Overview content is hidden.
6. Ordinary snippets mentioning AI Overviews remain visible.
7. Ambiguous wrappers containing unrelated result headings remain visible.
8. Reused containers stop being hidden when their content becomes normal results.
9. Hide AI Mode defaults off, including when upgrading with only an existing overview preference.
10. AI Mode hiding works independently, restores the tab when off, and preserves All, other filters, and ordinary result links.
11. Delayed and recycled navigation items are handled correctly.
12. The popup works with Tab and Space, and save errors are visible.

Keep host permissions limited to Google Search. Do not add tracking, remote scripts, or collected search data. When reporting a layout issue, include the Google host and interface language without private query or account information.
