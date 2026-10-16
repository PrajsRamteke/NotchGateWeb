// The widgets tour: one widget at a time, in the real notch. Scrolling
// through the section steps from widget to widget (the dock follows, with a
// bar for how far along each one you are); clicking a widget jumps there.
(function () {
  'use strict';
  const NG = window.NG;
  const S = () => NG.settings;
  const e = NG.escape;

  const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  const stops = [
    {
      id: 'music', setting: 'nowPlaying', name: 'Now Playing', icon: svg('<path d="M9.5 17.5V6l9-2v11.5"/><circle cx="7" cy="17.5" r="2.5"/><circle cx="16" cy="15.5" r="2.5"/>'),
      line: 'Whatever\'s playing on your Mac.',
      body: 'Music, Spotify, Podcasts or a YouTube tab, with the artwork, a playhead you can drag and every control. The card takes its colours from the artwork.',
      points: ['Shuffle, ±15 s, previous, play, next, repeat', 'Long titles scroll; drag the bar to seek', 'Artwork and a live equalizer in the closed notch'],
      try: 'Press ⏭ for the next track, or drag the playhead.',
    },
    {
      id: 'usage', setting: 'usageWidget', name: 'Usage', icon: svg('<path d="M4.5 16.5a8 8 0 1 1 15 0"/><path d="M12 13l3.5-4"/>'),
      line: 'Your plan\'s limits, before you hit them.',
      body: 'Your 5-hour and weekly limits as two bars, with when each one resets. They turn amber at 75% and red at 90%.',
      points: ['Reads Claude Code\'s status line', 'Your own status line keeps working', 'Pro and Max plans'],
      try: 'Prompt the playground below and watch the 5-hour bar move.',
    },
    {
      id: 'insights', setting: 'insightsWidget', name: 'Insights', icon: svg('<path d="M4 20h16M6.5 16.5v-5M10.5 16.5V7M14.5 16.5v-3.5M18.5 16.5V9"/>'),
      line: 'What Claude cost, and where it went.',
      body: 'Cost and tokens over the last 24 hours, 7 or 30 days: a bar per hour or day, sessions, active time, prompts and files, the busiest projects and the split by model.',
      points: ['Hover a bar for that hour or day', 'At API list prices, cache included', 'Read from your transcripts, on your Mac'],
      try: 'Switch between 24h, 7d and 30d, then hover the bars.',
    },
    {
      id: 'session', setting: 'sessionWidget', name: 'Session', icon: svg('<rect x="5.5" y="5.5" width="13" height="13" rx="2.5"/><rect x="9.5" y="9.5" width="5" height="5" rx=".8"/><path d="M10 2.8v2.7M14 2.8v2.7M10 18.5v2.7M14 18.5v2.7M2.8 10h2.7M2.8 14h2.7M18.5 10h2.7M18.5 14h2.7"/>'),
      line: 'Model, context and cost, per session.',
      body: 'How full each session\'s context window is, what it has cost so far and which branch it\'s on. With several running, a line each and their total.',
      points: ['Context turns amber, then red', 'Git branch at a glance', 'Also behind each session\'s chip button'],
      try: 'Hover a line to see its branch.',
    },
    {
      id: 'tools', setting: 'toolsWidget', name: 'Tool activity', icon: svg('<path d="M13.5 6.5l4 4M4 20l9.2-9.2"/><path d="M11 4.5c2.6-1.4 5.6-1 7.6 1l1.9 1.9-2.4 2.4-1.9-1.9-2.3 2.3-3.3-3.3z"/>'),
      line: 'Every tool call, counted.',
      body: 'Bash, Edit, Read, Search, Web, Agents and MCP calls as one split bar with counts, and a heat strip of the last hour.',
      points: ['All sessions, or pick one', 'Two-minute cells, an hour back', 'Same categories as the app'],
      try: 'Pick a session chip to see just its calls.',
    },
    {
      id: 'resume', setting: 'resumeWidget', name: 'Resume', icon: svg('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4v4h4"/><path d="M12 8v4.5l3 1.8"/>'),
      line: 'Back into a session in one click.',
      body: 'Recent sessions that aren\'t running, each one click from claude --resume in a new Terminal window, plus New session in any folder.',
      points: ['Shows each session\'s branch and age', 'Spots a moved or deleted folder', 'New session: a recent project, Home or any folder'],
      try: 'Press Resume, or pick a folder for a new session.',
    },
  ];

  let section, dock, detail, index = -1, inView = false;

  function renderDetail(stop, i) {
    detail.innerHTML = `
      <div class="tour-step" data-key="${stop.id}">
        <span class="tour-count">${String(i + 1).padStart(2, '0')} <i>/ ${String(stops.length).padStart(2, '0')}</i></span>
        <h3>${e(stop.name)}</h3>
        <p class="tour-line">${e(stop.line)}</p>
        <p class="tour-body">${e(stop.body)}</p>
        <ul>${stop.points.map((p) => `<li>${e(p)}</li>`).join('')}</ul>
        <p class="tour-try"><span>Try it</span>${e(stop.try)}</p>
      </div>`;
  }

  /// Shows widget `i` in the notch.
  function select(i) {
    if (i === index) return;
    index = i;
    const stop = stops[i];
    NG.$$('.tour-item', dock).forEach((item, n) => {
      item.setAttribute('aria-selected', String(n === i));
      item.classList.toggle('is-past', n < i);
    });
    renderDetail(stop, i);
    // On narrow screens the dock is a row that scrolls: keep the current chip in view.
    if (dock.scrollWidth > dock.clientWidth) {
      const item = NG.$$('.tour-item', dock)[i];
      const left = item.getBoundingClientRect().left - dock.getBoundingClientRect().left + dock.scrollLeft;
      dock.scrollTo({ left: left - dock.clientWidth / 2 + item.offsetWidth / 2, behavior: NG.reducedMotion ? 'auto' : 'smooth' });
    }
    if (!inView) return;
    show(stop);
  }

  function show(stop) {
    S().set(stop.setting, true);
    if (stop.id === 'insights' && S().get('panelWidget') !== 'insights') NG.insights.grow();
    S().set('panelWidget', stop.id);
    NG.island.claim('tour', NG.panel.view({ widgetOnly: true }));
  }

  /// How far through the section the visitor has scrolled, 0…1.
  function progress() {
    const rect = section.getBoundingClientRect();
    const travel = section.offsetHeight - window.innerHeight;
    return Math.min(1, Math.max(0, -rect.top / Math.max(travel, 1)));
  }

  function onScroll() {
    if (!inView) return;
    const p = progress() * stops.length;
    const i = Math.min(stops.length - 1, Math.floor(p));
    select(i);
    NG.$$('.tour-item', dock).forEach((item, n) => {
      const fill = Math.min(1, Math.max(0, p - n));
      item.style.setProperty('--fill', fill.toFixed(3));
    });
  }

  /// Clicking a widget scrolls to its stretch of the section.
  function jump(i) {
    const travel = section.offsetHeight - window.innerHeight;
    const top = section.getBoundingClientRect().top + window.scrollY + ((i + 0.35) / stops.length) * travel;
    window.scrollTo({ top, behavior: NG.reducedMotion ? 'auto' : 'smooth' });
  }

  /// The hint (and, below the wide layout, the copy) sits under the notch, however tall it grows.
  function fitUnderNotch() {
    if (!inView || NG.island.root.dataset.state !== 'open') return;
    // The height it's springing to, not where the animation is now.
    const bottom = parseFloat(NG.island.root.style.getPropertyValue('--h')) || NG.island.root.getBoundingClientRect().height;
    section.style.setProperty('--notch-bottom', `${Math.round(bottom)}px`);
  }

  NG.tour = {
    /// Scrolls to one widget ("What's new" links here).
    go(id) {
      const i = stops.findIndex((s) => s.id === id);
      if (i >= 0) jump(i);
    },
  };

  NG.initTour = function () {
    section = NG.$('#widgets');
    if (!section) return;
    dock = NG.$('.tour-dock', section);
    detail = NG.$('.tour-detail', section);
    dock.innerHTML = stops.map((stop, i) => `
      <li><button type="button" class="tour-item" role="tab" data-index="${i}" aria-selected="false" aria-controls="tour-detail">
        <span class="tour-icon">${stop.icon}</span>
        <span class="tour-name"><b>${e(stop.name)}</b><small>${e(stop.line)}</small></span>
        <span class="tour-fill" aria-hidden="true"></span>
      </button></li>`).join('');
    select(0);

    dock.addEventListener('click', (event) => {
      const item = event.target.closest('.tour-item');
      if (item) jump(Number(item.dataset.index));
    });
    dock.addEventListener('keydown', (event) => {
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const next = Math.min(stops.length - 1, Math.max(0, index + step));
      jump(next);
      NG.$$('.tour-item', dock)[next].focus({ preventScroll: true });
    });

    // The sticky stage is "in view" while it pins the screen.
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      section.classList.toggle('is-live', inView);
      if (inView) { index = -1; onScroll(); } else NG.island.release('tour');
    }, { rootMargin: '-40% 0px -40% 0px' });
    observer.observe(section);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('ng:rendered', fitUnderNotch);
  };
})();
