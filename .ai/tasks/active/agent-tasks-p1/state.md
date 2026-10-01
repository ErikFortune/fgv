# State — `agent-tasks-p1`

**Status:** implemented; gates and the revert matrix run on final source; PR open into
`integration/agent-tasks-v1`; Copilot loop in progress. See `result.md` for everything shipped.

## Where things stand

| | |
|---|---|
| brief | `brief.md` — complete |
| branch | `claude/agent-tasks-p1`, cut off `integration/agent-tasks-v1` at `8e9916b88` |
| PR | see `result.md` § Gates (number filled in after creation) |
| base | `integration/agent-tasks-v1` — **not `release`** |
| result | `result.md` |
| matrix | `p1Matrix.js` (here, not `perf/`, which M1 owns) |

## The two decisions, taken

1. **Assertion split** — library suites own behaviour; new `journey/publicJourney.test.ts` owns the six
   compositions no suite pinned; the scenario owns "composes from outside the package" with every
   check's observed value asserted in `agentTasks.test.ts`; the CLI smoke owns registration/output.
2. **Core** — `runAgentTasksJourney(options?)` → `Result<IJourneyReport>`; `index.ts` only renders.

## Things a resumer must know

- **The testbed's Jest environment is jsdom**, which lacks `structuredClone`; the library needs it
  (finding 1). `config/jest.setup.js` polyfills it. A plain `npx jest` defaults to node and hides this —
  always run the suite through `heft test` / `rushx test`.
- **`Result.orDefault` treats a successful `null` as absent.** `report.ts` checks `isSuccess()` instead.
- **Update ids encode the category as an index** (`plan:3:4`), so tests build them with `taskUpdateId`.
- **A substituted executor is a factory** (`IWorldOptions.executor: () => SimulatedExecutor`), because
  branches 5–9 each seed their own world.
- **Matrix copies**: build them fresh before each run (`p1Matrix.js` header); never run without `--pkg`
  and `--testbed`, and never reuse a copy from an interrupted run.

## Resume instructions

If the PR is open: drive the Copilot loop (bare `@copilot review` comment), fix findings, re-run the
affected gates and, for any library-adjacent change, the matrix. Keep `result.md` § Review current.
