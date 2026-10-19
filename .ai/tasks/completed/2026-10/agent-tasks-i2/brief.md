# Stream brief — `agent-tasks-i2`

**I2 — prompt fragments and the final composition check.**
`docs/design/agent-tasks/implementation-plan.md` § I2.

## Mission

A new **`prompt` packlet** in `ts-agent-tasks`: reusable fragment/descriptor factories, literal
substitutions, a final **checked** resolve/cache-request helper, and a host receipt-handoff example.
One trailing per-request task-context slot, placed **after** the intended stable prefix.

**Dependencies:** T2, T7, I1 — all landed. **P1 depends on you**, so what you publish is the surface
its journey step 9 will drive.

**You consume `ts-prompt-assist` and `ts-extras`/ai-assist unchanged.** A change to either is
permitted only for a *demonstrated* upstream bug, and then as a separately reviewed fix — not folded
into this stream. If you believe you have found one, surface it.

## Branch and PR posture

- **Branch:** `claude/agent-tasks-i2`, cut off `integration/agent-tasks-v1` at `e662da68c` (the
  tracked-commands landing, after all of I1) and pushed.
- **PR into `integration/agent-tasks-v1`** — **not `release`.**
- **Artifacts in `.ai/tasks/active/agent-tasks-i2/`.** The family finalizes at cluster close; do
  **not** run `/finalize-task`.
- **May run in parallel with the M1 stop-state cohort**, whose surface is `perf/residentMemory.js`
  plus its result artifact. You own `packlets/prompt/`; leave `perf/` alone. Collisions on shared
  substrate (the plan, the ledger, `CAPABILITIES.md`) are expected — if M1 lands first, merge the
  landing into your branch and re-run gates, as `agent-tasks-tracked-commands` did.

---

## What exists, verified — do not rebuild it

| primitive | where | signature as it actually is |
|---|---|---|
| `toCacheRequest` | `ts-prompt-assist` | `(composition: IPromptComposition, hints?: IToCacheRequestHints) => Result<AiAssist.IAiCacheRequest>` |
| `analyzePromptCacheStability` | `ts-prompt-assist` | `(params: IPromptCacheStabilityAnalysisParams) => ReadonlyArray<IPromptCacheFinding>` |
| `IPromptComposition.cacheFindings` | `ts-prompt-assist` | the same findings, carried on a resolved composition |
| `PromptCacheStability` | `ts-prompt-assist` | `'frozen' \| 'per-conversation' \| 'per-request'` |
| `TaskContextRenderer` + `ITaskInclusionReceipt` | `ts-agent-tasks` `context` | T2's bounded render and its pure inclusion receipt |
| `framingReserve` | `context/renderer.ts` | the renderer's own framing cost, already public on the instance |
| `quoteData` / `serializeRecord` | `context/escaping.ts` | **internal to the `context` packlet** — see the framing decision below |
| `IAiCacheRequest`, `validateAiCacheRequest` | `ts-extras` ai-assist | the request-side cache contract |

Read `.ai/tasks/active/agent-tasks-t2/result.md` for what the receipt means before you design
anything that carries one.

## The decision this slice exists to take: how a receipt is bound to the prompt that was sent

The plan's hardest acceptance line is:

> *"A changed/dropped task slot prevents acknowledging its original receipt."*

T2's receipt says exactly which task updates were included in a rendered body. If composition then
reorders, truncates, re-renders or drops that slot, the receipt still *describes* a render that no
longer matches what the model was sent — and acknowledging it would discharge obligations for context
nobody saw. That is the same defect class as I1a's paging gap, one layer up.

So: **what makes a receipt unacknowledgeable when the composed body no longer carries its slot?**
Candidate mechanisms, none of them yet verified — **check each is actually buildable on the surfaces
above before you rank them**, and say in `result.md` which you checked and how:

1. **Bind to the emitted text.** The helper hashes the slot text it rendered and the receipt carries
   that hash; acknowledgement requires the hash to match a slot present in the body actually sent.
   Strongest, and it detects re-rendering as well as dropping — but needs a canonical notion of "the
   slot's text in the emitted body", which is what `IPromptComposition`'s segments may or may not
   give you. **Verify that before choosing it.**
2. **Bind to composition identity.** The receipt is paired with the composition's own identity and
   the slot's position; acknowledgement refuses if the composition that was sent is not the one the
   receipt came from. Cheaper, but it cannot tell a *changed* slot from an unchanged one if identity
   does not cover slot content.
3. **Refuse the shape.** Conclude the helper must not hand back an acknowledgeable receipt at all —
   it returns the receipt and the request, and the *host* acknowledges only after it has sent the
   body it was given, with the library asserting nothing. Honest, and it may be right; if so, say
   what the host must do and what the library guarantees instead.

**Also required and separable:** *"Receipt is never in prompt text or silently acknowledged by
composition."* Nothing about the receipt may appear in the body — a model must not be able to read or
forge one — and resolving a prompt must never acknowledge anything as a side effect. Both are
properties to test, not just to assert.

## The framing decision I1a routed here

`docs/TECH_DEBT.md` carries a **[P3]** with **I2 as its named trigger**, because *"prompt trust
framing is its review gate"*:

> `task_inspect` returns a task's details as unframed host JSON beside the framed context. Task state
> reaches the model only inside `TaskContextRenderer`'s framed, escaped text; details are returned as
> structured JSON beside it — size-bounded but not framed, and without the renderer's escaping of
> invisible and frame-breaking characters.

`quoteData` is internal to `context`, so reusing it needs a new public primitive. The entry's own
scope sketch gives the fork: **decide whether details are data to be framed like task prose.** If
yes, publish an escaping helper from `context` (or render details inside the framed text) and route
them through it. If no, **record that as the design** — explicitly, with the reason — and the entry is
retired either way. Do not leave it open; its trigger has fired.

## Acceptance properties, from the plan

- **Composition is positively available.** And the sharp corollary the plan states: *"Deliberately
  unavailable composition with empty findings must fail."* An empty `cacheFindings` is **not**
  evidence that composition was analyzed — absence of findings and absence of analysis look identical
  unless you distinguish them. Build the test that fails.
- **Emitted system text equals the analyzed body.** Assert the outbound system body, not an
  intermediate.
- **Full issued task context is included exactly once.** Not zero times, not twice.
- **Required cache-ordering/refutation findings are handled**, and **no claim about actual provider
  hits** — you are asserting the plan and the ordering, never a cache hit.
- **Threshold-unknown is classified, not treated as generic failure or proof.**
- **Intentionally cache-hostile placement and a false frozen declaration must trigger checks.**
- One trailing per-request task-context slot **after** the stable prefix — the whole point is that the
  volatile part is last so the prefix can cache.

## Tests the plan singles out

Two requests changing **progress only**, with the stable prefix and **exact UTF-16 breakpoints**
unchanged. Empty task set. Repeated text. Unicode and **astral** characters. Post-analysis suffix and
prefix mutation. Enforced slot override. Missing and repeated task slot.

> *"Use real `PromptLibrary` and final request builder, not fabricated composition metadata; assert
> outbound system body and breakpoint plan."*

That is the C-phase lesson again (`TESTING_GUIDELINES.md` § *Coverage Gap Resolution*): a stream once
reported live success while client tools had never been merged into the request. **Fabricated
composition metadata would make every assertion here vacuous.** I1a–I1d all built real outbound
capture; follow them (`test/unit/tools/requestCapture.test.ts` is the pattern).

**Review gate:** *"`HorizontalComposer` output alone cannot satisfy this gate at the inspected
baseline."* Read that as written — composing and inspecting the composer's own output is not evidence
about what ai-assist sends.

## Package surface

`libraries/ts-agent-tasks` only — the new `prompt` packlet, its types/converters/tests; a new public
escaping primitive in `context` **if** the framing decision calls for one; `CAPABILITIES.md` and the
router line; this stream's artifacts; the plan's I2 status and the ledger entry.

**Headroom.** The package's largest file is `storage/repository.ts` at ~1875 lines, 125 under the
2000-line `max-lines` cap (a promoted P1). You are writing a new packlet — plan the file split before
you approach it. **Do not touch `storage/` or `perf/`.**

## Gates

- [ ] `rushx build` **zero warnings**; `rushx lint`; `rushx fixlint` before the final commit
- [ ] `rushx test` at 100 % coverage with **zero `c8 ignore`**
- [ ] `rush change --verify --target-branch origin/integration/agent-tasks-v1`; change file **`minor`**
- [ ] Repo-wide `rebuild`; and repo-wide `test` if you widen what anything accepts or classifies —
      **publishing an escaping helper from `context` widens a shared surface**
- [ ] `verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`,
      `verify-bundler-resolution`, `verify-tarball-exports`
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] **Revert matrix rows, run on final source** — `--pkg` with a `node_modules` symlink
- [ ] Both review layers recorded in `result.md`
- [ ] The plan's I2 status line and the ledger entry written as shipped **in this PR**
- [ ] The I2-triggered `docs/TECH_DEBT.md` entry **resolved or recorded as the design**, not left open

## Skills to load, and when

| when you are about to | load |
|---|---|
| write or review a converter, validator, or a `JsonSchema` | `/type-safe-validation` |
| write or review any `Result<T>`-returning code | `/result-pattern` |
| write or review tests | `/result-tests` |
| write anything that "feels general" | `/published-primitives-reflex` |

## Traps this cluster paid for

1. **Verify an option is buildable before ranking it.** Twice the orchestrator's brief named a
   preferred option that could not work — I1c's "expose only the `toJson()` wire form" (an
   `IAiClientTool` needs a validator) and tracked-commands' "unify onto one authority" (`JsonSchema`
   cannot state the converter's bounds). Both were correctly overruled. **This brief's three
   receipt-binding options are unverified; treat them as candidates, not a ranking.**
2. **A matrix row can be green while protecting the bug.** I1c's canonicalization fixture used a
   whitespace-trimming encoder — idempotent — so the defect and the protection were
   indistinguishable, and the row "protecting" canonical encoding pinned the double-encode. Choose
   fixture values where right and wrong answers differ. For you this bites on *repeated text* and
   *empty task set*: pick bodies where a dropped slot and an unchanged one cannot look alike.
3. **A rule from one slice did not survive the next.** I1b-10's capture-before-the-`await` rule
   reappeared as an I1c high. If you write a check-then-act path, read both rows first.
4. **Never run the matrix without `--pkg`** and a `node_modules` symlink — it mutates the package in
   place, and an interrupted run leaves a mutant behind. (The orchestrator did this and then
   misdiagnosed its own corruption as a merge defect.)
5. **Quote a suite and a total someone can count.**
6. **A review round that posts zero comments is not evidence of a clean diff** — read the
   previously-missed block. I1d's round 3 posted no findings and listed two missed items, both real.
7. **Copilot's API trigger is unreliable** — use a bare `@copilot review` **comment**.
8. **Route anything outliving this slice to `docs/TECH_DEBT.md` in this PR.**

## Exit artifact

`result.md`, opening with a one-line `**Shipped:** …` that becomes the capability-feed `sourceLine`
verbatim. It must record:

- **The receipt-binding decision**, which candidates you verified as buildable and which you ruled
  out on what fact, and exactly what makes a receipt unacknowledgeable after its slot changes.
- **The framing decision**, and the debt entry's disposition either way.
- How "composition is positively available" is distinguished from "nothing was analyzed", and the
  test that fails when it is not.
- The outbound evidence: the system body and breakpoint plan asserted, from a real `PromptLibrary`
  and the real request builder.
- The two-request progress-only comparison, with the unchanged UTF-16 breakpoints quoted.
- Every check-then-act window in the diff, and what re-checks after it.
- The revert matrix rows on final source, with per-row suite names.
- Anything P1 will need from you, stated as the surface it can rely on.

Keep `state.md` current; `state.md` plus this brief must be enough to resume cold.

## Required reading, in order

1. This brief.
2. `docs/design/agent-tasks/implementation-plan.md` § I2 — and § P1's journey step 9, which is your
   consumer.
3. `.ai/tasks/active/agent-tasks-t2/result.md` — the renderer's bounding and inclusion receipts.
4. `.ai/tasks/active/agent-tasks-i1a/result.md` — the outbound-capture pattern and the bounding
   story you are composing with.
5. `libraries/ts-agent-tasks/src/packlets/context/` — `renderer.ts`, `escaping.ts`.
6. `libraries/ts-prompt-assist/CAPABILITIES.md` — then `toCacheRequest`,
   `analyzePromptCacheStability`, `IPromptComposition` in the source.
7. `docs/TECH_DEBT.md` — the `task_inspect` details entry triggered here.
8. `.ai/instructions/TESTING_GUIDELINES.md` § *Coverage Gap Resolution* — the fabricated-metadata
   lesson.

## Missing-input rule

If a required-reading file does not exist, or does not say what this brief claims, **STOP and surface
the gap.** Do not reconstruct intent from surrounding code and proceed.
