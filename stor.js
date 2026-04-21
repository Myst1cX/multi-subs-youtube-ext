// stor.js - Storage helper with browser/chrome fallback

const api = (typeof browser !== 'undefined' && browser.storage) ? browser : chrome;

// Expose on window so other content scripts can access this helper
// when injected via the manifest content_scripts array.
const stor = window.stor = {
  get(keys) {
    return new Promise((resolve, reject) => {
      api.storage.local.get(keys, (result) => {
        if (api.runtime.lastError) {
          reject(api.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  },

  set(items) {
    return new Promise((resolve, reject) => {
      api.storage.local.set(items, () => {
        if (api.runtime.lastError) {
          reject(api.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },

  remove(keys) {
    return new Promise((resolve, reject) => {
      api.storage.local.remove(keys, () => {
        if (api.runtime.lastError) {
          reject(api.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
};
