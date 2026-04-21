// popup.js - Modernized UI controller (Manifest V3)
// Cross-browser API fallback
const api = (typeof browser !== 'undefined' && browser.tabs) ? browser : chrome;

const statusEl = document.getElementById('status');
const trackListEl = document.getElementById('track-list');
const noTracksEl = document.getElementById('no-tracks');

async function getActiveYouTubeTab() {
  const tabs = await api.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || !tab.url || !tab.url.includes('youtube.com/watch')) {
    return null;
  }
  return tab;
}

async function queryTracks(tabId) {
  const results = await api.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    func: () => {
      // Gary's way: read ytInitialPlayerResponse first (MAIN world required)
      const ipr = window.ytInitialPlayerResponse;
      const iprTracks = ipr?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (iprTracks?.length) return iprTracks;

      // Fallback: ytplayer.config (updated after SPA navigation)
      const raw = window.ytplayer?.config?.args?.raw_player_response;
      const rawTracks = raw?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (rawTracks?.length) return rawTracks;

      // Last resort: DOM player API
      const player = document.getElementById('movie_player');
      return player?.getPlayerResponse?.()?.captions?.playerCaptionsTracklistRenderer?.captionTracks || null;
    }
  });
  return results?.[0]?.result ?? null;
}

async function getActiveTrackIds(tabId) {
  const results = await api.scripting.executeScript({
    target: { tabId },
    func: () => {
      const checks = document.querySelectorAll('#yt-multi-subs-bar input[type="checkbox"]');
      const active = [];
      checks.forEach(cb => {
        if (cb.checked) active.push(cb.getAttribute('data-lang-id'));
      });
      return active;
    }
  });
  return results?.[0]?.result ?? [];
}

async function toggleTrackInPage(tabId, id, baseUrl, label, checked) {
  await api.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    func: (langId, url, lbl, isChecked) => {
      // Dispatch a custom event that inject.js listens to (both run in MAIN world)
      window.dispatchEvent(new CustomEvent('yt-multi-subs-toggle', {
        detail: { id: langId, baseUrl: url, label: lbl, checked: isChecked }
      }));
    },
    args: [id, baseUrl, label, checked]
  });
}

async function init() {
  const tab = await getActiveYouTubeTab();
  if (!tab) {
    statusEl.textContent = 'Navigate to a YouTube video.';
    noTracksEl.style.display = 'block';
    return;
  }

  let tracks;
  try {
    tracks = await queryTracks(tab.id);
  } catch (e) {
    statusEl.textContent = 'Could not read tracks.';
    noTracksEl.style.display = 'block';
    console.error('[Multi-Subs popup]', e);
    return;
  }

  if (!tracks || tracks.length === 0) {
    statusEl.textContent = 'No subtitle tracks available.';
    noTracksEl.style.display = 'block';
    return;
  }

  const activeIds = await getActiveTrackIds(tab.id).catch(() => []);
  statusEl.textContent = `${tracks.length} track(s) available`;

  tracks.forEach(t => {
    const isAuto = t.kind === 'asr';
    const id = t.languageCode + (isAuto ? '-auto' : '');
    const displayName = (t.name?.simpleText || t.languageCode) + (isAuto ? ' (auto)' : '');

    const item = document.createElement('div');
    item.className = 'track-item';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = `popup-cb-${id}`;
    cb.checked = activeIds.includes(id);
    cb.onchange = async (e) => {
      try {
        await toggleTrackInPage(tab.id, id, t.baseUrl, displayName, e.target.checked);
      } catch (err) {
        console.error('[Multi-Subs popup] Failed to toggle track:', err);
        // Revert the checkbox to its previous state on failure
        e.target.checked = !e.target.checked;
      }
    };

    const lbl = document.createElement('label');
    lbl.htmlFor = `popup-cb-${id}`;
    lbl.textContent = displayName;
    lbl.style.cursor = 'pointer';
    lbl.style.flex = '1';

    if (isAuto) {
      const badge = document.createElement('span');
      badge.className = 'track-badge';
      badge.textContent = 'auto';
      item.append(cb, lbl, badge);
    } else {
      item.append(cb, lbl);
    }

    trackListEl.appendChild(item);
  });
}

init();
