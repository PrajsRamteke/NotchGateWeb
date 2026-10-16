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
      <h3>Sounds you pick.</h3>
      <p>One for <b>Claude needs you</b>, one for <b>Claude finished</b>, from macOS's own. Tap to listen.</p>
      <div class="sound-chips" id="sound-chips"></div>
      <div class="sound-roles"><span>Needs you: <b data-role="attentionSound"></b></span><span>Finished: <b data-role="finishedSound"></b></span></div>
    </article>
    <article class="tile tile-half">
      <h3>Works where Claude runs.</h3>
      <p>Prompts from the notch land in the right session, and ↗ brings back its exact tab or window.</p>
      <div class="terminals"><span>Terminal</span><span>iTerm2</span><span>tmux</span><span>Cursor</span><span>VS Code</span><span>Windsurf</span><span>WezTerm</span></div>
    </article>
    <article class="tile tile-narrow">
      <h3>Updates itself.</h3>
      <p>New version on GitHub? An Update pill shows up in the notch.</p>
      <div class="mini-update" id="mini-update">
        <strong></strong>
        <div class="bar"><i></i></div>
        <button class="button button-primary button-small" type="button">Update</button>
      </div>
    </article>
    <article class="tile tile-narrow tile-dark">
      <h3>Drafts wait.</h3>
      <p>Close the notch mid-sentence. Your prompt is still there, marked with a dot.</p>
      <div class="draft-demo" aria-hidden="true"><span class="draft-chip"><i></i>💬</span><span class="draft-text">Also add a changelog entry<b></b></span></div>
    </article>
    <article class="tile tile-narrow">
      <h3>Never steals focus.</h3>
      <p>Answer the notch and keep typing where you were.</p>
    </article>
    <article class="tile tile-full tile-dark">
      <h3>Stays on your Mac.</h3>
      <p>Claude Code and the notch talk over a private local socket. Insights are read from your own transcripts. The only network call checks GitHub for updates.</p>
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

  /// The same updater as the menu and the notch: update here, and it's done there too.
  function wireUpdate() {
    const box = NG.$('#mini-update');
    const button = NG.$('button', box);
    const label = NG.$('strong', box);
    const bar = NG.$('.bar i', box);
    const sync = () => {
      const u = NG.updates.state;
      label.textContent = u.status === 'updating' ? `Updating to ${u.latest}…` : u.status === 'current' ? `Up to date: ${u.installed}` : `${u.latest} is available`;
      button.textContent = u.status === 'current' ? 'Again' : 'Update';
      button.disabled = u.status === 'updating';
      bar.style.width = u.status === 'available' ? '0' : '100%';
      box.classList.toggle('is-current', u.status === 'current');
    };
    button.addEventListener('click', () => {
      if (NG.updates.state.status === 'current') {
        bar.style.transition = 'none';
        NG.updates.reset();
        requestAnimationFrame(() => (bar.style.transition = ''));
        return;
      }
      NG.updates.update();
    });
    NG.updates.subscribe(sync);
    sync();
  }

  function wireSounds() {
    const chips = NG.$('#sound-chips');
    const roles = () => NG.$$('[data-role]').forEach((el) => (el.textContent = NG.settings.get(el.dataset.role)));
    chips.innerHTML = NG.sounds.names.map((name) => `<button type="button" class="sound-chip" data-sound="${name}"><i></i>${name}</button>`).join('');
    chips.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-sound]');
      if (!chip) return;
      NG.sounds.play(chip.dataset.sound);
      chip.classList.remove('is-playing');
      void chip.offsetWidth;
      chip.classList.add('is-playing');
    });
    NG.settings.subscribe((key) => { if (key.endsWith('Sound')) roles(); });
    roles();
  }

  NG.initDetails = function () {
    const grid = NG.$('#details-grid');
    if (!grid) return;
    grid.innerHTML = tiles;
    wireRiskChecker();
    wireKeycaps();
    wireUpdate();
    wireSounds();
  };
})();
