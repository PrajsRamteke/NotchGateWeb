// Card templates for the island. Buttons carry data-action (what happened)
// and data-key (primary / reject) so keyboard shortcuts can press them.
(function () {
  'use strict';
  const NG = window.NG;
  const e = NG.escape;

  const head = (chip, meta = 'just now') =>
    `<div class="card-head"><span class="card-chip">${chip}</span><span class="grow"></span><span>${e(meta)}</span></div>`;

  const title = (text, sub) =>
    `<div><div class="card-title">${e(text)}</div>${sub ? `<div class="card-sub">${e(sub)}</div>` : ''}</div>`;

  NG.cards = {
    permission(d) {
      return {
        title: d.project || 'checkout-api',
        badge: 1,
        waiting: true,
        html: `<div class="card">${head('Permission')}${title(d.title, d.sub)}
          <pre class="code"><span class="prompt">›</span>${e(d.command)}</pre>
          <div class="actions">
            <span class="grow"></span>
            <button class="pill is-danger" data-action="deny" data-key="reject">Deny</button>
            <button class="pill" data-action="always">Always allow</button>
            <button class="pill is-primary" data-action="allow" data-key="primary">Allow <span class="key">⏎</span></button>
          </div></div>`,
      };
    },

    edit(d) {
      const lines = d.removed.map((l) => `<div class="del">${e(l)}</div>`).join('') +
        d.added.map((l) => `<div class="add">${e(l)}</div>`).join('');
      return {
        title: d.project || 'checkout-api',
        badge: 1,
        waiting: true,
        html: `<div class="card">${head('File edit')}${title(d.title, d.sub)}
          <div class="diff">${lines}</div>
          <div class="actions"><span class="grow"></span>
            <button class="pill is-danger" data-action="deny" data-key="reject">Deny</button>
            <button class="pill is-primary" data-action="allow" data-key="primary">Allow <span class="key">⏎</span></button>
          </div></div>`,
      };
    },

    question(d) {
      const options = d.options.map((o) => `
        <button class="option" data-select="${e(o.label)}" aria-pressed="false">
          <span class="dot"></span><span><b>${e(o.label)}</b><small>${e(o.detail)}</small></span>
        </button>`).join('');
      return {
        title: d.project || 'checkout-api',
        badge: 1,
        waiting: true,
        html: `<div class="card">${head('Question')}${title(d.text, d.header)}
          <div class="options">${options}</div>
          <div class="actions"><button class="link" data-action="terminal" data-key="reject">Answer in terminal</button><span class="grow"></span>
            <button class="pill is-primary" data-action="submit" data-key="primary" data-needs-selection disabled>Submit <span class="key">⏎</span></button>
          </div></div>`,
      };
    },

    plan(d) {
      const steps = d.steps.map((s) => `<li>${e(s)}</li>`).join('');
      return {
        title: d.project || 'checkout-api',
        badge: 1,
        waiting: true,
        html: `<div class="card">${head('Plan review')}${title('Ready to code?', 'Claude finished planning.')}
          <div class="plan"><h4>${e(d.title)}</h4><ol>${steps}</ol></div>
          <div class="actions"><span class="grow"></span>
            <button class="pill" data-action="deny" data-key="reject">Keep planning</button>
            <button class="pill is-primary" data-action="allow" data-key="primary">Approve <span class="key">⏎</span></button>
          </div></div>`,
      };
    },

    done(d) {
      return {
        title: d.project || 'checkout-api',
        badge: 1,
        html: `<div class="card">${head('Finished')}${title('Claude is done', `What should it do next in ${d.project || 'checkout-api'}?`)}
          <div class="code" style="font-family: var(--sans); font-size: 13px">${e(d.summary)}</div>
          <form class="composer" data-composer>
            <input type="text" placeholder="Message Claude…" aria-label="Message Claude" maxlength="140">
            <button class="send" type="submit" disabled aria-label="Send">↑</button>
          </form>
          <div class="note">${e(d.note || 'Types into your terminal as if you wrote it there.')}</div></div>`,
      };
    },

    /// Claude is blocked on something switched off for the notch: the notch
    /// still opens, and points at the terminal until it's answered there.
    attention(d) {
      return {
        title: d.project || 'checkout-api',
        badge: 1,
        waiting: true,
        html: `<div class="card card-attention">
          <div class="card-head"><span class="card-chip is-attention"><i class="bell"></i>Needs you</span><span class="grow"></span><span>just now</span></div>
          ${title('Claude is waiting in the terminal', d.sub)}
          <div class="attention-line"><span class="ring"></span><span>${e(d.what)}</span></div>
          <div class="actions"><span class="note">Stays until you answer there.</span><span class="grow"></span>
            <button class="pill is-primary" data-action="go" data-key="primary">Go to terminal <span class="key">⏎</span></button>
          </div></div>`,
      };
    },

    result(text) {
      return { title: 'NotchGate', html: `<div class="card"><div class="ok-line">✓ ${e(text)}</div></div>` };
    },
  };
})();
