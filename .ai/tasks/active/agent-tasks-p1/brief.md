# Stream brief — `agent-tasks-p1`

**P1 — the credential-free public-API proving ground.** The last implementation stream before the
cluster promotes. `docs/design/agent-tasks/implementation-plan.md` § P1.

## Mission

A `samples/testbed` scenario — `samples/testbed/src/scenarios/agentTasks` — that walks the plan's
**nine-step journey** through `ts-agent-tasks`' public surface, plus the `ts-agent-tasks` public
contract/journey tests that assert it. A testable core with a thin Node CLI bootstrap.

**The plan's journey is prescriptive: read § P1 and follow its nine steps as written.** This brief
does not restate them; it names the traps, the determinism contract and the two decisions you must
take.

**Dependencies:** T8, T9, I1 (all four slices), I2 — **all landed**. Not M1.

## Branch and PR posture

- **Branch:** `claude/agent-tasks-p1`, cut off `integration/agent-tasks-v1` at `8e9916b88` (the I2
  landing) and pushed.
- **PR into `integration/agent-tasks-v1`** — **not `release`.**
- **Artifacts in `.ai/tasks/active/agent-tasks-p1/`.** The family finalizes at cluster close; do
  **not** run `/finalize-task`.
- **Runs in parallel with `agent-tasks-m1-stop`**, which owns `libraries/ts-agent-tasks/perf/`.
  **Do not touch `perf/`.** If M1 lands first, merge the landing and re-run gates — the pattern
  `agent-tasks-tracked-commands` used. M1 measures and does not modify, so nothing it does changes
  your inputs; if it recommends a capacity-profile change, that comes to the user as a decision, not
  as a commit under you.

---

## You are creating this package's first external consumer, and that has a cost worth knowing

Right now **nothing outside `libraries/ts-agent-tasks/` imports it** — verified. That is why I2 could
change `task_inspect`'s `details` from host JSON to escaped text for free two days after I1a shipped
it.

Your scenario ends that. From the moment it lands, `ts-agent-tasks` has a `samples/` consumer, and
`CODING_STANDARDS.md` § *Widening a shared interface needs a repo-wide build* documents **four
consecutive streams** breaking `samples/testbed` on exactly this pattern — three on hand-rolled test
doubles, and one (`scenarios/memoryToolsGate/index.ts`) on a **source** file, which a shared double
would not have saved.

Two consequences, both yours to act on:

- **Prefer the library's real exports to hand-rolled doubles** wherever a real object will do. Every
  double you write is a future break that the library's own suite cannot see.
- **Where you must simulate** (the external source, the clock, the id factory), say so in `result.md`
  and keep the simulation in one place, so the next interface change has one site to fix rather than
  nine.

## The determinism contract — non-negotiable

From the plan: **no credentials, no network, no downloads, no model weights, no sleeps, and no
real-time race oracle.**

Verified support for the rest:

- **`ITaskEnvironmentParams` takes `clock: () => number` and `newId: () => Result<string>`**
  (`types/environment.ts`), so a fixed clock and a deterministic id factory are first-class, not a
  workaround. Use them.
- **In-memory `FileTree`** or a host-created temporary Node root — both exist; the plan allows either.
- **The external source is advanced explicitly.** Nothing waits on wall-clock time. If you find
  yourself wanting a `setTimeout`, that is the race oracle the plan forbids — surface it instead.

`gateDenyClientTools` and `memoryToolsGate` are the credential-free precedents in this registry; read
one before you start.

## Use exported APIs only — and treat a gap as the finding

The plan: *"Use exported APIs only; simulation implementation remains test/example code."* This is the
point of the stream. It is a **proving ground**: its job is to discover whether the public surface is
actually sufficient to drive the library end to end.

So if a journey step cannot be done through exports — if it needs an internal import, a cast, or
knowledge no consumer could have — **that is a finding about the surface, not an obstacle to route
around.** Record it, and say what export would have closed it. A scenario that reaches past the public
API has proved nothing about the public API.

## The two decisions this stream must take

1. **Where each assertion lives.** The plan names both *"samples/testbed"* and *"`ts-agent-tasks`
   public contract/journey tests"*, and says *"Unit-test the scenario core and smoke-test CLI
   registration/output with fake host interfaces."* So the same journey has two homes and you must
   split it deliberately: which behaviour is asserted as a **library contract test** (runs in
   `ts-agent-tasks`' suite, gates its coverage, survives the sample being deleted) and which is
   asserted about **the scenario** (its core unit-tested, its CLI smoke-tested). Argue the split; do
   not duplicate the whole journey in both places, and do not leave a claimed behaviour asserted only
   by the sample's printed output.
2. **What the scenario's core is.** *"Testable core plus thin Node CLI bootstrap"* — decide the seam,
   and keep the bootstrap thin enough that the core's tests are the real evidence.

## The two evidence rules the plan states, and why they are there

> *"Every claimed behavior is asserted through public APIs; a 'VERIFIED' printed label is not evidence
> by itself."*

> *"Fault-injection suites, not the example's happy-path text, establish crash claims."*

Both read as written against a specific past failure, and this cluster has its own version of it:
a stream once reported *"live testbed run reported success"* in its exit artifact while
`executeClientToolTurn` had never merged client tools into the request — the model could not have
called them, 100 % coverage was measured on the mocked response side, and **no test verified the
request body** (`TESTING_GUIDELINES.md` § *Coverage Gap Resolution*). The claim shipped, not the code.

Your scenario prints readable output *and* carries deterministic structured assertions. **The printed
line is never the evidence.** When you write `result.md`, for each of the nine steps, name the
assertion that would fail if the behaviour regressed — not the line that would stop printing.

## Steps where this cluster already decided something you must not re-litigate

- **Step 3 (commands).** I1c established that **a model must not resend a command** — every call mints
  a fresh key, so a resend is a second command, and the only safe resend path is the host's
  `resolveCommands` pump, which resends a `source-key` command under the *same* key and never resends
  a `none` command (it resolves it by lookup or holds it). Your step 3 is the first place that
  reasoning is driven end to end through a simulated source rather than argued. The plan asks for
  *"source-key duplicate suppression and refusal to resend an uncertain non-idempotent command"* —
  that is exactly this, so make the simulated source's dedup real.
- **Step 7 (cascade stop).** I1d established that a model may **request** and **read** a stop but
  never **release** it or **run the pump**, and that `release`/`resume` are separate operations. The
  plan's step 7 says the same ("show release/resume are separate operations"), so drive it with the
  host doing the reconciliation and releasing.
- **Step 9 (the final prompt).** I2 shipped `prepareTaskPrompt()` → `ITaskPromptHandoff` with
  `acknowledge(sentSystem)`, and the binding is **exact text equality**: the host must pass the text
  it *actually sent*, not `prompt.system` by reflex. A dropped, moved, repeated or edited slot
  abandons the delivery's manifest. The plan's *"Reject foreign/modified receipt attempts and show
  normal valid replay"* is precisely that surface — read
  `.ai/tasks/active/agent-tasks-i2/result.md` § *What P1 can rely on* first.

## Mechanical obligations, verified

- **The scenario registry is a manual `readonly` array** in `samples/testbed/src/scenarios/index.ts`
  with an explicit import per scenario — append yours. The file's own header documents the two steps.
- **`samples/testbed/src/test/unit/scenarios.test.ts` has a snapshot**
  (`__snapshots__/scenarios.test.ts.snap`). Adding a scenario changes it; update it deliberately and
  check what changed rather than accepting a blind `-u`.
- `samples/testbed` is a Rush project with **`shouldPublish: false`**. It still needs a change file if
  `rush change --verify` asks for one — CI's first gate keys off *files touched* — so run the verify
  and do what it says rather than assuming a sample is exempt.

## Gates

- [ ] `rushx build` **zero warnings**, `rushx lint`, `rushx fixlint` — in **both** modified packages
- [ ] `rushx test` in both; `ts-agent-tasks` at **100 % coverage with zero `c8 ignore`**. Report
      `samples/testbed`'s own coverage posture as its config defines it, rather than assuming it
      matches
- [ ] `rush change --verify --target-branch origin/integration/agent-tasks-v1` for **every** package
      touched
- [ ] **Repo-wide `rebuild` and repo-wide `test`** — you are adding a cross-package dependency edge
      and a new consumer; this is exactly the case the checkbox exists for
- [ ] `verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`,
      `verify-bundler-resolution`, `verify-tarball-exports`
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] **Revert matrix rows, run on final source** — `--pkg` with a `node_modules` symlink. I2's rows
      live in `.ai/tasks/active/agent-tasks-i2/i2Matrix.js` because M1 owns `perf/`; follow whichever
      placement is free when you get there, and say which you chose and why
- [ ] Both review layers recorded in `result.md`
- [ ] The plan's P1 status line and the ledger entry written as shipped **in this PR**

## Review

Layer 1 (`code-reviewer`), then the Copilot loop driven by a bare **`@copilot review` comment** (the
API request silently did nothing four times on I1b).

**The plan's review gate for P1 is *"portability and adversarial end-to-end review"***, and it adds:
*"No dependency on multi-agent chat or memory infrastructure; ingestion observation does not
substitute for command proof."* Ask layer 1 directly: *which of the nine steps is asserted only by
printed output, and which assertion would fail if the behaviour regressed?*

Expect a substantive loop. Every slice in this cluster with an authorization or ordering surface ran
2–7 rounds, and rounds 1 and 2 each found a real high on I1c. P1 spans all of those surfaces at once.

## Traps this cluster paid for

1. **A printed label is not evidence.** See above; it is the plan's own first warning.
2. **A matrix row can be green while protecting the bug.** I1c's canonicalization fixture used an
   idempotent (whitespace-trimming) encoder, so the defect and the protection were indistinguishable
   and the row "protecting" canonical encoding pinned the double-encode. Pick fixture values where
   right and wrong answers differ.
3. **A rule from one slice did not survive the next** — I1b-10's capture-before-the-`await` rule
   reappeared as an I1c high.
4. **Never run a matrix without `--pkg`** and a `node_modules` symlink; it mutates the package in
   place and an interrupted run leaves a mutant behind.
5. **Quote a suite and a total someone can count.** I1c said a grep gave five files; it gave six.
6. **A review round that posts zero comments is not evidence of a clean diff** — read the
   previously-missed block. I1d's round 3 posted no findings and listed two missed items, both real.
7. **A brief's claims are claims.** This one asserts the registry shape, the snapshot test, the
   injectable clock/id factory and `shouldPublish: false`. Verify before relying.
8. **Route anything outliving this slice to `docs/TECH_DEBT.md` in this PR.**

## Exit artifact

`result.md`, opening with a one-line `**Shipped:** …` for the capability feed. It must record:

- **The assertion-location split** (library contract test vs scenario core vs CLI smoke), argued.
- **For each of the nine steps: the assertion that would fail on regression** — explicitly, not the
  printed line.
- **Every place the public surface was insufficient**, with the export that would have closed it.
  This is the proving ground's primary output; "nothing was missing" is a legitimate result, stated as
  such.
- **Every simulation and double**, in one list, so the next interface change has one place to look.
- The fault-injection suites behind any crash or recovery claim.
- Confirmation that no step depends on credentials, network, downloads, weights, sleeps or wall-clock
  ordering.
- The revert matrix rows on final source, with per-row suite names and the placement you chose.
- Anything the cluster still owes before promotion, routed durably.

Keep `state.md` current; `state.md` plus this brief must be enough to resume cold.

## Required reading, in order

1. This brief.
2. `docs/design/agent-tasks/implementation-plan.md` § P1 — the nine steps, verbatim; plus § 8's
   release-evidence section, which this stream feeds.
3. `.ai/tasks/active/agent-tasks-i2/result.md` § *What P1 can rely on* — your step 9.
4. `.ai/tasks/active/agent-tasks-i1c/result.md` — the command-resend reasoning your step 3 drives.
5. `.ai/tasks/active/agent-tasks-i1d/result.md` — the stop decisions your step 7 drives.
6. `samples/testbed/src/scenarios/index.ts` and one credential-free precedent
   (`gateDenyClientTools/` or `memoryToolsGate/`).
7. `samples/testbed/src/shell/index.ts` — `IScenarioBase`, `IScenarioContext`.
8. `libraries/ts-agent-tasks/CAPABILITIES.md` — the surface you are proving.
9. `.ai/instructions/TESTING_GUIDELINES.md` § *Coverage Gap Resolution* — the claimed-live-success
   failure.
10. `.ai/instructions/CODING_STANDARDS.md` § *Widening a shared interface needs a repo-wide build* —
    why your scenario is a liability as well as an asset.

## Missing-input rule

If a required-reading file does not exist, or does not say what this brief claims, **STOP and surface
the gap.** Do not reconstruct intent from surrounding code and proceed.
