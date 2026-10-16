// NotchGate's updater, pretend edition: this "Mac" runs 2.13.0 and GitHub has
// 2.13.1. The menu's banner, the Update pill in the notch and the details
// tile all share it, so updating from one updates them all.
(function () {
  'use strict';
  const NG = window.NG;

  const listeners = new Set();
  const state = {
    status: 'available',   // available · updating · current · checking
    installed: '2.13.0',
    latest: '2.13.1',
    changes: [
      'A Live pill mirrors ✦ Claude across the camera',
      'Session headers fit on one line, however busy',
    ],
    checkedAt: Date.now() - 2 * 60000,
  };

  const emit = () => listeners.forEach((listener) => listener(state));

  NG.updates = {
    get state() { return state; },
    get available() { return state.status === 'available'; },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },

    /// Downloads, swaps the app and relaunches: a few seconds on a real Mac.
    async update() {
      if (state.status !== 'available') return;
      state.status = 'updating';
      emit();
      await NG.sleep(2400);
      state.status = 'current';
      state.installed = state.latest;
      state.checkedAt = Date.now();
      emit();
      NG.toast(`Relaunched on NotchGate ${state.latest}`);
    },

    /// The refresh button: asks GitHub again.
    async check() {
      if (state.status === 'updating' || state.status === 'checking') return;
      const before = state.status;
      state.status = 'checking';
      emit();
      await NG.sleep(1100);
      state.status = before;
      state.checkedAt = Date.now();
      emit();
    },

    /// "Start over" for the demo: the update shows up again.
    reset() {
      Object.assign(state, { status: 'available', installed: '2.13.0' });
      emit();
    },
  };
})();
