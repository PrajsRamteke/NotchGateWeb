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

    /// Background sessions shown in the live-activity panel.
    sessions: [
      { id: 'web', project: 'dashboard', status: 'Upgrading the chart library', state: 'working', done: 2, total: 5, started: Date.now() - 96000 },
      { id: 'docs', project: 'handbook', status: 'Rewrote the onboarding guide', state: 'done', started: Date.now() - 420000, finishedAfter: 120 },
    ],

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
