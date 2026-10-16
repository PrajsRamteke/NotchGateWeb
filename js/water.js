// The water reminder from the app's Extras: a buddy drops out of the notch on
// a line, holding a bottle (the robot on its rope, Spidey upside down on a
// web, Batman on his grapnel line). Hover it for Drank it / Snooze, poke it
// and it giggles. It grows more insistent the longer it's ignored, and counts
// glasses toward a daily goal (kept in this browser only). The characters
// themselves are drawn in buddies.js.
(function () {
  'use strict';
  const NG = window.NG;
  const S = () => NG.settings;
  const B = () => NG.buddies;

  // Same thresholds as WaterBotMood.
  const PLEADING_AFTER = 25000;
  const THIRSTY_AFTER = 75000;
  /// The line hangs this far below the notch before the figure starts.
  const ROPE = 62;
  /// Where the line meets the notch, relative to the middle of the screen.
  const LINE_X = -84;

  const markup = () => `
    <div class="wb-hang">
      <span class="wb-line"></span>
      <button class="wb-bot" type="button" aria-label="Your water buddy. Poke it"></button>
      <div class="wb-bubble" aria-live="polite"><b></b><span class="wb-progress"></span></div>
    </div>
    <div class="wb-actions">
      <button class="wb-drank" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3 4.5 6 7.7 6 11a6 6 0 0 1-12 0c0-3.3 3-6.5 6-11z"/></svg>Drank it</button>
      <button class="wb-snooze" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 15.5A8 8 0 0 1 9.5 5a8 8 0 1 0 9.5 10.5z"/></svg><span></span></button>
      <button class="wb-skip" type="button" aria-label="Skip this one"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg></button>
    </div>`;

  // MARK: State

  let root, timer, moodTimer, leaveTimer, swapTimer;
  const bot = {
    state: 'away',        // away · asking · drinking · snoozing
    character: 'robot',
    preview: false,       // ▶ in the menu: doesn't count a glass or move the next reminder
    askedAt: 0,
    hovered: false,
    pokes: 0,
    pokedAt: 0,
    reminders: 0,
    forced: null,         // { mood, until }: the mood gallery's pick
    face: '',
  };

  const today = () => new Date().toDateString();
  function glasses() {
    return NG.storage.get('ng-water-day') === today() ? Number(NG.storage.get('ng-water-glasses')) || 0 : 0;
  }
  function addGlass() {
    NG.storage.set('ng-water-day', today());
    NG.storage.set('ng-water-glasses', String(glasses() + 1));
  }

  const formatMinutes = (m) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} hr ${m % 60} min` : `${m / 60} hr`);

  /// Robot, Spidey or Batman: the setting, or a new pick each time on Random.
  function pick(theme = S().get('waterBuddy')) {
    if (theme !== 'random') return theme;
    const all = ['robot', 'spidey', 'batman'];
    return all[Math.floor(Math.random() * all.length)];
  }

  function mood(t) {
    if (bot.state === 'drinking') return 'delighted';
    if (bot.state === 'snoozing') return 'sleepy';
    if (bot.forced && t < bot.forced.until) return bot.forced.mood;
    if (t - bot.pokedAt < 1400) return 'tickled';
    if (bot.hovered) return 'excited';
    const waited = t - bot.askedAt;
    return waited >= THIRSTY_AFTER ? 'thirsty' : waited >= PLEADING_AFTER ? 'pleading' : 'cheerful';
  }

  function line(m) {
    const goal = S().get('waterGoal');
    if (m === 'delighted' && !bot.preview && glasses() === goal) return 'Goal reached!';
    const lines = B()[bot.character].lines[m];
    return lines[Math.abs(m === 'tickled' ? bot.pokes : bot.reminders - 1) % lines.length];
  }

  // MARK: Drawing

  /// Puts the chosen character on the line.
  function dress() {
    const buddy = B()[bot.character];
    const vars = {
      '--buddy-w': `${buddy.width}px`,
      '--buddy-h': `${buddy.height}px`,
      '--line-x': `${buddy.lineX}px`,
      '--line-end': `${ROPE + buddy.lineTop}px`,
      '--rope': `${ROPE}px`,
      '--bubble-x': `${buddy.bubble.x}px`,
      '--bubble-y': `${ROPE + buddy.bubble.y}px`,
    };
    Object.entries(vars).forEach(([name, value]) => root.style.setProperty(name, value));
    NG.$('.wb-line', root).className = `wb-line is-${buddy.line}`;
    NG.$('.wb-bot', root).innerHTML = buddy.svg('live');
    root.dataset.character = bot.character;
    bot.face = '';
  }

  function draw() {
    if (!root || bot.state === 'away') return;
    const m = mood(Date.now());
    const goal = S().get('waterGoal');
    const count = glasses();
    const svg = NG.$('.wb-svg', root);
    root.dataset.mood = m;
    root.dataset.state = bot.state;
    if (svg) {
      svg.dataset.mood = m;
      svg.classList.toggle('is-drinking', bot.state === 'drinking');
      if (bot.face !== m) { bot.face = m; NG.$('.wb-face', svg).innerHTML = B()[bot.character].face(m); }
    }
    const title = NG.$('.wb-bubble b', root);
    const text = line(m);
    if (title.textContent !== text) {
      title.textContent = text;
      title.classList.remove('is-new');
      void title.offsetWidth;
      title.classList.add('is-new');
    }
    const progress = NG.$('.wb-progress', root);
    progress.removeAttribute('aria-label');
    if (bot.state === 'snoozing') progress.textContent = `Back in ${formatMinutes(S().get('waterSnooze'))}`;
    else if (bot.state === 'drinking') progress.textContent = bot.preview ? 'Just a preview: no glass counted' : count >= goal ? `${count} glasses today` : `${count} of ${goal} today`;
    else if (goal > 12) progress.textContent = `${count} of ${goal} glasses today`;
    else {
      progress.innerHTML = Array.from({ length: goal }, (_, i) => `<i class="${i < count ? 'is-full' : ''}"></i>`).join('');
      progress.setAttribute('aria-label', `${count} of ${goal} glasses today`);
    }
    NG.$('.wb-snooze span', root).textContent = `Snooze ${S().get('waterSnooze')}m`;
    NG.$('.wb-drank', root).title = bot.preview ? 'A preview: this won\'t count a glass' : 'Log a glass of water';
    NG.$('.wb-snooze', root).title = `Remind me in ${formatMinutes(S().get('waterSnooze'))}`;
    document.dispatchEvent(new CustomEvent('ng:water', { detail: { state: bot.state, character: bot.character, mood: m } }));
  }

  // MARK: Life cycle

  /// Drops a buddy out of the notch. `character` overrides the setting;
  /// `preview` is the menu's ▶ (no glass counted, the schedule stays).
  function remind({ character, preview = false } = {}) {
    if (!root || !B()) return;
    clearTimeout(leaveTimer);
    clearTimeout(swapTimer);
    const next = character || pick();
    if (bot.state === 'asking' && next === bot.character) { bot.preview = bot.preview && preview; return draw(); }
    if (bot.state !== 'away' && !root.hidden) {
      // Someone else is on the line: they climb up first.
      climb();
      bot.state = 'away';
      clearInterval(moodTimer);
      swapTimer = setTimeout(() => remind({ character: next, preview }), NG.reducedMotion ? 0 : 520);
      return;
    }
    bot.character = next;
    bot.preview = preview;
    bot.state = 'asking';
    bot.askedAt = Date.now();
    bot.reminders++;
    bot.hovered = false;
    bot.forced = null;
    dress();
    root.hidden = false;
    root.classList.remove('is-leaving', 'is-touched');
    void root.offsetWidth;
    root.classList.add('is-in');
    draw();
    NG.chime();
    clearInterval(moodTimer);
    moodTimer = setInterval(draw, 1000);
  }

  function climb() {
    root.classList.add('is-leaving');
    root.classList.remove('is-in');
  }

  function leave(after = 0) {
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => {
      if (!root || root.hidden) return;
      climb();
      setTimeout(() => {
        if (!root.classList.contains('is-leaving')) return;
        root.hidden = true;
        bot.state = 'away';
        clearInterval(moodTimer);
        document.dispatchEvent(new CustomEvent('ng:water', { detail: { state: 'away', character: bot.character } }));
      }, NG.reducedMotion ? 0 : 650);
    }, after);
    if (!bot.preview) schedule();
  }

  function drink() {
    if (bot.state !== 'asking') return;
    if (!bot.preview) addGlass();
    bot.state = 'drinking';
    draw();
    if (bot.preview) NG.toast('Just a preview, so no glass was counted');
    else NG.toast(glasses() >= S().get('waterGoal') ? 'Daily goal reached. Nice!' : `${glasses()} of ${S().get('waterGoal')} glasses today`);
    leave(2800);
  }

  function snooze() {
    if (bot.state !== 'asking') return;
    bot.state = 'snoozing';
    draw();
    leave(1800);
  }

  function poke() {
    if (bot.state !== 'asking') return;
    bot.pokes++;
    bot.pokedAt = Date.now();
    bot.forced = null;
    const figure = NG.$('.wb-bot', root);
    figure.classList.remove('is-poked', 'is-twirl');
    void figure.offsetWidth;
    // Every fifth poke it does a little twirl on its line.
    figure.classList.add(bot.pokes % 5 === 0 ? 'is-twirl' : 'is-poked');
    draw();
  }

  /// The real reminder: after "Remind every" minutes on the page, like the app.
  function schedule() {
    clearTimeout(timer);
    if (!S().get('waterReminder')) return;
    timer = setTimeout(() => {
      if (document.hidden || (NG.island && NG.island.root.dataset.state !== 'idle')) return schedule();
      remind();
    }, S().get('waterMinutes') * 60000);
  }

  NG.water = {
    remind,
    preview: (character) => remind({ character, preview: true }),
    /// Climbs back up, unless the visitor is in the middle of answering it.
    hide: () => bot.state === 'asking' && leave(),
    /// Shows one mood for a few seconds (the mood gallery).
    showMood(m) {
      if (bot.state !== 'asking') return;
      bot.forced = { mood: m, until: Date.now() + 3200 };
      draw();
    },
    get glasses() { return glasses(); },
    get state() { return bot.state; },
    get character() { return bot.character; },
    formatMinutes,
  };

  NG.initWater = function () {
    root = document.createElement('div');
    root.className = 'waterbot';
    root.hidden = true;
    root.innerHTML = markup();
    document.body.appendChild(root);
    root.style.setProperty('--line-at', `${LINE_X}px`);

    NG.$('.wb-bot', root).addEventListener('click', () => { poke(); root.classList.add('is-touched'); });
    NG.$('.wb-drank', root).addEventListener('click', drink);
    NG.$('.wb-snooze', root).addEventListener('click', snooze);
    NG.$('.wb-skip', root).addEventListener('click', () => leave());
    root.addEventListener('mouseenter', () => { bot.hovered = true; draw(); });
    root.addEventListener('mouseleave', () => { bot.hovered = false; draw(); });

    S().subscribe((key) => {
      if (['waterReminder', 'waterMinutes'].includes(key)) schedule();
      if (key === 'waterReminder' && !S().get('waterReminder')) NG.water.hide();
      if (bot.state !== 'away') draw();
    });
    schedule();
  };
})();
