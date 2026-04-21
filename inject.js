// inject.js - Core injection, VTT cleanup, debug logging, SPA navigation support
// Runs in MAIN world (see manifest.json) so YouTube page-level globals are accessible.

const YT_PANEL_ID = 'yt-multi-subs-panel';
// Set of langIds with active subtitle tracks
const activeTracks = new Set();

// ── Timedtext fetch interceptor ──────────────────────────────────────────────
// YouTube's timedtext API requires a POT (Proof of Origin Token) that only
// YouTube's player can generate — without it all formats return an empty body.
// Running in MAIN world lets us monkey-patch window.fetch to:
//   1. Cache every response body by language code (so we can reuse it directly).
//   2. Extract the pot= value for use when fetching languages the player hasn't
//      requested yet (pot is per-session/video, not per-language).
const timedtextCache = {};   // { [langCode]: string } raw json3 response text
let timedtextPot = null;     // pot= token extracted from the last intercepted URL

(function interceptTimedtextFetch() {
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url ?? '');
    const response = await origFetch.apply(this, args);
    if (url.includes('/api/timedtext')) {
      try {
        const params = new URL(url).searchParams;
        const lang = params.get('lang');
        const pot  = params.get('pot');
        if (pot) timedtextPot = pot;
        if (lang) {
          response.clone().text().then(body => {
            if (body) {
              timedtextCache[lang] = body;
              console.log(`[Multi-Subs] Intercepted timedtext lang="${lang}" | ${body.length} chars | pot=${!!pot}`);
            }
          }).catch(() => {});
        }
      } catch (_) {}
    }
    return response;
  };
})();

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

// ── json3 → VTT conversion ───────────────────────────────────────────────────
// YouTube's timedtext API returns fmt=vtt as an empty body unless the request
// includes a POT (Proof of Origin Token) that only the player can generate.
// fmt=json3 works without a POT, so we fetch json3 and convert it to VTT here.
function msToVttTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const ms3 = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms3).padStart(3, '0')}`;
}

function json3ToVtt(json3) {
  const lines = ['WEBVTT', ''];
  for (const event of (json3.events || [])) {
    if (!event.segs || !event.dDurationMs) continue;
    const text = event.segs.map(s => s.utf8 || '').join('').trim();
    if (!text) continue;
    const start = msToVttTime(event.tStartMs || 0);
    const end = msToVttTime((event.tStartMs || 0) + event.dDurationMs);
    lines.push(`${start} --> ${end}`, text, '');
  }
  return lines.join('\n');
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
    // The bare language code (strip -auto suffix used internally)
    const langCode = id.replace(/-auto$/, '');

    let json3;

    // 1. Use a response the player already fetched (pot not needed)
    if (timedtextCache[langCode]) {
      console.log(`[Multi-Subs] Using intercepted cache for lang="${langCode}"`);
      json3 = JSON.parse(timedtextCache[langCode]);

    } else {
      // 2. Fetch via baseUrl (from ytInitialPlayerResponse captionTracks).
      //    The signature covers only sparams (ip, expire, v, …) and does NOT
      //    cover lang/pot/fmt, so we can freely append them.
      //    Append pot= if we captured one from the player – without it the
      //    server silently returns an empty body for both fmt=vtt and fmt=json3.
      const url = new URL(baseUrl);
      url.searchParams.set('fmt', 'json3');
      if (timedtextPot) {
        url.searchParams.set('pot', timedtextPot);
        url.searchParams.set('potc', '1'); // potc=1 signals the server that a POT is present
        console.log(`[Multi-Subs] Fetching json3 with pot for lang="${langCode}"`);
      } else {
        console.log(`[Multi-Subs] Fetching json3 without pot for lang="${langCode}" (may be empty)`);
      }

      const response = await fetch(url.toString());
      console.log(`[Multi-Subs] Fetch response | status=${response.status} ok=${response.ok}`);
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

      json3 = await response.json();
    }

    const eventCount = (json3.events || []).length;
    console.log(`[Multi-Subs] json3 parsed | events=${eventCount}`);

    const vttText = json3ToVtt(json3);
    console.log(`[Multi-Subs] Converted to VTT | length=${vttText.length} chars`);

    // Use a data URI – self-contained, no origin/CORS issues (Gary's way).
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
  // Clear per-video timedtext state; pot and cache are invalid after navigation
  timedtextPot = null;
  for (const key of Object.keys(timedtextCache)) delete timedtextCache[key];
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
