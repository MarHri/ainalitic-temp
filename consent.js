/*
  Ainalitic cookie consent + Google Analytics loader

  HOW TO ACTIVATE
  1. Create a Google Analytics 4 property and copy its Measurement ID
     (it looks like G-ABC123XYZ4).
  2. Paste it into the GA_ID line below, replacing the placeholder.
  3. Upload this file to your site next to index.html.

  Until a real ID is set, this script does nothing: no banner is shown
  and nothing is loaded.
*/
(function () {
  'use strict';

  var GA_ID = 'G-PL1G920XRP';

  var STORAGE_KEY = 'ainalitic_cookie_consent';
  var MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // ask again after 12 months
  var POLICY_URL = 'cookies.html';

  var configured = /^G-[A-Z0-9]{6,}$/.test(GA_ID) && GA_ID.indexOf('XXXX') === -1;
  if (!configured) { return; }

  /* ---------- stored choice ---------- */
  function readConsent() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) { return null; }
      var data = JSON.parse(raw);
      if (typeof data.analytics !== 'boolean' || !data.ts) { return null; }
      if (Date.now() - data.ts > MAX_AGE_MS) { return null; }
      return data.analytics;
    } catch (e) { return null; }
  }

  function saveConsent(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics: value, ts: Date.now() }));
    } catch (e) { /* storage unavailable: the banner will simply show again */ }
  }

  /* ---------- Google Analytics ---------- */
  var loaded = false;

  function loadAnalytics() {
    window['ga-disable-' + GA_ID] = false;
    if (loaded) { return; }
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }

  function deleteGaCookies() {
    var host = window.location.hostname;
    var parts = host.split('.');
    var domains = [host, '.' + host];
    if (parts.length > 2) { domains.push('.' + parts.slice(-2).join('.')); }
    var expired = '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name === '_ga' || name === '_gid' || name.indexOf('_ga_') === 0 || name.indexOf('_gat') === 0) {
        document.cookie = name + expired;
        domains.forEach(function (d) { document.cookie = name + expired + '; domain=' + d; });
      }
    });
  }

  function stopAnalytics() {
    window['ga-disable-' + GA_ID] = true;
    deleteGaCookies();
  }

  /* ---------- banner ---------- */
  var banner = null;

  function buildBanner() {
    var style = document.createElement('style');
    style.textContent =
      '.ac-banner{position:fixed;left:16px;right:16px;bottom:16px;max-width:560px;margin:0 auto;z-index:9999;' +
      'background:#F7F6F2;color:#1C1E1B;border:1px solid #CBC7BB;border-radius:6px;padding:18px 20px;' +
      'box-shadow:0 8px 30px rgba(28,30,27,.14);font-family:Inter,system-ui,sans-serif;font-size:14px;' +
      'line-height:1.5;text-align:left;display:block}' +
      '.ac-banner[hidden]{display:none}' +
      '.ac-text{margin:0 0 14px;color:#4A4C46}' +
      '.ac-text strong{color:#1C1E1B}' +
      '.ac-text a{color:#0E6FA4}' +
      '.ac-actions{display:flex;gap:10px;flex-wrap:wrap}' +
      '.ac-btn{flex:1 1 140px;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:12.5px;' +
      'letter-spacing:.02em;padding:11px 16px;background:transparent;color:#1C1E1B;border:1px solid #1C1E1B;' +
      'border-radius:2px;cursor:pointer}' +
      '.ac-btn:hover,.ac-btn:focus-visible{background:#1C1E1B;color:#EFEEE9}' +
      '@media (min-width:600px){.ac-banner{left:24px;right:auto;bottom:24px;margin:0}}';
    document.head.appendChild(style);

    banner = document.createElement('div');
    banner.className = 'ac-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie preferences');
    banner.hidden = true;
    banner.innerHTML =
      '<p class="ac-text"><strong>Cookies.</strong> We\u2019d like to use Google Analytics to count visits ' +
      'and see which pages are useful. It sets cookies and sends usage data to Google. ' +
      'It stays off unless you accept. <a href="' + POLICY_URL + '">Cookie Policy</a></p>' +
      '<div class="ac-actions">' +
      '<button type="button" class="ac-btn" data-ac="accept">Accept analytics</button>' +
      '<button type="button" class="ac-btn" data-ac="decline">Decline</button>' +
      '</div>';
    document.body.appendChild(banner);

    banner.addEventListener('click', function (e) {
      var target = e.target.closest ? e.target.closest('[data-ac]') : null;
      if (!target) { return; }
      var accept = target.getAttribute('data-ac') === 'accept';
      saveConsent(accept);
      banner.hidden = true;
      if (accept) { loadAnalytics(); } else { stopAnalytics(); }
    });
  }

  function showBanner() {
    if (!banner) { buildBanner(); }
    banner.hidden = false;
    var first = banner.querySelector('button');
    if (first) { first.focus(); }
  }

  /* ---------- start ---------- */
  function init() {
    var links = document.querySelectorAll('[data-cookie-settings]');
    for (var i = 0; i < links.length; i++) {
      links[i].hidden = false;
      links[i].addEventListener('click', function (e) { e.preventDefault(); showBanner(); });
    }
    var consent = readConsent();
    if (consent === true) { loadAnalytics(); }
    else if (consent === false) { stopAnalytics(); }
    else { showBanner(); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
