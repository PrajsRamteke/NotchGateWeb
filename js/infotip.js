// The ⓘ bubbles from the app's settings: what a setting does lives in a
// bubble shown on hovering (or tapping) its ⓘ, not in gray captions. Any
// element with data-tip gets one. The bubble is drawn above everything, so
// no scroll area or notch edge can clip it.
(function () {
  'use strict';
  const NG = window.NG;

  let bubble;
  let owner = null;
  let showTimer;

  function place(target) {
    const rect = target.getBoundingClientRect();
    const box = bubble.getBoundingClientRect();
    const gap = 8;
    let top = rect.bottom + gap;
    let below = true;
    if (top + box.height > window.innerHeight - 8) { top = rect.top - box.height - gap; below = false; }
    const left = Math.min(window.innerWidth - box.width - 8, Math.max(8, rect.left + rect.width / 2 - box.width / 2));
    bubble.style.top = `${Math.max(8, top)}px`;
    bubble.style.left = `${left}px`;
    bubble.style.setProperty('--arrow', `${rect.left + rect.width / 2 - left}px`);
    bubble.classList.toggle('is-above', !below);
  }

  function show(target) {
    clearTimeout(showTimer);
    owner = target;
    bubble.textContent = target.dataset.tip;
    bubble.classList.toggle('is-island', Boolean(target.closest('.island, .tile-dark, .ng-dark')));
    bubble.hidden = false;
    place(target);
    requestAnimationFrame(() => bubble.classList.add('is-shown'));
  }

  function hide() {
    clearTimeout(showTimer);
    owner = null;
    bubble.classList.remove('is-shown');
    bubble.hidden = true;
  }

  NG.initInfoTips = function () {
    bubble = document.createElement('div');
    bubble.className = 'infotip';
    bubble.setAttribute('role', 'tooltip');
    bubble.hidden = true;
    document.body.appendChild(bubble);

    document.addEventListener('mouseover', (event) => {
      const target = event.target.closest && event.target.closest('[data-tip]');
      if (!target || target === owner) return;
      clearTimeout(showTimer);
      showTimer = setTimeout(() => show(target), 120);
    });
    document.addEventListener('mouseout', (event) => {
      const target = event.target.closest && event.target.closest('[data-tip]');
      if (!target || target.contains(event.relatedTarget)) return;
      if (target === owner) hide();
      else clearTimeout(showTimer);
    });
    // Tap (or click) toggles it, for touch screens and keyboards.
    document.addEventListener('click', (event) => {
      const target = event.target.closest && event.target.closest('[data-tip]');
      if (!target) return owner && hide();
      event.preventDefault();
      owner === target ? hide() : show(target);
    }, true);
    document.addEventListener('focusin', (event) => {
      if (event.target.matches && event.target.matches('[data-tip]')) show(event.target);
    });
    document.addEventListener('focusout', (event) => { if (event.target === owner) hide(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && owner) hide(); });
    window.addEventListener('scroll', () => owner && hide(), { passive: true });
    // A re-render can remove the ⓘ under the bubble.
    setInterval(() => { if (owner && !owner.isConnected) hide(); }, 500);
  };
})();
