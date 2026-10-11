// Scroll story: the step in the middle of the screen decides what the live
// notch shows. Cards stay interactive; answering them plays out in the
// sticky terminal, then the scene resets so it can be tried again.
(function () {
  'use strict';
  const NG = window.NG;
  const d = NG.demo;

  const line = (cls, text) => `<div class="${cls}">${NG.escape(text)}</div>`;
  const opening = line('dim', '~/checkout-api ❯ claude') + line('user', '❯ Add retry with backoff to payments');

  const scenes = {
    permission: {
      card: () => NG.cards.permission(d.permission),
      lines: () => opening + line('claude', 'I\'ll run the payment tests first.') + line('dim', '  Bash(npm test -- payments)') + line('wait', 'Waiting for you in the notch ↑'),
      outcome(action) {
        return action === 'deny'
          ? ['Denied. Claude will find another way.', line('claude', 'Okay, skipping the tests.')]
          : [action === 'always' ? 'Allowed, and won\'t ask again here.' : 'Allowed.', line('dim', '  ⎿ 13 passed in 2.1s')];
      },
    },
    edit: {
      card: () => NG.cards.edit(d.edit),
      lines: () => opening + line('claude', 'Retries need a longer timeout.') + line('dim', '  Edit(src/payments/client.ts)') + line('wait', 'Waiting for you in the notch ↑'),
      outcome(action) {
        return action === 'deny'
          ? ['Edit declined.', line('claude', 'Leaving client.ts as it is.')]
          : ['Edit applied.', line('dim', '  ⎿ Updated client.ts (+2 −2)')];
      },
    },
    question: {
      card: () => NG.cards.question(d.question),
      lines: () => opening + line('claude', 'One decision before I continue.') + line('wait', 'Question in the notch ↑'),
      outcome(action, detail) {
        return action === 'terminal'
          ? ['Answer it in the terminal instead.', line('dim', '  Which storage should the retry queue use?')]
          : [`Answered: ${detail.selection}.`, line('claude', `Going with ${detail.selection}.`)];
      },
    },
    plan: {
      card: () => NG.cards.plan(d.plan),
      lines: () => line('dim', '~/checkout-api ❯ claude  (plan mode)') + line('user', '❯ Add offline sync') + line('claude', 'Here is the plan.') + line('wait', 'Waiting for your approval ↑'),
      outcome(action) {
        return action === 'deny'
          ? ['Sent back. Claude keeps planning.', line('claude', 'What should I change?')]
          : ['Plan approved.', line('claude', 'Starting with the write queue.')];
      },
    },
    activity: {
      card: () => NG.cards.activity(NG.activitySessions()),
      lines: () => line('dim', '3 Claude sessions running') + line('claude', 'checkout-api: writing tests') + line('claude', 'dashboard: upgrading charts') + line('claude', 'handbook: done'),
      live: true,
    },
    done: {
      card: () => NG.cards.done({ ...d.done, note: 'Type a reply and press ⏎.' }),
      lines: () => opening + line('claude', d.done.summary) + line('dim', '✻ Worked for 2m 14s'),
      outcome(action, detail) {
        return ['Sent to your terminal as a real prompt.', line('user', `❯ ${detail.value}`) + line('claude', 'On it.')];
      },
    },
  };

  let active = null;
  let settleTimer;
  let liveTimer;
  /// Scenes the visitor already answered: { message, extra }. Answered scenes
  /// never ask again; they show a small "done" pill instead.
  const answered = new Map();
  const stage = () => NG.$('#stage-terminal');

  const donePill = (message) => ({ title: `✓ ${message.replace(/\.$/, '')}` });

  function show(name) {
    const scene = scenes[name];
    if (!scene) return;
    active = name;
    clearTimeout(settleTimer);
    clearInterval(liveTimer);
    const done = answered.get(name);
    const terminal = stage();
    if (terminal) terminal.innerHTML = `<div class="stage-lines">${scene.lines()}</div>`;
    if (done) {
      if (terminal) settleStage(done.extra);
      return NG.island.claim('story', { card: donePill(done.message), peek: true });
    }
    NG.island.claim('story', { card: scene.card(), onAction: (action, detail) => respond(name, action, detail) });
    if (scene.live) liveTimer = setInterval(() => active === name && NG.island.refresh(scene.card()), 1000);
  }

  function settleStage(extra) {
    const terminal = NG.$('.stage-lines', stage());
    if (!terminal) return;
    NG.$$('.wait', terminal).forEach((w) => w.remove());
    terminal.insertAdjacentHTML('beforeend', extra);
  }

  /// Records an answer for a scene (also used by the hero's identical request).
  function record(name, action, detail) {
    const scene = scenes[name];
    if (!scene || !scene.outcome) return null;
    const [message, extra] = scene.outcome(action, detail || {});
    answered.set(name, { message, extra });
    return { message, extra };
  }

  function respond(name, action, detail) {
    if (active !== name || answered.has(name)) return;
    const result = record(name, action, detail);
    if (!result) return;
    settleStage(result.extra);
    NG.island.claim('story', { card: NG.cards.result(result.message), onAction: () => {} });
    // Show the confirmation briefly, then fold into a quiet pill (no repeat).
    settleTimer = setTimeout(() => active === name && show(name), 1600);
  }

  NG.story = { record };

  NG.initStory = function () {
    const steps = NG.$$('.story-step');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        steps.forEach((s) => s.classList.toggle('is-active', s === entry.target));
        show(entry.target.dataset.scene);
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((step) => observer.observe(step));

    NG.watch(NG.$('#story'), () => {}, () => {
      active = null;
      clearTimeout(settleTimer);
      clearInterval(liveTimer);
      steps.forEach((s) => s.classList.remove('is-active'));
      NG.island.release('story');
    }, { threshold: 0 });
  };
})();
