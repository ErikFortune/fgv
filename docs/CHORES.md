# Chores — fgv

Scheduled cleanup batches. Different from TECH_DEBT (long-running
structural debt) and FUTURE (parking lot of ideas). A chore batch
is a focused agent run that closes several small items at once,
typically tied to a specific transition — after a feature ships
with surface-local followups, before an adjacent feature starts on
the same surface, or after a consumer-integration round closes and
the open items become legible. Each batch is bounded, agent-shaped,
and usually 3–6 items.

---

## What goes here vs. TECH_DEBT vs. FUTURE

| Doc | Captures | Shape | Closed by |
|-----|----------|-------|-----------|
| **Batch register (this doc)** | Scheduled cleanup tied to a specific transition | Time-bounded, batched, 3–6 items | A focused agent run |
| **TECH_DEBT** | Long-running structural debt | Priority-ranked (P1–P4) | Opportunistically — when the right surface area is touched |
| **FUTURE** | Parking-lot ideas, not on roadmap, not non-goals | Captured with rationale | Promoted to roadmap when concrete demand surfaces |

Items can move between docs. A TECH_DEBT entry that becomes
time-critical can be promoted into the active chore batch.

## Process notes

### When to open a new batch

A chore batch needs a concrete transition trigger. Recognized
triggers in this repo:

- **Post-feature followup batch.** A feature stream just shipped
  to `release` and left N small followups on its surface (test-only
  paths, deferred coverage closures, TODO-marked cleanups).
- **Adjacent-feature prep.** Another stream is about to start on a
  surface adjacent to one that's been accumulating debt — clean it
  up before the new stream touches it, so the new stream isn't
  fighting old smells.
- **Pre-alpha tidy.** Before cutting an alpha (i.e. before mirroring
  `release` → `prerelease` for a publish), sweep for changelog
  rot, doc-rot, and obvious cross-package inconsistencies that the
  alpha would otherwise carry.
- **Post-consumer-integration sweep.** After a consumer applies a
  feature end-to-end, the friction they hit usually surfaces a
  cluster of small fixes worth batching.

Items that don't have a concrete trigger belong in TECH_DEBT or
FUTURE, not here.

### Kickoff-prompt shape for chore agents

Reference: `.ai/conventions/workflow/kickoff-prompt-shape.md` §
interleaved-per-item. A chore batch is a **sequential walk** through
3–6 small items, not a single coherent feature. **Don't** give the
agent a single upfront "Read everything before coding" list spanning
all items.

### Coverage-closure items — explicit smell guidance

Any chore item that includes "close coverage gaps" needs explicit
guidance to **load `/result-pattern` before reaching for coverage-
suppression**, plus a one-line description of the smell:

> If you're about to add a coverage-suppression directive around an
> imperative `isFailure()` propagation block, that's a refactor
> signal. Try chaining first — it usually closes the gap
> structurally. Accept suppression only after determining the
> imperative form is genuinely the right shape. See
> `.claude/skills/result-pattern/SKILL.md` § Coverage-gap smell.

### Artifact migration is pre-merge

Same rule as workstreams. The chore-batch agent migrates
`.ai/tasks/active/<batch-id>/` → `.ai/tasks/completed/<YYYY-MM>/<batch-id>/`
and writes the polished `README.md` **as part of the PR, before
merge**, not as a post-merge follow-up.

---

## Active batch

*(No active batch.)*

### Queued — unbatched

#### `mutableFsTree` permission test cannot pass as root

`libraries/ts-json-base/src/test/unit/file-tree/mutableFsTree.test.ts:89` —
`FsFileTreeAccessors > fileIsMutable > returns permission-denied for read-only file` `chmod`s a file
to `0444` and asserts it is not writable. **Root ignores permission bits**, so the write succeeds,
`fileIsMutable` correctly reports `true`, and the assertion fails. It passes in CI, which runs as
the non-root `runner` user.

**Why it is worth fixing rather than tolerating.** Agent and cloud containers routinely run as uid
0, and the repo's own guidance is to reproduce CI locally before blaming CI — advice that quietly
assumes a non-root environment. The failure surfaces in a package the reader has usually not
touched, and its message (`expected "permission denied", received "persistent"`) gives no hint of
the cause. It has now cost investigation time on at least three separate occasions.

**Preferred fix**, from the finding that first recorded it
(`.ai/tasks/completed/2026-08/ts-utils-async-detailed-result/findings/inbox/2026-08-06-root-sensitive-fstree-test.md`):
skip when `process.getuid?.() === 0`, with a message naming root as the reason — keeps the assertion
honest where it means something and removes the false signal where it does not. The stronger
alternative is to assert on the accessor's permission logic with an injected stat result, testing
the code rather than the kernel.

**Not a defect in the test's correctness** — it is correct for the environment it assumes.

**Escalated 2026-08-23 (`schema-optional-translation`, #659): it now silently disables a gate.**
`CODING_STANDARDS.md` gained a repo-wide `rush test` acceptance checkbox in #656, for changes that
widen what a function *accepts* (a compiler cannot see those). **Rush blocks every dependent of a
failed project**, so this one failure stops the run at `@fgv/ts-json-base` and `@fgv/ts-extras` and
everything downstream never execute. The failure mode is the bad kind: the command exits non-zero
for a familiar unrelated reason, the reader recognises it and moves on, and **the box gets ticked
for a run that tested none of the packages the rule protects.** This raises the item from *annoying*
to *blocking a stated gate*; also filed as P2 in `TECH_DEBT.md`.

#### `as Record<string, …>` after a type guard — 32 sites, a P1 anti-pattern that propagates by example

`CODE_REVIEW_CHECKLIST.md` lists "manual type checking with unsafe casts" as **P1 CRITICAL** and
names `as Record<string, unknown>` in its own detection greps. The recurring shape:

```ts
if (raw === null || typeof raw !== 'object') { return false; }
const node = raw as Record<string, JsonValue | undefined>;   // ← the violation
```

**Measured, not estimated.** `grep -rn "as Record<string" --include=*.ts libraries/*/src tools/*/src`
excluding tests returns 33 lines, **one of which is a comment** (`fromJson.ts:58`) — so **32 code
sites** across 11 packages.

**Why it belongs in a batch rather than being left to opportunistic cleanup:** it spreads by
imitation. `schema-optional-translation` introduced three fresh instances in August 2026 by
mirroring `hasOptionalProperties`, which had shipped with the same cast — in a PR whose own argument
was *don't assert what you can prove*. Lint, build, tests and 100% coverage were all green with them
in place. **Nothing in the toolchain enforces this P1**, so the nearest example in the file wins.

Triaged into three groups; the cost profile differs sharply, so do not treat this as one sweep.

**Group 1 — provably removable, mechanical (≈8 sites).** The value has *already* been narrowed to a
typed object and the cast re-states what the compiler knows. `JsonObject` is
`{ [key: string]: JsonValue }`, so after a `null` / `typeof` / `Array.isArray` guard the property is
directly accessible. Three such casts were removed from `ts-extras/ai-assist/structuredOutput.ts` in
#659 with **no signature change, no behaviour change, lint clean, coverage unmoved at 100%** — that
PR is the worked example. Candidates: `ts-json-base/json-schema-builder/fromJson.ts` (109, 300, 324,
505) and `types.ts:127`; `ts-utils/base/normalize.ts:121`; `ts-agent-memory/converters/envelopeConverter.ts:81`;
`ts-prompt-assist/converters/bindingsConverter.ts:37`.

**Group 2 — a Converter is the actual answer (≈16 sites).** Genuinely untrusted input being read
field-by-field after a hand-rolled guard: provider wire responses in
`ts-extras/ai-assist/{completionClient.ts:430,459,567,568,956, listModelsClient.ts:449, imageGenerationClient.ts:641, converters.ts:113-114}`,
`crypto-utils/{model.ts:936, keystore/model.ts:778}`, `mustache/mustacheTemplate.ts:341`,
`ts-web-extras/file-tree/localStorageTreeAccessors.ts:{288,327}`,
`ts-app-shell/ai-assist/useAiAssist.ts:{194,196}`,
`ts-res/runtime/context/simpleContextQualifierProvider.ts:269`,
`repo-template/src/commands/link.ts:217` (`JSON.parse(output) as Record<string, string>` — untrusted
CLI output). **These are not cast removals — they are missing Converters**, which is the checklist's
prescribed fix and a materially larger job. Size each before batching; several may deserve their own
stream.

**Group 3 — benign, probably leave (≈8 sites).** Typing a freshly-created empty object or the loose
return of a typed operation, where nothing untrusted is being narrowed:
`ks/src/app.ts:260` (`Object.create(null) as Record<string, string>` — TS types `Object.create` as
`any`, so this is legitimate), `ts-res-ui-components/src/utils/resourceSelectors.ts:205` (`{} as
Record<string, number>`, better written as an annotation), `resolutionUtils.ts:139` /
`filterResources.ts:169` (re-typing an `Object.fromEntries` result), `resolutionEditing.ts:104`,
`ts-utils/collections/aggregatedResultMap.ts:1125`. **Confirm each individually** — the grep cannot
tell these apart from Group 1, and mis-sorting a Group 2 site into here is the expensive mistake.

**Suggested batching:** Group 1 alone is a clean 3–6 item batch with a worked example to follow and
a hard acceptance test (no behaviour change, coverage unmoved). Group 3 can ride along as
confirmations. **Group 2 should not be batched with them** — it is design work, not cleanup.

**Worth considering alongside:** whether an ESLint rule can catch the guard-then-cast shape. The
checklist calls it blocking and nothing enforces it, which is why it recurs; a lint rule would move
this from a recurring chore to a one-time fix.

---

## Completed batches

*(No completed batches yet.)*
