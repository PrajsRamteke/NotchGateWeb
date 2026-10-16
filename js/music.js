// Now Playing, from the app's Extras: whatever's playing gets a card in the
// hover panel (artwork, a title that scrolls when it's too long, a playhead
// you can drag, and the transport buttons), tinted by the artwork. While it
// plays, the closed notch shows the artwork and a live equalizer.
//
// Playback is pretend: the clock moves, nothing makes a sound.
(function () {
  'use strict';
  const NG = window.NG;
  const S = () => NG.settings;
  const e = NG.escape;

  // MARK: Artwork (drawn, so the page ships no images)

  const art = {
    sunset(id) {
      return `<defs><linearGradient id="a${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6a45a"/><stop offset=".55" stop-color="#ef7d55"/><stop offset="1" stop-color="#e5536b"/></linearGradient></defs>
        <rect width="64" height="64" fill="url(#a${id})"/><circle cx="32" cy="28" r="12" fill="#fff4e4"/>
        ${[36, 41, 46, 51, 56, 61].map((y, i) => `<rect x="0" y="${y}" width="64" height="${1.4 + i * 0.35}" fill="#e5536b" opacity="${0.55 + i * 0.07}"/>`).join('')}`;
    },
    tide(id) {
      return `<defs><linearGradient id="a${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d2a4a"/><stop offset="1" stop-color="#1f7a8c"/></linearGradient></defs>
        <rect width="64" height="64" fill="url(#a${id})"/><circle cx="44" cy="18" r="7" fill="#e6f4ff"/><circle cx="47" cy="16" r="6" fill="#163a5c"/>
        ${[34, 42, 50, 58].map((y, i) => `<path d="M-4 ${y}q8-6 16 0t16 0 16 0 16 0 16 0" fill="none" stroke="#8fd3e8" stroke-width="2" opacity="${0.9 - i * 0.15}"/>`).join('')}
        <path d="M20 40l6-10 6 10z" fill="#e6f4ff" opacity=".85"/>`;
    },
    bloom(id) {
      return `<defs><linearGradient id="a${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd1e1"/><stop offset="1" stop-color="#9b7fe6"/></linearGradient></defs>
        <rect width="64" height="64" fill="url(#a${id})"/>
        ${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="32" cy="22" rx="7" ry="11" fill="#fff" opacity=".55" transform="rotate(${r} 32 33)"/>`).join('')}
        <circle cx="32" cy="33" r="6" fill="#ff8fb1"/><path d="M8 54q12-8 24 0t24 0" fill="none" stroke="#fff" stroke-width="1.6" opacity=".7"/>`;
    },
    video(id) {
      return `<defs><linearGradient id="a${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b2f3a"/><stop offset="1" stop-color="#14161c"/></linearGradient></defs>
        <rect width="64" height="64" fill="url(#a${id})"/><rect x="9" y="12" width="46" height="34" rx="5" fill="#000" stroke="#3b4150"/>
        <rect x="18" y="17" width="28" height="5" rx="2.5" fill="#d97757"/>
        <rect x="14" y="26" width="18" height="2.4" rx="1.2" fill="#6fa8dc"/><rect x="34" y="26" width="14" height="2.4" rx="1.2" fill="#e9b45a"/>
        <rect x="14" y="31" width="26" height="2.4" rx="1.2" fill="#6cc49a"/><rect x="14" y="36" width="12" height="2.4" rx="1.2" fill="#a48be0"/>
        <rect x="22" y="50" width="20" height="5" rx="2.5" fill="#e5484d"/><path d="M30 51.2v2.6l2.4-1.3z" fill="#fff"/>`;
    },
    podcast(id) {
      return `<defs><linearGradient id="a${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b267e6"/><stop offset="1" stop-color="#5b2a9e"/></linearGradient></defs>
        <rect width="64" height="64" fill="url(#a${id})"/>
        <rect x="26" y="14" width="12" height="22" rx="6" fill="#fff"/><path d="M20 30a12 12 0 0 0 24 0M32 42v8M25 50h14" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M12 24q-4 8 0 16M52 24q4 8 0 16" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/>`;
    },
  };

  /// `slot` keeps gradient ids stable between renders and unique on the page.
  const artwork = (track, slot = 'card') =>
    `<svg class="np-artwork" viewBox="0 0 64 64" aria-hidden="true">${art[track.art](`-${track.art}-${slot}`)}</svg>`;

  // MARK: Players: what each one lets you do

  const players = {
    Music: { icon: '<svg viewBox="0 0 16 16"><rect width="16" height="16" rx="4" fill="#fa2d55"/><path d="M6.2 11.2V5.4l5-1v5.2" fill="none" stroke="#fff" stroke-width="1.3"/><circle cx="5" cy="11.3" r="1.5" fill="#fff"/><circle cx="10" cy="10.3" r="1.5" fill="#fff"/></svg>', all: true },
    Spotify: { icon: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#1ed760"/><path d="M4.2 6.2c2.6-.8 5.3-.6 7.6.6M4.7 8.4c2.1-.6 4.3-.4 6.1.5M5.2 10.4c1.6-.4 3.2-.3 4.6.4" fill="none" stroke="#000" stroke-width="1.1" stroke-linecap="round"/></svg>', all: true },
    Podcasts: { icon: '<svg viewBox="0 0 16 16"><rect width="16" height="16" rx="4" fill="#9b4dde"/><circle cx="8" cy="6.6" r="1.6" fill="#fff"/><path d="M7.2 9h1.6l-.3 3.6h-1z" fill="#fff"/><path d="M4.6 9.6a4 4 0 1 1 6.8 0" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/></svg>', shuffle: false, repeat: false },
    Chrome: { icon: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#e5484d"/><circle cx="8" cy="8" r="3.2" fill="#fff"/><circle cx="8" cy="8" r="2.2" fill="#3b82f6"/></svg>', shuffle: false, repeat: false, previous: false },
  };
  const can = (track, command) => {
    const player = players[track.app];
    return player.all || player[command] !== false;
  };
  /// Hidden, not dimmed: shuffle and repeat mean nothing to a podcast or a video.
  const hides = (track, command) => (command === 'shuffle' || command === 'repeat') && !can(track, command);

  // MARK: State

  const tracks = [
    { title: 'Golden Hour Drive (Extended Sunset Mix)', artist: 'Lumen & The Tides', album: 'Neon Coast', app: 'Music', duration: 247, art: 'sunset', a: '#ef7d55', b: '#7a2b3a', accent: '#f28a5e' },
    { title: 'Midnight Ferry', artist: 'Harbor Lights', album: 'Low Tide', app: 'Spotify', duration: 214, art: 'tide', a: '#2a8aa3', b: '#0d2a4a', accent: '#5cc6dd' },
    { title: 'Paper Planes over Kyoto', artist: 'Mono Garden', album: 'Soft Focus', app: 'Music', duration: 198, art: 'bloom', a: '#c88be6', b: '#7a4fb8', accent: '#e59ad0' },
    { title: 'Building a notch app in SwiftUI, from first sketch to shipping', artist: 'Indie Dev Diaries', app: 'Chrome', source: 'YouTube', duration: 1342, art: 'video', a: '#c2414b', b: '#2b2f3a', accent: '#ef6a6f' },
    { title: 'Agents in the terminal, with the people who build them', artist: 'Ship It Weekly', album: 'Episode 112', app: 'Podcasts', duration: 2710, art: 'podcast', a: '#a058e0', b: '#3d1a6e', accent: '#c48af2' },
  ];

  const state = {
    index: 0,
    playing: true,
    position: 84,
    clockAt: Date.now(),
    shuffle: true,
    repeat: 'off',       // off · all · one
    scrubbing: false,
  };

  const track = () => tracks[state.index];
  const enabled = () => S().get('nowPlaying');

  function position() {
    const t = track();
    const moved = state.playing && !state.scrubbing ? (Date.now() - state.clockAt) / 1000 : 0;
    return Math.min(t.duration, state.position + moved);
  }

  function setPosition(seconds) {
    state.position = Math.max(0, Math.min(track().duration, seconds));
    state.clockAt = Date.now();
  }

  function changed() {
    document.dispatchEvent(new CustomEvent('ng:music'));
    NG.panel && NG.panel.rerender();
  }

  function go(step) {
    let next = state.index + step;
    if (state.shuffle && step > 0 && can(track(), 'shuffle')) {
      next = (state.index + 1 + Math.floor(Math.random() * (tracks.length - 1))) % tracks.length;
    }
    state.index = (next + tracks.length) % tracks.length;
    setPosition(0);
    changed();
  }

  /// Runs the clock: at the end of a track, repeat it or move on.
  function tick() {
    if (!state.playing || state.scrubbing) return;
    if (position() >= track().duration) {
      if (state.repeat === 'one') { setPosition(0); changed(); } else go(1);
    }
  }

  // MARK: Formatting

  function clock(seconds) {
    const s = Math.max(0, Math.round(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const rest = String(s % 60).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${rest}` : `${m}:${rest}`;
  }

  // MARK: Icons

  const svg = (body, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  const I = {
    shuffle: svg('<path d="M3.5 7h3.2c2 0 3.2 1 4.3 2.6l2 3c1.1 1.6 2.3 2.6 4.3 2.6h3.2M3.5 17h3.2c1.4 0 2.4-.5 3.2-1.3M13.8 8.3c.8-.8 1.8-1.3 3.2-1.3h3.2"/><path d="M18 4.5l2.5 2.5L18 9.5M18 14.5l2.5 2.5-2.5 2.5"/>'),
    repeat: svg('<path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H19M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H5"/><path d="M16.5 3.5L19 6l-2.5 2.5M7.5 20.5L5 18l2.5-2.5"/>'),
    back15: svg('<path d="M12 4.5a7.5 7.5 0 1 1-7.1 5.1"/><path d="M12 1.8v5.4L9 4.5z" fill="currentColor"/><text x="12" y="15.6" text-anchor="middle" font-size="7.4" font-weight="700" fill="currentColor" stroke="none" font-family="-apple-system,system-ui,sans-serif">15</text>'),
    fwd15: svg('<path d="M12 4.5a7.5 7.5 0 1 0 7.1 5.1"/><path d="M12 1.8v5.4l3-2.7z" fill="currentColor"/><text x="12" y="15.6" text-anchor="middle" font-size="7.4" font-weight="700" fill="currentColor" stroke="none" font-family="-apple-system,system-ui,sans-serif">15</text>'),
    prev: svg('<path d="M12 6.5v11L4 12zM20.5 6.5v11L12.5 12z" fill="currentColor" stroke="none"/>'),
    next: svg('<path d="M12 6.5v11l8-5.5zM3.5 6.5v11l8-5.5z" fill="currentColor" stroke="none"/>'),
    play: svg('<path d="M8 5.2v13.6L19 12z" fill="currentColor" stroke="none"/>'),
    pause: svg('<rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/>'),
    out: svg('<path d="M8 16l8-8M9.5 8H16v6.5"/>'),
    note: svg('<path d="M9 17.5V6.5l10-2v10.5"/><circle cx="6.8" cy="17.6" r="2.4" fill="currentColor"/><circle cx="16.8" cy="15.4" r="2.4" fill="currentColor"/>'),
  };

  const eq = (bars = 4, cls = '') => `<span class="np-eq ${cls} ${state.playing ? 'is-playing' : ''}" aria-hidden="true">${'<i></i>'.repeat(bars)}</span>`;

  function button(action, icon, label, { disabled, on, cls = '' } = {}) {
    return `<button type="button" class="np-btn ${cls}" data-action="${action}" aria-label="${label}" title="${label}"
      ${on !== undefined ? `aria-pressed="${on}"` : ''} ${disabled ? 'disabled' : ''}>${icon}</button>`;
  }

  // MARK: The card

  function card() {
    const t = track();
    const at = position();
    const fraction = at / t.duration;
    const subtitle = [t.artist, t.album].filter(Boolean).join(' — ');
    const source = t.source ? `${t.source} · ${t.app}` : t.app;
    const repeatLabel = { off: 'Repeat: off', all: 'Repeat: all', one: 'Repeat: one' }[state.repeat];
    const controls = [
      hides(t, 'shuffle') ? '<span class="np-gap"></span>' : button('np-shuffle', I.shuffle, state.shuffle ? 'Shuffle: on' : 'Shuffle: off', { on: state.shuffle, cls: 'is-toggle' }),
      button('np-back15', I.back15, 'Back 15 seconds'),
      button('np-prev', I.prev, 'Previous', { disabled: !can(t, 'previous'), cls: 'is-skip' }),
      `<button type="button" class="np-play" data-action="np-play" aria-label="${state.playing ? 'Pause' : 'Play'}" title="${state.playing ? 'Pause' : 'Play'}">${state.playing ? I.pause : I.play}</button>`,
      button('np-next', I.next, 'Next', { cls: 'is-skip' }),
      button('np-fwd15', I.fwd15, 'Forward 15 seconds'),
      hides(t, 'repeat') ? '<span class="np-gap"></span>' : button('np-repeat', `${I.repeat}${state.repeat === 'one' ? '<b>1</b>' : ''}`, repeatLabel, { on: state.repeat !== 'off', cls: 'is-toggle' }),
    ].join('');
    return `<section class="wg np" data-key="w-music" style="--np-a:${t.a};--np-b:${t.b};--np-accent:${t.accent}">
      <div class="np-head">
        ${eq(3, 'is-small')}<span class="np-label">${state.playing ? 'Now Playing' : 'Paused'}</span><span class="grow"></span>
        <button type="button" class="np-app" data-action="np-open" title="Bring ${e(t.app)} to the front">${players[t.app].icon}<span>${e(source)}</span>${I.out}</button>
      </div>
      <div class="np-main">
        <button type="button" class="np-art ${state.playing ? 'is-playing' : ''}" data-action="np-open" aria-label="Open ${e(t.app)}" data-key="art-${state.index}">${artwork(t)}</button>
        <div class="np-text">
          <div class="np-title" data-key="title-${state.index}"><span>${e(t.title)}</span></div>
          ${subtitle ? `<small>${e(subtitle)}</small>` : ''}
        </div>
      </div>
      <div class="np-seek ${state.scrubbing ? 'is-scrubbing' : ''}" data-np-seek role="slider" tabindex="0" aria-label="Playback position"
        aria-valuemin="0" aria-valuemax="${t.duration}" aria-valuenow="${Math.round(at)}" aria-valuetext="${clock(at)} of ${clock(t.duration)}">
        <span class="np-track"><i class="np-fill" style="width:${(fraction * 100).toFixed(2)}%"></i></span>
        <b class="np-knob" style="left:${(fraction * 100).toFixed(2)}%"></b>
      </div>
      <div class="np-times"><span>${clock(at)}</span><span>-${clock(t.duration - at)}</span></div>
      <div class="np-controls">${controls}</div>
    </section>`;
  }

  /// Long titles scroll, like the app's MarqueeText.
  function fit(root) {
    NG.$$('.np-title', root).forEach((box) => {
      const span = box.firstElementChild;
      const overflow = span.scrollWidth - box.clientWidth;
      const scrolls = overflow > 4;
      box.classList.toggle('is-marquee', scrolls);
      if (scrolls) {
        box.style.setProperty('--np-shift', `${-overflow - 24}px`);
        box.style.setProperty('--np-time', `${Math.max(6, overflow / 22 + 4)}s`);
      }
    });
  }

  // MARK: Actions

  function act(action) {
    const t = track();
    switch (action) {
      case 'np-play':
        setPosition(position());
        state.playing = !state.playing;
        break;
      case 'np-next': go(1); return;
      case 'np-prev':
        // Like every player: a few seconds in, "previous" restarts the track.
        if (position() > 3) { setPosition(0); break; }
        go(-1);
        return;
      case 'np-back15': setPosition(position() - 15); break;
      case 'np-fwd15': setPosition(position() + 15); break;
      case 'np-shuffle': state.shuffle = !state.shuffle; break;
      case 'np-repeat': state.repeat = { off: 'all', all: 'one', one: 'off' }[state.repeat]; break;
      case 'np-open': NG.toast(`Brings ${t.app} to the front`); return;
      default: return;
    }
    changed();
  }

  // MARK: Dragging the playhead

  function wireSeek(root) {
    let seek = null;
    const seekTo = (event) => {
      const rect = seek.getBoundingClientRect();
      const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      setPosition(fraction * track().duration);
      // Move the bar right away; the next render catches up with the rest.
      NG.$('.np-fill', seek).style.width = `${fraction * 100}%`;
      NG.$('.np-knob', seek).style.left = `${fraction * 100}%`;
      const times = NG.$$('.np-times span', seek.parentElement);
      if (times.length === 2) {
        times[0].textContent = clock(position());
        times[1].textContent = `-${clock(track().duration - position())}`;
      }
    };
    root.addEventListener('pointerdown', (event) => {
      const target = event.target.closest('[data-np-seek]');
      if (!target) return;
      event.preventDefault();
      seek = target;
      state.scrubbing = true;
      seek.classList.add('is-scrubbing');
      seek.setPointerCapture(event.pointerId);
      seekTo(event);
    });
    root.addEventListener('pointermove', (event) => { if (seek) seekTo(event); });
    const end = () => {
      if (!seek) return;
      seek = null;
      state.scrubbing = false;
      state.clockAt = Date.now();
      changed();
    };
    root.addEventListener('pointerup', end);
    root.addEventListener('pointercancel', end);
    root.addEventListener('keydown', (event) => {
      if (!event.target.closest('[data-np-seek]')) return;
      const step = { ArrowLeft: -5, ArrowRight: 5 }[event.key];
      if (!step) return;
      event.preventDefault();
      setPosition(position() + step);
      changed();
    });
  }

  // MARK: Public

  NG.music = {
    card,
    act,
    fit,
    artwork,
    eq,
    get track() { return track(); },
    get playing() { return state.playing; },
    /// The closed notch shows the artwork and an equalizer while music plays.
    showsInClosedNotch: () => enabled() && S().get('nowPlayingClosed') && state.playing,
    enabled,
  };

  NG.initMusic = function () {
    if (NG.island) wireSeek(NG.island.root);
    setInterval(tick, 500);
    S().subscribe((key) => { if (key === 'nowPlaying' || key === 'nowPlayingClosed') changed(); });
  };
})();
