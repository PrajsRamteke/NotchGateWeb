// A Claude Code terminal look-alike for the playground.
(function () {
  'use strict';
  const NG = window.NG;

  class Terminal {
    constructor(log) {
      this.log = log;
    }

    clear() {
      this.log.innerHTML = '';
      this.raw(`<div class="t-welcome"><b>Welcome to Claude Code</b><br>~/checkout-api · demo session with pretend tools</div>`);
    }

    raw(html) {
      this.log.insertAdjacentHTML('beforeend', html);
      this.scroll();
      return this.log.lastElementChild;
    }

    add(cls, text) {
      return this.raw(`<div class="t-line ${cls}">${NG.escape(text)}</div>`);
    }

    user(text) { return this.add('t-user', text); }
    tool(text) { return this.add('t-tool', text); }
    result(text) { return this.add('t-result', text); }
    dim(text) { return this.add('t-dim', text); }
    ok(text) { return this.add('t-ok', text); }
    wait(text) { return this.add('t-wait', text); }

    /// Claude's prose, streamed word by word like the real thing.
    async claude(text) {
      const line = this.add('t-claude', '');
      const words = text.split(' ');
      for (let i = 0; i < words.length; i++) {
        line.textContent += (i ? ' ' : '') + words[i];
        this.scroll();
        await NG.sleep(28);
      }
      return line;
    }

    /// Spinner line; returns a function that removes it.
    thinking(label = 'Thinking') {
      const frames = ['✻', '✺', '✹', '✸', '✷', '✶'];
      const line = this.add('t-dim', `${frames[0]} ${label}…`);
      let i = 0;
      const timer = setInterval(() => { line.textContent = `${frames[++i % frames.length]} ${label}…`; }, 120);
      return () => { clearInterval(timer); line.remove(); };
    }

    /// Inline choice, like Claude Code's own prompts. Resolves with the chosen index.
    dialog(question, options) {
      const buttons = options.map((label, i) => `<button type="button" data-choice="${i}">${i + 1}. ${NG.escape(label)}</button>`).join('');
      const box = this.raw(`<div class="t-dialog" role="group" aria-label="${NG.escape(question)}"><div>${NG.escape(question)}</div>${buttons}</div>`);
      NG.$('button', box).focus({ preventScroll: true });
      return new Promise((resolve) => {
        box.addEventListener('click', (event) => {
          const button = event.target.closest('[data-choice]');
          if (!button) return;
          const index = Number(button.dataset.choice);
          box.replaceWith(Object.assign(document.createElement('div'), {
            className: 't-line t-dim',
            textContent: `  ${question} → ${options[index]}`,
          }));
          resolve(index);
        });
      });
    }

    scroll() {
      this.log.scrollTop = this.log.scrollHeight;
    }
  }

  NG.Terminal = Terminal;
})();
