// background.js - Manifest V3 service worker
// Cross-browser fallback
const api = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

api.runtime.onInstalled.addListener(() => {
  console.log('[Multi-Subs] Extension installed / updated.');
});
