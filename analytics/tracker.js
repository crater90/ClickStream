/**
 * EventTracker - Lightweight client-side event tracking script
 * Usage: <script src="tracker.js" data-api="http://localhost:3001/api/events"></script>
 *
 * FIX NOTES:
 *  - sendBeacon with Blob is NOT parsed by express.json() — use fetch with keepalive instead.
 *  - FLUSH_INTERVAL reduced to 500ms so events appear in DB almost immediately.
 *  - On unload, falls back to sendBeacon with text/plain workaround OR sync XHR.
 *  - Works when opened as file:// or http://.
 */
(function (window, document) {
  'use strict';

  // ── Configuration ────────────────────────────────────────────────────────
  const script = document.currentScript || document.querySelector('script[data-api]');
  const API_ENDPOINT = (script && script.getAttribute('data-api')) || 'http://localhost:3001/api/events';
  const FLUSH_INTERVAL_MS = 500;  // flush every 500ms — fast enough to see in DB immediately
  const MAX_QUEUE_SIZE = 10;
  const SESSION_KEY = 'et_session_id';
  const SESSION_COOKIE_DAYS = 1;

  // ── Session Management ───────────────────────────────────────────────────
  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax';
  }

  function getCookie(name) {
    return document.cookie.split('; ').reduce(function (r, v) {
      const parts = v.split('=');
      return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, null);
  }

  function getSessionId() {
    let sid = getCookie(SESSION_KEY);
    if (!sid) {
      try { sid = localStorage.getItem(SESSION_KEY); } catch (e) { }
    }
    if (!sid) {
      sid = generateId();
      setCookie(SESSION_KEY, sid, SESSION_COOKIE_DAYS);
      try { localStorage.setItem(SESSION_KEY, sid); } catch (e) { }
    }
    return sid;
  }

  const SESSION_ID = getSessionId();

  // ── Event Queue & Flush ──────────────────────────────────────────────────
  let queue = [];
  let flushTimer = null;

  /**
   * PRIMARY flush — uses fetch() with keepalive:true.
   * This properly sets Content-Type: application/json which express.json() can parse.
   * keepalive:true allows the request to outlive the page.
   */
  function flushWithFetch(batch) {
    var payload = JSON.stringify({ events: batch });
    fetch(API_ENDPOINT + '/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,          // survives page unload in modern browsers
    })
      .then(function (res) {
        if (!res.ok) {
          res.text().then(function (t) {
            console.warn('[EventTracker] Server error ' + res.status + ':', t);
          });
        } else {
          console.debug('[EventTracker] Flushed ' + batch.length + ' event(s) ✓');
        }
      })
      .catch(function (err) {
        console.error('[EventTracker] Flush failed — is the backend running at', API_ENDPOINT + '?', err.message);
      });
  }

  /**
   * FALLBACK flush for pagehide/unload — synchronous XHR as last resort
   * when fetch keepalive is not supported or budget exceeded (>64KB).
   */
  function flushSync(batch) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', API_ENDPOINT + '/batch', false); // false = synchronous
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({ events: batch }));
    } catch (e) {
      console.warn('[EventTracker] Sync flush failed:', e);
    }
  }

  function flush(isUnload) {
    if (queue.length === 0) return;
    var batch = queue.slice();
    queue = [];
    if (isUnload) {
      flushSync(batch);
    } else {
      flushWithFetch(batch);
    }
  }

  function scheduleFlush() {
    clearTimeout(flushTimer);
    flushTimer = setTimeout(function () { flush(false); }, FLUSH_INTERVAL_MS);
  }

  function enqueue(eventData) {
    queue.push(eventData);
    console.debug('[EventTracker] Queued:', eventData.event_type, eventData.page_url);
    if (queue.length >= MAX_QUEUE_SIZE) {
      flush(false);
    } else {
      scheduleFlush();
    }
  }

  // ── Core Event Builder ───────────────────────────────────────────────────
  function buildBaseEvent(type) {
    return {
      session_id: SESSION_ID,
      event_type: type,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || null,
    };
  }

  // ── Trackers ─────────────────────────────────────────────────────────────
  function trackPageView() {
    enqueue(buildBaseEvent('page_view'));
  }

  function handleClick(e) {
    var event = buildBaseEvent('click');
    event.click_x = e.clientX;
    event.click_y = e.clientY;
    event.viewport_width = window.innerWidth;
    event.viewport_height = window.innerHeight;
    enqueue(event);
  }

  function patchHistory(method) {
    var original = history[method];
    history[method] = function () {
      var result = original.apply(this, arguments);
      trackPageView();
      return result;
    };
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  function init() {
    trackPageView();

    document.addEventListener('click', handleClick, { passive: true });

    patchHistory('pushState');
    patchHistory('replaceState');
    window.addEventListener('popstate', trackPageView);

    // Use synchronous XHR on unload so data isn't lost
    window.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') flush(true);
    });
    window.addEventListener('pagehide', function () { flush(true); });
    window.addEventListener('beforeunload', function () { flush(true); });

    console.info('[EventTracker] ✅ Initialized | Session:', SESSION_ID, '| API:', API_ENDPOINT);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.EventTracker = {
    getSessionId: function () { return SESSION_ID; },
    flush: function () { flush(false); },
    getQueue: function () { return queue.slice(); },
  };

}(window, document));