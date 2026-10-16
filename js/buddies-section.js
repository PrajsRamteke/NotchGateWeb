// "Drink some water": the buddies section. Pick who drops in (the robot,
// Spidey, Batman or a surprise), see every mood they have, and click one to
// make the buddy on the line wear it. Scrolling here drops your buddy from
// the notch; scrolling away sends it back up.
(function () {
  'use strict';
  const NG = window.NG;
  const S = () => NG.settings;
  const e = NG.escape;

  const choices = [
    ['robot', 'Robot', 'Clipped to its rope by the ring on its antenna.'],
    ['spidey', 'Spidey', 'Hangs upside down from a web tied round his ankle.'],
    ['batman', 'Batman', 'Lowers himself on his grapnel line, cape and all.'],
    ['random', 'Random', 'A different buddy on each reminder.'],
  ];
  const moods = [
    ['cheerful', 'Cheerful', 'Just dropped in'],
    ['excited', 'Excited', 'Your cursor is on it'],
    ['pleading', 'Pleading', 'Ignored for a bit'],
    ['thirsty', 'Thirsty', 'Ignored for longer'],
    ['delighted', 'Delighted', 'You drank'],
    ['sleepy', 'Sleepy', 'Snoozed, or you\'re away'],
    ['tickled', 'Tickled', 'Poked'],
  ];

  let section, inView = false;

  /// The buddy the mood gallery shows: the pick, or whoever's on the line for Random.
  function shown() {
    const theme = S().get('waterBuddy');
    if (theme !== 'random') return theme;
    return NG.water.state !== 'away' ? NG.water.character : 'robot';
  }

  function renderPicker() {
    const theme = S().get('waterBuddy');
    NG.$('.buddy-picker', section).innerHTML = choices.map(([id, name, line]) => {
      const art = id === 'random'
        ? `<span class="buddy-random">${['robot', 'spidey', 'batman'].map((c) => `<span>${NG.buddies.render(c, 'cheerful', { uid: `pick-r-${c}` })}</span>`).join('')}<b>?</b></span>`
        : NG.buddies.render(id, id === theme ? 'excited' : 'cheerful', { uid: `pick-${id}` });
      return `<button type="button" class="buddy-card" role="radio" aria-checked="${id === theme}" data-buddy="${id}">
        <span class="buddy-art">${art}</span>
        <span class="buddy-text"><b>${e(name)}</b><small>${e(line)}</small></span>
      </button>`;
    }).join('');
  }

  function renderMoods() {
    const who = shown();
    NG.$('.mood-who', section).textContent = NG.buddies[who].name;
    NG.$('.mood-strip', section).innerHTML = moods.map(([id, name, when]) => `
      <button type="button" class="mood" data-mood="${id}" title="${e(when)}">
        <span class="mood-art">${NG.buddies.render(who, id, { uid: `mood-${who}-${id}`, drinking: id === 'delighted' })}</span>
        <b>${e(name)}</b><small>${e(when)}</small>
      </button>`).join('');
  }

  function renderGlasses() {
    const goal = S().get('waterGoal');
    const count = NG.water.glasses;
    NG.$('.glasses', section).innerHTML = `
      <span class="glass-drops" aria-hidden="true">${Array.from({ length: Math.min(goal, 12) }, (_, i) => `<i class="${i < count ? 'is-full' : ''}"></i>`).join('')}</span>
      <span><b>${count}</b> of ${goal} glasses today</span>`;
    NG.$('.water-every', section).textContent = `Every ${NG.water.formatMinutes(S().get('waterMinutes'))}`;
  }

  function drop(preview) {
    NG.water.remind({ preview });
  }

  NG.buddySection = {
    /// "What's new" links here with a buddy to show.
    show(id) {
      if (id) S().set('waterBuddy', id);
      section.scrollIntoView({ behavior: NG.reducedMotion ? 'auto' : 'smooth', block: 'start' });
    },
  };

  NG.initBuddySection = function () {
    section = NG.$('#buddies');
    if (!section || !NG.buddies) return;
    renderPicker();
    renderMoods();
    renderGlasses();

    section.addEventListener('click', (event) => {
      const card = event.target.closest('[data-buddy]');
      if (card) {
        S().set('waterBuddy', card.dataset.buddy);
        return drop(false);
      }
      const mood = event.target.closest('[data-mood]');
      if (mood) {
        if (NG.water.state === 'away') {
          drop(false);
          return setTimeout(() => NG.water.showMood(mood.dataset.mood), NG.reducedMotion ? 0 : 900);
        }
        return NG.water.showMood(mood.dataset.mood);
      }
      if (event.target.closest('[data-drop]')) drop(false);
    });

    S().subscribe((key) => {
      if (key === 'waterBuddy') { renderPicker(); renderMoods(); }
      if (['waterGoal', 'waterMinutes'].includes(key)) renderGlasses();
    });
    document.addEventListener('ng:water', (event) => {
      renderGlasses();
      const { state, mood } = event.detail;
      if (S().get('waterBuddy') === 'random' && NG.$('.mood-who', section).textContent !== NG.buddies[shown()].name) renderMoods();
      NG.$$('.mood', section).forEach((m) => m.classList.toggle('is-current', state !== 'away' && m.dataset.mood === mood));
    });

    // Scrolling here drops the buddy in; leaving sends it home.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting === inView) return;
      inView = entry.isIntersecting;
      if (inView && NG.water.state === 'away') drop(false);
      if (!inView) NG.water.hide();
    }, { rootMargin: '-35% 0px -35% 0px' });
    observer.observe(section);
  };
})();
