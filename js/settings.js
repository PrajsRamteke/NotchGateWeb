// One settings store shared by the header menu, the playground and the
// notch, so flipping a switch anywhere changes the behaviour everywhere.
(function () {
  'use strict';
  const NG = window.NG;

  const defaults = {
    notchPermissions: true,
    notchEdits: true,
    questionMode: 'notch',   // 'notch' | 'terminal' | 'off'
    notchPlans: true,
    replyWhenDone: true,
    autoAllow: false,
    askRisky: true,
    autoExpand: true,
    liveActivity: true,
    quickSettings: false,
    sound: false,
    notices: true,
    checkUpdates: true,
    launchAtLogin: true,
  };

  const values = { ...defaults };
  const listeners = new Set();

  NG.settings = {
    get: (key) => values[key],
    set(key, value) {
      if (values[key] === value) return;
      values[key] = value;
      listeners.forEach((listener) => listener(key, value));
    },
    reset() {
      Object.keys(defaults).forEach((key) => NG.settings.set(key, defaults[key]));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /// "Questions" in Show in notch is on unless questions go to the terminal.
    questionsInNotch: () => values.questionMode !== 'terminal',
  };

  // A soft two-note chime for new requests (off by default, like a polite website).
  let audio;
  NG.chime = function () {
    if (!values.sound) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      [880, 1318.5].forEach((frequency, i) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        const start = audio.currentTime + i * 0.09;
        osc.frequency.value = frequency;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.08, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
        osc.connect(gain).connect(audio.destination);
        osc.start(start);
        osc.stop(start + 0.4);
      });
    } catch (_) { /* audio unavailable */ }
  };
})();
