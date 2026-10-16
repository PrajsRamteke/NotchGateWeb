// "What's new": the latest releases as a rail of cards. Each one has a
// "Show me" that plays the feature on this page: in the notch, the menu,
// or the section that demos it.
(function () {
  'use strict';
  const NG = window.NG;
  const S = () => NG.settings;
  const e = NG.escape;

  const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  const releases = [
    {
      version: '2.13', title: 'Sounds you pick',
      text: 'Choose what plays when Claude needs you and when it finishes, from macOS\'s own alert sounds. ▶ to listen.',
      icon: svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
      action: 'Pick a sound', run() { S().set('sound', true); NG.menu.reveal('behavior'); NG.sounds.play(S().get('attentionSound')); },
    },
    {
      version: '2.12', title: 'Preview your buddy',
      text: '▶ on the Water reminder row drops your buddy in right away. A preview doesn\'t count a glass or move the next reminder.',
      icon: svg('<circle cx="12" cy="12" r="8.5"/><path d="M10 8.5v7l5.5-3.5z"/>'),
      action: 'Preview it', run() { NG.water.preview(); },
    },
    {
      version: '2.11', title: 'Batman joins',
      text: 'The caped crusader lowers himself on his grapnel line with your bottle. “Gotham needs you hydrated.”',
      icon: svg('<path d="M3 9c2 0 3.5-1 4.5-3 .6 1.4 1.6 2 2.6 2L12 6l1.9 2c1 0 2-.6 2.6-2 1 2 2.5 3 4.5 3-1.4 1.2-2 3-2 5-1.6-1-3.4-1-4.5.5L12 18l-2.5-3.5C8.4 13 6.6 13 5 14c0-2-.6-3.8-2-5z"/>'),
      action: 'Meet Batman', run() { NG.buddySection.show('batman'); },
    },
    {
      version: '2.10', title: 'Update from the notch',
      text: 'An Update pill in the hover panel when a new version lands, and a refresh button in the menu. One click, a few seconds, relaunched.',
      icon: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v8M8.5 12.5l3.5 3.5 3.5-3.5"/>'),
      action: 'Open the panel', run: openPanel,
    },
    {
      version: '2.9', title: 'Insights',
      text: 'What Claude Code cost and did over 24 hours, 7 or 30 days: a bar per hour or day, the busiest projects, the split by model.',
      icon: svg('<path d="M4 20h16M6.5 16.5v-5M10.5 16.5V7M14.5 16.5v-3.5M18.5 16.5V9"/>'),
      action: 'See Insights', run() { NG.tour.go('insights'); },
    },
    {
      version: '2.8', title: 'Settings, tidied',
      text: 'One line per setting: its name, an ⓘ that explains it, and its switch. Icon tiles, keycaps, compact pop-ups.',
      icon: svg('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
      action: 'Open the menu', run() { NG.menu.reveal('extras'); },
    },
    {
      version: '2.7', title: 'Now Playing',
      text: 'Music, Spotify, Podcasts or a YouTube tab in the notch, tinted by the artwork. While it plays, the closed notch shows an equalizer.',
      icon: svg('<path d="M9.5 17.5V6l9-2v11.5"/><circle cx="7" cy="17.5" r="2.5"/><circle cx="16" cy="15.5" r="2.5"/>'),
      action: 'Play something', run() { NG.tour.go('music'); },
    },
    {
      version: '2.7', title: 'Drafts wait, ↗ finds the tab',
      text: 'Unsent prompts survive the notch closing (a dot marks them). ↗ brings back the exact Terminal or iTerm tab, or the VS Code window.',
      icon: svg('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M10 14l5-5M10.5 9H15v4.5"/>'),
      action: 'Open the panel', run: openPanel,
    },
    {
      version: '2.6', title: 'Spidey joins',
      text: 'Hangs upside down from a web tied round his ankle, and rolls his mask up to drink. Pick him, or Random.',
      icon: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6L6 18"/><circle cx="12" cy="12" r="4"/>'),
      action: 'Meet Spidey', run() { NG.buddySection.show('spidey'); },
    },
    {
      version: '2.6', title: 'Never miss a blocked Claude',
      text: 'When Claude is waiting on you, the notch always opens, even for things you answer in the terminal. The alert stays until you do.',
      icon: svg('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5h4"/>'),
      action: 'Show me', run() { NG.$('[data-scene="alert"]').scrollIntoView({ behavior: 'smooth', block: 'center' }); },
    },
  ];

  /// The hover panel, open, as if the notch was hovered.
  function openPanel() {
    window.scrollTo({ top: 0, behavior: NG.reducedMotion ? 'auto' : 'smooth' });
    setTimeout(() => {
      NG.island.claim('preview', NG.panel.view());
      const release = (event) => {
        if (event.composedPath().includes(NG.island.root)) return;
        document.removeEventListener('click', release);
        NG.island.release('preview');
      };
      setTimeout(() => document.addEventListener('click', release));
    }, NG.reducedMotion ? 0 : 700);
  }

  NG.initWhatsNew = function () {
    const rail = NG.$('#new-rail');
    if (!rail) return;
    rail.innerHTML = releases.map((r, i) => `
      <li class="release" style="--i:${i}">
        <div class="release-top"><span class="release-icon">${r.icon}</span><span class="release-version">v${r.version}</span></div>
        <h3>${e(r.title)}</h3>
        <p>${e(r.text)}</p>
        <button type="button" class="release-go" data-release="${i}">${e(r.action)}<span aria-hidden="true">→</span></button>
      </li>`).join('');
    rail.addEventListener('click', (event) => {
      const button = event.target.closest('[data-release]');
      if (!button) return;
      event.stopPropagation();
      releases[Number(button.dataset.release)].run();
    });
    const scroll = (dir) => rail.scrollBy({ left: dir * Math.min(rail.clientWidth * 0.8, 640), behavior: 'smooth' });
    NG.$('[data-rail="prev"]')?.addEventListener('click', () => scroll(-1));
    NG.$('[data-rail="next"]')?.addEventListener('click', () => scroll(1));
    const sync = () => {
      NG.$('[data-rail="prev"]').disabled = rail.scrollLeft < 8;
      NG.$('[data-rail="next"]').disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
    };
    rail.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  };
})();
