// Light / dark theme: light by default; the visitor's choice is remembered.
(function () {
  'use strict';
  const NG = window.NG;
  const root = document.documentElement;
  const current = () => root.dataset.theme || 'light';

  function sync() {
    const theme = current();
    const button = NG.$('#theme-toggle');
    if (button) button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }

  NG.initTheme = function () {
    const button = NG.$('#theme-toggle');
    if (!button) return;
    button.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      NG.storage.set('ng-theme', next);
      sync();
    });
    sync();
  };
})();
