// Header behaviour: frosted once scrolled, plus a current-section highlight.
(function () {
  'use strict';
  const NG = window.NG;

  function wireScrolled(bar) {
    const update = () => bar.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function wireScrollSpy() {
    const links = NG.$$('[data-spy]');
    // Every section, so one without a link (details, what's new) clears the highlight.
    const sections = NG.$$('main > section');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => link.classList.toggle('is-current', link.dataset.spy === entry.target.id));
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach((section) => observer.observe(section));
    // Back at the top: nothing is "current".
    window.addEventListener('scroll', () => {
      if (window.scrollY < window.innerHeight * 0.5) links.forEach((link) => link.classList.remove('is-current'));
    }, { passive: true });
  }

  NG.initHeader = function () {
    const bar = NG.$('.menubar');
    if (!bar) return;
    wireScrolled(bar);
    wireScrollSpy();
  };
})();
