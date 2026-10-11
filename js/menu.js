// The NotchGate menu-bar menu, recreated from the app. Its switches drive the
// shared settings (so they change the playground and the notch), and each
// ▶ button previews that card in the live notch.
(function () {
  'use strict';
  const NG = window.NG;
  const S = () => NG.settings;
  const play = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z" fill="currentColor"/></svg>';

  const toggle = (key, title, detail, { indented, preview } = {}) => `
    <label class="pm-row ${indented ? 'is-indented' : ''}" data-row="${key}">
      <span class="pm-text"><span>${title}</span>${detail ? `<small>${detail}</small>` : ''}</span>
      ${preview ? `<button class="pm-preview" type="button" data-preview="${preview}" aria-label="Preview ${title}">${play}</button>` : ''}
      <span class="switch"><input type="checkbox" data-key="${key}"><i></i></span>
    </label>`;

  const section = (id, title, body, open) => `
    <details class="pm-section" data-section="${id}" ${open ? 'open' : ''}>
      <summary><span>${title}</span><span class="pm-summary" data-summary="${id}"></span></summary>
      <div class="pm-body">${body}</div>
    </details>`;

  const markup = () => `
    <div class="pm-head"><img src="assets/spark.svg" alt=""><div><b>NotchGate</b><small>Listening for Claude</small></div></div>
    ${section('claude', 'Claude Code', `
      <div class="pm-row"><span class="pm-status-dot"></span><span class="pm-text"><span>Hooks installed</span></span><button class="pm-button" type="button" data-demo>Remove</button></div>
      <p class="pm-note">Adds NotchGate to ~/.claude/settings.json and backs it up first.</p>
      <div class="pm-row"><span class="pm-status-dot"></span><span class="pm-text"><span>Editor helper in Cursor</span><small>Prompts type straight into its terminals.</small></span><button class="pm-button" type="button" data-demo>Reinstall</button></div>`)}
    ${section('show', 'Show in notch', `
      ${toggle('notchPermissions', 'Permissions', 'Commands, web, MCP tools', { preview: 'permission' })}
      ${toggle('notchEdits', 'File edits', 'Edit and Write approvals', { preview: 'edit' })}
      ${toggle('questionsInNotch', 'Questions', 'Claude asking you to choose', { preview: 'question' })}
      ${toggle('notchPlans', 'Plan approvals', 'Approve before Claude codes', { preview: 'plan' })}
      ${toggle('replyWhenDone', 'Reply when done', 'Send the next prompt', { preview: 'done' })}
      <p class="pm-note">Off means the terminal handles it, just like without NotchGate.</p>`, true)}
    ${section('permissions', 'Permissions and questions', `
      ${toggle('autoAllow', 'Auto-allow permissions', 'Approve prompts instantly, with no card')}
      ${toggle('askRisky', 'Still ask for risky commands', 'rm -rf, sudo, force push, DROP TABLE', { indented: true })}
      <div class="pm-text" style="padding-top:6px"><span>Claude's questions</span></div>
      <div class="pm-segmented" role="group" aria-label="Claude's questions">
        <button type="button" data-mode="notch">Notch</button><button type="button" data-mode="terminal">Terminal</button><button type="button" data-mode="off">Don't ask</button>
      </div>
      <p class="pm-note" data-mode-note></p>`)}
    ${section('widgets', 'Widgets', `
      ${toggle('usageWidget', 'Usage', '5-hour and weekly limits, and when they reset', { preview: 'usageCardShown' })}
      ${toggle('sessionWidget', 'Session', 'Model, context used, cost and git branch', { preview: 'sessionCardShown' })}
      ${toggle('toolsWidget', 'Tool activity', 'Bash, Edit, Read… calls per session, and a heat strip of the last hour', { preview: 'toolsCardShown' })}
      ${toggle('resumeWidget', 'Resume', 'Pick up a recent session or start a new one in Terminal', { preview: 'resumeCardShown' })}
      <p class="pm-note">Usage and Session read Claude Code's status line; yours still shows as before. Open each card from its button in the notch's hover panel.</p>`)}
    ${section('extras', 'Extras', `
      ${toggle('waterReminder', 'Water reminder', 'A little bot drops from the notch with a bottle', { preview: 'water' })}
      <div class="pm-water" data-water>
        <div class="pm-stepper"><span>Remind every</span><b data-value="waterMinutes"></b>
          <button type="button" data-step="waterMinutes" data-delta="-5" aria-label="Remind less often">−</button><button type="button" data-step="waterMinutes" data-delta="5" aria-label="Remind more often">+</button></div>
        <div class="pm-stepper"><span>Daily goal</span><b data-value="waterGoal"></b>
          <button type="button" data-step="waterGoal" data-delta="-1" aria-label="Fewer glasses">−</button><button type="button" data-step="waterGoal" data-delta="1" aria-label="More glasses">+</button></div>
        <div class="pm-stepper"><span>Snooze for</span>
          <div class="pm-segmented is-compact" role="group" aria-label="Snooze for">${[5, 10, 15, 30].map((m) => `<button type="button" data-snooze="${m}">${m}m</button>`).join('')}</div></div>
        <p class="pm-note" data-water-note></p>
      </div>`)}
    ${section('behavior', 'Behavior', `
      ${toggle('autoExpand', 'Expand automatically', 'Open the full card as soon as Claude asks')}
      ${toggle('liveActivity', 'Live activity on hover', 'Hover the notch to see every session')}
      ${toggle('quickSettings', 'Quick settings in the notch', 'Auto-allow and questions, under the sessions')}
      ${toggle('sound', 'Play a sound', 'A soft chime for new requests')}
      ${toggle('notices', 'Finished notices', 'A brief note when a task ends')}
      ${toggle('checkUpdates', 'Check for updates', 'Looks for a newer NotchGate on GitHub')}
      ${toggle('launchAtLogin', 'Launch at login', 'On by default; NotchGate starts with your Mac')}`)}
    ${section('shortcuts', 'Shortcuts', `
      <p class="pm-note">These work anywhere while a request is waiting.</p>
      <div class="pm-keys"><kbd>⌃⌥⏎</kbd><span>Allow or approve</span><kbd>⌃⌥⌫</kbd><span>Deny or reject</span><kbd>⌃⌥Space</kbd><span>Show or hide the card</span></div>`)}
    <div class="pm-foot"><span>Version 2.1.0, up to date</span><button class="pm-button" type="button" data-close>Close menu</button></div>`;

  const modeNotes = {
    notch: 'Answer Claude\'s questions from the notch.',
    terminal: 'Questions appear only in the terminal.',
    off: 'Claude decides for itself and keeps going.',
  };

  function read(key) {
    return key === 'questionsInNotch' ? S().questionsInNotch() : S().get(key);
  }

  function write(key, value) {
    if (key === 'questionsInNotch') return S().set('questionMode', value ? 'notch' : 'terminal');
    S().set(key, value);
  }

  function sync(menu) {
    NG.$$('input[data-key]', menu).forEach((input) => (input.checked = Boolean(read(input.dataset.key))));
    const risky = NG.$('[data-row="askRisky"]', menu);
    NG.$('input', risky).disabled = !S().get('autoAllow');
    risky.setAttribute('aria-disabled', String(!S().get('autoAllow')));
    NG.$$('[data-mode]', menu).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === S().get('questionMode'))));
    NG.$('[data-mode-note]', menu).textContent = modeNotes[S().get('questionMode')];

    const shown = ['notchPermissions', 'notchEdits', 'questionsInNotch', 'notchPlans', 'replyWhenDone'].filter(read).length;
    NG.$('[data-summary="claude"]', menu).textContent = 'Hooks installed';
    NG.$('[data-summary="show"]', menu).textContent = `${shown} of 5 on`;
    NG.$('[data-summary="permissions"]', menu).textContent = `Auto-allow ${S().get('autoAllow') ? 'on' : 'off'}`;
    NG.$('[data-summary="shortcuts"]', menu).textContent = '⌃⌥⏎  ⌃⌥⌫';
    const widgets = ['usageWidget', 'sessionWidget', 'toolsWidget', 'resumeWidget'].filter(read).length;
    NG.$('[data-summary="widgets"]', menu).textContent = `${widgets} of 4 on`;
    NG.$('[data-summary="extras"]', menu).textContent = `${S().get('waterReminder') ? 1 : 0} of 1 on`;
    NG.$('[data-water]', menu).hidden = !S().get('waterReminder');
    NG.$('[data-value="waterMinutes"]', menu).textContent = NG.water.formatMinutes(S().get('waterMinutes'));
    NG.$('[data-value="waterGoal"]', menu).textContent = `${S().get('waterGoal')} glasses`;
    NG.$$('[data-snooze]', menu).forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.snooze) === S().get('waterSnooze'))));
    NG.$('[data-water-note]', menu).textContent = `${NG.water.glasses} of ${S().get('waterGoal')} glasses today. Waits while you're away from the Mac.`;
  }

  /// Opens one widget's card in the hover panel, until the next click elsewhere.
  function previewPanel(card) {
    const widget = { usageCardShown: 'usageWidget', sessionCardShown: 'sessionWidget', toolsCardShown: 'toolsWidget', resumeCardShown: 'resumeWidget' }[card];
    S().set(widget, true);
    S().set(card, true);
    NG.island.claim('preview', NG.panel.view());
    const release = (event) => {
      if (event.composedPath().includes(NG.island.root)) return;
      document.removeEventListener('click', release);
      NG.island.release('preview');
    };
    setTimeout(() => document.addEventListener('click', release));
    if (window.innerWidth < 900) close();
  }

  const steps = { waterMinutes: [5, 240], waterGoal: [1, 20] };

  /// Shows one card in the notch, answerable, then hands the notch back.
  function preview(kind) {
    if (kind === 'water') { if (window.innerWidth < 900) close(); return NG.water.remind(); }
    if (kind.endsWith('CardShown')) return previewPanel(kind);
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
    if (window.innerWidth < 900) close();
  }

  let menu, trigger;

  function open() {
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    sync(menu);
    NG.$('summary', menu).focus({ preventScroll: true });
  }

  function close() {
    if (menu.hidden) return;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }

  NG.initMenu = function () {
    menu = NG.$('#ng-menu');
    trigger = NG.$('#menu-extra');
    if (!menu || !trigger) return;
    menu.innerHTML = markup();

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      menu.hidden ? open() : close();
    });
    menu.addEventListener('click', (event) => {
      event.stopPropagation();
      const previewButton = event.target.closest('[data-preview]');
      if (previewButton) { event.preventDefault(); return preview(previewButton.dataset.preview); }
      const step = event.target.closest('[data-step]');
      if (step) {
        const [min, max] = steps[step.dataset.step];
        return S().set(step.dataset.step, Math.min(max, Math.max(min, S().get(step.dataset.step) + Number(step.dataset.delta))));
      }
      const snooze = event.target.closest('[data-snooze]');
      if (snooze) return S().set('waterSnooze', Number(snooze.dataset.snooze));
      const mode = event.target.closest('[data-mode]');
      if (mode) return S().set('questionMode', mode.dataset.mode);
      if (event.target.closest('[data-demo]')) return NG.toast('This menu is a live preview of the app');
      if (event.target.closest('[data-close]')) { close(); trigger.focus(); }
    });
    menu.addEventListener('change', (event) => {
      const key = event.target.dataset.key;
      if (key) write(key, event.target.checked);
    });
    document.addEventListener('click', (event) => { if (!menu.contains(event.target)) close(); });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !menu.hidden) { close(); trigger.focus(); }
    });
    S().subscribe(() => !menu.hidden && sync(menu));
  };
})();
