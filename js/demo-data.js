// Dummy content for the demos. Nothing here talks to a real Claude.
(function () {
  'use strict';
  const NG = window.NG;

  NG.demo = {
    permission: {
      title: 'Run a command?',
      sub: 'Run the payment tests',
      command: 'npm test -- payments',
    },
    edit: {
      title: 'Edit client.ts?',
      sub: 'src/payments/client.ts',
      removed: ['const timeout = 30', 'retry(count: 1)'],
      added: ['const timeout = 120', 'retry(count: 3, backoff: "exponential")'],
    },
    question: {
      header: 'Storage',
      text: 'Which storage should the retry queue use?',
      options: [
        { label: 'SQLite', detail: 'Survives restarts' },
        { label: 'In-memory', detail: 'Fastest, lost on restart' },
      ],
    },
    plan: {
      title: 'Add offline sync',
      steps: ['Queue writes while offline', 'Retry with exponential backoff', 'Show sync status in settings', 'Cover conflicts with tests'],
    },
    done: {
      summary: 'Added retry with exponential backoff. All 13 tests pass.',
    },

    /// Sessions in the hover panel. checkout-api is the playground's session;
    /// the others run on their own. Tool calls are [tool, count] and get spread
    /// over the last hour; `snap` is what Claude Code's status line reports.
    sessions: [
      {
        id: 'api', project: 'checkout-api', state: 'idle', status: 'Ready for your next message',
        prompt: 'Add retry with backoff to the payment client', steps: 14,
        started: Date.now() - 900000, ended: Date.now() - 765000,
        files: { added: 2, modified: 3, deleted: 1, linesAdded: 246, linesRemoved: 21 },
        calls: [['Bash', 18], ['Read', 26], ['Edit', 14], ['Grep', 9], ['Write', 2], ['WebFetch', 3], ['Agent', 1]],
        snap: { model: 'Opus', context: 62.4, size: 200000, cost: 3.27, branch: 'feature/refund-webhooks' },
      },
      {
        id: 'web', project: 'dashboard', state: 'working', status: 'Updating chart options', symbol: 'edit',
        prompt: 'Upgrade the chart library', steps: 6, started: Date.now() - 96000,
        tasks: { done: 2, total: 5, titles: ['Read the chart configs', 'Bump the library', 'Updating chart options', 'Fixing the legends', 'Running the visual tests'] },
        finalMessage: 'Upgraded the chart library. 3 charts needed new options; visual tests pass.',
        calls: [['Read', 6], ['Bash', 2], ['mcp__github__get_issue', 2]],
        snap: { model: 'Sonnet', context: 91, size: 1000000, cost: 0.84, branch: 'main' },
      },
      {
        id: 'docs', project: 'handbook', state: 'done', status: 'Rewrote the onboarding guide and fixed 6 broken links.',
        prompt: 'Tidy up the onboarding guide', steps: 9, started: Date.now() - 420000, ended: Date.now() - 300000,
        files: { added: 0, modified: 6, deleted: 0, linesAdded: 24, linesRemoved: 18 },
        calls: [['Read', 7], ['Edit', 6], ['Grep', 3], ['WebFetch', 6]],
        snap: null,
      },
    ],

    /// The plan's limits, as the Usage widget shows them.
    usage: {
      fiveHour: { percent: 23.5, resetsIn: (2 * 60 + 14) * 60000 },
      weekly: { percent: 81.2, resetsIn: 3 * 86400000 },
      updatedAgo: 3 * 60000,
    },

    /// Earlier sessions the Resume widget offers. The last one's folder is gone.
    pastSessions: [
      { id: 'past-1', project: 'orders-service', title: 'Add pagination to the orders endpoint', branch: 'feature/orders-paging', ago: 25 * 60000 },
      { id: 'past-2', project: 'checkout-api', title: 'Fix flaky checkout tests', branch: 'main', ago: 5 * 3600000 },
      { id: 'past-3', project: 'onboarding', title: 'Prototype the onboarding flow', ago: 3 * 86400000, missing: true },
    ],
    recentProjects: ['orders-service', 'checkout-api', 'handbook'],

    /// Replies for prompts sent to the background sessions from the panel.
    sessionReplies: [
      'Done. I also updated the changelog.',
      'Fixed it, and the tests still pass.',
      'Updated. I left a note in the README.',
    ],

    /// What the water bot says, by mood (the same lines as the app).
    water: {
      cheerful: ['Drink water!', 'Sip time!', 'Hydration break!', 'Water o\'clock!'],
      excited: ['Yes! Grab a sip!', 'Ooh, you\'re here!', 'Let\'s hydrate!'],
      pleading: ['Pretty please?', 'Just one sip?', 'I carried this up here…'],
      thirsty: ['I\'m wilting here…', 'Brains are 75% water!', 'Even plants drink…'],
      delighted: ['Ahh, refreshing!', 'Hydrated!', 'Splash-tastic!'],
      sleepy: ['Zzz…'],
      tickled: ['Hehe, that tickles!', 'Boop! Now drink.', 'Hey! Water first!'],
    },

    /// Suggested prompts for the playground, each with its own wording.
    /// Anything a task leaves out falls back to the payments requests above.
    tasks: [
      { prompt: 'Add retry with backoff to payments', read: 'src/payments/client.ts', summary: 'Added retry with exponential backoff. All 13 tests pass.' },
      {
        prompt: 'Fix the flaky checkout test',
        read: 'tests/checkout.test.ts',
        summary: 'The test raced a timer. Fixed it with a fake clock; the suite is green.',
        permission: { title: 'Run a command?', sub: 'Run the checkout tests', command: 'npm test -- checkout' },
        ran: '8 passed, 1 failed: applies discount (timed out)',
        question: {
          header: 'Timers',
          text: 'How should the test control time?',
          options: [
            { label: 'Fake timers', detail: 'Deterministic, no real waiting' },
            { label: 'Longer timeout', detail: 'Quick fix, may still flake' },
          ],
        },
        askStep: 'Pick a fix',
        edit: {
          title: 'Edit checkout.test.ts?',
          sub: 'tests/checkout.test.ts',
          removed: ['await sleep(500)'],
          added: ['vi.useFakeTimers()', 'await vi.advanceTimersByTimeAsync(500)'],
        },
        edited: 'Updated checkout.test.ts (+2 −1)',
      },
      {
        prompt: 'Write docs for the payments API',
        read: 'src/payments/index.ts',
        summary: 'Wrote docs/payments.md with examples for every endpoint.',
        permission: { title: 'Run a command?', sub: 'List the payments routes', command: 'grep -n "router\\." src/payments/routes.ts' },
        ran: 'Found 6 routes',
        runStep: 'Find the endpoints',
        question: {
          header: 'Examples',
          text: 'Which examples should the docs show?',
          options: [
            { label: 'curl', detail: 'Works from any language' },
            { label: 'TypeScript SDK', detail: 'Matches our client code' },
          ],
        },
        askStep: 'Pick examples',
        edit: {
          title: 'Edit payments.md?',
          sub: 'docs/payments.md',
          removed: ['TODO: document the payments API'],
          added: ['## POST /payments/charge', 'Charges a saved card and returns a Payment.'],
        },
        edited: 'Updated payments.md (+2 −1)',
      },
    ],

    followUps: [
      'Done. Also added a changelog entry.',
      'Updated. The README now links to it.',
      'Finished. Everything still passes.',
    ],
  };

  // Same patterns NotchGate uses to keep asking for risky commands under auto-allow.
  NG.riskyPatterns = [
    /\brm\s+(-[a-z]*[rf][a-z]*\s+)+/i,
    /\bsudo\b/i,
    /\bgit\s+push\b.*(--force|\s-f\b|--force-with-lease)/i,
    /\bgit\s+reset\s+--hard\b/i,
    /\bgit\s+clean\s+-[a-z]*f/i,
    /\bgit\s+branch\s+-D\b/,
    /\b(mkfs|diskutil\s+erase|fdisk)\b/i,
    /\bdd\s+if=/i,
    /\bchmod\s+(-R\s+)?777\b/i,
    /\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(ba|z)?sh\b/i,
    /\bdrop\s+(table|database|schema)\b/i,
  ];

  NG.isRisky = (command) => NG.riskyPatterns.some((pattern) => pattern.test(command));
})();
