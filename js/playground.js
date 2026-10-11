// "Your turn": a pretend Claude Code session wired to the real notch at the
// top of the page. Settings decide whether each request goes to the notch
// or stays in the terminal, exactly like NotchGate's "Show in notch".
(function () {
  'use strict';
  const NG = window.NG;
  const d = NG.demo;

  // Same switches as the header menu: both read and write NG.settings.
  const settingRows = [
    ['notchPermissions', 'Permissions', 'Commands and tools'],
    ['notchEdits', 'File edits', 'Diffs before changes'],
    ['questionsInNotch', 'Questions', 'When Claude asks you'],
    ['replyWhenDone', 'Reply when done', 'Send the next prompt'],
    ['autoAllow', 'Auto-allow', 'Risky commands still ask'],
  ];
  const S = () => NG.settings;
  const setting = (key) => (key === 'questionsInNotch' ? S().questionsInNotch() : S().get(key));

  let term;
  let run = 0;            // Bumped on "Start over" so stale flows stop.
  let busy = false;
  let session = null;     // This demo session, as shown in live activity.

  class Cancelled extends Error {}
  const guard = (id) => { if (id !== run) throw new Cancelled(); };
  const pause = async (id, ms) => { await NG.sleep(ms); guard(id); };

  // MARK: Live activity

  function setSession(state, status, done, step) {
    session = { ...(session || { project: 'checkout-api', total: 4, started: Date.now() }), state, status };
    if (done !== undefined) { session.done = done; session.step = step; }
  }

  NG.activitySessions = function () {
    const now = Date.now();
    const base = d.sessions.map((s) => {
      if (s.state === 'done') return { ...s, time: NG.formatElapsed(s.finishedAfter) };
      const done = Math.min(s.total, s.done + Math.floor((now - s.started) / 25000));
      return { ...s, done, step: done === s.total ? 'Wrapping up' : 'Updating chart options', time: NG.formatElapsed((now - s.started) / 1000) };
    });
    const mine = session && { ...session, time: NG.formatElapsed((now - session.started) / 1000) };
    return mine ? [mine, ...base] : [{ project: 'checkout-api', status: 'Ready for your next message', state: 'idle', time: '' }, ...base];
  };

  // MARK: Requests

  const kindSetting = { permission: 'notchPermissions', edit: 'notchEdits', question: 'questionsInNotch' };

  /// Asks the user, in the notch or the terminal depending on settings.
  async function ask(id, kind, data) {
    const risky = kind === 'permission' && S().get('askRisky') && NG.isRisky(data.command);
    if (kind === 'permission' && S().get('autoAllow') && !risky) {
      term.dim('  Auto-allowed by NotchGate');
      return true;
    }
    if (kind === 'question' && S().get('questionMode') === 'off') {
      term.dim('  Questions are off, so Claude picked for itself');
      return data.options[0].label;
    }
    setSession('waiting', kind === 'question' ? 'Asking you a question' : `Needs permission · ${data.title.replace('?', '')}`);
    const answer = setting(kindSetting[kind]) ? await askInNotch(kind, data) : await askInTerminal(kind, data);
    guard(id);
    setSession('working', 'Working…');
    return answer;
  }

  function askInNotch(kind, data) {
    const hint = term.wait('Waiting for you in the notch ↑');
    return new Promise((resolve) => {
      NG.island.claim('play', {
        card: NG.cards[kind]({ ...data, project: 'checkout-api' }),
        onAction(action, detail) {
          NG.island.release('play');
          hint.remove();
          if (kind === 'question') {
            if (action === 'terminal') return askInTerminal(kind, data).then(resolve);
            return resolve(detail.selection);
          }
          if (action === 'always') NG.toast('Allowed. Won\'t ask again in this project');
          resolve(action === 'allow' || action === 'always');
        },
      });
    });
  }

  async function askInTerminal(kind, data) {
    if (kind === 'question') {
      const index = await term.dialog(data.text, data.options.map((o) => o.label));
      return data.options[index].label;
    }
    const question = kind === 'edit' ? `Make this edit to ${data.sub}?` : `Allow Bash(${data.command})?`;
    return (await term.dialog(question, ['Yes', 'No'])) === 0;
  }

  // MARK: The scripted task

  async function runTask(prompt, task) {
    const id = run;
    setBusy(true);
    try {
      term.user(prompt);
      setSession('working', 'Thinking…', 0, 'Read the code');
      session.started = Date.now();
      const stop = term.thinking();
      await pause(id, 900);
      stop();
      await term.claude(`I'll start with ${task.read}.`);
      term.tool(`Read(${task.read})`);
      await pause(id, 450);
      term.result('Read 214 lines');
      setSession('working', 'Running the tests', 1, 'Run the tests');

      if (await ask(id, 'permission', d.permission)) {
        term.tool(`Bash(${d.permission.command})`);
        await pause(id, 700);
        term.result('12 passed, 1 failed: retries on timeout');
      } else {
        await term.claude('Okay, I won\'t run the tests.');
      }
      setSession('working', 'Choosing storage', 2, 'Pick storage');

      const choice = await ask(id, 'question', d.question);
      await term.claude(`Going with ${choice}.`);
      setSession('working', 'Editing client.ts', 3, 'Edit client.ts');

      if (await ask(id, 'edit', d.edit)) {
        term.tool(`Edit(${d.edit.sub})`);
        await pause(id, 400);
        term.result('Updated client.ts (+2 −2)');
      } else {
        await term.claude('Leaving the file as it is.');
      }
      await pause(id, 300);
      await term.claude(task.summary);
      term.dim(`✻ Worked for ${NG.formatElapsed((Date.now() - session.started) / 1000)}`);
      setSession('done', task.summary, 4, '');
      finish(id, task.summary);
    } catch (error) {
      if (!(error instanceof Cancelled)) throw error;
    }
  }

  function finish(id, summary) {
    setBusy(false);
    if (!S().get('replyWhenDone')) {
      if (!S().get('notices')) return;
      NG.island.claim('play', { card: { ...NG.cards.result('Claude finished'), title: 'checkout-api' }, peek: true });
      return setTimeout(() => id === run && NG.island.release('play'), 2600);
    }
    NG.island.claim('play', {
      card: NG.cards.done({ summary, project: 'checkout-api' }),
      onAction(action, detail) {
        if (action !== 'send') return;
        NG.island.release('play');
        NG.toast('Typed into your terminal');
        followUp(detail.value);
      },
    });
  }

  async function followUp(prompt) {
    const id = run;
    setBusy(true);
    try {
      term.user(prompt);
      setSession('working', 'Thinking…', 3, 'Follow-up');
      const stop = term.thinking();
      await pause(id, 800);
      stop();
      const reply = d.followUps[Math.floor(Math.random() * d.followUps.length)];
      await term.claude(reply);
      setSession('done', reply, 4, '');
      finish(id, reply);
    } catch (error) {
      if (!(error instanceof Cancelled)) throw error;
    }
  }

  // MARK: Setup

  function setBusy(value) {
    busy = value;
    const input = NG.$('#term-text');
    input.disabled = value;
    input.placeholder = value ? 'Claude is working. Answer it in the notch ↑' : 'Ask Claude to do something…';
    NG.$$('.chip').forEach((chip) => (chip.disabled = value));
  }

  function reset() {
    run++;
    session = null;
    NG.island.release('play');
    setBusy(false);
    term.clear();
  }

  function renderSettings() {
    NG.$('#settings-list').innerHTML = settingRows.map(([key, label, hint]) => `
      <label class="setting"><span>${label}<small>${hint}</small></span>
        <span class="switch"><input type="checkbox" data-setting="${key}" ${setting(key) ? 'checked' : ''}><i></i></span>
      </label>`).join('');
  }

  NG.initPlayground = function () {
    const log = NG.$('#term-log');
    if (!log) return;
    term = new NG.Terminal(log);
    term.clear();
    renderSettings();

    NG.$('#settings-list').addEventListener('change', (event) => {
      const key = event.target.dataset.setting;
      if (!key) return;
      if (key === 'questionsInNotch') S().set('questionMode', event.target.checked ? 'notch' : 'terminal');
      else S().set(key, event.target.checked);
    });
    // Keep these switches in step with the header menu.
    S().subscribe(() => NG.$$('#settings-list input').forEach((input) => (input.checked = Boolean(setting(input.dataset.setting)))));
    NG.$('#term-chips').innerHTML = d.tasks.map((t, i) => `<button class="chip" type="button" data-task="${i}">${NG.escape(t.prompt)}</button>`).join('');
    NG.$('#term-chips').addEventListener('click', (event) => {
      const chip = event.target.closest('[data-task]');
      if (chip && !busy) { const task = d.tasks[chip.dataset.task]; runTask(task.prompt, task); }
    });
    NG.$('#term-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const input = NG.$('#term-text');
      const prompt = input.value.trim();
      if (!prompt || busy) return;
      input.value = '';
      runTask(prompt, { read: 'src/payments/client.ts', summary: `Done: ${prompt.charAt(0).toLowerCase()}${prompt.slice(1)}. Tests pass.` });
    });
    NG.$('#reset-demo').addEventListener('click', reset);
  };
})();
