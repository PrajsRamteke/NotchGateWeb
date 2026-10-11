// Boot. The page opens with a quiet, closed notch. Hovering it, or starting
// to scroll, makes it ask for a permission, like it would on your Mac.
(function () {
  'use strict';
  const NG = window.NG;

  const intro = { done: false, shown: false };

  const inHero = () => window.scrollY < window.innerHeight * 0.45;
  const introPending = () => !intro.done && inHero();

  function answerIntro(action) {
    if (intro.done) return;
    intro.done = true;
    // Same request as the first feature step: answered here means answered there.
    NG.story?.record('permission', action);
    NG.toast(action === 'deny' ? 'Denied. Claude will find another way' : 'Allowed. Claude keeps going');
    NG.island.claim('hero', { card: NG.cards.result(action === 'deny' ? 'Denied.' : 'Allowed.'), onAction() {} });
    setTimeout(() => NG.island.release('hero'), 1400);
  }

  const introView = () => ({
    card: NG.cards.permission({ ...NG.demo.permission, project: 'checkout-api' }),
    onAction: answerIntro,
  });

  /// First scroll: the notch opens on its own and stays open until answered.
  function showIntroOnScroll() {
    const onScroll = () => {
      if (intro.shown || intro.done || window.scrollY < 12) return;
      intro.shown = true;
      window.removeEventListener('scroll', onScroll);
      NG.island.claim('hero', introView());
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    NG.watch(NG.$('#top'), () => {}, () => { intro.done = true; NG.island.release('hero'); }, { threshold: 0.35 });
  }

  /// Hover: the intro card while it's pending, live activity after that.
  function wireHover() {
    NG.island.hoverView = () => {
      if (introPending()) return introView();
      if (!NG.settings.get('liveActivity')) return null;
      return NG.panel.view();
    };

    // The panel keeps itself up to date (see panel.js).
    document.addEventListener('ng:hover', (event) => {
      if (event.detail) NG.$('.hero-hint')?.classList.add('is-gone');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    NG.initTheme();
    NG.initIsland();
    NG.initPanel();
    NG.initWater();
    NG.initHeader();
    NG.initMenu();
    NG.initPlayground();
    NG.initStory();
    NG.initDetails();
    NG.initInstall();
    wireHover();
    showIntroOnScroll();
  });
})();
