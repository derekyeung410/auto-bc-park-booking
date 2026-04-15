// ==UserScript==
// @name         BC Parks — Expand Details + Reserve at 7AM
// @namespace    https://camping.bcparks.ca/
// @version      7.0.0
// @match        https://camping.bcparks.ca/create-booking/results*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const OPEN_TIME = new Date('2026-04-04T07:00:00-07:00').getTime();

  // ── UI ──
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; top: 16px; right: 16px; z-index: 999999;
    background: #1a2e1a; border: 2px solid #4caf50; border-radius: 10px;
    padding: 14px 18px; font-family: monospace; font-size: 13px;
    color: #e8f5e9; min-width: 260px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  `;
  overlay.innerHTML = `
    <div style="font-weight:700;margin-bottom:8px;">🏕️ BC Parks Auto-Reserve</div>
    <div>Countdown: <span id="bcp-countdown" style="color:#ffee58">--:--:--</span></div>
    <div>Details expanded: <span id="bcp-expanded" style="color:#80cbc4">0</span></div>
    <div>Status: <span id="bcp-status" style="color:#80cbc4">Starting...</span></div>
  `;
  document.body.appendChild(overlay);

  const countdownEl = document.getElementById('bcp-countdown');
  const expandedEl  = document.getElementById('bcp-expanded');
  const statusEl    = document.getElementById('bcp-status');

  function setStatus(msg, color = '#80cbc4') {
    statusEl.textContent = msg;
    statusEl.style.color = color;
    console.log('[BC Parks]', msg);
  }

  // ── Countdown ──
  setInterval(() => {
    const diff = OPEN_TIME - Date.now();
    if (diff <= 0) { countdownEl.textContent = 'OPEN'; return; }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    countdownEl.textContent =
      `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }, 1000);


  // ── Expand all Details panels ──
  // Uses id^="details-" to match details-0, details-1, details-2 ...
  function expandAllDetails() {
    const panels = document.querySelectorAll('[id^="details-"]');
    panels.forEach(btn => btn.click());
    expandedEl.textContent = panels.length;
    setStatus(`Expanded ${panels.length} Details panel(s)`);
    return panels.length;
  }

  // ── Wait for Angular to render the list, then expand ──
  // Polls until at least one details panel appears in the DOM
  function waitAndExpand() {
    const check = setInterval(() => {
      const count = document.querySelectorAll('[id^="details-"]').length;
      if (count > 0) {
        clearInterval(check);
        expandAllDetails();
      }
    }, 500);
  }

  // ── Click Reserve ──
  function clickReserve() {
    const btn = document.querySelector('button.reserve-button:not([disabled])');
    if (btn) {
      btn.click();
      setStatus('✅ Reserve clicked! Complete checkout.', '#66bb6a');
      clearInterval(scanTimer);
    } else {
      setStatus('Scanning for Reserve button...', '#ffb74d');
    }
  }

  let scanTimer = null;
  const diff = OPEN_TIME - Date.now();

  if (diff <= 0) {
    // ── Past 7:00 AM — expand details then click Reserve immediately ──
    waitAndExpand();
    setStatus('🟢 Past open time — clicking Reserve...', '#ffee58');
    scanTimer = setInterval(clickReserve, 500);

  } else {
    // ── Before 7:00 AM — expand details now, reload at exactly 7:00 AM ──
    waitAndExpand();
    setStatus('Waiting for 7:00 AM PDT...', '#80cbc4');

    setTimeout(() => {
      setStatus('🔄 Reloading at 7:00 AM...');
      location.reload();
    }, diff);
  }

})();