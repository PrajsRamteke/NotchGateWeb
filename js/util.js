// Shared helpers. Classic scripts (no modules) so the site also works when
// index.html is opened straight from disk.
(function () {
  'use strict';
  const NG = (window.NG = window.NG || {});

  NG.$ = (selector, root = document) => root.querySelector(selector);
  NG.$$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  NG.escape = (value) =>
    String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  NG.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, NG.reducedMotion ? Math.min(ms, 60) : ms));

  NG.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Storage can throw (private mode, blocked site data); never let it break the page.
  NG.storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch (_) { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch (_) { /* ignore */ }
    },
  };

  let toastTimer;
  NG.toast = (message) => {
    const toast = NG.$('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
  };

  NG.formatElapsed = (seconds) => {
    const s = Math.max(0, Math.floor(seconds));
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
  };

  /// Calls `onEnter` / `onLeave` as an element crosses the viewport.
  NG.watch = (element, onEnter, onLeave, options = { threshold: 0.15 }) => {
    if (!element) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? onEnter(entry) : onLeave && onLeave(entry)));
    }, options);
    observer.observe(element);
  };
})();
