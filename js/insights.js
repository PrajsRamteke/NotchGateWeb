// The Insights widget: what Claude Code cost and did over the last 24 hours,
// 7 days or 30 days. A bar per hour or day (hover one for its numbers), the
// totals, the busiest projects and the split by model. The app reads this
// from ~/.claude/projects; here it's seeded, so it's the same on every visit.
(function () {
  'use strict';
  const NG = window.NG;
  const S = () => NG.settings;
  const e = NG.escape;

  const ranges = {
    day: { title: '24h', count: 24, unit: 'hour', start: '24 hours ago', end: 'Now', sessions: 9, prompts: 57, files: 34, active: 252 },
    week: { title: '7d', count: 7, unit: 'day', start: '7 days ago', end: 'Today', sessions: 38, prompts: 264, files: 141, active: 1564 },
    month: { title: '30d', count: 30, unit: 'day', start: '30 days ago', end: 'Today', sessions: 131, prompts: 1012, files: 486, active: 3550 },
  };

  const projects = [['checkout-api', 0.44], ['dashboard', 0.27], ['handbook', 0.13], ['orders-service', 0.1], ['onboarding', 0.06]];
  const models = {
    day: [['Opus', 0.74], ['Sonnet', 0.21], ['Haiku', 0.05]],
    week: [['Opus', 0.69], ['Sonnet', 0.24], ['Haiku', 0.05], ['Fable', 0.02]],
    month: [['Opus', 0.66], ['Sonnet', 0.25], ['Fable', 0.05], ['Haiku', 0.04]],
  };
  const modelTint = { Fable: '#a48be0', Opus: '#d97757', Sonnet: '#6fa8dc', Haiku: '#6cc49a' };

  // MARK: Data

  /// A small seeded random, so the chart doesn't change between visits.
  function seeded(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /// How busy a typical hour of the day is: mornings and late afternoons.
  const hourWeight = (h) => (h < 8 ? (h < 1 ? 0.25 : 0) : h < 13 ? 0.7 + (h - 8) * 0.12 : h === 13 ? 0.3 : h < 20 ? 1 - (h - 14) * 0.06 : h < 23 ? 0.45 : 0.15);

  const cache = {};
  function summary(range) {
    const now = new Date();
    const key = `${range}-${now.getHours()}`;
    if (cache[key]) return cache[key];
    const r = ranges[range];
    const rand = seeded({ day: 11, week: 23, month: 37 }[range]);
    const buckets = [];
    for (let i = r.count - 1; i >= 0; i--) {
      const start = new Date(now);
      let weight;
      if (r.unit === 'hour') {
        start.setMinutes(0, 0, 0);
        start.setHours(start.getHours() - i);
        weight = hourWeight(start.getHours()) * (0.55 + rand() * 0.9);
        weight *= 1.6;
      } else {
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - i);
        const weekend = start.getDay() === 0 || start.getDay() === 6;
        weight = (weekend ? 0.25 + rand() * 0.5 : 0.75 + rand() * 0.65) * (i === 0 ? 0.6 : 1);
        weight *= 30;
        if (range === 'month' && rand() < 0.08) weight = 0;
      }
      const cost = Math.round(weight * 100) / 100;
      buckets.push({ start, cost, tokens: Math.round(cost * (1.5 + rand() * 0.3) * 1e6), replies: Math.round(cost * (7 + rand() * 4)) });
    }
    const cost = buckets.reduce((sum, b) => sum + b.cost, 0);
    const tokens = buckets.reduce((sum, b) => sum + b.tokens, 0);
    cache[key] = { range, buckets, cost, tokens, cached: { day: 0.91, week: 0.89, month: 0.9 }[range], ...r };
    return cache[key];
  }

  // MARK: Formatting (InsightsFormat)

  const cost = (v) => (v >= 1000 ? `$${Math.round(v).toLocaleString('en-US')}` : `$${v.toFixed(2)}`);
  function tokens(v) {
    if (v >= 1e9) return `${+(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `${+(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${+(v / 1e3).toFixed(1)}K`;
    return String(v);
  }
  function duration(minutes) {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60), m = minutes % 60;
    return h >= 10 || !m ? `${h}h` : `${h}h ${m}m`;
  }
  function bucketTitle(b, unit) {
    if (unit === 'hour') {
      const end = new Date(b.start.getTime() + 3600000);
      const t = (d) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      return `${t(b.start)} – ${t(end)}`;
    }
    return b.start.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  }

  // MARK: Icons

  const svg = (body) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  const I = {
    chart: svg('<path d="M4 20h16M6.5 16.5v-5M10.5 16.5V7M14.5 16.5v-3.5M18.5 16.5V9"/>'),
    stack: svg('<rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M6.5 5h11"/>'),
    timer: svg('<circle cx="12" cy="13.5" r="7"/><path d="M12 13.5V10M10 3.5h4"/>'),
    bubble: svg('<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16h-8l-4 3.5V16H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 5z"/>'),
    doc: svg('<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z"/><path d="M14 3.5V8h4M10 13h4.5M10 16h3"/>'),
    info: '<svg class="i is-info" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.2M12 7.8v.4"/></svg>',
  };

  const tip = (text, label) => `<button type="button" class="in-tip" data-tip="${e(text)}" aria-label="About ${e(label)}">${I.info}</button>`;

  // MARK: The card

  /// Which bar is under the pointer, and whether the bars should grow in.
  const ui = { hover: null, growUntil: 0 };

  function card() {
    const range = S().get('insightsRange');
    const s = summary(range);
    const peak = Math.max(...s.buckets.map((b) => b.cost), 0.01);
    const hovered = ui.hover != null ? s.buckets[ui.hover] : null;
    const chips = Object.entries(ranges).map(([key, r]) =>
      `<button type="button" class="in-chip" data-action="in-range" data-range="${key}" aria-pressed="${key === range}" title="Show the last ${r.title.replace('h', ' hours').replace('d', ' days')}">${r.title}</button>`).join('');
    const bars = s.buckets.map((b, i) => {
      const f = b.cost / peak;
      return `<i class="in-bar ${f ? '' : 'is-quiet'} ${ui.hover === i ? 'is-hover' : ''}" style="height:${f ? Math.max(6, f * 100).toFixed(1) : 4}%;--i:${i}"></i>`;
    }).join('');
    const axis = hovered
      ? `<div class="in-axis is-hover"><span>${e(bucketTitle(hovered, s.unit))}</span><span class="grow"></span><b>${cost(hovered.cost)}</b><span>·</span><span>${tokens(hovered.tokens)} tokens</span><span>·</span><span>${hovered.replies === 1 ? '1 reply' : `${hovered.replies} replies`}</span></div>`
      : range === 'week'
        ? `<div class="in-axis is-days">${s.buckets.map((b, i) => `<span>${i === s.buckets.length - 1 ? 'Today' : b.start.toLocaleDateString(undefined, { weekday: 'short' })}</span>`).join('')}</div>`
        : `<div class="in-axis"><span>${s.start}</span><span class="grow"></span><span>${s.end}</span></div>`;
    const stat = (title, value, icon, info) => `<div class="in-stat"><small>${icon}${title}${info ? tip(info, title) : ''}</small><b>${value}</b></div>`;
    const top = projects.slice(0, 3).map(([name, share]) => `<div class="in-project">
        <div><span>${e(name)}</span><b>${cost(s.cost * share)}</b></div>
        <span class="ap-bar"><i style="width:${((share / projects[0][1]) * 100).toFixed(1)}%;background:rgba(217,119,87,.8)"></i></span></div>`).join('');
    const split = models[range].map(([name, share]) => `<i style="flex:${share} 0 4px;background:${modelTint[name]}"></i>`).join('');
    const legend = models[range].map(([name, share]) => `<div class="in-model"><i style="background:${modelTint[name]}"></i><span>${name}</span><b>${Math.round(share * 100)}%</b></div>`).join('');
    const perDay = range === 'day' ? '' : ` · ${cost(s.cost / s.count)}/day`;
    return `<section class="wg in" data-key="w-insights">
      <div class="wg-head"><span class="wg-title">${I.chart}Insights</span><span class="in-chips">${chips}</span></div>
      <div class="in-headline">
        <div><b class="in-cost">${cost(s.cost)}</b><small>at API prices${perDay}${tip('What these tokens would cost at Anthropic\'s API list prices, cache reads and writes included. On a Pro or Max plan you pay your subscription, not this. Worked out from Claude Code\'s transcripts in ~/.claude/projects.', 'cost')}</small></div>
        <div class="is-end"><b class="in-tokens">${tokens(s.tokens)}</b><small>tokens · ${Math.round(s.cached * 100)}% cached</small></div>
      </div>
      <div class="in-chart ${hovered ? 'is-hovering' : ''} ${Date.now() < ui.growUntil ? 'is-growing' : ''} is-${range}" data-in-chart
        role="img" aria-label="Busiest: ${e(bucketTitle(s.buckets.reduce((a, b) => (b.cost > a.cost ? b : a)), s.unit))}">${bars}</div>
      ${axis}
      <div class="in-stats">
        ${stat('Sessions', s.sessions, I.stack)}
        ${stat('Active', duration(s.active), I.timer, 'Time Claude was working: the gaps of up to five minutes between a session\'s prompts and replies, added up.')}
        ${stat('Prompts', s.prompts.toLocaleString('en-US'), I.bubble)}
        ${stat('Files', s.files, I.doc, 'Different files Claude edited or wrote (Edit, Write, MultiEdit, NotebookEdit).')}
      </div>
      <hr>
      <div class="in-breakdown">
        <div class="in-projects"><small class="in-label">Projects</small>${top}<small class="in-more">+ ${projects.length - 3} more</small></div>
        <div class="in-models"><small class="in-label">Models</small><div class="in-split">${split}</div>${legend}</div>
      </div>
    </section>`;
  }

  // MARK: Interaction

  function act(action, el) {
    if (action !== 'in-range') return false;
    ui.hover = null;
    S().set('insightsRange', el.dataset.range);
    return true;
  }

  /// Hovering the chart picks the bar under the pointer.
  function wire(root) {
    root.addEventListener('pointermove', (event) => {
      const chart = event.target.closest && event.target.closest('[data-in-chart]');
      if (!chart) return;
      const rect = chart.getBoundingClientRect();
      const count = chart.children.length;
      const index = Math.min(count - 1, Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * count)));
      if (index !== ui.hover) { ui.hover = index; NG.panel.rerender(); }
    });
    root.addEventListener('pointerout', (event) => {
      const chart = event.target.closest && event.target.closest('[data-in-chart]');
      if (!chart || chart.contains(event.relatedTarget)) return;
      ui.hover = null;
      NG.panel.rerender();
    });
  }

  NG.insights = {
    card,
    act,
    /// Called when the card opens: the bars grow in once.
    grow() { ui.growUntil = Date.now() + 900; ui.hover = null; },
    summary,
  };

  NG.initInsights = function () {
    if (NG.island) wire(NG.island.root);
  };
})();
