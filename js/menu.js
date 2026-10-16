// The NotchGate menu-bar menu, recreated from the app (2.8 onwards): an
// update banner, then sections that fold open, each with an icon tile and a
// one-line summary. Every setting is one line: its name, an ⓘ that explains
// it, and its switch. The switches drive the shared settings (so they change
// the playground and the notch), and each ▶ shows that thing in the notch.
(function () {
  'use strict';
  const NG = window.NG;
  const S = () => NG.settings;
  const e = NG.escape;

  // MARK: Icons

  const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  const I = {
    play: svg('<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z" fill="currentColor"/>'),
    info: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.2M12 7.8v.4"/>'),
    terminal: svg('<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M7.5 10l2.5 2-2.5 2M12 14.5h4"/>'),
    bell: svg('<path d="M6.5 16V11a5.5 5.5 0 0 1 11 0v5l1.5 1.5h-14z"/><path d="M10 20h4"/>'),
    shield: svg('<path d="M12 3.5l7 2.5v5.5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>'),
    grid: svg('<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>'),
    sparkles: svg('<path d="M10 4c.5 3.7 2.6 5.8 6.3 6.3-3.7.5-5.8 2.6-6.3 6.3-.5-3.7-2.6-5.8-6.3-6.3C7.4 9.8 9.5 7.7 10 4z"/><path d="M17.5 14c.2 1.6 1 2.4 2.5 2.5-1.5.2-2.3 1-2.5 2.5-.2-1.5-1-2.3-2.5-2.5 1.5-.1 2.3-.9 2.5-2.5z"/>'),
    sliders: svg('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
    keyboard: svg('<rect x="3" y="6.5" width="18" height="11" rx="2"/><path d="M6.5 10h1M10 10h1M13.5 10h1M17 10h.5M7.5 14h9"/>'),
    download: svg('<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="M12 7.5v8M8.5 12.5l3.5 3.5 3.5-3.5" stroke="#fff" stroke-width="2"/>'),
    refresh: svg('<path d="M19 12a7 7 0 1 1-2.1-5"/><path d="M19 4.5V9h-4.5"/>'),
    chevron: svg('<path d="M9.5 6.5L15 12l-5.5 5.5"/>'),
  };

  // MARK: Rows

  const tip = (text, name) => `<button type="button" class="pm-tip" data-tip="${e(text)}" aria-label="About ${e(name)}">${I.info}</button>`;
  const preview = (kind, name) => `<button class="pm-preview" type="button" data-preview="${kind}" aria-label="Show ${e(name)} in the notch" title="Show it in the notch">${I.play}</button>`;

  /// One line: name, ⓘ, an optional ▶, and the switch.
  const toggle = (key, title, info, { indented, previewKind } = {}) => `
    <label class="pm-row ${indented ? 'is-indented' : ''}" data-row="${key}">
      <span class="pm-name">${title}${info ? tip(info, title) : ''}</span>
      ${previewKind ? preview(previewKind, title) : ''}
      <span class="switch"><input type="checkbox" data-key="${key}"><i></i></span>
    </label>`;

  /// A compact pop-up menu, like the app's for Buddy and Snooze.
  const popup = (key, title, options, { indented, info, after = '' } = {}) => `
    <div class="pm-row ${indented ? 'is-indented' : ''}" data-row="${key}">
      <span class="pm-name">${title}${info ? tip(info, title) : ''}</span>
      ${after}
      <span class="pm-popup"><select data-select="${key}" aria-label="${e(title)}">${options.map(([value, label]) => `<option value="${e(value)}">${e(label)}</option>`).join('')}</select></span>
    </div>`;

  const stepper = (key, title, label) => `
    <div class="pm-row is-indented" data-row="${key}">
      <span class="pm-name">${title}</span>
      <b class="pm-value" data-value="${key}"></b>
      <span class="pm-stepper"><button type="button" data-step="${key}" data-delta="-1" aria-label="${label[0]}">−</button><button type="button" data-step="${key}" data-delta="1" aria-label="${label[1]}">+</button></span>
    </div>`;

  const status = (id) => `<p class="pm-status" data-status="${id}"></p>`;

  const section = (id, icon, title, body) => `
    <details class="pm-section" data-section="${id}">
      <summary><span class="pm-tile">${icon}</span><span class="pm-title">${title}</span><span class="pm-summary" data-summary="${id}"></span><span class="pm-chevron">${I.chevron}</span></summary>
      <div class="pm-body"><div class="pm-group">${body}</div></div>
    </details>`;

  const sounds = () => [['None', 'None'], ...NG.sounds.names.map((n) => [n, n])];

  const markup = () => `
    <div class="pm-head"><img src="assets/spark.svg" alt=""><div><b>NotchGate</b><small>Listening for Claude</small></div></div>
    <div class="pm-update" data-update></div>
    <hr class="pm-rule">
    ${section('claude', I.terminal, 'Claude Code', `
      <div class="pm-row"><span class="pm-dot"></span><span class="pm-name">Hooks installed${tip('NotchGate adds itself to ~/.claude/settings.json, backing it up first. Remove takes it out again.', 'hooks')}</span><button class="pm-button" type="button" data-demo>Remove</button></div>
      <div class="pm-row"><span class="pm-dot"></span><span class="pm-name">Editor helper in Cursor${tip('A tiny extension that lets notch prompts type straight into Cursor and VS Code terminals, and ↗ find the right window.', 'editor helper')}</span><button class="pm-button" type="button" data-demo>Reinstall</button></div>
      ${status('claude')}`)}
    ${section('show', I.bell, 'Show in notch', `
      ${toggle('notchPermissions', 'Permissions', 'Commands, web fetches and MCP tools ask in the notch.', { previewKind: 'permission' })}
      ${toggle('notchEdits', 'File edits', 'Edit and Write approvals, with the diff.', { previewKind: 'edit' })}
      ${toggle('questionsInNotch', 'Questions', 'Claude asking you to choose, with its options.', { previewKind: 'question' })}
      ${toggle('notchPlans', 'Plan approvals', 'Approve the plan before Claude starts coding.', { previewKind: 'plan' })}
      ${toggle('replyWhenDone', 'Reply when done', 'When Claude finishes, send the next prompt from the notch.', { previewKind: 'done' })}
      ${status('show')}`)}
    ${section('permissions', I.shield, 'Permissions & questions', `
      ${toggle('autoAllow', 'Auto-allow permissions', 'Approves permission requests instantly, with no card.')}
      ${toggle('askRisky', 'Still ask for risky commands', 'rm -rf, sudo, git push --force, DROP TABLE and friends always ask, even with auto-allow on.', { indented: true })}
      <div class="pm-row is-stacked"><span class="pm-name">Claude's questions${tip('Notch: answer with a click. Terminal: as without NotchGate. Don\'t ask: Claude decides for itself and keeps going.', 'questions')}</span>
        <div class="pm-segmented" role="group" aria-label="Claude's questions"><button type="button" data-mode="notch">Notch</button><button type="button" data-mode="terminal">Terminal</button><button type="button" data-mode="off">Don't ask</button></div></div>`)}
    ${section('widgets', I.grid, 'Widgets', `
      ${toggle('usageWidget', 'Usage', 'Your plan\'s 5-hour and weekly limits, and when each resets.', { previewKind: 'usage' })}
      ${toggle('insightsWidget', 'Insights', 'Cost, tokens and activity over 24 hours, 7 or 30 days, with the busiest projects and the split by model.', { previewKind: 'insights' })}
      ${toggle('sessionWidget', 'Session', 'Model, context used, cost and git branch for each session.', { previewKind: 'session' })}
      ${toggle('toolsWidget', 'Tool activity', 'Bash, Edit, Read… calls per session, and a heat strip of the last hour.', { previewKind: 'tools' })}
      ${toggle('resumeWidget', 'Resume', 'Pick up a recent session, or start a new one in any folder.', { previewKind: 'resume' })}
      ${status('widgets')}`)}
    ${section('extras', I.sparkles, 'Extras', `
      ${toggle('waterReminder', 'Water reminder', 'A buddy drops from the notch with a bottle. Hover it to log a glass or snooze. ▶ previews it without counting a glass.', { previewKind: 'water' })}
      <div class="pm-sub" data-sub="water">
        ${popup('waterBuddy', 'Buddy', [['robot', 'Robot'], ['spidey', 'Spidey'], ['batman', 'Batman'], ['random', 'Random']], { indented: true, info: 'Who drops in. Random picks a new one each time.' })}
        ${stepper('waterMinutes', 'Remind every', ['Remind less often', 'Remind more often'])}
        ${stepper('waterGoal', 'Daily goal', ['Fewer glasses', 'More glasses'])}
        ${popup('waterSnooze', 'Snooze', [[5, '5 min'], [10, '10 min'], [15, '15 min'], [30, '30 min']], { indented: true })}
      </div>
      ${toggle('nowPlaying', 'Now playing', 'Music, Spotify, Podcasts or a YouTube tab gets a card in the hover panel: artwork, a playhead you can drag, and the controls.', { previewKind: 'music' })}
      <div class="pm-sub" data-sub="music">${toggle('nowPlayingClosed', 'Show while closed', 'The closed notch shows the artwork and a live equalizer while music plays.', { indented: true })}</div>
      ${status('extras')}`)}
    ${section('behavior', I.sliders, 'Behavior', `
      ${toggle('autoExpand', 'Expand automatically', 'Opens the full card as soon as Claude asks. Off: a small pill waits until you hover.')}
      ${toggle('liveActivity', 'Live activity on hover', 'Hover the notch to see every session, its widgets and your prompt boxes.')}
      ${toggle('quickSettings', 'Quick settings in the notch', 'Auto-allow and Claude\'s questions, under the sessions.')}
      ${toggle('notices', 'Finished notices', 'A brief note in the notch when a task ends.')}
      ${toggle('sound', 'Sounds', 'Plays a sound when Claude needs you, and another when it finishes.')}
      <div class="pm-sub" data-sub="sound">
        ${popup('attentionSound', 'Claude needs you', sounds(), { indented: true, after: `<button class="pm-preview" type="button" data-listen="attentionSound" aria-label="Listen" title="Listen">${I.play}</button>` })}
        ${popup('finishedSound', 'Claude finished', sounds(), { indented: true, after: `<button class="pm-preview" type="button" data-listen="finishedSound" aria-label="Listen" title="Listen">${I.play}</button>` })}
      </div>
      ${toggle('checkUpdates', 'Check for updates', 'Looks on GitHub for a newer NotchGate, and again whenever you open this menu.')}
      ${toggle('launchAtLogin', 'Launch at login', 'On by default: NotchGate starts with your Mac.')}`)}
    ${section('shortcuts', I.keyboard, 'Shortcuts', `
      <p class="pm-status is-shown">These work from any app while a request is waiting.</p>
      <div class="pm-keys">
        <span class="pm-caps"><kbd>⌃</kbd><kbd>⌥</kbd><kbd>⏎</kbd></span><span>Allow or approve</span>
        <span class="pm-caps"><kbd>⌃</kbd><kbd>⌥</kbd><kbd>⌫</kbd></span><span>Deny or reject</span>
        <span class="pm-caps"><kbd>⌃</kbd><kbd>⌥</kbd><kbd>Space</kbd></span><span>Show or hide the card</span>
      </div>`)}
    <div class="pm-foot"><span data-version></span><button class="pm-button" type="button" data-close>Quit NotchGate</button></div>`;

  // MARK: Sync

  function read(key) {
    return key === 'questionsInNotch' ? S().questionsInNotch() : S().get(key);
  }

  function write(key, value) {
    if (key === 'questionsInNotch') return S().set('questionMode', value ? 'notch' : 'terminal');
    S().set(key, value);
  }

  const ago = (t) => { const m = Math.floor((Date.now() - t) / 60000); return m < 1 ? 'just now' : `${m}m ago`; };

  function syncUpdate(menu) {
    const u = NG.updates.state;
    const box = NG.$('[data-update]', menu);
    const refresh = `<button type="button" class="pm-refresh ${u.status === 'checking' ? 'is-spinning' : ''}" data-refresh aria-label="Check again" title="Check again">${I.refresh}</button>`;
    if (u.status === 'available' || (u.status === 'checking' && u.installed !== u.latest)) {
      box.className = 'pm-update is-available';
      box.innerHTML = `<div class="pm-update-top">${I.download}<b>Update available</b>${refresh}<button type="button" class="pm-button" data-update-now>Update</button></div>
        <p>${u.changes.length} new changes:</p><ul>${u.changes.map((c) => `<li>${e(c)}</li>`).join('')}</ul>`;
    } else if (u.status === 'updating') {
      box.className = 'pm-update is-updating';
      box.innerHTML = `<div class="pm-update-top"><span class="pm-spin"></span><b>Updating to ${u.latest}…</b></div><div class="pm-progress"><i></i></div>`;
    } else {
      box.className = 'pm-update is-current';
      box.innerHTML = `<div class="pm-update-top"><span class="pm-dot"></span><span>Up to date · checked ${ago(u.checkedAt)}</span>${refresh}</div>`;
    }
    NG.$('[data-version]', menu).textContent = `v${u.installed}${u.status === 'available' ? ' · update available' : ''}`;
  }

  function sync(menu) {
    NG.$$('input[data-key]', menu).forEach((input) => (input.checked = Boolean(read(input.dataset.key))));
    NG.$$('select[data-select]', menu).forEach((select) => (select.value = String(S().get(select.dataset.select))));
    const risky = NG.$('[data-row="askRisky"]', menu);
    NG.$('input', risky).disabled = !S().get('autoAllow');
    risky.setAttribute('aria-disabled', String(!S().get('autoAllow')));
    NG.$$('[data-mode]', menu).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === S().get('questionMode'))));
    NG.$('[data-sub="water"]', menu).hidden = !S().get('waterReminder');
    NG.$('[data-sub="music"]', menu).hidden = !S().get('nowPlaying');
    NG.$('[data-sub="sound"]', menu).hidden = !S().get('sound');
    NG.$('[data-value="waterMinutes"]', menu).textContent = NG.water.formatMinutes(S().get('waterMinutes'));
    NG.$('[data-value="waterGoal"]', menu).textContent = `${S().get('waterGoal')} glasses`;

    const shown = ['notchPermissions', 'notchEdits', 'questionsInNotch', 'notchPlans', 'replyWhenDone'].filter(read).length;
    const widgets = ['usageWidget', 'insightsWidget', 'sessionWidget', 'toolsWidget', 'resumeWidget'].filter(read).length;
    const extras = ['waterReminder', 'nowPlaying'].filter(read).length;
    const summaries = {
      claude: 'Hooks installed',
      show: `${shown} of 5 on`,
      permissions: S().get('autoAllow') ? 'Auto-allow' : 'Asks first',
      widgets: `${widgets} of 5 on`,
      extras: `${extras} of 2 on`,
      behavior: S().get('autoExpand') ? 'Auto-expand on' : 'Auto-expand off',
      shortcuts: '⌃⌥⏎ · ⌃⌥⌫',
    };
    Object.entries(summaries).forEach(([id, text]) => (NG.$(`[data-summary="${id}"]`, menu).textContent = text));

    // Live status: one short line per section.
    const line = (id, text, tone = '') => {
      const el = NG.$(`[data-status="${id}"]`, menu);
      el.textContent = text;
      el.className = `pm-status ${tone}`;
    };
    line('claude', 'Connected · 3 sessions running');
    line('show', 'Off: the notch still opens with an alert when Claude is blocked, and you answer in the terminal.');
    line('widgets', 'Open one at a time from the buttons at the top of the hover panel.');
    const goal = S().get('waterGoal');
    line('extras', S().get('waterReminder') ? `${NG.water.glasses} of ${goal} glasses today` : 'Water reminder is off', NG.water.glasses >= goal ? 'is-good' : '');
    syncUpdate(menu);
  }

  // MARK: Previews

  /// Opens the hover panel on one widget, until the next click elsewhere.
  function previewWidget(widget) {
    const setting = { music: 'nowPlaying', usage: 'usageWidget', insights: 'insightsWidget', session: 'sessionWidget', tools: 'toolsWidget', resume: 'resumeWidget' }[widget];
    S().set(setting, true);
    if (widget === 'insights') NG.insights.grow();
    S().set('panelWidget', widget);
    NG.island.claim('preview', NG.panel.view());
    const release = (event) => {
      if (event.composedPath().includes(NG.island.root)) return;
      document.removeEventListener('click', release);
      NG.island.release('preview');
    };
    setTimeout(() => document.addEventListener('click', release));
  }

  /// Shows one card in the notch, answerable, then hands the notch back.
  function previewCard(kind) {
    const card = NG.cards[kind]({ ...NG.demo[kind], project: 'checkout-api' });
    NG.island.claim('preview', {
      card,
      onAction(action, detail) {
        if (kind === 'done' && action !== 'send') return;
        const label = { allow: 'Allowed.', always: 'Always allowed.', deny: 'Denied.', submit: `Answered: ${detail.selection}.`, terminal: 'Left for the terminal.', send: 'Sent to your terminal.' }[action] || 'Done.';
        NG.island.claim('preview', { card: NG.cards.result(label), onAction() {} });
        setTimeout(() => NG.island.release('preview'), 1400);
      },
    });
  }

  function previewKind(kind) {
    if (window.innerWidth < 900) close();
    if (kind === 'water') return NG.water.preview();
    if (['music', 'usage', 'insights', 'session', 'tools', 'resume'].includes(kind)) return previewWidget(kind);
    previewCard(kind);
  }

  const steps = { waterMinutes: [[5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240]], waterGoal: [[1, 20]] };

  function stepValue(key, delta) {
    const value = S().get(key);
    if (key === 'waterGoal') return Math.min(20, Math.max(1, value + delta));
    const list = steps.waterMinutes[0];
    const index = list.findIndex((m) => m >= value);
    return list[Math.min(list.length - 1, Math.max(0, (index < 0 ? list.length - 1 : index) + delta))];
  }

  // MARK: Open and close

  let menu, trigger;

  function open() {
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    sync(menu);
    // Opening the menu checks GitHub again, like the app.
    if (S().get('checkUpdates') && Date.now() - NG.updates.state.checkedAt > 120000) NG.updates.check();
    NG.$('summary', menu).focus({ preventScroll: true });
  }

  function close() {
    if (menu.hidden) return;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }

  NG.menu = {
    /// Opens the menu with one section unfolded (used by "What's new").
    reveal(section) {
      if (!menu) return;
      NG.$$('.pm-section', menu).forEach((d) => (d.open = d.dataset.section === section));
      open();
      NG.$(`[data-section="${section}"]`, menu)?.scrollIntoView({ block: 'nearest' });
    },
  };

  NG.initMenu = function () {
    menu = NG.$('#ng-menu');
    trigger = NG.$('#menu-extra');
    if (!menu || !trigger) return;
    menu.innerHTML = markup();
    NG.$('[data-section="show"]', menu).open = true;

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      menu.hidden ? open() : close();
    });
    menu.addEventListener('click', (event) => {
      event.stopPropagation();
      const previewButton = event.target.closest('[data-preview]');
      if (previewButton) { event.preventDefault(); return previewKind(previewButton.dataset.preview); }
      const listen = event.target.closest('[data-listen]');
      if (listen) return NG.sounds.play(S().get(listen.dataset.listen));
      const step = event.target.closest('[data-step]');
      if (step) return S().set(step.dataset.step, stepValue(step.dataset.step, Number(step.dataset.delta)));
      const mode = event.target.closest('[data-mode]');
      if (mode) return S().set('questionMode', mode.dataset.mode);
      if (event.target.closest('[data-update-now]')) return NG.updates.update();
      if (event.target.closest('[data-refresh]')) return NG.updates.check();
      if (event.target.closest('[data-demo]')) return NG.toast('This menu is a live preview of the app');
      if (event.target.closest('[data-close]')) { close(); trigger.focus(); NG.toast('It\'s a website: NotchGate stays put'); }
    });
    menu.addEventListener('change', (event) => {
      const key = event.target.dataset.key;
      if (key) return write(key, event.target.checked);
      const select = event.target.dataset.select;
      if (!select) return;
      const raw = event.target.value;
      S().set(select, select === 'waterSnooze' ? Number(raw) : raw);
      // Picking a sound plays it, as macOS's own sound pickers do.
      if (select.endsWith('Sound')) NG.sounds.play(raw);
    });
    document.addEventListener('click', (event) => { if (!menu.contains(event.target) && !event.target.closest('.infotip')) close(); });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !menu.hidden) { close(); trigger.focus(); }
    });
    S().subscribe(() => !menu.hidden && sync(menu));
    NG.updates.subscribe(() => {
      trigger.classList.toggle('has-update', NG.updates.available);
      if (!menu.hidden) sync(menu);
    });
    trigger.classList.toggle('has-update', NG.updates.available);
  };
})();
