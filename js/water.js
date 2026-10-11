// The water reminder from the app's Extras: a little bot drops out of the
// notch on a rope, holding a bottle. Hover it for Drank it / Snooze, poke it
// and it giggles. It grows more insistent the longer it's ignored, and counts
// glasses toward a daily goal (kept in this browser only).
(function () {
  'use strict';
  const NG = window.NG;
  const S = () => NG.settings;

  // Same thresholds as WaterBotMood.
  const PLEADING_AFTER = 25000;
  const THIRSTY_AFTER = 75000;

  // MARK: Faces

  const eyes = {
    cheerful: '<path class="wb-glow" d="M40 58q5-6 10 0M70 58q5-6 10 0"/><path class="wb-glow" d="M55 67q5 4 10 0"/>',
    excited: `${['45', '75'].map((x) => `<path class="wb-fill" transform="translate(${x} 56)" d="M0-7l1.8 5.2L7 0l-5.2 1.8L0 7l-1.8-5.2L-7 0l5.2-1.8z"/>`).join('')}<path class="wb-fill" d="M56 66h8q-4 6-8 0z"/>`,
    pleading: '<circle class="wb-fill" cx="45" cy="57" r="6"/><circle class="wb-fill" cx="75" cy="57" r="6"/><circle cx="47" cy="55" r="2" fill="#1b1512"/><circle cx="77" cy="55" r="2" fill="#1b1512"/><circle class="wb-fill" cx="60" cy="68" r="2.2"/>',
    thirsty: '<path class="wb-glow" d="M39 57h11M70 57h11"/><path class="wb-glow" d="M53 69q2.5-3 5 0t5 0t5 0"/><path class="wb-sweat" d="M92 30q3 5 0 7q-3-2 0-7z"/>',
    delighted: '<path class="wb-glow" d="M40 58q5-6 10 0M70 58q5-6 10 0"/><path class="wb-fill" d="M54 65h12q-6 8-12 0z"/>',
    sleepy: '<path class="wb-glow" d="M40 57q5 4 10 0M70 57q5 4 10 0"/><circle class="wb-fill" cx="60" cy="68" r="1.2"/><text class="wb-z" x="94" y="22">z</text><text class="wb-z" x="101" y="13">z</text>',
    tickled: '<path class="wb-glow" d="M40 53l8 4-8 4M80 53l-8 4 8 4"/><path class="wb-glow" d="M55 66q5 5 10 0"/>',
  };

  const figure = () => `
    <svg class="wb-svg" viewBox="0 0 132 158" aria-hidden="true">
      <defs>
        <linearGradient id="wb-shell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf7ef"/><stop offset="1" stop-color="#e6dfd2"/></linearGradient>
        <linearGradient id="wb-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd0ff"/><stop offset="1" stop-color="#4b8fe6"/></linearGradient>
        <clipPath id="wb-bottle-clip"><rect x="-10" y="-14" width="20" height="30" rx="6"/></clipPath>
      </defs>
      <path class="wb-arm-up" d="M26 92c-14-14-12-60 26-68"/>
      <circle cx="60" cy="14" r="7" fill="url(#wb-shell)" stroke="#c9bfae" stroke-width="1.2"/>
      <path d="M54 12h12M54 16h12" stroke="#c9bfae" stroke-width="1.2"/>
      <circle cx="13" cy="58" r="11" fill="#d97757"/><circle cx="13" cy="58" r="5" fill="#7a3f2a"/>
      <circle cx="107" cy="58" r="11" fill="#d97757"/><circle cx="107" cy="58" r="5" fill="#7a3f2a"/>
      <rect x="16" y="22" width="88" height="74" rx="34" fill="url(#wb-shell)"/>
      <path transform="translate(60 31)" d="M0-6.5L1.3-1.3 6.5 0 1.3 1.3 0 6.5-1.3 1.3-6.5 0-1.3-1.3z" fill="#d97757"/>
      <rect x="27" y="40" width="66" height="44" rx="19" fill="#1b1512"/>
      <ellipse cx="38" cy="67" rx="5" ry="3" fill="#d97757" opacity=".45"/><ellipse cx="82" cy="67" rx="5" ry="3" fill="#d97757" opacity=".45"/>
      <g class="wb-face"></g>
      <rect x="40" y="96" width="40" height="11" fill="#2a2420"/>
      <rect x="34" y="100" width="52" height="34" rx="15" fill="url(#wb-shell)"/>
      <rect x="34" y="117" width="52" height="6" fill="#d97757"/>
      <circle cx="60" cy="108" r="3.4" fill="#f3b48f"/>
      <rect x="44" y="132" width="7" height="9" fill="#2a2420"/><rect x="69" y="132" width="7" height="9" fill="#2a2420"/>
      <ellipse cx="46" cy="145" rx="11" ry="6.5" fill="url(#wb-shell)" stroke="#d97757" stroke-width="2"/>
      <ellipse cx="74" cy="145" rx="11" ry="6.5" fill="url(#wb-shell)" stroke="#d97757" stroke-width="2"/>
      <path d="M84 110l10 2" stroke="#2a2420" stroke-width="5" stroke-linecap="round"/>
      <g class="wb-bottle">
        <rect x="-10" y="-14" width="20" height="30" rx="6" fill="rgba(220,238,255,.55)" stroke="#fff" stroke-width="1.6"/>
        <g clip-path="url(#wb-bottle-clip)"><rect class="wb-water" x="-10" y="-14" width="20" height="30" fill="url(#wb-water)"/></g>
        <circle cx="-3" cy="6" r="1.6" fill="none" stroke="#fff" stroke-width=".9"/><circle cx="3" cy="-2" r="1.2" fill="none" stroke="#fff" stroke-width=".9"/>
        <rect x="-6" y="-21" width="12" height="7" rx="2" fill="#d97757"/>
      </g>
      <circle cx="95" cy="113" r="6" fill="url(#wb-shell)" stroke="#2a2420" stroke-width="1.6"/>
    </svg>`;

  const markup = () => `
    <div class="wb-hang">
      <span class="wb-rope"></span>
      <button class="wb-bot" type="button" aria-label="Water bot. Poke it">${figure()}</button>
      <div class="wb-bubble" aria-live="polite"><b></b><span class="wb-progress"></span></div>
    </div>
    <div class="wb-actions">
      <button class="wb-drink" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3 4.5 6 7.7 6 11a6 6 0 0 1-12 0c0-3.3 3-6.5 6-11z"/></svg>Drank it</button>
      <button class="wb-snooze" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 15.5A8 8 0 0 1 9.5 5a8 8 0 1 0 9.5 10.5z"/></svg><span></span></button>
      <button class="wb-skip" type="button" aria-label="Skip this one"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg></button>
    </div>`;

  // MARK: State

  let root, timer, moodTimer, leaveTimer;
  const bot = {
    state: 'away',        // away · asking · drinking · snoozing
    askedAt: 0,
    hovered: false,
    pokes: 0,
    pokedAt: 0,
    reminders: 0,
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

  function mood(t) {
    if (bot.state === 'drinking') return 'delighted';
    if (bot.state === 'snoozing') return 'sleepy';
    if (t - bot.pokedAt < 1400) return 'tickled';
    if (bot.hovered) return 'excited';
    const waited = t - bot.askedAt;
    return waited >= THIRSTY_AFTER ? 'thirsty' : waited >= PLEADING_AFTER ? 'pleading' : 'cheerful';
  }

  function line(m) {
    const goal = S().get('waterGoal');
    if (m === 'delighted' && glasses() === goal) return 'Goal reached!';
    if (m === 'sleepy') return 'Okay… nap time';
    const lines = NG.demo.water[m];
    return lines[(m === 'tickled' ? bot.pokes : bot.reminders - 1) % lines.length];
  }

  function draw() {
    if (!root) return;
    const m = mood(Date.now());
    const goal = S().get('waterGoal');
    const count = glasses();
    root.dataset.mood = m;
    root.dataset.state = bot.state;
    NG.$('.wb-face', root).innerHTML = eyes[m];
    const title = NG.$('.wb-bubble b', root);
    const text = line(m);
    if (title.textContent !== text) {
      title.textContent = text;
      title.classList.remove('is-new');
      void title.offsetWidth;
      title.classList.add('is-new');
    }
    const progress = NG.$('.wb-progress', root);
    if (bot.state === 'snoozing') progress.textContent = `Back in ${formatMinutes(S().get('waterSnooze'))}`;
    else if (bot.state === 'drinking') progress.textContent = count >= goal ? `${count} glasses today` : `${count} of ${goal} today`;
    else if (goal > 12) progress.textContent = `${count} of ${goal} glasses today`;
    else {
      progress.innerHTML = Array.from({ length: goal }, (_, i) => `<i class="${i < count ? 'is-full' : ''}"></i>`).join('');
      progress.setAttribute('aria-label', `${count} of ${goal} glasses today`);
    }
    NG.$('.wb-snooze span', root).textContent = `Snooze ${S().get('waterSnooze')}m`;
    NG.$('.wb-drink', root).title = 'Log a glass of water';
    NG.$('.wb-snooze', root).title = `Remind me in ${formatMinutes(S().get('waterSnooze'))}`;
  }

  // MARK: Life cycle

  /// Drops the bot out of the notch (also used by the menu's preview and the story).
  function remind() {
    if (!root) return;
    clearTimeout(leaveTimer);
    if (bot.state === 'asking') return;
    bot.state = 'asking';
    bot.askedAt = Date.now();
    bot.reminders++;
    bot.hovered = false;
    root.hidden = false;
    root.classList.remove('is-leaving');
    void root.offsetWidth;
    root.classList.add('is-in');
    draw();
    if (S().get('sound')) NG.chime();
    clearInterval(moodTimer);
    moodTimer = setInterval(draw, 1000);
  }

  function leave(after = 0) {
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => {
      if (!root || root.hidden) return;
      root.classList.add('is-leaving');
      root.classList.remove('is-in');
      setTimeout(() => {
        if (!root.classList.contains('is-leaving')) return;
        root.hidden = true;
        bot.state = 'away';
        clearInterval(moodTimer);
      }, NG.reducedMotion ? 0 : 650);
    }, after);
    schedule();
  }

  function drink() {
    if (bot.state !== 'asking') return;
    addGlass();
    bot.state = 'drinking';
    draw();
    NG.toast(glasses() >= S().get('waterGoal') ? 'Daily goal reached. Nice!' : `${glasses()} of ${S().get('waterGoal')} glasses today`);
    leave(2600);
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
    const figureEl = NG.$('.wb-bot', root);
    figureEl.classList.remove('is-poked', 'is-twirl');
    void figureEl.offsetWidth;
    // Every fifth poke it does a little twirl on its rope.
    figureEl.classList.add(bot.pokes % 5 === 0 ? 'is-twirl' : 'is-poked');
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
    /// Climbs back up, unless the visitor is in the middle of answering it.
    hide: () => bot.state === 'asking' && leave(),
    get glasses() { return glasses(); },
    formatMinutes,
  };

  NG.initWater = function () {
    root = document.createElement('div');
    root.className = 'waterbot';
    root.hidden = true;
    root.innerHTML = markup();
    document.body.appendChild(root);

    NG.$('.wb-bot', root).addEventListener('click', () => { poke(); root.classList.add('is-touched'); });
    NG.$('.wb-drink', root).addEventListener('click', drink);
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
