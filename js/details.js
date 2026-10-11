// Details grid: small facts, each with a hands-on bit where it helps.
(function () {
  'use strict';
  const NG = window.NG;

  const tiles = `
    <article class="tile tile-wide">
      <h3>Auto-allow, with guardrails.</h3>
      <p>Approve everything automatically, except the commands you'd want to read first. Try one.</p>
      <form class="risk-form" id="risk-form" autocomplete="off">
        <label class="visually-hidden" for="risk-input">A shell command</label>
        <input id="risk-input" value="git push --force origin main" spellcheck="false">
        <span class="verdict" id="risk-verdict" aria-live="polite"></span>
      </form>
    </article>
    <article class="tile tile-narrow tile-dark">
      <h3>Hands stay on the keys.</h3>
      <p>Allow from any app.</p>
      <div class="keycaps" aria-hidden="true">
        <span class="keycap" data-key="Control">⌃</span><span class="keycap" data-key="Alt">⌥</span><span class="keycap" data-key="Enter">⏎</span>
      </div>
    </article>
    <article class="tile tile-half">
      <h3>Works where Claude runs.</h3>
      <p>Prompts from the notch land in the right session.</p>
      <div class="terminals"><span>Terminal</span><span>iTerm2</span><span>tmux</span><span>Cursor</span><span>VS Code</span><span>WezTerm</span></div>
    </article>
    <article class="tile tile-half">
      <h3>Updates itself.</h3>
      <p>New version on GitHub? One click.</p>
      <div class="mini-update" id="mini-update">
        <strong>Update available</strong>
        <div class="bar"><i></i></div>
        <button class="button button-primary button-small" type="button">Update</button>
      </div>
    </article>
    <article class="tile tile-narrow">
      <h3>Never steals focus.</h3>
      <p>Answer the notch and keep typing where you were.</p>
    </article>
    <article class="tile tile-wide tile-dark">
      <h3>Stays on your Mac.</h3>
      <p>Claude Code and the notch talk over a private local socket. The only network call checks GitHub for updates.</p>
    </article>`;

  function wireRiskChecker() {
    const input = NG.$('#risk-input');
    const verdict = NG.$('#risk-verdict');
    const update = () => {
      const command = input.value.trim();
      const risky = command && NG.isRisky(command);
      verdict.className = `verdict ${risky ? 'is-risky' : 'is-safe'}`;
      verdict.textContent = !command ? 'Type a command' : risky ? 'Still asks you' : 'Auto-allowed';
    };
    input.addEventListener('input', update);
    NG.$('#risk-form').addEventListener('submit', (event) => event.preventDefault());
    update();
  }

  function wireKeycaps() {
    const caps = NG.$$('.keycap');
    const enter = caps.find((c) => c.dataset.key === 'Enter');
    const set = (event, down) => {
      if (event.key === 'Backspace' || event.code === 'Space') {
        enter.textContent = event.key === 'Backspace' ? '⌫' : '␣';
        enter.classList.toggle('is-down', down);
        return;
      }
      if (event.key === 'Enter') enter.textContent = '⏎';
      const cap = caps.find((c) => c.dataset.key === event.key);
      if (cap) cap.classList.toggle('is-down', down);
    };
    document.addEventListener('keydown', (event) => set(event, true));
    document.addEventListener('keyup', (event) => set(event, false));
    window.addEventListener('blur', () => caps.forEach((c) => c.classList.remove('is-down')));
  }

  function wireUpdate() {
    const box = NG.$('#mini-update');
    const button = NG.$('button', box);
    const label = NG.$('strong', box);
    const bar = NG.$('.bar i', box);
    button.addEventListener('click', async () => {
      if (button.disabled) return;
      button.disabled = true;
      label.textContent = 'Updating…';
      bar.style.width = '100%';
      await NG.sleep(2300);
      label.textContent = 'Up to date';
      button.textContent = 'Restarted';
      await NG.sleep(2600);
      label.textContent = 'Update available';
      button.textContent = 'Update';
      bar.style.transition = 'none';
      bar.style.width = '0';
      requestAnimationFrame(() => { bar.style.transition = ''; button.disabled = false; });
    });
  }

  NG.initDetails = function () {
    const grid = NG.$('#details-grid');
    if (!grid) return;
    grid.innerHTML = tiles;
    wireRiskChecker();
    wireKeycaps();
    wireUpdate();
  };
})();
