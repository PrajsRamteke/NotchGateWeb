// The live notch at the top of the page.
//
// Sections "claim" the island while they're on screen (the most recent claim
// wins) and receive the actions people take on its cards. Hovering an idle
// notch reveals live activity, just like the app.
(function () {
  'use strict';
  const NG = window.NG;

  const css = (name) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  const expandedWidth = () => Math.min(460, window.innerWidth - 24);

  class Island {
    constructor(root) {
      this.root = root;
      this.title = NG.$('.island-title', root);
      this.badge = NG.$('.island-badge', root);
      this.body = NG.$('.island-body', root);
      this.owners = new Map();
      this.order = 0;
      this.hovering = false;
      this.minimized = false;
      this.renderToken = 0;
      this.currentHTML = '';
      /// What hovering an idle notch reveals: { card, onAction, isActivity } or null.
      this.hoverView = () => null;
      this.flares = ['', 'is-right'].map((side) => {
        const flare = document.createElement('div');
        flare.className = `island-flare ${side}`;
        document.body.appendChild(flare);
        return flare;
      });
      this.bindEvents();
      this.setSize(css('--notch-width'), css('--notch-height'));
      this.root.dataset.state = 'idle';
    }

    // MARK: Ownership

    /// `view`: { card, onAction(action, detail), peek }
    claim(owner, view) {
      this.owners.set(owner, { ...view, order: ++this.order });
      this.minimized = false;
      this.render();
    }

    release(owner) {
      if (this.owners.delete(owner)) this.render();
    }

    top() {
      let best = null;
      this.owners.forEach((view) => { if (!best || view.order > best.order) best = view; });
      return best;
    }

    // MARK: Rendering

    render() {
      const top = this.top();
      // "Expand automatically" off: new requests wait as a pill until hovered.
      const heldBack = top && top.card.waiting && !NG.settings.get('autoExpand') && !this.hovering;
      const showsCard = top && !top.peek && !this.minimized && !heldBack;
      this.showingActivity = false;
      if (this.hovering && !(top && !top.peek && !this.minimized)) {
        const view = this.hoverView();
        if (view) {
          this.showingActivity = Boolean(view.isActivity);
          return this.open(view.card, view);
        }
      }
      if (!top) return this.idle();
      if (!showsCard) return this.peek(top.card);
      this.open(top.card, top);
    }

    async open(card, view) {
      const token = ++this.renderToken;
      this.view = view;
      this.setChrome(card);
      if (this.root.dataset.state === 'open' && this.currentHTML === card.html) return;

      if (this.root.dataset.state === 'open') {
        this.body.classList.remove('is-shown');
        await NG.sleep(140);
        if (token !== this.renderToken) return;
      }
      if (card.waiting && card.html !== this.lastChimed) {
        this.lastChimed = card.html;
        NG.chime();
      }
      this.currentHTML = card.html;
      const width = expandedWidth();
      this.body.style.width = `${width}px`;
      this.body.innerHTML = card.html;
      this.root.dataset.state = 'open';
      this.setSize(width, css('--notch-height') + this.body.offsetHeight);
      requestAnimationFrame(() => token === this.renderToken && this.body.classList.add('is-shown'));
    }

    /// Re-renders dynamic content (live activity) in place, without the swap animation.
    refresh(card) {
      if (this.root.dataset.state !== 'open') return;
      this.currentHTML = card.html;
      this.body.innerHTML = card.html;
      this.setChrome(card);
      this.setSize(expandedWidth(), css('--notch-height') + this.body.offsetHeight);
    }

    peek(card) {
      this.renderToken++;
      this.view = null;
      this.currentHTML = '';
      this.body.classList.remove('is-shown');
      this.setChrome(card);
      this.root.dataset.state = 'peek';
      this.setSize(Math.min(css('--notch-width') + 210, window.innerWidth - 24), css('--notch-height'));
    }

    idle() {
      this.renderToken++;
      this.view = null;
      this.currentHTML = '';
      this.body.classList.remove('is-shown');
      this.root.dataset.state = 'idle';
      delete this.root.dataset.waiting;
      delete this.root.dataset.live;
      this.setSize(css('--notch-width'), css('--notch-height'));
    }

    setChrome(card) {
      this.title.textContent = card.title || '';
      this.badge.hidden = !card.badge;
      this.badge.textContent = card.badge || '';
      this.root.toggleAttribute('data-waiting', Boolean(card.waiting));
      this.root.toggleAttribute('data-live', Boolean(card.live || card.waiting));
    }

    setSize(width, height) {
      this.root.style.setProperty('--w', `${width}px`);
      this.root.style.setProperty('--h', `${height}px`);
      this.flares[0].style.left = `calc(50% - ${width / 2}px - 10px)`;
      this.flares[1].style.left = `calc(50% + ${width / 2}px)`;
    }

    // MARK: Interaction

    act(action, detail = {}) {
      if (this.view && this.view.onAction) this.view.onAction(action, detail);
    }

    bindEvents() {
      this.root.addEventListener('click', (event) => {
        const option = event.target.closest('[data-select]');
        if (option) {
          NG.$$('[data-select]', this.body).forEach((o) => o.setAttribute('aria-pressed', String(o === option)));
          NG.$$('[data-needs-selection]', this.body).forEach((b) => (b.disabled = false));
          this.selection = option.dataset.select;
          return;
        }
        const button = event.target.closest('[data-action]');
        if (button && !button.disabled) return this.act(button.dataset.action, { selection: this.selection, target: button });
        // Touch screens have no hover: tapping an idle notch toggles live activity.
        if (this.root.dataset.state !== 'open') {
          this.openedByTap = !this.hovering;
          this.setHovering(!this.hovering);
        }
      });

      this.root.addEventListener('input', (event) => {
        const form = event.target.closest('[data-composer]');
        const send = form && NG.$('.send', form);
        if (send) send.disabled = !event.target.value.trim();
      });
      this.root.addEventListener('submit', (event) => {
        const form = event.target.closest('[data-composer]');
        if (!form) return;
        event.preventDefault();
        const input = NG.$('input[type="text"], input:not([type])', form);
        const value = input.value.trim();
        // The hover panel's prompt boxes can send images with no text.
        if (value || NG.$('.ap-thumb', form)) this.act('send', { value, form });
      });

      this.root.addEventListener('mouseenter', () => this.setHovering(true));
      this.root.addEventListener('mouseleave', () => {
        clearTimeout(this.leaveTimer);
        this.leaveTimer = setTimeout(() => this.setHovering(false), 280);
      });
      document.addEventListener('click', (event) => {
        // composedPath, not contains(): a click that re-rendered the panel leaves its target detached.
        if (this.hovering && !event.composedPath().includes(this.root)) this.setHovering(false);
      });

      // Activity opened by a tap closes once the visitor scrolls on.
      window.addEventListener('scroll', () => {
        if (this.hovering && this.openedByTap) { this.openedByTap = false; this.setHovering(false); }
      }, { passive: true });

      document.addEventListener('keydown', (event) => this.handleShortcut(event));
      window.addEventListener('resize', () => this.render());
    }

    setHovering(hovering) {
      clearTimeout(this.leaveTimer);
      if (this.hovering === hovering) return;
      this.hovering = hovering;
      this.selection = undefined;
      this.render();
      document.dispatchEvent(new CustomEvent('ng:hover', { detail: hovering }));
    }

    handleShortcut(event) {
      if (!event.ctrlKey || !event.altKey) return;
      const key = event.code;
      if (key === 'Space') {
        event.preventDefault();
        if (this.top()) { this.minimized = !this.minimized; this.render(); }
        return;
      }
      const role = key === 'Enter' ? 'primary' : key === 'Backspace' ? 'reject' : null;
      const button = role && NG.$(`[data-key="${role}"]:not([disabled])`, this.body);
      if (button && this.root.dataset.state === 'open') {
        event.preventDefault();
        button.click();
      }
    }
  }

  NG.initIsland = function () {
    const root = NG.$('#island');
    if (root) NG.island = new Island(root);
  };
})();
