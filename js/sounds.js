// macOS's built-in alert sounds, sketched with the Web Audio API so the page
// ships no audio files. They're impressions, not recordings: close enough to
// pick a favourite, the way NotchGate's Sounds menu lets you.
(function () {
  'use strict';
  const NG = window.NG;

  let ctx;
  let master;

  function audio() {
    if (!ctx) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return null;
      ctx = new Context();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /// One enveloped oscillator. `glide` bends the pitch to that frequency.
  function tone(t, { type = 'sine', freq, glide, start = 0, attack = 0.005, decay = 0.3, peak = 0.3, out = master }) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const at = t + start;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    if (glide) osc.frequency.exponentialRampToValueAtTime(glide, at + attack + decay);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
    osc.connect(gain).connect(out);
    osc.start(at);
    osc.stop(at + attack + decay + 0.05);
    return { osc, gain };
  }

  /// A burst of filtered noise (breath, clicks, thuds).
  function noise(t, { start = 0, decay = 0.2, peak = 0.2, filter = 'bandpass', freq = 1000, sweep, q = 1 }) {
    const length = Math.ceil(ctx.sampleRate * (decay + 0.05));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    const bq = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const at = t + start;
    src.buffer = buffer;
    bq.type = filter;
    bq.frequency.setValueAtTime(freq, at);
    if (sweep) bq.frequency.exponentialRampToValueAtTime(sweep, at + decay);
    bq.Q.value = q;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    src.connect(bq).connect(gain).connect(master);
    src.start(at);
    src.stop(at + decay + 0.05);
  }

  /// A bell: a fundamental plus inharmonic partials that die away faster.
  function bell(t, freq, { start = 0, decay = 1.2, peak = 0.22 } = {}) {
    [[1, 1], [2.76, 0.4], [5.4, 0.18], [8.93, 0.08]].forEach(([ratio, level], i) =>
      tone(t, { freq: freq * ratio, start, decay: decay / (1 + i * 0.8), peak: peak * level }));
  }

  /// An echo bus, for the sonar.
  function echo(delayTime, feedback) {
    const delay = ctx.createDelay(1);
    const fb = ctx.createGain();
    const wet = ctx.createGain();
    delay.delayTime.value = delayTime;
    fb.gain.value = feedback;
    wet.gain.value = 0.6;
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(master);
    return delay;
  }

  const recipes = {
    Basso(t) {
      tone(t, { type: 'triangle', freq: 92, glide: 70, decay: 0.55, peak: 0.6 });
      tone(t, { freq: 184, glide: 140, decay: 0.3, peak: 0.25 });
      noise(t, { filter: 'lowpass', freq: 400, decay: 0.12, peak: 0.25 });
    },
    Blow(t) {
      noise(t, { filter: 'bandpass', freq: 500, sweep: 1600, q: 2.5, decay: 0.55, peak: 0.5 });
      tone(t, { freq: 420, glide: 620, attack: 0.08, decay: 0.4, peak: 0.06 });
    },
    Bottle(t) {
      noise(t, { filter: 'highpass', freq: 2200, decay: 0.03, peak: 0.25 });
      tone(t, { freq: 760, glide: 640, attack: 0.004, decay: 0.42, peak: 0.32 });
      tone(t, { freq: 1520, glide: 1280, attack: 0.004, decay: 0.18, peak: 0.06 });
    },
    Frog(t) {
      const out = ctx.createBiquadFilter();
      out.type = 'lowpass';
      out.frequency.value = 900;
      out.connect(master);
      for (let i = 0; i < 4; i++) tone(t, { type: 'square', freq: 210 - i * 6, start: i * 0.045, attack: 0.004, decay: 0.05, peak: 0.12, out });
    },
    Funk(t) {
      tone(t, { type: 'sawtooth', freq: 196, glide: 98, decay: 0.16, peak: 0.12 });
      tone(t, { type: 'sawtooth', freq: 147, glide: 110, start: 0.13, decay: 0.22, peak: 0.12 });
      tone(t, { freq: 98, start: 0.13, decay: 0.3, peak: 0.25 });
    },
    Glass(t) {
      bell(t, 1568, { decay: 1.4, peak: 0.25 });
      tone(t, { freq: 3136, decay: 0.5, peak: 0.05 });
    },
    Hero(t) {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(t, f, { start: i * 0.075, decay: 0.9, peak: 0.13 }));
    },
    Morse(t) {
      [0, 0.12].forEach((start) => tone(t, { type: 'square', freq: 1046, start, attack: 0.003, decay: 0.07, peak: 0.07 }));
    },
    Ping(t) {
      tone(t, { freq: 1318.5, attack: 0.003, decay: 0.7, peak: 0.3 });
      tone(t, { freq: 2637, attack: 0.003, decay: 0.25, peak: 0.05 });
    },
    Pop(t) {
      tone(t, { freq: 640, glide: 220, attack: 0.002, decay: 0.09, peak: 0.45 });
      noise(t, { filter: 'bandpass', freq: 1800, decay: 0.035, peak: 0.18 });
    },
    Purr(t) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      const { gain } = tone(t, { type: 'sawtooth', freq: 74, attack: 0.08, decay: 0.6, peak: 0.12 });
      lfo.frequency.value = 26;
      depth.gain.value = 0.08;
      lfo.connect(depth).connect(gain.gain);
      lfo.start(t);
      lfo.stop(t + 0.75);
    },
    Sosumi(t) {
      bell(t, 1174.66, { decay: 0.45, peak: 0.18 });
      bell(t, 880, { start: 0.11, decay: 0.7, peak: 0.18 });
    },
    Submarine(t) {
      const out = echo(0.22, 0.42);
      tone(t, { freq: 587, attack: 0.01, decay: 0.55, peak: 0.28 });
      tone(t, { freq: 587, attack: 0.01, decay: 0.4, peak: 0.25, out });
    },
    Tink(t) {
      tone(t, { freq: 2794, attack: 0.001, decay: 0.12, peak: 0.25 });
      tone(t, { freq: 4186, attack: 0.001, decay: 0.05, peak: 0.08 });
    },
  };

  NG.sounds = {
    /// The sounds, in the order macOS lists them (after "None").
    names: Object.keys(recipes),
    play(name) {
      const recipe = recipes[name];
      if (!recipe || !audio()) return;
      try { recipe(ctx.currentTime + 0.02); } catch (_) { /* audio unavailable */ }
    },
  };
})();
