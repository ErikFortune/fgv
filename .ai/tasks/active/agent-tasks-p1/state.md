# State — `agent-tasks-p1`

**Status:** brief written, not started.

## Where things stand

| | |
|---|---|
| brief | `.ai/tasks/active/agent-tasks-p1/brief.md` — complete |
| branch | `claude/agent-tasks-p1`, cut off `integration/agent-tasks-v1` at `8e9916b88` (the I2 landing) |
| PR | none |
| base | `integration/agent-tasks-v1` — **not `release`** |

**The last implementation stream before the cluster promotes to `release` as one landing.**

## Dependencies and parallelism

P1's declared dependencies are **T8, T9, I1, I2** — all landed. **M1 is not among them**, so this runs
beside `agent-tasks-m1-stop`, which owns `libraries/ts-agent-tasks/perf/`. This stream owns
`samples/testbed/src/scenarios/agentTasks` and `ts-agent-tasks`' public contract/journey tests.

M1 measures and does not modify, so it cannot change P1's inputs. If M1 recommends a capacity-profile
change, that reaches the user as a decision rather than a commit.

## Open decisions this slice must take

1. **Where each assertion lives.** The plan names both `samples/testbed` *and* `ts-agent-tasks` public
   contract/journey tests, and asks for the scenario core unit-tested and CLI registration
   smoke-tested. The split must be argued: library contract tests survive the sample being deleted;
   scenario tests do not. No claimed behaviour may rest on printed output alone.
2. **What the scenario's testable core is**, with a thin enough CLI bootstrap that the core's tests
   carry the evidence.

## The structural consequence worth tracking

**Nothing outside `libraries/ts-agent-tasks/` imports it today** — verified. That is why I2 could
change `task_inspect`'s `details` from host JSON to escaped text for free, two days after I1a shipped
it. P1 ends that: once the scenario lands, `ts-agent-tasks` has a `samples/` consumer, and
`CODING_STANDARDS.md` records four consecutive streams breaking `samples/testbed` on interface
widening — one of them a source file, not a test double. After P1, the repo-wide rebuild checkbox
genuinely bites for this package.

## Verified inputs (checked, not assumed)

- `ITaskEnvironmentParams` takes `clock: () => number` and `newId: () => Result<string>`
  (`types/environment.ts`), so the fixed clock and deterministic id factory are first-class.
- The scenario registry is a manual `readonly` array with an explicit import per scenario
  (`samples/testbed/src/scenarios/index.ts`), currently ~24 scenarios.
- `samples/testbed/src/test/unit/scenarios.test.ts` has a committed **snapshot** that adding a
  scenario will change.
- `samples/testbed` is a Rush project with **`shouldPublish: false`**; 26 test files exist.
- Credential-free precedents in the registry: `gateDenyClientTools`, `memoryToolsGate`.

## Resume instructions

`brief.md` plus this file is enough to start cold. Nothing is implemented.
