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
    quickSettings: true,
    notices: true,
    checkUpdates: true,
    launchAtLogin: true,

    // Sounds: off by default here (a polite website), on in the app.
    sound: false,
    attentionSound: 'Tink',
    finishedSound: 'Pop',

    // Widgets: a switch each in the menu. The hover panel shows one at a
    // time, picked from the buttons in its header (null: sessions only).
    usageWidget: true,
    insightsWidget: true,
    sessionWidget: true,
    toolsWidget: true,
    resumeWidget: true,
    panelWidget: 'music',
    insightsRange: 'day',    // 'day' | 'week' | 'month'

    // Extras
    nowPlaying: true,
    nowPlayingClosed: true,
    waterReminder: true,
    waterMinutes: 15,
    waterSnooze: 10,
    waterGoal: 8,
    waterBuddy: 'robot',     // 'robot' | 'spidey' | 'batman' | 'random'
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

  /// The "Claude needs you" sound, when sounds are on.
  NG.chime = function (cue = 'attention') {
    if (!values.sound || !NG.sounds) return;
    NG.sounds.play(cue === 'finished' ? values.finishedSound : values.attentionSound);
  };
})();
