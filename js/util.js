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

  // MARK: Morphing

  /// Brings `target`'s children in line with `html`, touching only what
  /// changed. Elements that stay keep their animations, scroll and focus, so
  /// the live panel can re-render every second without flicker. A different
  /// tag or `data-key` swaps the element (and replays its entrance).
  NG.morph = (target, html) => {
    const template = document.createElement('template');
    template.innerHTML = html;
    morphChildren(target, template.content);
  };

  const same = (a, b) => a.nodeType === b.nodeType
    && (a.nodeType !== 1 || (a.tagName === b.tagName && a.getAttribute('data-key') === b.getAttribute('data-key')));

  function morphChildren(from, to) {
    const old = Array.from(from.childNodes);
    const next = Array.from(to.childNodes);
    next.forEach((node, i) => {
      const current = old[i];
      if (!current) from.appendChild(node);
      else if (!same(current, node)) from.replaceChild(node, current);
      else if (node.nodeType !== 1) { if (current.nodeValue !== node.nodeValue) current.nodeValue = node.nodeValue; }
      else morphElement(current, node);
    });
    old.slice(next.length).forEach((node) => node.remove());
  }

  function morphElement(current, next) {
    Array.from(current.attributes).forEach((a) => { if (!next.hasAttribute(a.name)) current.removeAttribute(a.name); });
    Array.from(next.attributes).forEach((a) => { if (current.getAttribute(a.name) !== a.value) current.setAttribute(a.name, a.value); });
    if (current.tagName === 'INPUT' || current.tagName === 'TEXTAREA') {
      // Never fight the caret: a focused field keeps what the visitor typed.
      if (document.activeElement !== current && current.value !== next.value) current.value = next.value;
      return;
    }
    morphChildren(current, next);
  }

  /// Calls `onEnter` / `onLeave` as an element crosses the viewport.
  NG.watch = (element, onEnter, onLeave, options = { threshold: 0.15 }) => {
    if (!element) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? onEnter(entry) : onLeave && onLeave(entry)));
    }, options);
    observer.observe(element);
  };
})();
