// The hover panel, recreated from the app: every session with its own
// buttons (usage, reply, open terminal, ✕), four widgets toggled from the
// header (Usage, Sessions, Tools, Resume), image drops, and quick settings.
//
// Sessions live here so the playground, the story and the hover all show the
// same thing. The panel re-renders in place each second; typed text, focus and
// open menus survive because they're kept in `ui`, not in the DOM.
(function () {
  'use strict';
  const NG = window.NG;
  const e = NG.escape;
  const S = () => NG.settings;
  const d = () => NG.demo;

  // MARK: Icons (SF Symbol look-alikes)

  const svg = (body, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  const I = {
    gauge: svg('<path d="M4.5 16.5a8 8 0 1 1 15 0"/><path d="M12 13l3.5-4"/><circle cx="12" cy="13.5" r="1.2" fill="currentColor"/>'),
    cpu: svg('<rect x="5.5" y="5.5" width="13" height="13" rx="2.5"/><rect x="9.5" y="9.5" width="5" height="5" rx=".8" fill="currentColor" stroke="none"/><path d="M10 2.8v2.7M14 2.8v2.7M10 18.5v2.7M14 18.5v2.7M2.8 10h2.7M2.8 14h2.7M18.5 10h2.7M18.5 14h2.7"/>'),
    hammer: svg('<path d="M13.5 6.5l4 4M4 20l9.2-9.2"/><path d="M11 4.5c2.6-1.4 5.6-1 7.6 1l1.9 1.9-2.4 2.4-1.9-1.9-2.3 2.3-3.3-3.3z"/>'),
    resume: svg('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4v4h4"/><path d="M12 8v4.5l3 1.8"/>'),
    wave: svg('<path d="M4 10v4M7.5 7v10M11 4v16M14.5 7.5v9M18 10v4M21 11.5v1"/>'),
    bolt: svg('<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z" fill="currentColor" stroke="none"/>'),
    bubble: svg('<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16h-8l-4 3.5V16H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 5z"/><path d="M8 9.5h8M8 12.5h5"/>'),
    clock: svg('<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>'),
    chevron: svg('<path d="M7 10l5 5 5-5"/>', 'is-chevron'),
    open: svg('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M10 14l5-5M10.5 9H15v4.5"/>'),
    close: svg('<path d="M7 7l10 10M17 7L7 17"/>'),
    terminal: svg('<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M7.5 10l2.5 2-2.5 2M12 14.5h4"/>'),
    edit: svg('<path d="M15 5l4 4L9 19H5v-4z"/>'),
    read: svg('<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z"/><path d="M14 3.5V8h4M9.5 12h5M9.5 15h5"/>'),
    search: svg('<circle cx="10.5" cy="10.5" r="5.5"/><path d="M15 15l4.5 4.5"/>'),
    globe: svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"/>'),
    agents: svg('<circle cx="9" cy="9" r="3"/><circle cx="16.5" cy="10" r="2.5"/><path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5M14.5 15c2.6-.4 4.8.8 5.5 3.5"/>'),
    mcp: svg('<path d="M9 4.5h4v2a1.5 1.5 0 0 0 3 0v-2h3.5V9h-2a1.5 1.5 0 0 0 0 3h2v7.5H15v-2a1.5 1.5 0 0 0-3 0v2H4.5V9h2a1.5 1.5 0 0 0 0-3h-2V4.5z"/>'),
    other: svg('<path d="M14 6a4 4 0 0 0 5 5l-8 8a2 2 0 0 1-3-3z"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    folder: svg('<path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4.5l2 2H19a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/>'),
    branch: svg('<circle cx="7" cy="5.5" r="2"/><circle cx="7" cy="18.5" r="2"/><circle cx="17" cy="7.5" r="2"/><path d="M7 7.5v9M17 9.5c0 4-10 2.5-10 7"/>'),
    sparkle: svg('<path d="M12 3.5c.6 4.6 3.9 7.9 8.5 8.5-4.6.6-7.9 3.9-8.5 8.5-.6-4.6-3.9-7.9-8.5-8.5 4.6-.6 7.9-3.9 8.5-8.5z" fill="currentColor" stroke="none"/>'),
    play: svg('<path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none"/>'),
    check: svg('<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="M8 12.2l2.7 2.6L16 9.5" stroke="#000" stroke-width="2.2"/>'),
    photo: svg('<rect x="3.5" y="6" width="14" height="12" rx="2"/><path d="M6.5 3.5h12a2 2 0 0 1 2 2v9"/><path d="M3.5 15l4-3.5 3 2.5 2.5-2 4 3.5"/>'),
    warning: svg('<path d="M12 4l9 15.5H3z" fill="currentColor" stroke="none"/><path d="M12 10v4M12 16.5v.5" stroke="#000" stroke-width="2"/>'),
    question: svg('<rect x="4" y="4.5" width="16" height="13" rx="3"/><path d="M9.8 9.2a2.3 2.3 0 1 1 3.2 2.1c-.6.3-1 .8-1 1.4M12 15v.3"/><path d="M9 17.5l3 2.5 3-2.5"/>'),
  };

  // MARK: Tools

  const categories = {
    run: { title: 'Bash', icon: I.terminal, tint: '#d97757' },
    edit: { title: 'Edit', icon: I.edit, tint: '#6cc49a' },
    read: { title: 'Read', icon: I.read, tint: '#6fa8dc' },
    search: { title: 'Search', icon: I.search, tint: '#e9b45a' },
    web: { title: 'Web', icon: I.globe, tint: '#a48be0' },
    agent: { title: 'Agents', icon: I.agents, tint: '#e08bb5' },
    mcp: { title: 'MCP', icon: I.mcp, tint: '#5fc4c4' },
    other: { title: 'Other', icon: I.other, tint: 'rgba(245,243,236,.4)' },
  };
  const order = Object.keys(categories);

  /// Same mapping as the app's ToolUsage.Category.
  function category(tool) {
    if (['Bash', 'BashOutput', 'KillShell'].includes(tool)) return 'run';
    if (['Edit', 'MultiEdit', 'Write', 'NotebookEdit'].includes(tool)) return 'edit';
    if (['Read', 'NotebookRead'].includes(tool)) return 'read';
    if (['Grep', 'Glob', 'LS', 'ToolSearch'].includes(tool)) return 'search';
    if (['WebFetch', 'WebSearch'].includes(tool)) return 'web';
    if (['Agent', 'Task'].includes(tool)) return 'agent';
    if (tool.startsWith('mcp__')) return 'mcp';
    return 'other';
  }

  /// Spreads a session's calls over the last hour in bursts, like a real session.
  function seedCalls(spec, now) {
    const calls = [];
    let step = 0;
    spec.forEach(([tool, count]) => {
      for (let i = 0; i < count; i++) {
        const minutesAgo = step % 3 === 0 ? 28 + (step % 6) : step % 15;
        calls.push({ cat: category(tool), at: now - (minutesAgo * 60 + 5) * 1000 });
        step++;
      }
    });
    return calls;
  }

  function ranked(calls) {
    const counts = {};
    calls.forEach((c) => (counts[c.cat] = (counts[c.cat] || 0) + 1));
    return order.filter((k) => counts[k]).map((k) => ({ cat: k, count: counts[k] })).sort((a, b) => b.count - a.count);
  }

  /// Calls in each 2-minute span of the last hour, oldest first.
  function timeline(calls, now) {
    const cells = new Array(30).fill(0);
    calls.forEach((c) => {
      const age = Math.floor((now - c.at) / 120000);
      if (age >= 0 && age < 30) cells[29 - age]++;
    });
    return cells;
  }

  // MARK: State

  const state = {
    sessions: [],
    past: [],
    usage: null,
    dismissed: new Set(),
  };
  /// View state: survives every re-render.
  const ui = {
    composer: null,
    usageOpen: new Set(),
    toolFilter: null,
    text: {},
    images: {},
    dragging: false,
    dropTarget: null,
    folder: null,      // null: latest project · 'home' · a project name
    folderMenu: false,
    launching: null,
  };

  function load() {
    const t = Date.now();
    state.sessions = d().sessions.map((s) => ({
      files: { added: 0, modified: 0, deleted: 0, linesAdded: 0, linesRemoved: 0 },
      ...JSON.parse(JSON.stringify(s)),
      calls: seedCalls(s.calls || [], t),
      // To-do progress is paced from page load: one item every 25 seconds.
      ...(s.tasks ? { tasks: { ...s.tasks, from: t, base: s.tasks.done } } : {}),
    }));
    state.past = d().pastSessions.map((p) => ({ ...p, at: t - p.ago }));
    const u = d().usage;
    state.usage = {
      fiveHour: { percent: u.fiveHour.percent, resetsAt: t + u.fiveHour.resetsIn },
      weekly: { percent: u.weekly.percent, resetsAt: t + u.weekly.resetsIn },
      updatedAt: t - u.updatedAgo,
    };
  }
  load();

  const find = (id) => state.sessions.find((s) => s.id === id);
  const visible = () => state.sessions.filter((s) => !state.dismissed.has(s.id)).slice(0, 4);
  const isWorking = (s) => s.state === 'working';
  const canDismiss = (s) => s.state === 'idle' || s.state === 'done';

  // MARK: Formatting

  function elapsed(s, t) {
    if (!s.started) return '';
    const end = s.ended || (isWorking(s) ? t : null);
    return end ? NG.formatElapsed((end - s.started) / 1000) : '';
  }

  const money = (v) => (v == null ? '—' : `$${v.toFixed(2)}`);
  const tokens = (n) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1000)}K`);
  const tint = (p) => (p >= 90 ? 'var(--danger)' : p >= 75 ? 'var(--warning)' : 'var(--clay)');

  function updatedPhrase(at, t) {
    const m = Math.floor((t - at) / 60000);
    return m < 1 ? 'Updated just now' : m < 60 ? `Updated ${m}m ago` : `Updated ${Math.floor(m / 60)}h ago`;
  }

  function agePhrase(at, t) {
    const m = Math.floor((t - at) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m / 60)}h ago`;
    return `${Math.floor(m / 1440)}d ago`;
  }

  function resetPhrase(at, t, weekly) {
    if (weekly) {
      const when = new Date(at);
      return `Resets ${when.toLocaleDateString(undefined, { weekday: 'short' })}, ${when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
    }
    const m = Math.max(0, Math.round((at - t) / 60000));
    return `Resets in ${Math.floor(m / 60)}h ${m % 60}m`;
  }

  function filesSummary(f) {
    const parts = [];
    if (f.added) parts.push(`${f.added} added`);
    if (f.modified) parts.push(`${f.modified} changed`);
    if (f.deleted) parts.push(`${f.deleted} deleted`);
    return `${parts.join(', ')} · +${f.linesAdded} −${f.linesRemoved} lines`;
  }

  const bar = (fraction, color) =>
    `<span class="ap-bar"><i style="width:max(5px, ${Math.min(fraction, 1) * 100}%);background:${color}"></i></span>`;

  // MARK: Widgets

  function usageCard(t) {
    const u = state.usage;
    const gauge = (title, g, weekly) => {
      const p = Math.round(g.percent);
      const color = tint(p);
      return `<div class="ap-gauge">
        <div class="ap-gauge-top"><span>${title}</span><b style="${p >= 75 ? `color:${color}` : ''}">${p}%</b></div>
        ${bar(g.percent / 100, color)}
        <small>${resetPhrase(g.resetsAt, t, weekly)}</small></div>`;
    };
    return `<section class="wg">
      <div class="wg-head"><span class="wg-title">${I.gauge}Usage</span><span class="wg-meta">${updatedPhrase(u.updatedAt, t)}</span></div>
      <div class="ap-gauges">${gauge('5-hour limit', u.fiveHour)}${gauge('Weekly limit', u.weekly, true)}</div>
    </section>`;
  }

  function details(snap) {
    const p = Math.round(snap.context);
    return `<div class="ap-details">
      <div class="ap-chips"><span class="ap-chip">${I.sparkle}${e(snap.model)}</span>${snap.branch ? `<span class="ap-chip" title="${e(snap.branch)}">${I.branch}${e(snap.branch)}</span>` : ''}</div>
      <div class="ap-gauge-top"><span>Context</span><b style="${p >= 75 ? `color:${tint(p)}` : ''}">${p}%</b><small>of ${tokens(snap.size)}</small></div>
      ${bar(snap.context / 100, tint(snap.context))}
      <div class="ap-gauge-top"><span>Cost</span><b>${money(snap.cost)}</b></div>
    </div>`;
  }

  function sessionsCard(t) {
    const entries = visible().filter((s) => s.snap);
    const title = entries.length === 0 ? 'Session' : entries.length === 1 ? `Session · ${e(entries[0].project)}` : 'Sessions';
    const newest = Math.max(...entries.map((s) => s.snap.updatedAt || t - 40000), 0);
    let body;
    if (!entries.length) body = '<p class="wg-empty">Appears after Claude Code\'s next reply.</p>';
    else if (entries.length === 1) body = details(entries[0].snap);
    else {
      const lines = entries.map((s) => `<div class="ap-line" title="${e(s.project)} on ${e(s.snap.branch || '')}">
        <b>${e(s.project)}</b><small>${e(s.snap.model)}</small><span class="grow"></span>
        <span class="ap-mini">${bar(s.snap.context / 100, tint(s.snap.context))}</span>
        <span class="ap-num">${Math.round(s.snap.context)}%</span><span class="ap-num is-strong">${money(s.snap.cost)}</span></div>`).join('');
      const total = entries.reduce((sum, s) => sum + s.snap.cost, 0);
      body = `<div class="ap-lines">${lines}</div><hr><div class="ap-gauge-top"><span>Total cost</span><b>${money(total)}</b></div>`;
    }
    return `<section class="wg">
      <div class="wg-head"><span class="wg-title">${I.cpu}${title}</span>${entries.length ? `<span class="wg-meta">${updatedPhrase(newest, t)}</span>` : ''}</div>
      ${body}</section>`;
  }

  function toolsCard(t) {
    const entries = visible();
    const selected = entries.find((s) => s.id === ui.toolFilter);
    const shown = entries.length === 1 ? entries : selected ? [selected] : entries;
    const calls = shown.flatMap((s) => s.calls);
    const title = entries.length === 1 ? `Tools · ${e(entries[0].project)}` : selected ? `Tools · ${e(selected.project)}` : 'Tools';
    const chip = (label, id) => `<button type="button" class="ap-filter" data-action="tools-filter" data-id="${id || ''}" aria-pressed="${(selected ? selected.id : '') === (id || '')}">${e(label)}</button>`;
    let body;
    if (!calls.length) {
      body = `<p class="wg-empty">${entries.length ? 'No tools called yet this session.' : 'Appears once Claude Code runs a tool.'}</p>`;
    } else {
      const items = ranked(calls);
      const split = items.map((x) => `<i style="flex:${x.count} 0 6px;background:${categories[x.cat].tint}"></i>`).join('');
      const legend = items.map((x) => `<div class="ap-legend-item"><i style="background:${categories[x.cat].tint}"></i>${categories[x.cat].icon}<span>${categories[x.cat].title}</span><b>${x.count}</b></div>`).join('');
      const cells = timeline(calls, t);
      const peak = Math.max(...cells, 1);
      const heat = cells.map((c) => `<i style="${c ? `background:rgba(217,119,87,${(0.25 + 0.75 * c / peak).toFixed(2)})` : ''}"></i>`).join('');
      body = `<div class="ap-split">${split}</div><div class="ap-legend">${legend}</div>
        <div class="ap-heat" title="${cells.reduce((a, b) => a + b, 0)} tool calls in the last hour">${heat}</div>
        <div class="ap-heat-axis"><span>1 hour ago</span><span>Now</span></div>`;
    }
    return `<section class="wg">
      <div class="wg-head"><span class="wg-title">${I.hammer}${title}</span>${calls.length ? `<span class="wg-meta">${calls.length} calls</span>` : ''}</div>
      ${entries.length > 1 ? `<div class="ap-filters">${chip('All', null)}${entries.map((s) => chip(s.project, s.id)).join('')}</div>` : ''}
      ${body}</section>`;
  }

  function resumeCard(t) {
    const rows = state.past.slice(0, visible().length ? 1 : 3).map((p, i) => {
      const meta = `${e(p.project)}${p.branch ? ` · <span class="ap-branch">${I.branch}${e(p.branch)}</span>` : ''} · ${agePhrase(p.at, t)}`;
      const action = p.missing
        ? `<span class="ap-missing" title="~/${e(p.project)} was moved or deleted, so this session can't be resumed.">${I.folder}Folder missing</span>`
        : `<button type="button" class="ap-resume ${i === 0 ? 'is-latest' : ''}" data-action="resume" data-id="${p.id}" ${ui.launching ? 'disabled' : ''}>${ui.launching === p.id ? '<span class="ap-spin"></span>' : I.play}Resume</button>`;
      return `<div class="ap-past ${p.missing ? 'is-missing' : ''}"><div><b>${e(p.title)}</b><small>${meta}</small></div>${action}</div>`;
    }).join('');
    const target = folderName();
    const projects = d().recentProjects.map((name) => `<button type="button" data-action="folder" data-folder="${e(name)}">${e(name)}</button>`).join('');
    return `<section class="wg">
      <div class="wg-head"><span class="wg-title">${I.resume}Resume</span></div>
      ${rows || '<p class="wg-empty">No earlier sessions to resume.</p>'}
      <hr>
      <div class="ap-new">
        <button type="button" class="ap-new-button" data-action="new-session" ${ui.launching ? 'disabled' : ''} title="Opens Terminal and starts Claude Code in ${e(target)}">${ui.launching === 'new' ? '<span class="ap-spin"></span>' : I.plus}New session</button>
        <span class="wg-meta">in</span>
        <span class="ap-folder-wrap">
          <button type="button" class="ap-folder" data-action="folder-menu" aria-expanded="${ui.folderMenu}">${I.folder}${e(target)}${I.chevron}</button>
        </span>
      </div>
      ${ui.folderMenu ? `<div class="ap-menu" role="menu"><small>Recent projects</small>${projects}<button type="button" data-action="folder" data-folder="home">Home folder</button><hr><button type="button" data-action="choose-folder">Choose Folder…</button></div>` : ''}
    </section>`;
  }

  function folderName() {
    if (ui.folder === 'home') return 'Home';
    return ui.folder || (state.past.find((p) => !p.missing) || { project: 'checkout-api' }).project;
  }

  // MARK: Sessions

  function indicator(s) {
    if (s.state === 'working') return '<span class="ap-phase is-working"></span>';
    if (s.state === 'waiting') return '<span class="ap-phase is-waiting"></span>';
    if (s.state === 'done') return `<span class="ap-phase is-done">${I.check}</span>`;
    return '<span class="ap-phase is-idle"></span>';
  }

  function row(s, t) {
    const f = s.files;
    const badge = f.added + f.modified + f.deleted
      ? `<span class="ap-files" title="${e(filesSummary(f))}">${f.added ? `<i class="is-add">+${f.added}</i>` : ''}${f.modified ? `<i class="is-mod">~${f.modified}</i>` : ''}${f.deleted ? `<i class="is-del">−${f.deleted}</i>` : ''}</span>`
      : '';
    const usageOpen = ui.usageOpen.has(s.id);
    const composerOpen = ui.composer === s.id;
    const drop = ui.dragging ? (ui.dropTarget === s.id || (visible().length === 1) ? 'is-drop-target' : 'is-drop-available') : '';
    const status = drop === 'is-drop-target'
      ? `<div class="ap-status is-drop">${I.photo}Drop to attach to this session's next prompt</div>`
      : `<div class="ap-status ${s.state === 'waiting' ? 'is-waiting' : s.state === 'done' || s.state === 'idle' ? 'is-quiet' : ''}">
          ${isWorking(s) ? (I[s.symbol] || I.terminal) : ''}<span>${e(s.status)}</span>${s.steps ? `<small>${s.steps} steps</small>` : ''}</div>`;
    const tasks = s.tasks && isWorking(s)
      ? `<div class="progress"><i style="width:${Math.round((s.tasks.done / s.tasks.total) * 100)}%"></i></div>
         <div class="progress-label">${s.tasks.done} of ${s.tasks.total}${s.tasks.titles ? ` · ${e(s.tasks.titles[Math.min(s.tasks.done, s.tasks.total - 1)])}` : ''}</div>`
      : '';
    const images = ui.images[s.id] || [];
    const text = ui.text[s.id] || '';
    const composer = composerOpen
      ? `<form class="ap-composer" data-composer data-id="${s.id}">
          ${images.length ? `<div class="ap-thumbs">${images.map((img, i) => `<span class="ap-thumb"><img src="${img.url}" alt="${e(img.name)}"><button type="button" data-action="remove-image" data-id="${s.id}" data-index="${i}" aria-label="Remove ${e(img.name)}">${I.close}</button></span>`).join('')}</div>` : ''}
          <div class="ap-compose-row">
            <input type="text" data-field="${s.id}" value="${e(text)}" placeholder="Message Claude in ${e(s.project)}…" aria-label="Message Claude in ${e(s.project)}" maxlength="160">
            <button class="send" type="submit" aria-label="Send" ${text.trim() || images.length ? '' : 'disabled'}>↑</button>
          </div>
          <small class="note">Types into ${e(s.project)}'s terminal and presses Return. Paste an image with ⌘V.</small>
        </form>`
      : '';
    const usage = S().get('sessionWidget')
      ? `<button type="button" class="ap-icon" data-action="row-usage" data-id="${s.id}" aria-pressed="${usageOpen}" title="Show this session's usage">${I.cpu}</button>`
      : '';
    return `<div class="ap-row ${composerOpen ? 'is-composing' : ''} ${drop}" data-session="${s.id}">
      <div class="ap-row-top">
        ${indicator(s)}<b class="ap-name">${e(s.project)}</b><span class="grow"></span>${badge}
        <span class="ap-time" data-elapsed="${s.id}">${elapsed(s, t)}</span>
        ${usage}
        <button type="button" class="ap-reply" data-action="reply" data-id="${s.id}" aria-expanded="${composerOpen}" title="Send this project a prompt">${s.queued ? I.clock : I.bubble}${I.chevron}</button>
        <button type="button" class="ap-icon" data-action="open-terminal" data-id="${s.id}" title="Open this session's terminal">${I.open}</button>
        <button type="button" class="ap-icon ap-dismiss" data-action="dismiss" data-id="${s.id}" ${canDismiss(s) ? '' : 'disabled'}
          title="${canDismiss(s) ? 'Remove from NotchGate. The session comes back when you prompt it.' : 'Can be removed once Claude stops'}">${I.close}</button>
      </div>
      ${status}${tasks}
      ${s.prompt ? `<div class="ap-prompt">“${e(s.prompt)}”</div>` : ''}
      ${usageOpen ? `<div class="ap-usage">${s.snap ? details(s.snap) : '<p class="wg-empty">Appears after this session\'s next reply.</p>'}</div>` : ''}
      ${composer}
    </div>`;
  }

  function quickSettings() {
    const mode = S().get('questionMode');
    const notes = { notch: 'Answer Claude\'s questions from the notch.', terminal: 'Questions appear only in the terminal.', off: 'Claude decides for itself.' };
    const seg = (m, label) => `<button type="button" data-action="qs-mode" data-mode="${m}" aria-pressed="${mode === m}">${label}</button>`;
    return `<section class="wg ap-qs">
      <div class="wg-head"><span class="wg-title is-plain">Quick settings</span><button type="button" class="ap-icon" data-action="qs-close" title="Hide quick settings (they stay in the ✦ menu)">${I.close}</button></div>
      <div class="ap-qs-row">${I.bolt}<span><b>Auto-allow permissions</b><small>Risky commands still ask</small></span>
        <button type="button" class="ap-switch" role="switch" data-action="qs-autoallow" aria-checked="${S().get('autoAllow')}" aria-label="Auto-allow permissions"></button></div>
      <div class="ap-qs-row">${I.question}<span><b>Claude's questions</b><small>${notes[mode]}</small></span></div>
      <div class="ap-seg">${seg('notch', 'Notch')}${seg('terminal', 'Terminal')}${seg('off', 'Don\'t ask')}</div>
    </section>`;
  }

  function header() {
    const count = state.sessions.filter((s) => !state.dismissed.has(s.id)).length;
    const live = state.sessions.some((s) => !state.dismissed.has(s.id) && isWorking(s));
    const toggle = (widget, card, icon, name) => S().get(widget)
      ? `<button type="button" class="ap-toggle" data-action="card" data-card="${card}" aria-pressed="${S().get(card)}" title="${S().get(card) ? 'Hide' : 'Show'} ${name}">${icon}</button>`
      : '';
    return `<div class="ap-head">
      <span class="ap-live">${I.wave}${live ? 'Live' : 'Activity'}</span>
      ${S().get('autoAllow') ? `<span class="ap-auto">${I.bolt}Auto-allow</span>` : ''}
      <span class="grow"></span>
      ${count ? `<span class="ap-count">${count === 1 ? '1 session' : `${count} sessions`}</span>` : ''}
      ${toggle('usageWidget', 'usageCardShown', I.gauge, 'usage')}
      ${toggle('sessionWidget', 'sessionCardShown', I.cpu, 'sessions')}
      ${toggle('toolsWidget', 'toolsCardShown', I.hammer, 'tool activity')}
      ${toggle('resumeWidget', 'resumeCardShown', I.resume, 'resume')}
    </div>`;
  }

  function html(compact) {
    const t = Date.now();
    const sessions = visible();
    const on = (widget, card) => S().get(widget) && S().get(card);
    const resumeShown = on('resumeWidget', 'resumeCardShown');
    const hint = ui.dragging && sessions.length
      ? `<div class="ap-drop-hint">${I.photo}${sessions.length === 1 ? `Drop to attach to ${e(sessions[0].project)}` : 'Drop on a project to attach the image'}</div>`
      : '';
    const list = sessions.length
      ? `<div class="ap-rows">${sessions.map((s) => row(s, t)).join('')}</div>`
      : `<div class="ap-empty"><div class="card-title">Nothing running</div><div class="card-sub">Start Claude Code in any terminal and its progress shows up here.</div>
          ${resumeShown ? '' : `<button type="button" class="pill is-primary" data-action="new-session">${I.terminal}Open Claude Code</button>`}</div>`;
    return `<div class="ap ${compact ? 'is-compact' : ''}">${header()}
      ${on('usageWidget', 'usageCardShown') ? usageCard(t) : ''}
      ${on('sessionWidget', 'sessionCardShown') ? sessionsCard(t) : ''}
      ${on('toolsWidget', 'toolsCardShown') ? toolsCard(t) : ''}
      ${resumeShown ? resumeCard(t) : ''}
      ${hint}${list}
      ${S().get('quickSettings') && !compact ? quickSettings() : ''}
    </div>`;
  }

  /// `compact`: the story's version, shorter so it covers less of the page.
  function card(compact) {
    const live = state.sessions.some((s) => !state.dismissed.has(s.id) && isWorking(s));
    return { title: 'Claude', live, html: html(compact) };
  }

  // MARK: Rendering in place

  const showing = () => NG.island && NG.island.view && NG.island.view.isPanel && NG.island.root.dataset.state === 'open';
  const signature = (markup) => markup.replace(/(data-elapsed="[^"]*">)[^<]*/g, '$1');

  /// Re-renders the open panel, keeping focus and the caret in the prompt box.
  function rerender() {
    if (!showing()) return;
    const island = NG.island;
    const next = card(island.view.compact);
    if (signature(next.html) === signature(island.currentHTML)) {
      // Only the clocks moved.
      NG.$$('[data-elapsed]', island.body).forEach((el) => {
        const s = find(el.dataset.elapsed);
        if (s) el.textContent = elapsed(s, Date.now());
      });
      island.currentHTML = next.html;
      return;
    }
    const active = document.activeElement;
    const field = active && island.root.contains(active) && active.dataset.field;
    const caret = field ? [active.selectionStart, active.selectionEnd] : null;
    const scroll = island.body.scrollTop;
    island.refresh(next);
    island.body.scrollTop = scroll;
    if (field) {
      const input = NG.$(`[data-field="${field}"]`, island.body);
      if (input) { input.focus({ preventScroll: true }); input.setSelectionRange(...caret); }
    }
  }

  // MARK: Actions

  function handle(action, detail = {}) {
    const el = detail.target;
    const id = el && el.dataset.id;
    const s = id && find(id);
    switch (action) {
      case 'card': S().set(el.dataset.card, !S().get(el.dataset.card)); break;
      case 'tools-filter': ui.toolFilter = id || null; break;
      case 'row-usage': ui.usageOpen.has(id) ? ui.usageOpen.delete(id) : ui.usageOpen.add(id); break;
      case 'reply':
        ui.composer = ui.composer === id ? null : id;
        rerender();
        if (ui.composer) NG.$(`[data-field="${id}"]`, NG.island.body)?.focus({ preventScroll: true });
        return;
      case 'open-terminal':
        if (s && s.id === 'api' && NG.$('#try')) { NG.$('#try').scrollIntoView({ behavior: 'smooth' }); NG.toast('checkout-api\'s terminal, brought to the front'); }
        else NG.toast(`Brings ${s ? s.project : 'its'} terminal window to the front`);
        return;
      case 'dismiss':
        if (!s || !canDismiss(s)) return;
        state.dismissed.add(id);
        ui.usageOpen.delete(id);
        if (ui.composer === id) ui.composer = null;
        NG.toast(`Removed ${s.project}. Claude keeps running; prompt it to bring it back`);
        break;
      case 'remove-image':
        (ui.images[id] || []).splice(Number(el.dataset.index), 1);
        break;
      case 'send': return send(detail.form.dataset.id, detail.value);
      case 'resume': return resume(id);
      case 'new-session': return startNew();
      case 'folder-menu': ui.folderMenu = !ui.folderMenu; break;
      case 'folder': ui.folder = el.dataset.folder; ui.folderMenu = false; break;
      case 'choose-folder': ui.folderMenu = false; NG.toast('Opens a folder picker on your Mac'); break;
      case 'qs-close': S().set('quickSettings', false); NG.toast('Quick settings hidden. They stay in the ✦ menu'); break;
      case 'qs-autoallow': S().set('autoAllow', !S().get('autoAllow')); break;
      case 'qs-mode': S().set('questionMode', el.dataset.mode); break;
      default: return;
    }
    rerender();
  }

  function send(id, value) {
    const s = find(id);
    if (!s) return;
    const images = ui.images[id] || [];
    const text = (value || '').trim();
    if (!text && !images.length) return;
    const prompt = text || (images.length === 1 ? '[Image #1]' : `[${images.length} images]`);
    ui.text[id] = '';
    ui.images[id] = [];
    ui.composer = null;
    state.dismissed.delete(id);
    NG.toast(images.length ? `Typed into ${s.project} with ${images.length} image${images.length > 1 ? 's' : ''}` : `Typed into ${s.project}'s terminal`);
    if (id === 'api' && NG.playground) NG.playground.prompt(prompt);
    else simulateTurn(s, prompt);
    rerender();
  }

  /// A background session answering a prompt sent from the panel.
  async function simulateTurn(s, prompt) {
    Object.assign(s, { state: 'working', status: 'Thinking…', symbol: 'terminal', prompt, started: Date.now(), ended: null, tasks: null });
    rerender();
    await NG.sleep(1600);
    s.status = 'Reading the project';
    s.symbol = 'read';
    record(s.id, 'Read');
    rerender();
    await NG.sleep(1800);
    s.status = 'Editing files';
    s.symbol = 'edit';
    record(s.id, 'Edit');
    recordFile(s.id, 'modified', 6, 2);
    rerender();
    await NG.sleep(1800);
    const replies = d().sessionReplies;
    Object.assign(s, { state: 'done', status: replies[Math.floor(Math.random() * replies.length)], ended: Date.now() });
    rerender();
  }

  async function resume(id) {
    const past = state.past.find((p) => p.id === id);
    if (!past || ui.launching) return;
    ui.launching = id;
    rerender();
    await NG.sleep(900);
    ui.launching = null;
    state.past = state.past.filter((p) => p !== past);
    addSession(past.project, { prompt: past.title, snap: { model: 'Opus', context: 34, size: 200000, cost: 1.12, branch: past.branch || null } });
    NG.toast(`Opened Terminal: claude --resume in ${past.project}`);
    rerender();
  }

  async function startNew() {
    if (ui.launching) return;
    const name = folderName();
    ui.launching = 'new';
    rerender();
    await NG.sleep(900);
    ui.launching = null;
    addSession(name === 'Home' ? '~' : name, {});
    NG.toast(`Opened Terminal and started Claude Code in ${name}`);
    rerender();
  }

  function addSession(project, extra) {
    const t = Date.now();
    state.sessions.unshift({
      id: `s${t}`, project, state: 'idle', status: 'Ready for your next message', steps: 0, started: null,
      files: { added: 0, modified: 0, deleted: 0, linesAdded: 0, linesRemoved: 0 }, calls: [], snap: null, ...extra,
    });
  }

  // MARK: Updates from the playground and the simulation

  function update(id, patch) {
    const s = find(id);
    if (!s) return;
    Object.assign(s, patch);
    if (patch.state === 'working') state.dismissed.delete(id);
    rerender();
  }

  /// A tool call: counts toward the Tools widget, the step count, cost and limits.
  function record(id, tool) {
    const s = find(id);
    if (!s) return;
    s.calls.push({ cat: category(tool), at: Date.now() });
    s.steps = (s.steps || 0) + 1;
    if (s.snap) {
      s.snap.cost += 0.04 + Math.random() * 0.05;
      s.snap.context = Math.min(99, s.snap.context + 0.8);
      s.snap.updatedAt = Date.now();
    }
    state.usage.fiveHour.percent = Math.min(100, state.usage.fiveHour.percent + 0.3);
    state.usage.weekly.percent = Math.min(100, state.usage.weekly.percent + 0.05);
    state.usage.updatedAt = Date.now();
  }

  function recordFile(id, kind, added = 0, removed = 0) {
    const s = find(id);
    if (!s) return;
    s.files[kind]++;
    s.files.linesAdded += added;
    s.files.linesRemoved += removed;
  }

  /// dashboard works through its to-do list on its own.
  let lastSimCall = 0;
  function simulate(t) {
    const s = find('web');
    if (!s || !isWorking(s) || !s.tasks || s.status === 'Thinking…') return;
    const done = Math.min(s.tasks.total, s.tasks.base + Math.floor((t - s.tasks.from) / 25000));
    if (s.tasks.titles && done !== s.tasks.done) {
      s.tasks.done = done;
      s.status = s.tasks.titles[Math.min(done, s.tasks.total - 1)];
      if (done > 2) recordFile('web', 'modified', 9, 4);
    }
    if (t - lastSimCall > 6000) {
      lastSimCall = t;
      record('web', ['Read', 'Edit', 'Bash', 'Grep'][Math.floor(Math.random() * 4)]);
    }
    if (done === s.tasks.total) Object.assign(s, { state: 'done', status: s.finalMessage, ended: t, tasks: null });
  }

  // MARK: Images

  const MAX_IMAGES = 5;

  function attach(id, files) {
    const list = (ui.images[id] = ui.images[id] || []);
    files.slice(0, MAX_IMAGES - list.length).forEach((f) => list.push(f));
    ui.composer = id;
    state.dismissed.delete(id);
  }

  /// A stand-in screenshot for visitors without an image to hand (and for touch).
  function sampleImage() {
    const shot = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0a35e"/><stop offset="1" stop-color="#e5675b"/></linearGradient></defs><rect width="160" height="100" fill="url(#g)"/><rect x="14" y="22" width="90" height="11" rx="4" fill="#fff" opacity=".9"/><rect x="14" y="42" width="128" height="7" rx="3" fill="#fff" opacity=".7"/><rect x="14" y="56" width="110" height="7" rx="3" fill="#fff" opacity=".7"/><rect x="14" y="74" width="44" height="12" rx="6" fill="#fff" opacity=".9"/></svg>`;
    return { url: `data:image/svg+xml,${encodeURIComponent(shot)}`, name: 'Screenshot.png' };
  }

  const isImageDrag = (event) => {
    const types = Array.from((event.dataTransfer && event.dataTransfer.types) || []);
    return types.includes('Files') || types.includes('application/x-notchgate-sample');
  };

  function setDragging(on) {
    if (ui.dragging === on) return;
    ui.dragging = on;
    ui.dropTarget = null;
    if (on && !showing()) NG.island.setHovering(true);
    rerender();
  }

  function wireImages(root) {
    let leaveTimer;
    root.addEventListener('dragenter', (event) => {
      if (!isImageDrag(event)) return;
      clearTimeout(leaveTimer);
      setDragging(true);
    });
    root.addEventListener('dragover', (event) => {
      if (!isImageDrag(event)) return;
      event.preventDefault();
      clearTimeout(leaveTimer);
      const target = event.target.closest && event.target.closest('[data-session]');
      const id = target ? target.dataset.session : null;
      if (id !== ui.dropTarget) { ui.dropTarget = id; rerender(); }
    });
    root.addEventListener('dragleave', (event) => {
      if (root.contains(event.relatedTarget)) return;
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => setDragging(false), 200);
    });
    root.addEventListener('drop', (event) => {
      if (!isImageDrag(event)) return;
      event.preventDefault();
      const sessions = visible();
      const target = event.target.closest && event.target.closest('[data-session]');
      const id = target ? target.dataset.session : sessions.length === 1 ? sessions[0].id : null;
      ui.dragging = false;
      ui.dropTarget = null;
      if (!id) { rerender(); return NG.toast('Drop on a project to attach the image'); }
      const dropped = Array.from(event.dataTransfer.files || []).filter((f) => f.type.startsWith('image/'))
        .map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
      const images = dropped.length ? dropped : event.dataTransfer.types.includes('application/x-notchgate-sample') ? [sampleImage()] : [];
      if (!images.length) { rerender(); return NG.toast('Only images can be attached'); }
      attach(id, images);
      rerender();
      NG.$(`[data-field="${id}"]`, NG.island.body)?.focus({ preventScroll: true });
    });
    // A file dropped anywhere else shouldn't navigate away from the page.
    document.addEventListener('dragover', (event) => { if (isImageDrag(event)) event.preventDefault(); });
    document.addEventListener('drop', (event) => { if (isImageDrag(event) && !root.contains(event.target)) { event.preventDefault(); setDragging(false); } });

    root.addEventListener('paste', (event) => {
      const field = event.target.dataset && event.target.dataset.field;
      if (!field) return;
      const files = Array.from(event.clipboardData.files || []).filter((f) => f.type.startsWith('image/'));
      if (!files.length) return;
      event.preventDefault();
      attach(field, files.map((f) => ({ url: URL.createObjectURL(f), name: f.name || 'Pasted image.png' })));
      rerender();
    });
    // Typed text lives in `ui`, so a re-render never loses it.
    root.addEventListener('input', (event) => {
      const field = event.target.dataset && event.target.dataset.field;
      if (!field) return;
      ui.text[field] = event.target.value;
      const send = NG.$('.send', event.target.closest('form'));
      if (send) send.disabled = !event.target.value.trim() && !(ui.images[field] || []).length;
    });
    // A click anywhere else closes the folder menu.
    root.addEventListener('click', (event) => {
      if (ui.folderMenu && !event.target.closest('.ap-folder, .ap-menu')) { ui.folderMenu = false; rerender(); }
    });
  }

  // MARK: Public

  NG.panel = {
    /// What to hand the island: hover, story scenes and drops all use this.
    view: ({ compact = false } = {}) => ({ card: card(compact), compact, isActivity: true, isPanel: true, onAction: handle }),
    rerender,
    update,
    record,
    recordFile,
    find,
    /// Story "images" scene: attach the sample screenshot to a session.
    attachSample(id = 'api') { attach(id, [sampleImage()]); rerender(); },
    setDragging,
  };

  NG.initPanel = function () {
    if (!NG.island) return;
    wireImages(NG.island.root);
    S().subscribe(() => rerender());
    setInterval(() => {
      simulate(Date.now());
      rerender();
    }, 1000);
  };
})();
