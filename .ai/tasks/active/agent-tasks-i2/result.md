**Shipped:** Agent task context can go into a cacheable prompt as its one trailing per-request slot — composition checked, the body sent required to be the body analyzed — and a delivery's receipt can be acknowledged only against the exact text that was sent.

# Result — `agent-tasks-i2`

**I2 does not close the cluster.** P1 follows; artifacts stay in `.ai/tasks/active/agent-tasks-i2/`,
and this family finalizes at cluster close. Written 2026-10-01.

---

## What shipped

- **`prompt` packlet** (`src/packlets/prompt/`, new; 3 files, 0 over 400 lines).
  - `fragments.ts` — `defaultTaskContextSlotName` (`taskContext`), `taskDataInterpretationRules`,
    `taskContextSlot()`, `taskPromptTemplate()`, `taskPromptDescriptor()`, `taskPromptRecord()`,
    `taskContextSubstitutions()`.
  - `checkedPrompt.ts` — `checkTaskPrompt()` → `ICheckedTaskPrompt` (`system`, `cacheRequest`,
    `taskSlot`, `stablePrefixChars`, `threshold`, `resolved`, `receiptFor(sentSystem)`);
    `ITaskPromptLibrary`, `ITaskPromptRequest`, `ITaskPromptThreshold`.
  - `handoff.ts` — `prepareTaskPrompt()` → `ITaskPromptHandoff` (`prompt`, `context` without its
    receipt, `deliveryId`, `expiresAt`, `acknowledge(sentSystem)`, `abandon()`).
- **`serializeTaskData`** published from `context/escaping.ts` — the renderer's `quoteData` applied
  to every string of a JSON value, keys included; fails on a non-finite number, a non-JSON value, or
  a cycle.
- **`task_inspect` details are framed** — `details` is now that escaped one-line text (a `string`),
  and `maxDetailsChars` bounds the escaped text. Breaking for a host reading `details` as an object;
  `ts-agent-tasks` is unpublished, change file `minor` with `BREAKING:`.
- **Dependency:** `@fgv/ts-prompt-assist` (`rush add -p`; 3-line lockfile diff), as
  `development-design.md` § packlets lists it.
- **`ts-prompt-assist` and `ts-extras` unchanged.** No upstream bug was found that needed a fix.

## The decision: how a receipt is bound to the prompt that was sent

The three candidates were checked against the actual surfaces before ranking.

| candidate | buildable? | the fact that decided it |
|---|---|---|
| **1. Bind to the emitted text** | **The binding, yes; the brief's carrier for it, no.** | `IPromptComposition.sections` gives a canonical slot text: offsets are computed during the render (`renderWithSegments`), never searched, and `body.slice(start, start + chars)` is exactly the substituted value (`PromptLibrary._buildComposition`, read in source; asserted in `checkedPrompt.test.ts`). So "the slot's text in the emitted body" exists. What does **not** exist is a way for the *receipt* to carry a hash that *acknowledgement* checks: `ITaskInclusionReceipt` is T2's canonical shape, `acknowledge` compares it in full against T7's stored manifest (`broker/delivery.ts` `_issuedMatch`), and the broker never sees the sent body. Adding a hash means changing the receipt converter, the manifest and storage — `storage/` is out of this slice's surface. |
| **2. Bind to composition identity** | **No.** | `IPromptComposition` has no identity: no id, no hash, no revision (`ts-prompt-assist` `types/trace.ts`). It would need an upstream change, and the brief rules that out except for a demonstrated bug. And, as the brief says, identity that does not cover slot content cannot tell a changed slot from an unchanged one. |
| **3. Refuse the shape** | Yes — and it is half of what shipped. | The library cannot observe the wire, so *some* host assertion of what was sent is unavoidable. |

**What shipped is candidate 1's binding, held where it can be checked, behind candidate 3's
handoff.** The text binding lives in the handoff object, not in the receipt: the check holds the exact
body it analyzed, and the receipt is released only against a string equal to it. Full equality is
stronger than a hash and needs none, because the binding never leaves the process — a hash would only
earn its place if the binding had to be persisted or transported, and it does not.

**What makes a receipt unacknowledgeable after its slot changes:**

1. **At composition** — `prepareTaskPrompt` checks the resolved body (one task slot, last, from this
   substitution, with the context's text exactly, nowhere else). A dropped, repeated, moved,
   overridden (enforced binding), or rejected (length cap) slot fails the check, and the helper
   **abandons the delivery's manifest** before returning. T7's acknowledgement matches only a
   manifest the subscription still holds, so the receipt `prepare` issued is dead *by any path* —
   including a host that captured it from `prepare` directly (`handoff.test.ts` › *a prompt that
   drops the task slot…* acknowledges the captured receipt through the delivery and is refused).
2. **After composition** — `handoff.acknowledge(sentSystem)` requires `sentSystem === prompt.system`.
   Anything else (a prefix the host added, an edited or truncated slot) abandons the manifest and
   fails `invalid-receipt`; the exact text afterwards is refused too.
3. **The receipt is never handed out on the delivery path.** `ITaskPromptHandoff` has no receipt;
   `context` is rebuilt from four named fields, so a field later added to `ITaskContext` is excluded
   by default; the handoff's keys are pinned by test.

**What the library guarantees, and what the host must do.** The library guarantees the three points
above. The host must pass the text it *actually sent* — not `prompt.system` by reflex — because the
library cannot see the wire; and must re-resolve and re-check after any change to the body, since old
offsets describe a different body. Both are in `CAPABILITIES.md` § *Prompt composition*.

**The snapshot path** (`checkTaskPrompt` with a host-rendered context) gives `receiptFor(sentSystem)`
with the same equality rule. There the context is trusted to be one render: the check binds the
context's *text* to the body, and that its *receipt* describes that text is T2's guarantee (layer-1
P2-a; documented on `checkTaskPrompt`). On the delivery path nothing is assembled by the host.

**"Receipt is never in prompt text or silently acknowledged by composition"** — tested, not asserted:
the substitution is the text only (`fragments.test.ts`), the delivery id appears nowhere in the body,
the merged-binding trace, the cache request or the checked object (`checkedPrompt.test.ts`), nor in
the system text of a real delivery (`handoff.test.ts`); after `prepareTaskPrompt` every owed id is
still pending (`handoff.test.ts` › *preparing and resolving acknowledge nothing*); and the public
surface exports no acknowledging prompt function (`publicSurface.test.ts`).

## The framing decision — `task_inspect` details

**Decided: details are data, framed like task prose.** The hazards the renderer escapes — tag-block
smuggling, bidi overrides, zero-width and other invisible characters, frame/Mustache/fence delimiters
— do not depend on which channel carries the text; a model reads a tool result as readily as a system
prompt. So `context` publishes `serializeTaskData`, and `task_inspect` routes details through it.

- **Shape:** `details` is one line of JSON text. It round-trips with `JSON.parse` to the host's value
  (tested on hostile input: `</task-context>` in a key, `{{…}}`, a backtick fence, U+2028, U+202E,
  ZWJ, BOM, a variation selector, and "IGNORE" in tag characters — none survives raw).
- **Budget:** `maxDetailsChars` counts the escaped text the model is shown, not raw JSON (a test
  where escaping pushes 20 `<` over the bound).
- **Unframeable details fail the call** (`invalid`, reason to the logger). Layer-1 P2-b asked for an
  explicit decision rather than `detailsOmitted`: this is I1a's rule that a failing projector fails
  the call, applied to projector output that cannot be framed. Found in the process: **the view's
  `JsonConverters.jsonValue` admits `Infinity`** (it would serialize as `null`). Not fixed here (no
  upstream change for a non-bug-blocking quirk); `serializeTaskData` refuses it, which is where the
  value would otherwise have been silently changed. Recorded in `docs/TECH_DEBT.md`.
- **Debt entry:** resolved in `docs/TECH_DEBT.md`, with this reason.

## Composition positively available vs nothing analyzed

An empty `cacheFindings` is never read as evidence. `checkTaskPrompt` requires a composition object,
no `unavailable` reason, and sections that start at 0, are contiguous, and sum to `body.length` (and to
`totalChars`). **The test that fails when this is not done:** `checkedPrompt.test.ts` › *deliberately
unavailable composition, with empty findings, fails* — a real `PromptLibrary` resolving a body with a
Mustache section, asserting first that the real composition has `unavailable` set **and**
`cacheFindings` equal to `[]`, then that the check refuses it. Matrix row I2-1 (accept an unavailable
composition) turns it red. Likewise `met` is never inferred from silence: no threshold finding with no
measure is `unknown` (row I2-13).

## Outbound evidence — real `PromptLibrary`, real request builders

`outbound.test.ts` resolves through a real `PromptLibrary` (`PromptStoreFixture` in-memory store,
records built by `taskPromptRecord`) and a real `TaskContextRenderer`, checks, then sends through
ai-assist's own `callProviderCompletion` / `executeClientToolTurn` with real provider descriptors and
`fetch` stubbed to record the body:

- **Anthropic:** `system` is exactly two blocks — `system.slice(0, taskSlot.start)` with
  `cache_control: { type: 'ephemeral' }`, then the context text with none; they concatenate to the
  checked body; the context occurs on the wire exactly once.
- **OpenAI:** the system content parts concatenate to the checked body, the first part is the prefix,
  the last the context, and `prompt_cache_breakpoint` is present.
- **Tool-use turn:** the same system blocks and breakpoint ride beside `task_query` / `task_inspect`.
- **Post-check mutation:** a host prepending a date line sends a body whose old breakpoint cuts in
  the wrong place (both blocks differ from the checked ones), and `receiptFor` refuses both the
  mutated text and the reassembled wire text.

The real library caught a defect a fabricated composition would have hidden: `taskPromptTemplate`'s
first version emitted `{{name}}`, which `ts-prompt-assist` refuses at load ("use triple-brace").
`EditingLibrary` (a real library whose answer a test edits) is used **only** for refusals a real
library never produces — no positive claim rests on it.

## The two-request progress-only comparison

`outbound.test.ts` › *two requests changing progress only*: tasks `t1` (revision 3, completed 4 of 10)
and `t2`, then `t1` at revision 4 with completed 7, everything else equal.

- Both plans are `{ systemBreakpoints: [391] }` — **391 UTF-16 code units**, asserted as a literal and
  equal to the length of the stable prefix built independently from the fixture's parts.
- The first Anthropic block is byte-identical between the two captured requests; the task blocks
  differ (`"completed":4` vs `"completed":7`); the receipts differ (`t1` revision 3 vs 4).
- **Empty task set:** same breakpoint and prefix as a one-task context; the empty set still renders
  its framing and omission line, so a present-but-empty slot cannot look like a dropped one.
- **Unicode/astral:** instructions with `é`, `𝒜` and `—`, a task title with `🧪`: the breakpoint equals
  the prefix's `.length`, which differs from both its UTF-8 byte length and its code-point count;
  progress-only change keeps the plan.
- **Repeated text:** identical task titles and a host slot echoing one do not move the slot.

## Check-then-act windows

| window | what re-checks after it |
|---|---|
| `prepareTaskPrompt`: `prepare` issues a manifest → `await` resolve and check → `abandon` on failure | The receipt is never returned during the window, so nothing can acknowledge it. If the manifest expires or is abandoned meanwhile, `abandon` fails and the failure says so ("its receipt expires unacknowledged"); still nothing acknowledgeable was handed out. |
| `handoff.acknowledge`: compare `sentSystem` → `delivery.acknowledge` | No `await` between them: `receiptFor` is synchronous. Everything after is T7's own fenced path (manifest match, policy epoch, per-task record revisions, inside the writer). |
| handoff state across calls (`refused`, `acknowledged`) | **Copilot round 1 found this window open** — the flag was set after the `await`, so an exact acknowledgement in flight and a mismatched send could interleave and the mismatch abandon the manifest mid-acknowledgement. Now every call on one handoff runs through a serial queue, and `refused` is set **before** the abandonment is awaited, so no flag is ever read while another call sits between its check and its act. A delivery that throws rejects that call only; the queue continues (tested). |
| `checkTaskPrompt`: `await library.resolve` → checks | The checks run on the returned value only; nothing is read twice. A throwing library, or a check that throws on a malformed answer, is captured as a failure (layer-1 P3-b). |

## Revert matrix — run on final source

Rows `I2-1`…`I2-30` in `.ai/tasks/active/agent-tasks-i2/i2Matrix.js` (outside `perf/`, which the M1
cohort owned during this slice — folding them into `perf/mutationMatrix.js` is in `docs/TECH_DEBT.md`).
Suites `prompt/|context/|tools/|publicSurface`, run 2026-10-01 with `--pkg` on a `git archive` copy
of `91436488` (`diff -r` identical to the working tree; no library source changed after it), copy's
`node_modules` symlinked to the package's.

**30 rows, 0 UNVERIFIED, 0 `0 red`; 143 red tests in all.** One row needed correcting first:
**I2-2 did not build** on the first pass (its mutant compared against a cast that left `composition`
possibly undefined below it). Re-pointed to replace the refusal with an empty-but-valid composition,
and re-run on the same copy: 1 red. A row that does not build is no evidence either way.

| row | verdict | tests that went red |
|---|---|---|
| I2-1 an unavailable composition is accepted | 1 red | composition must be positively available › deliberately unavailable composition, with empty findings, fails |
| I2-2 a missing composition is not refused by name | 1 red | composition must be positively available › a library answering with no composition fails |
| I2-3 a gap between sections is accepted | 1 red | composition must be positively available › sections with a gap, or that do not cover the body, fail |
| I2-4 sections need not cover the body | 1 red | composition must be positively available › sections with a gap, or that do not cover the body, fail |
| I2-5 a repeated task slot is accepted | 1 red | the task slot: exactly one, last, per-request, carrying the whole issued context › a repeated task slot fails |
| I2-6 the task slot need not be last | 1 red | the task slot: exactly one, last, per-request, carrying the whole issued context › anything after the task slot fails — no trailing literal, no trailing slot |
| I2-7 a slot filled by an enforced binding or a default is accepted | 2 red | the task slot: exactly one, last, per-request, carrying the whole issued context › a slot reporting any other source fails<br>the task slot: exactly one, last, per-request, carrying the whole issued context › an enforced binding overriding the task slot fails |
| I2-8 the slot's text need not be the context's | 1 red | the task slot: exactly one, last, per-request, carrying the whole issued context › a slot whose text is not the context's, exactly, fails |
| I2-9 the context may also appear elsewhere in the body | 1 red | the task slot: exactly one, last, per-request, carrying the whole issued context › the context appearing anywhere else in the body fails: it must be included exactly once |
| I2-10 the task slot may claim better than per-request | 1 red | the task slot: exactly one, last, per-request, carrying the whole issued context › a false frozen claim on the task slot fails |
| I2-11 an empty stable prefix is accepted | 1 red | the task slot: exactly one, last, per-request, carrying the whole issued context › a body that is only the task context has no stable prefix, and fails |
| I2-12 refusing cache findings are ignored | 3 red | cache findings are handled: ordering and refutation fail the check › a false frozen declaration on a host slot fails<br>cache findings are handled: ordering and refutation fail the check › intentionally cache-hostile placement fails<br>cache findings are handled: ordering and refutation fail the check › volatile content ahead of everything leaves no cacheable prefix, and fails |
| I2-13 met is inferred from silence | 1 red | met is never inferred from silence › no threshold finding, but nothing measured: unknown, not met |
| I2-14 the breakpoint plan need not end at the task slot | 1 red | cache findings are handled: ordering and refutation fail the check › a plan whose breakpoints do not end at the task slot fails |
| I2-15 the receipt is released against any sent text | 6 red | a changed or dropped task slot prevents acknowledging the original receipt › a refusal is classified invalid-receipt<br>a changed or dropped task slot prevents acknowledging the original receipt › text sent that differs from the checked body is refused, and the receipt is dead from then on<br>a checked handoff › after an acknowledgement, a mismatched send is refused without killing the idempotent replay<br>the outbound system body is the analyzed body, with its breakpoint where the plan put it › a host that mutates the body after the check sends what the plan does not describe — and gets no receipt<br>… and 2 more |
| I2-16 the host's substitutions may fill the task slot | 1 red | the task slot: exactly one, last, per-request, carrying the whole issued context › the host's substitutions may not name the task slot |
| I2-17 a failed check leaves the issued receipt live | 2 red | a changed or dropped task slot prevents acknowledging the original receipt › a prompt that drops the task slot fails the prepare, and the issued receipt is abandoned<br>when the delivery itself fails › if abandoning after a failed check also fails, the failure says so |
| I2-18 a mismatched send leaves the receipt live | 2 red | a changed or dropped task slot prevents acknowledging the original receipt › text sent that differs from the checked body is refused, and the receipt is dead from then on<br>when the delivery itself fails › if abandoning after a mismatched send also fails, the failure says so |
| I2-19 the handoff hands back the context with its receipt | 1 red | a checked handoff › carries the prepared context in its trailing slot, and no receipt anywhere |
| I2-20 a mismatched send after acknowledgement abandons it | 1 red | a checked handoff › after an acknowledgement, a mismatched send is refused without killing the idempotent replay |
| I2-21 details reach the model unescaped | 2 red | an inspection is bounded › details are returned only when the host exposes them and they fit › the bound counts the escaped text the model is shown, not the raw JSON<br>details are task data: framed and escaped like task prose › no frame-breaking or invisible character reaches the model raw, and the text parses back exactly |
| I2-22 the details budget counts raw JSON, not the escaped text | 1 red | an inspection is bounded › details are returned only when the host exposes them and they fit › the bound counts the escaped text the model is shown, not the raw JSON |
| I2-23 a non-finite number is serialized | 2 red | details are task data: framed and escaped like task prose › details with no JSON form fail the inspection; why goes to the host, not the model<br>serializeTaskData › a number with no JSON form fails, naming where it was |
| I2-24 a cycle is not detected | 1 red | serializeTaskData › a value that contains itself fails; one shared twice, without a cycle, does not |
| I2-25 serialized task-data strings are not escaped | 3 red | an inspection is bounded › details are returned only when the host exposes them and they fit › the bound counts the escaped text the model is shown, not the raw JSON<br>details are task data: framed and escaped like task prose › no frame-breaking or invisible character reaches the model raw, and the text parses back exactly<br>serializeTaskData › strings — keys included — are escaped as the renderer escapes task prose |
| I2-26 the template puts the task slot first | 35 red | a changed or dropped task slot prevents acknowledging the original receipt › a host abandoning the handoff leaves its receipt unacknowledgeable<br>a changed or dropped task slot prevents acknowledging the original receipt › a refusal is classified invalid-receipt<br>a changed or dropped task slot prevents acknowledging the original receipt › text sent that differs from the checked body is refused, and the receipt is dead from then on<br>a checked handoff › acknowledging with the exact text sent discharges exactly what was included; a replay is idempotent<br>… and 31 more |
| I2-27 fixed text may form a Mustache tag | 2 red | taskPromptDescriptor and taskPromptRecord › the record is unconditional and its template follows the declared slot order<br>taskPromptTemplate › refuses fixed text that could form a Mustache tag |
| I2-28 slot names are not validated | 1 red | taskPromptTemplate › refuses a slot name that is not a Mustache name, since it is interpolated into the template |
| I2-29 the task slot is declared frozen | 31 red | a changed or dropped task slot prevents acknowledging the original receipt › a host abandoning the handoff leaves its receipt unacknowledgeable<br>a changed or dropped task slot prevents acknowledging the original receipt › a refusal is classified invalid-receipt<br>a changed or dropped task slot prevents acknowledging the original receipt › text sent that differs from the checked body is refused, and the receipt is dead from then on<br>a checked handoff › acknowledging with the exact text sent discharges exactly what was included; a replay is idempotent<br>… and 27 more |
| I2-30 the substitution carries the receipt | 35 red | a changed or dropped task slot prevents acknowledging the original receipt › a host abandoning the handoff leaves its receipt unacknowledgeable<br>a changed or dropped task slot prevents acknowledging the original receipt › a refusal is classified invalid-receipt<br>a changed or dropped task slot prevents acknowledging the original receipt › text sent that differs from the checked body is refused, and the receipt is dead from then on<br>a checked handoff › acknowledging with the exact text sent discharges exactly what was included; a replay is idempotent<br>… and 31 more |

## Review

### Layer 1 — `code-reviewer`, before coverage work

**No P1.** Two P2, eight P3; the reviewer found no path for the receipt into text, trace or
observers, and no way for a changed slot to release the original receipt.

| finding | disposition |
|---|---|
| **P2-a** the receipt-to-text pairing in `checkTaskPrompt` is trusted, not verified — a host mixing two renders' fields gets one's receipt against the other's body | **Documented** on `checkTaskPrompt` and above: the snapshot path trusts the context to be one render (T2's guarantee); the delivery path takes it from the delivery that issued it. Verifying would need a text hash in the receipt — a T2/T7 surface change. |
| **P2-b** `task_inspect` now fails the call on non-JSON details | **Kept, decided** (above), with a test. |
| P3-a `met` inferred from the absence of threshold findings; a non-null assertion | **Fixed**: `met` requires `totalMeasured`; the map lookup and `!` are gone. Test + row I2-13. |
| P3-b a check that throws after `prepare` leaves the manifest live | **Fixed**: the check runs inside `captureResult`. Test. |
| P3-c a mismatched send after a successful acknowledgement abandoned the acknowledged manifest, breaking replay | **Fixed**: the handoff remembers its acknowledgement and then refuses without abandoning. Test + row I2-20. |
| P3-d awkward `captureAsyncResult(...).then(...)` flattening; resolve failures classified `invalid` | Flattening **fixed**. Classification **kept**: a resolve failure (unknown prompt, store fault, safeguard rejection) is not one the helper can classify further, and `invalid` + `after-host-action` is the honest answer. |
| P3-e needless cast; no cycle guard in `serializeTaskData` | **Fixed** both: cast removed; a cycle fails by path (row I2-24). |
| P3-f long doc lines | `fixlint` run; build and lint are clean. |
| P3-g `taskPromptTemplate` did not validate slot names as Mustache names | **Fixed** with `ts-prompt-assist`'s own `Convert.slotName` (row I2-28). |
| P3-h "non-empty stable prefix" is only "starts after 0" | **Accepted**: `no-cacheable-prefix` covers a prefix with nothing stable in it; the doc says "precedes it". |

The reviewer also noted two weaker assertions (receipt `included` lists that a broken binding would
leave equal); the binding is pinned by the mismatch tests, so no change.

### Layer 2 — Copilot

**Round 1 — one high, three medium, three low; all seven real, all fixed.** The first two
`@copilot review` comments (12:20, 13:41 UTC) never registered; the API request at 14:32 did.

| finding | fix |
|---|---|
| **(high)** handoff state updated only after the awaited acknowledgement: an exact acknowledgement and a mismatched send overlapping could abandon the manifest mid-acknowledgement | handoff calls serialized; tests run both orders concurrently (exact first: it succeeds, the mismatch is refused without abandoning, replay survives; mismatch first: it abandons, the exact one is refused, every obligation still owed); a throwing delivery does not wedge the queue. Row I2-31 |
| **(medium)** a failed abandonment left the handoff live, so a later exact acknowledgement released a still-issued receipt — contradicting "a mismatched send kills the receipt" | `refused` is terminal and set before the abandonment is awaited; `abandon()` sets it too. Tests for both failing-abandon paths. Rows I2-32, I2-33 |
| (medium) `slot in substitutions` sees inherited properties, so a task slot named `toString` / `constructor` was refused | own-property check; test resolves real prompts with both names. Row I2-34 |
| (medium) the partition check accepted negative or fractional section lengths whose offsets still added up | each length must be a non-negative integer; test with `+5/−5` and `+0.5/−0.5` pairs that pass the old loop. Row I2-35 |
| (low) `serializeTaskData`'s TSDoc linked the internal `quoteData`, baking an `ae-unresolved-link` into `api.md` | plain prose; `api.md` regenerated, 0 unresolved links |
| (low) this section held a placeholder | this table |
| (low) `state.md` stale | updated |

Layer 1 had flagged the same concurrency window (P3-c) and the fix then stopped at the
already-acknowledged case; round 1 is the same window one step further — a check-then-act across an
`await`, exactly the class the brief's trap 3 names. The matrix was re-run on the round-1 source.

## What P1 can rely on

P1's journey step 9 resolves the final prompt with real prompt-assist composition, captures the
ai-assist request, changes only progress, compares prefix/breakpoints, and rejects foreign/modified
receipts. The surface for it:

- `taskPromptRecord({ scope, id, title, instructions, stableSlots })` → a record for
  `PromptStoreFixture.build` / a `FileTreePromptStore`; `PromptLibrary.create({ store, qualifiers: [] })`.
- `prepareTaskPrompt({ delivery, library, request })` → `prompt.system` / `prompt.cacheRequest` to
  send; `acknowledge(<sent system>)`. A modified sent text is `invalid-receipt` and kills the
  receipt; a foreign receipt is T7's refusal, unchanged.
- `checkTaskPrompt` for the snapshot-only branch, `receiptFor(sent)` for its receipt.
- `prompt.cacheRequest.systemBreakpoints` is `[prompt.taskSlot.start]` for a prompt whose prefix is
  one stability level; a `per-conversation` host slot adds an earlier breakpoint.
- **Not given:** any statement about provider cache hits; `HorizontalComposer` integration.

## Routed

- `docs/TECH_DEBT.md`: fold `I2-1…I2-30` into `perf/mutationMatrix.js`; `JsonConverters.jsonValue`
  admits `Infinity`.
- Resolved: the I2-triggered `task_inspect` details entry.

## Gate results

Run on the final library source (`91436488`; later commits change only docs and this directory).

| gate | result |
|---|---|
| `rushx build` (`heft build --clean`) | Finished, **zero warnings** |
| `rushx lint` / `rushx fixlint` | clean; `fixlint` run before the final source commit |
| `rushx test` | **2394 tests**, 100% statements / branches / functions / lines, **0 `c8 ignore`** in `src/packlets` |
| this slice's suites | `prompt/checkedPrompt` 31, `prompt/handoff` 12, `prompt/fragments` 11, `prompt/outbound` 8, `context/taskData` 7, `tools/bounding` 31 (3 new), plus one each added to `publicSurface` and amended in `context/purity` |
| `rush change --verify --target-branch origin/integration/agent-tasks-v1` | passes; change file `minor`, `BREAKING:` prefix |
| repo-wide `install-run-rush.js rebuild` | exit 0, no warnings |
| repo-wide `install-run-rush.js test` | exit 0 (37 projects) — required: `task_inspect` changes what it returns |
| `verify-capability-docs` | 22,038 / 24,000 chars, 0 failed |
| `generate-capability-feed --check` | 0 stale |
| `verify-esm-entrypoints` | 24 checked, 0 failed |
| `verify-bundler-resolution` | 20 checked, 0 failed |
| `verify-tarball-exports` | 26 packages, 205 manifest paths, 0 failed |
| revert matrix | 30 rows, all red (above) |
