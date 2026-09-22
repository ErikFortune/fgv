# Result — `agent-tasks-t2`

**T2 does not close the stream.** T3 and beyond follow; artifacts stay in
`.ai/tasks/active/agent-tasks-t2/`. Written 2026-09-22.

---

## What shipped

The **snapshot-only entry point**: a host hands `TaskContextRenderer` already-authorized task
values and gets bounded framed text, a structured view, an omission report and a pure inclusion
receipt — with no storage, no broker, and nothing the renderer could write to.

**`types`** (additions only; no T1 member changed)
- `summary.ts` — `ITaskSummary` (`{ envelope }`, no details) and `IUnresolvedTaskReference`,
  pulled forward from design §7 / §8.3 because the renderer's input is made of them.
- `updates.ts` — `ITaskUpdate` (§8.3), beside T1's `UpdateCategory`.
- `context.ts` — `ITaskContextBudget` / `defaultTaskContextBudget` (20 / 3 / 8,000),
  `ITaskContextLimits` / `taskContextLimits` (200 items, 10,000 input entries per list),
  `IInclusionEntry`, `ITaskInclusionReceipt`, `TaskInputCompleteness`, `ITaskContextInput`,
  `TaskContextSection`, `TaskContextPresentation`, `ITaskContextEntry`, `TaskContextOmissionReason`,
  `ITaskContextOmissions`, `ITaskContextDiagnostic`, `ITaskContext`, `TaskContextProjection`.

**`converters`** — `TaskConverters.context` (`contextConverters.ts`): strict `summary`;
`presentable` (summary or snapshot, details explicitly discarded); `update` (snapshot pinned to the
task and revision it names; audience bounded by `maxReferences` and unique); `unresolvedReference`;
`input`; `budget`; `inclusionEntry`; `receipt` (canonical: entries strictly ascending by task then
revision, update IDs strictly ascending, no update ID in two entries, ≤ 7 per entry, ≤ 200
entries).

**`context`** (new packlet)
- `normalize.ts` — dedup and conflict rules (below).
- `escaping.ts` — per-string JSON quoting that additionally `\uXXXX`-escapes `< > & { }`, the
  backtick, DEL and C1 controls, U+2028/2029, bidi controls, zero-width and other invisible
  formatting characters, variation selectors and the Unicode tag block.
- `framing.ts` — the fixed trusted framing and `computeFramingReserve()` (fixed lines + the
  longest omission line any rendering can produce).
- `renderer.ts` — `TaskContextRenderer.create({ converters?, projection? })`,
  `render(input, budget?) → TaskResult<ITaskContext>`, and `defaultTaskContextProjection`
  (strips the source binding).

Pipeline: validate budget (incl. `maxChars ≥ framingReserve`) → validate input → normalize →
project each distinct `(task, revision)` once, re-validate, pin identity → reject parent cycles →
rank → greedy select (items → depth → full line → abbreviated line → omit) → render by section →
receipt from what rendered.

498 tests in the package (89 new). 100% statements, branches, functions and lines. No coverage
directives.

---

## Decisions that revisit the design sketch, and why

1. **A class, not `renderTaskContext(input, budget)`.** The renderer must validate what it renders
   (the symmetry hole the brief named), validation is bounds-dependent, and bounds live on a
   `TaskConverters` instance. `TaskContextRenderer.create(...)` matches `TaskConverters.create` /
   `TaskKindRegistry.create`.
2. **`TaskResult`, not `Result`.** `invalid` (malformed input, impossible budget, failing
   projection, parent cycle) and `conflict` (input describing one thing two ways) are different
   host actions.
3. **One render item per `(task, revision)`.** `IInclusionEntry` is already `(taskId, revision,
   updateIds)`; updates at the revision a current snapshot shows ride on that item rather than
   rendering the same state twice. Distinct revisions stay distinct items (§9: "multiple required
   revisions of one task remain distinct render items").
4. **Tie-break is task ID then revision, not "task ID and update ID" (§9).** With one item per
   revision, an item carries zero or several update IDs, so update ID is not a total key; revision
   is. Same determinism, a key that exists. **For the design authority:** §9's sentence should
   read "task ID and revision".
5. **`ITaskContext` grew three things beyond the sketch.** `entries` is `ITaskContextEntry`
   (summary + section + presentation + depth + delivered update IDs) rather than bare
   `ITaskSummary`, because the structured view has to say which items were abbreviated;
   `diagnostics` is `ITaskContextDiagnostic[]` — the rendered unresolved references reduced to exactly the fields the text shows (Copilot round 1: returning the raw reference leaked the binding around the projection); `omissions.abbreviated` counts
   abbreviated items.
6. **At most one update per `(task, revision, category)`, enforced as `conflict`.** §8.3 says
   update identity *is* that tuple. It also bounds a receipt entry at seven update IDs.
7. **Abbreviation keeps the revision, drops every update ID.** Descriptive prose (`description`,
   `progress.summary`) is dropped behind `"abbreviated":true`. The entry stays in the receipt —
   the revision *was* presented, abbreviated — but carries no update IDs, including optional ones:
   an update ID in a receipt claims complete delivery.
8. **The receipt is canonical.** Ordering is part of the converter, so two receipts describing one
   inclusion are byte-identical — which is what T7's "compare … using full canonical JSON" needs.
9. **Unresolved references consume the item budget** and render in `[diagnostics]`, with no
   revision and no binding. Their `revision` is used only as a sort key.

---

## T1 union members exercised — and none revised

T1's table (in its `result.md`) now carries a T2 note on each affected row.

| union | exercised by T2 as a *choice* | revised? |
|---|---|---|
| `TaskLifecycle` / status sets | terminal vs open drives priority; each state's payload is what is presented | no |
| `ObservationHealth` | not-`current` renders state and reason; timestamps are telemetry, newest wins on collapse | no |
| `TaskFailureCode` | `invalid`, `conflict` | no — `invalid-receipt` is correctly T7's, not a pure renderer's |
| `UpdateCategory` | required `attention` and non-`progress` categories drive priority; categories rendered | no — but see decision 6 |
| `ITaskReference` | rendered as opaque `[namespace, key]` pairs; never dereferenced | no |

Nothing in T1's vocabulary was wrong for rendering. The honest reading: T2 exercises the
*presentation* half of four unions; the storage/source/command halves remain T3–T6's to test.

---

## Which test establishes which acceptance criterion

| plan acceptance criterion | established by |
|---|---|
| Same validated input and budget produces the same output | `renderer.test.ts` › *determinism* — two renders and a second renderer instance are deep-equal; **reversed input order** is deep-equal; *observation tie breaks deterministically regardless of order* |
| No filesystem, clock, random or checkpoint calls | `purity.test.ts` — spies on `Date.now`, `Math.random`, `performance.now`, `hrtime.bigint`, web crypto and every configurable function on `crypto`, `fs`, `fs/promises` (> 50 spies, with a sanity assertion that they are live); the projection is the only call. **Watched fail** with an injected `Date.now()` + `fs.existsSync`. Plus: the renderer's own fields are only converters, reserve, projection and normalizer (no store/clock/ID/logger), the packlet's imports are allow-listed, and input is not mutated |
| Only actually-included revisions and update IDs appear in receipts | `renderer.test.ts` › *receipt honesty* — at every character budget from the reserve to a full fit, the receipt equals one **derived independently from parsing the text**, round-trips its own converter, and `requiredUpdates` equals the undelivered required IDs |
| A required payload that does not fit remains unacknowledged | *multi-revision required updates* (abbreviated rev 3 keeps no update ID while rev 4 is receipted; outright omission; optional vs required counting) and *truncation of results* |
| Partial visible trees never establish parent completion | *partial visible trees never establish parent completion* (partial and complete input, all visible children succeeded, parent still `running`, no aggregate field or phrase); *an omitted child is reported as omitted* |
| Task prose is data | *treating task prose as data* — frame close, fake section header, Mustache, fence, controls, bidi, zero-width, separators; exact JSON round-trip; framing text byte-identical with and without hostile input; single-line fields reject controls |

The plan's named test topics each have a `describe`: overlapping scopes reduced to duplicate
snapshots; duplicate conflicting revision data; all budget boundaries **including the framing
reserve** (reserve − 1 rejected, reserve exactly renders nothing, an item fits at exactly its cost
and not one character less, every omission reason at once within one item's room, a
text-length ≤ maxChars sweep); depth omissions; unknown totals; empty data; partial and
non-exhaustive input; multi-revision required updates; truncation of results; hostile text /
Mustache / control characters; snapshot receipts without event history.

---

## Review

**Layer 1 — `code-reviewer`, before coverage closure.** No P1.

- **P2 — the revision tie-break was an untested real path.** Two revisions of one task at the
  same rank only differ by revision. **Fixed** with a test (and the lower revision is the one kept
  under an item budget of one).
- **P2 — tie-break wording diverges from §9.** **Dispositioned** as decision 4 above, flagged for
  the design authority; the design doc is outside this slice's paths.
- **P3 — `?? 0` in the depth lookup was unreachable.** **Fixed by restructuring**, not by a
  directive: cycle refusal and depth are now separate functions, and depth is a walk that cannot
  miss. The second uncovered branch (an unresolved item reaching the revision comparator) went the
  same way — the item now carries its sort key.
- **P3 — escaping omitted zero-width and ALM/BOM characters.** **Fixed**: U+061C, U+200B–U+200D,
  U+2060, U+FEFF added, with test coverage.
- **P3 — `IUnresolvedTaskReference.revision` doc read as contradictory.** **Fixed**: it is the
  registration record's catalog revision, not a presentable state.
- **P3 — local `omittedItems` vs field `visibleItems`.** **Fixed** (renamed).
- **P3 — `allTaskResults` is a detail-preserving `mapResults`.** **Dispositioned**: `mapResults`
  drops `DetailedResult` detail. Kept package-local (eight lines); **a `ts-utils` candidate** if a
  second slice needs it — record in `TECH_DEBT.md` at stream close rather than repeat it.

**Layer 2 — Copilot, round 1: two posted findings, two more only in the summary's file table;
all four real, all fixed.**
1. *Depth recomputed by a full ancestor walk per item — quadratic on a deep chain within the
   10,000-entry bound.* Fixed: one walk per node across the whole render, memoized, with
   `Set`-based cycle detection; a 2,000-deep chain test pins exact depths including siblings whose
   walks stop at a measured ancestor.
2. *The receipt-honesty sweep stepped by 7, so it did not establish "at every budget".* Fixed:
   step 1. A test named for a property must check the property.
3. *(summary only)* **`diagnostics` returned the raw `IUnresolvedTaskReference`, binding and all
   — a disclosure path around the projection.** The symmetry hole the brief warned about: the text
   never rendered the binding, but the structured view beside it handed it over. Fixed with
   `ITaskContextDiagnostic`, and a test that the structured view contains no binding.
4. *(summary only)* The `CAPABILITIES.md` example did not unwrap the result or define the
   projection. Fixed.

Worth recording: as in T1, **half this round's substance was not posted as comments.**

**Layer 2 — Copilot, round 2: `Findings: None` posted, and a headline saying "unresolved moderate
findings remain in the renderer, escaping, and bounded input validation" — with nothing named.**
This is the exact shape T1 warned about, so it was treated as a pointer, not a pass: I hunted the
three named areas myself and found two real defects, each shown failing before its fix.
1. **`boundedArrayOf` checked the length *after* converting every element** (a T1 primitive,
   used by all 18 bounded arrays in the package). The cap bounded the result, not the work: a
   million-entry `tasks` array was validated in full before being refused. Now the length is
   checked first; a counting-converter test proves no element is touched when the array is
   oversized.
2. **Escaping missed invisible code points outside the listed set** — above all the Unicode tag
   block (U+E0000–U+E007F), which spells an ASCII message a reader cannot see and a model can,
   plus variation selectors, soft hyphen, U+180E, invisible operators and interlinear
   annotation marks. Now escaped; variation selectors go by `\p{Variation_Selector}` because
   a selector inside a regex class trips `no-misleading-character-class`. The hostile-text test
   smuggles "IGNORE" in tag characters and asserts no such code point survives.

Whether these are what Copilot meant cannot be known from its output; they are what the three
areas it named actually contained.

**Layer 2 — Copilot, round 3: again `Findings: None` posted, and a headline naming two issues —
both real, both fixed, each watched failing first.**
1. **Depth disagreed with `parent` across revisions.** A task reparented between two supplied
   revisions rendered its older revision with that revision's own `parent` but the newest
   revision's depth. Each revision's depth is now measured from the parent that revision names
   (the task's current position is still walked first, so cycle refusal is unchanged); an older
   revision naming itself as parent is `invalid`.
2. **Round 2's `boundedArrayOf` fix dropped the converter `context` argument** — the wrapper
   called the element converter without it. Now passed through, with a test using a
   context-dependent element converter. A regression introduced by a review fix, caught by the
   next round: the reason the loop runs past the first clean-looking pass.

---

## Things a later slice must decide

1. **T7: baseline obligations vs one-update-per-category.** Design §9's bootstrap IDs are
   `(subscriptionId, taskId, revision, 'initial')`. If T7 models a baseline as an `ITaskUpdate`
   with a category, it collides with a real update of that category at the same revision under
   T2's rule, and the receipt entry cap (7) does not count it. T7 either gives baselines their own
   representation or revises the rule and the cap together.
2. **T7: what an abbreviated entry means to acknowledgement.** T2's receipt keeps the revision of an
   abbreviated item with no update IDs. T7 clears obligations by exact update ID only, so this is
   safe — but T7 must not treat "revision present" as delivery.
3. **I2: the text is one block.** Sections (`[attention]`, `[updates]`, `[current]`,
   `[diagnostics]`, `[omissions]`) live inside one framed text meant for the single trailing
   per-request slot. If I2 wants separate fragments, it should split on the framing the renderer
   owns rather than re-render.
4. **Input size bounds are sanity bounds, not measured.** 10,000 entries per list and 200 items
   per receipt. The renderer is O(n log n) apart from visible-depth walks, which are O(depth) per
   item.
5. **Design §9 tie-break wording** — see decision 4.

### The two open questions

1. **Source-history spelling** — not reached. Nothing in T2 names it.
2. **Executor-payload dereference** — **did not reach T2.** The renderer never dereferences any
   reference: artifacts and attention render as opaque `[namespace, key]` pairs, and details and
   binding are never rendered. Nothing here needed either answer.

### Upstream

Nothing new escalated. T1's `strictObject` null-prototype observation stands; T2's converters
inherit it for the same reason and the same `JSON.parse` argument applies.

---

## Gate results

Recorded after the final run — see `state.md` phase 3.
