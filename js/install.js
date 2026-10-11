// Install section: copy the command, and show the repo's live star count.
(function () {
  'use strict';
  const NG = window.NG;
  const REPO = 'PrajsRamteke/NotchGate';

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      // Fallback for browsers or contexts without the async clipboard API.
      const area = Object.assign(document.createElement('textarea'), { value: text });
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    }
  }

  function wireCopy() {
    const button = NG.$('#copy-command');
    const command = NG.$('#install-command');
    if (!button || !command) return;
    button.addEventListener('click', async () => {
      const ok = await copy(command.textContent.trim());
      button.textContent = ok ? 'Copied' : 'Select and copy';
      NG.toast(ok ? 'Copied. Paste it into Terminal' : 'Couldn\'t copy. Select the command instead');
      setTimeout(() => (button.textContent = 'Copy'), 2200);
    });
  }

  const format = (count) => (count >= 1000 ? `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(count));

  async function loadStars() {
    let count = null;
    try {
      const cached = JSON.parse(sessionStorage.getItem('ng-stars') || 'null');
      if (cached && Date.now() - cached.at < 10 * 60 * 1000) count = cached.count;
    } catch (_) { /* no session storage */ }

    if (count === null) {
      try {
        const response = await fetch(`https://api.github.com/repos/${REPO}`, { headers: { Accept: 'application/vnd.github+json' } });
        if (!response.ok) return;
        count = (await response.json()).stargazers_count;
        try { sessionStorage.setItem('ng-stars', JSON.stringify({ count, at: Date.now() })); } catch (_) { /* ignore */ }
      } catch (_) {
        return; // Offline or rate-limited: the Star buttons still work without a number.
      }
    }
    if (typeof count !== 'number' || count < 1) return;
    NG.$$('[data-star-count]').forEach((el) => {
      el.textContent = format(count);
      el.hidden = false;
    });
  }

  NG.initInstall = function () {
    wireCopy();
    loadStars();
  };
})();
