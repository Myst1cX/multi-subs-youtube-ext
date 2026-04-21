// inject.js - Core injection, VTT cleanup, debug logging, SPA navigation support
// Runs in MAIN world (see manifest.json) so YouTube page-level globals are accessible.

const YT_PANEL_ID = 'yt-multi-subs-panel';
// Set of langIds with active subtitle tracks
const activeTracks = new Set();

// ── Styles ──────────────────────────────────────────────────────────────────
(function injectStyles() {
  const style = document.createElement('style');
  style.id = 'yt-multi-subs-style';
  style.textContent = `
    #${YT_PANEL_ID} {
      display: inline-flex;
      align-items: center;
      height: 100%;
      vertical-align: middle;
    }
    #yt-multi-subs-bar {
      display: inline-flex;
      align-items: center;
      max-width: 500px;
      height: 100%;
      overflow-x: auto;
      scrollbar-width: none;
      white-space: nowrap;
      padding: 0 10px;
    }
    #yt-multi-subs-bar::-webkit-scrollbar { display: none; }
    .yt-multi-cb-label {
      margin: 0 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      background: rgba(255,255,255,0.1);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      color: #eee;
      border: 1px solid transparent;
      user-select: none;
    }
    .yt-multi-cb-label:hover {
      background: rgba(255,255,255,0.2);
      border-color: rgba(255,255,255,0.3);
    }
    .yt-multi-cb-label input[type="checkbox"] {
      margin-right: 4px;
      cursor: pointer;
    }
    video::cue {
      background-color: rgba(8, 8, 8, 0.75) !important;
      color: #ffffff !important;
      font-size: 1.1em;
    }
  `;
  document.head.appendChild(style);
})();

// ── Caption track discovery (Gary's way) ────────────────────────────────────
// Running in MAIN world gives us direct access to YouTube's page-level globals.
// Priority: ytInitialPlayerResponse → ytplayer.config → DOM getPlayerResponse()
function getCaptionTracks() {
  // 1. ytInitialPlayerResponse – always present on page load, most reliable
  const ipr = window.ytInitialPlayerResponse;
  const iprTracks = ipr?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (iprTracks?.length) {
    console.log(`[Multi-Subs] getCaptionTracks via ytInitialPlayerResponse: ${iprTracks.length} track(s)`);
    return iprTracks;
  }

  // 2. ytplayer.config – updated after SPA navigation
  const raw = window.ytplayer?.config?.args?.raw_player_response;
  const rawTracks = raw?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (rawTracks?.length) {
    console.log(`[Multi-Subs] getCaptionTracks via ytplayer.config: ${rawTracks.length} track(s)`);
    return rawTracks;
  }

  // 3. DOM player API – last resort
  const player = document.getElementById('movie_player');
  const domTracks = player?.getPlayerResponse?.()?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (domTracks?.length) {
    console.log(`[Multi-Subs] getCaptionTracks via getPlayerResponse(): ${domTracks.length} track(s)`);
    return domTracks;
  }

  console.log('[Multi-Subs] getCaptionTracks: no tracks found from any source.');
  return [];
}

// ── Subtitle toggle ──────────────────────────────────────────────────────────
async function toggleSubtitle(id, baseUrl, label, isChecked) {
  console.log(`[Multi-Subs] toggleSubtitle called | id="${id}" label="${label}" checked=${isChecked}`);

  const video = document.querySelector('video');
  if (!video) {
    console.error('[Multi-Subs] <video> element not found');
    return;
  }

  // Remove any existing track for this id
  const existing = document.getElementById(`yt-multi-track-${id}`);
  if (existing) {
    console.log(`[Multi-Subs] Removing existing track for id="${id}"`);
    existing.track.mode = 'disabled';
    existing.remove();
    activeTracks.delete(id);
  }

  if (!isChecked) {
    console.log(`[Multi-Subs] Checkbox unchecked – subtitle "${id}" removed.`);
    return;
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.set('fmt', 'vtt');

    const fetchUrl = url.toString();
    console.log(`[Multi-Subs] Fetching VTT from: ${fetchUrl}`);

    const response = await fetch(fetchUrl);
    console.log(`[Multi-Subs] Fetch response | status=${response.status} ok=${response.ok}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    let vttText = await response.text();
    console.log(`[Multi-Subs] VTT received | length=${vttText.length} chars`);

    // Strip YouTube's left-aligned positioning cues so subtitles render at
    // bottom-center instead of overlapping at the top-left corner. (Gary's fix)
    vttText = vttText.replaceAll('align:start position:0%', '');

    // Use a data URI – self-contained and works in any extension context
    // without the cross-origin restrictions that blob: URLs can trigger.
    const dataUri = 'data:text/vtt,' + encodeURIComponent(vttText);

    const track = document.createElement('track');
    track.id = `yt-multi-track-${id}`;
    track.kind = 'captions';
    track.label = label;
    track.srclang = id;
    track.default = true;
    track.src = dataUri;

    video.appendChild(track);
    track.track.mode = 'showing';
    activeTracks.add(id);
    console.log(`[Multi-Subs] <track> appended | id="${id}" mode=${track.track.mode}`);

  } catch (e) {
    console.error(`[Multi-Subs] Error loading subtitle "${id}":`, e);
  }
}

// ── UI injection ─────────────────────────────────────────────────────────────
function initUI() {
  const subBtn = document.querySelector('.ytp-subtitles-button');
  if (!subBtn) return;
  if (document.getElementById(YT_PANEL_ID)) return;

  const tracks = getCaptionTracks();

  console.log(`[Multi-Subs] initUI | found ${tracks.length} caption track(s)`);

  if (tracks.length === 0) return;

  const wrapper = document.createElement('span');
  wrapper.id = YT_PANEL_ID;

  const bar = document.createElement('div');
  bar.id = 'yt-multi-subs-bar';

  tracks.forEach(t => {
    const isAuto = t.kind === 'asr';
    const id = t.languageCode + (isAuto ? '-auto' : '');
    const displayName = (t.name?.simpleText || t.languageCode) + (isAuto ? ' (auto)' : '');

    const label = document.createElement('label');
    label.className = 'yt-multi-cb-label';
    label.title = displayName;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.setAttribute('data-lang-id', id);
    cb.onchange = async (e) => toggleSubtitle(id, t.baseUrl, t.name?.simpleText || t.languageCode, e.target.checked);

    label.append(cb, displayName);
    bar.appendChild(label);
  });

  wrapper.appendChild(bar);
  subBtn.parentNode.insertBefore(wrapper, subBtn);
  console.log('[Multi-Subs] UI panel injected into YouTube controls.');
}

// ── Polling runner ───────────────────────────────────────────────────────────
let pollInterval = null;

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(() => {
    if (document.querySelector('.ytp-subtitles-button')) {
      initUI();
    }
  }, 1000);
}

// ── SPA navigation (YouTube is a SPA) ────────────────────────────────────────
window.addEventListener('yt-navigate-finish', () => {
  console.log('[Multi-Subs] yt-navigate-finish – resetting state.');
  activeTracks.clear();
  // Remove the injected panel so initUI can re-create it for the new page
  document.getElementById(YT_PANEL_ID)?.remove();
  startPolling();
});

// ── Popup communication ──────────────────────────────────────────────────────
// The popup uses scripting.executeScript to dispatch this custom event, allowing
// it to trigger subtitle toggles without unsafe eval or inline scripts.
window.addEventListener('yt-multi-subs-toggle', (e) => {
  const { id, baseUrl, label, checked } = e.detail;
  console.log('[Multi-Subs] Received yt-multi-subs-toggle event:', e.detail);
  toggleSubtitle(id, baseUrl, label, checked);

  // Sync the checkbox state in the in-page bar if it exists
  const cb = document.querySelector(`#yt-multi-subs-bar input[data-lang-id="${id}"]`);
  if (cb) cb.checked = checked;
});

// Initial run
startPolling();
