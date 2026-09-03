# Workstreams — fgv

The canonical doc for in-flight and completed parallel workstreams.
Each entry is a kickoff brief — designed so a fresh agent (or fresh
human) can pick it up cold from this doc plus the linked reading
list, without re-creating any of the design discussion that produced
it.

---

## Repo shape (load-bearing context)

This repo is a set of related but distinct utility libraries under
`libraries/` (plus CLI tools under `tools/`), not a single coherent
product. Work is mostly **reactive, consumer-driven, feature-shaped**:
external consumers batch up feature requests as they do major work;
we service those batches and publish an alpha; consumers integrate;
once at least one consumer has applied a feature end-to-end, we
treat that surface as validated. A feature commonly touches 1–3
packages, so the unit of work is the **feature**, not the package.

**Lockstep version policy.** When we publish, we publish everything.
Independent roadmaps per library, single shared version. Sizing the
blast radius of any stream needs to account for this — a change in
one package ships in the same alpha as every other package's changes.

**Stability-via-consumption.** We presume instability until at least
one consumer has applied a feature end-to-end. `release` and the
alphas published from `prerelease` are post-feature-PR but
pre-validation. Production promotion is gated on observed consumer
use, not just CI green. Case in point: a -25 → -26 type-tightening
that would have been a production regression if -25 had shipped to
main.

## Branch flow

```
agent feature branches ─PR─▶ release ──mirror──▶ prerelease ──npm-publish─▶ alpha
                                │
                                └── promote (test/docs gate, not code review) ──▶ main
```

- **`release`** is the buffer line. Feature PRs merge here. Iterative
  review cycles, followups, and slips are absorbed here.
- **`prerelease`** mirrors `release` immediately. The only deltas vs.
  `release` are `package.json` / version-policy files and Rush
  changelogs. Alphas publish from `prerelease` via the
  `npm-publish` GitHub workflow.
- **`main`** is the canonical line. Promotion `release` → `main` is
  a release event — it accumulates a long delta and is gated on
  **test/docs/sibling-sweep, not code review** (each constituent PR
  was reviewed on its way into `release`; the unified delta is too
  large for meaningful re-review).

A branch-model evolution to a more conventional "main is tip,
hotfix branches off main" topology is on the roadmap; see the
relevant entry in this file when it's drafted.

## Status conventions

- 🟢 ready to start (all hard dependencies met)
- 🟡 ready but trailing on a soft dependency, or trigger TBD
- 🔵 in flight (active design or implementation)
- 🔴 blocked (hard dependency unmet)
- ✅ shipped (merged to `release`)

## Stream entry shape

Every stream entry declares, at minimum:

- **Mission** — 1–2 sentences.
- **Package surface** — explicit list of packages this stream
  expects to modify (e.g. `ts-extras/ai-assist`, `ts-app-shell/ai-assist`).
  This is both the reading-aid and the collision-avoidance metadata
  for parallel streams.
- **Out-of-scope** — paths this stream will NOT touch, when
  collision avoidance with another stream depends on it.
- **Acceptance criteria** — exit gates.
- **Artifact pointer** — `.ai/tasks/active/<stream-id>/`.

Full kickoff-prompt shape: `.ai/conventions/workflow/kickoff-prompt-shape.md`.

## Branch base

New streams branch from current `release` HEAD. There is no shared
"wave base" — streams are mostly independent, and the few real
file-boundary conflicts are caught by the package-surface and
out-of-scope declarations in the stream entry. `.ai/BASELINE.md`
pins the last `release` → `main` promotion (i.e. the last
published lockstep version), used as a recovery referent and for
sizing blast radius, not as a stream-start gate.

## Stream versions

Used when a stream's deliverable splits into independently-shippable
phases. Each version has its own brief, status, dependencies, PR,
and task-artifact directory. Reserve for streams where the phases
are genuinely separable shipping units.

## Shared types between parallel streams

When two parallel streams share a type, pick exactly one pattern:

1. **Coordination commit**: land the shared type as a small commit
   before either stream branches.
2. **Narrower consumer interface**: consumer defines a smaller,
   distinctly-named interface exposing only the methods it needs.
3. **Lock ownership in kickoff prompts**: exactly one stream owns
   each shared symbol; the other is told explicitly NOT to define it.

Never have two parallel streams publishing the same symbol.

## Artifact protocol

Every workstream maintains live artifacts at
`.ai/tasks/active/<stream-id>/{brief.md, state.md, result.md}`
throughout the run. **Migrate to `.ai/tasks/completed/<YYYY-MM>/<stream-id>/`
and write a polished `README.md` as part of the PR — before merge,
not as a follow-up.** See `.ai/conventions/workflow/artifact-protocol.md`.

## Out-of-scope packages

The sudoku packages (`ts-sudoku-lib`, `ts-sudoku-ui`) are slated to
move to their own monorepo and are out of scope for the workflow
substrate. Don't queue streams against them here.

---

## Active workstreams

### `prompt-composition-metadata` ✅ (shipped 2026-09-02 via #663 — additive)

**Status:** ✅ shipped via **#663**, stacked on #661 (same pattern as #662). Gates green — build / lint / test at **100%** in `@fgv/ts-extras` (2789 tests) and `@fgv/ts-prompt-assist` (280), repo-wide `rush rebuild` at exit 0 with **zero warnings**, change files for both verified against `origin/release`, `@fgv/testbed` (the one downstream consumer) green. **One `c8` directive in the whole stream** (the identity check described below) — flagged for sign-off.
**Package surface:** `@fgv/ts-extras` (`MustacheTemplate.renderWithSegments`, `IRenderedTemplate`, `IRenderedSegment`), `@fgv/ts-prompt-assist` (`IPromptComposition` family, opt-in on `PromptLibrary.resolve`).
**Artifacts:** `.ai/tasks/completed/2026-09/prompt-composition-metadata/`
**Origin:** the user's own question, framed explicitly as exploration — *"what would it look like to produce a metadata object along with each generated prompt indicating the order and relative size of each section"*, amended mid-turn to absolute size — then escalated to **"let's build the real thing. I usually regret shortcuts."**

**Shipped:** two surfaces answering the same question — *what is in this output, in what order, and how much of it is each part*. `renderWithSegments` returns the text `render()` produces plus a document-ordered, contiguous, gapless attribution of every code unit to literal template text or a named interpolation. `IPromptComposition` layers the anti-jailbreak preface and per-slot binding provenance on top, opt-in, with an optional caller-supplied `measure` for a second unit.

**The shortcut the user pre-empted is the whole design.** Recovering each section's offset by searching the finished text for the substituted value needs no new primitive and is a few lines. It is wrong four ways — a value used twice (reports the first occurrence for both), a value that is a substring of the literal text (`the {{w}} the` reports 0; the substitution is at 4), a value that renders empty (nothing to search for), and a value escaping alters (`<b>&</b>` appears nowhere in its 29-char escaped output). Each is now a test. What makes it worth a primitive rather than a caveat is that it fails **silently, with plausible offsets** — the worst property a diagnostic can have. Computing offsets during the render is the only sound way, and only `MustacheTemplate` owns the token list, so the work extended the sibling library rather than working around it.

**An invariant check written expecting to be unreachable fired — and the first fix for it was itself a shortcut.** `renderWithSegments` compares its accumulated text against `render()` before returning. The first implementation rendered each interpolation by slicing the raw template and handing the slice back to the writer, which **re-parses it with the default delimiters** — so `A{{=<% %>=}}<%v%>B` renders `AXB` but was mapped as `A<%v%>B`. The check caught it. The first response was to **refuse** such templates, filed alongside the refusal of sections, inverted sections and partials as though the four were alike. **They are not.** A section has no correct linear map — it may repeat its body or omit it. A set-delimiter template has one; the implementation merely could not compute it. Refusing a case with a well-defined answer, because of how one chose to render, is a property of the implementation dressed up as a property of the problem. **Fixed at the cause:** each interpolation now renders from its already-parsed token via `Writer.escapedValue` / `unescapedValue` — the same primitives `render()` reaches through `renderTokens`. Delimiters are a parse-time concern, so once a token exists they are invisible, and the whole hazard class is gone rather than documented. It also stops reimplementing value semantics: dotted paths, lambdas, `null` rendering empty and non-string coercion are now delegated, verified across eleven shapes against `render()` before the change was written. `@types/mustache` types the primitives' token parameter as `string[]` while a parsed span carries numeric offsets — handled by building the `[type, name]` pair they actually read, not by casting around the typings. The check is **kept**, now genuinely unreachable, carrying **the stream's sole `c8` directive**; it has already earned its keep once.

**Three uncovered branches, three different right answers, no directives.** `sec.measured ?? 0` was genuinely dead and was **removed** by accumulating the total as sections are built. `entry === undefined` on the slot lookup looked unreachable — every declared slot gets a `merged` entry, and `validateAndRender` fails the resolve for any absent variable — but `{{{.}}}` interpolates the whole render context, is never a declared slot, and no scanner rejects it; **reachable, now tested** (two earlier probes were wrong first). `winningScope === undefined` needed a scope-supplied binding the test helper could not seed; **helper extended, tested**. Asking *should this branch exist?* before *how do I cover it?* paid three times in one stream.

**A watched-it-fail run needs its own sanity check.** Sixteen neuters, applied one at a time — including one that **reinstates the slice-and-reparse**, turning exactly the two new set-delimiter tests red, so the fix is pinned by tests that fail against the code it replaced. The first `indexOf` simulation produced **zero** red tests — a `Math.max` collapsed it back to the correct value, making the neuter a no-op. Read as "the tests do not bite", the conclusion would have been exactly backwards. Rewritten as the genuine unsound implementation, it turns exactly the four soundness tests red plus the fifth zero-length case. Two lesser notes from the same run: two neuters never reached jest because a constant condition tripped `no-constant-condition` in the build's lint pass, and the detection script initially parsed for a reporter marker Heft does not emit. **When nothing goes red, suspect the harness before the tests.**

**Router headroom is now the binding constraint.** `.ai/instructions/LIBRARY_CAPABILITIES.md` sits at **17,870 of its 18,000-char cap** after this stream's two shortcuts. The next stream wanting a router entry must compress an existing one; the cap was raised once already (16,000 → 18,000) with *"the router grew is NOT a reason"* recorded alongside it.

### `schema-optional-translation` ✅ (shipped 2026-08-23 via #659 — additive)

**Status:** ✅ shipped to `release` via **#659** (`022dbf19`, 2026-08-23). Gates green — build / lint / test at **100%** in `@fgv/ts-extras` (2773 tests) and `@fgv/ts-json-base`, repo-wide `rush rebuild` at exit 0 with zero warnings, change files for both.
**Package surface:** `@fgv/ts-extras` (`ISchemaStructuredOutputRequest.adaptOptionalToNullable`, `hoistNullableOptionals`), `@fgv/ts-json-base` (`factories.ts` docstring only).
**Artifacts:** `.ai/tasks/completed/2026-08/schema-optional-translation/`
**Origin:** a PersonAIlity ask (personaility#644) asking us to revisit a decision we documented and declined. Stated priority **low** — nothing of theirs is blocked; the ask is about where a piece of provider knowledge lives.

**Shipped:** `adaptOptionalToNullable`, defaulting off. On a format requiring every property to be `required`, it lists an optional property in `required` when that property's node **already admits `null`** — instead of refusing the whole schema.

**We gave them the spelling they asked for and refused the semantics.** Their ask framed the flag as the caller *"asserting something about its own validator, which is the fact only the caller has."* **It is not a fact only the caller has — it is written on the schema.** `OptionalSchemaValidator.toJson()` delegates to its inner schema, so optionality lives only in the parent's `required` array; hoisting a nullable optional narrows the permitted replies from *absent-or-null-or-value* to *null-or-value*, a strict **subset** of what the supplied schema already accepts. The distinction is load-bearing rather than pedantic, because **an assertion can be false**: a caller with `optional(string())` could have set the proposed boolean and received a wire schema their own validator rejects at runtime — the precise drift `hasOptionalProperties` exists to prevent, reintroduced by the flag meant to work around it. Reading the condition off the schema makes the hazard *unsayable* rather than merely discouraged, which is the same discipline as `resolveJsonOutput`'s runtime-evidenced `expectedKind`. Their underlying complaint was right and is fixed: they now author `optional(x({ nullable: true }))`, which states what their converter does rather than what one provider demands.

**The verification is the original check, re-run.** The rewrite runs first and `hasOptionalProperties` then judges its output, so there is **no second notion of correctness to keep in sync** — a non-nullable optional survives the rewrite untouched, trips the guard, and routes through `onUnsupported` exactly as before. A partly-hoistable schema degrades or fails **whole**; it never sends a half-adapted schema.

**Our own tests caught the same class of error in our implementation.** The first cut gated the hoist on the flag alone rather than the format, and the test asserting the flag is *inert on Gemini* went red — it narrowed a reply on a provider with no all-required rule. That is this stream's own subject one level up: a rewrite justified by one provider's constraint, applied where that constraint does not exist. The test existed only because "inert where the rule does not apply" was written into the brief as a criterion rather than discovered afterwards.

**It could not satisfy the gate promoted one PR earlier, and that is filed rather than glossed.** #656's repo-wide `rush test` checkbox is unsatisfiable today: `@fgv/ts-json-base` fails a pre-existing root/`chmod` test and **Rush blocks every dependent**, so the run never reaches `@fgv/ts-extras` or anything downstream. Substituted an explicit run over all eight consuming packages (including `samples/testbed`); filed as **P2** in `TECH_DEBT.md`, because the failure mode is a box ticked for a run that tested nothing the rule protects.

### `json-schema-nullable` ✅ (shipped 2026-08-23 via #655 — additive)

**Status:** ✅ shipped to `release` via **#655** (`6c4b9125`, 2026-08-23). Gates green — build / lint / test at **100%** in `@fgv/ts-json-base` and `@fgv/ts-extras`, repo-wide `rush rebuild`, repo-wide `rush test`, change files for all three packages. CodeRabbit loop stopped at **1 round on diminishing returns**: two findings, both non-substantive (a GFM table-cell split on a pipe inside a code span; two `.orThrow()` calls in test bodies where the parse succeeding was itself the assertion), both fixed in `dd4d6caa`.
**Package surface:** `@fgv/ts-json-base` (`ISchemaOptions.nullable` and an overload on every factory; `fromJson`'s nullable union), `@fgv/ts-extras` (`toGeminiParameterSchema` dialect translation), `@fgv/ts-extras-mcp` (behaviour only — a nullable-schema tool now adapts), plus `.ai/instructions/LIBRARY_CAPABILITIES.md`.
**Artifacts:** `.ai/tasks/completed/2026-08/json-schema-nullable/`
**Origin:** a PersonAIlity ask. Brief, implementation and finalized artifacts land in one commit at the maintainer's instruction.

**Shipped:** `nullable: true` on every `JsonSchema` factory — `Static<S>` widens to `T | null`, the validator accepts `null`, and the wire emits the draft-07 union `type: ['string', 'null']`.

**It unblocks a provider rather than polishing a surface.** `mode: 'schema'` is the **only** structured-output mode that reaches Anthropic — its only lane is forced tool use, and a forced tool needs a schema to force to. The consumer was on `json-object`, which works on four providers and not that one. The blocker was that OpenAI strict mode requires *every* property in `required`, so `optional(...)` is unsendable there; the remaining route was to make everything required and fake absence with an empty-string sentinel the converter maps back — **the schema-and-check drift the one-object design exists to remove, reintroduced one layer down.**

**We asked them to let us verify their OpenAI premise, and it paid.** It holds, and turned up what they did not have: **OpenAI ignores the OpenAPI-style `nullable: true`**; only the union array works. So the option's *name* and its *emission* are different dialects on purpose — stated on the option's own TSDoc and pinned by a test asserting the emitted keys never contain `nullable`.

**Three consequences the ask did not have, all in our code.** (1) `fromJson` **rejected union `type` arrays**, and `callProxiedCompletion` reconstitutes forwarded schemas with it — shipping the emitter without the parser would have been our own code refusing our own output on the path the consumer already uses. It now admits exactly `[<type>, 'null']` and still refuses every other union. (2) `toGeminiParameterSchema` passed `type` through verbatim, and the two dialects are **mutually exclusive** — OpenAI ignores the keyword, Gemini rejects the union — so unblocking the fifth provider would have broken one of the four that work today. (3) `enum` nullability is a different emission, and `fromJson` now requires the two halves to **agree**, since a node nullable in one and not the other describes two schemas with no honest way to pick.

**Both consequences were watched failing.** Reverting the parser's acceptance turns exactly the 7 round-trip tests red and leaves the 15 emission/validation tests green — which is what shows the round-trip suite pins the parser half rather than the emitter. Neutering the Gemini translation turns exactly its 4 red.

**A fourth consequence surfaced only in CI, and the gate that found it is the lesson.** `@fgv/ts-extras-mcp` pinned a nullable-union tool as un-adaptable; widening `fromJson` moved it from `skipped` to `tools`, which is correct and desirable — an MCP server offering a nullable field is now usable. The repo-wide **`rush rebuild` passed with zero warnings** and could not have caught it: `fromJson` kept its signature and every consumer kept compiling. What changed was *what it returns for an input it used to reject*. **`rush rebuild` covers a widened type; only a repo-wide `rush test` covers a widened behaviour** — the existing acceptance criterion was written from a case where an interface member became required, which a build does catch. **Promoted into `CODING_STANDARDS.md` via #656** (`352f237a`) as a section beside the existing repo-wide-build rule plus its own acceptance-criteria checkbox — the tell being *your diff touched no signature and you cannot name a line that would fail to compile*, which is exactly when the compiler has nothing to say and the suites do.

**A flag, not a wrapper node, and we agreed with the consumer for a different reason.** A `nullable(inner)` wrapper would have been one generic function instead of seven overloads and sibling-consistent with `optional`/`array`. It loses because the object factory builds `required` by reading `prop._type !== 'optional'`: `nullable(optional(x))` would present the wrong discriminant, the key would land in `required`, and the field would **silently stop being optional** — no error, no failing test, wrong schema.

**`hasOptionalProperties` is untouched, and that is the point.** Its docstring rejects "rewriting optional to required-and-nullable" because *the library* doing it silently would break the caller's validator. That objection **evaporates when the caller authors it**, since the validator and the wire schema are then the same object. This stream is not a reversal of that refusal — it is what makes keeping it affordable, and there is now a test asserting a nullable-and-required schema reaches OpenAI as `'schema'` directly beside the suite asserting an optional one degrades.

### `sqlite-vec-throwaway-clear-statement` ✅ (shipped 2026-08-22 via #654 — behaviour-neutral)

**Status:** ✅ shipped to `release` (#654, squashed as `a50009f3`). Gates green — build / lint / test at **100%** in `@fgv/ts-agent-memory-sqlite-vec` (153 → 157 tests), repo-wide `rush rebuild` at exit 0 with zero warnings, change file present, teardown probe green on linux-x64 / Node 22.22.2.
**Package surface:** `@fgv/ts-agent-memory-sqlite-vec` (`_clear` on both index classes; `perf/statementTeardown.js`), plus `.ai/instructions/LIBRARY_CAPABILITIES.md` and corrections to `sqlite-vec-statement-lifetime`'s artifacts.
**Artifacts:** `.ai/tasks/completed/2026-08/sqlite-vec-throwaway-clear-statement/`
**Origin:** a PersonAIlity report sent deliberately **before** either side spent a test cycle on the linux-arm64 measurement `sqlite-vec-statement-lifetime` was waiting on.

**Shipped:** `_clear()` runs `Database.exec` rather than `prepare(...).run()`, on both index classes. Same SQL, same (absent) transaction context, same `Result` shape — the change is **lifetime, not semantics**.

**A statement nobody holds is the dangerous kind.** `release()` drops `_stmts`; this one was never *in* `_stmts`, because nothing referenced it the moment `.run()` returned. So `release()` could not drop it, could not have, and **no amount of correct `release()` usage on a consumer's side would have helped** — its native destructor ran whenever GC reached it, which may be during environment teardown, the frame the reported `Statement::~Statement()` abort fires in.

**The remedy is stronger than the one proposed, and the difference is the lesson.** The reporter suggested caching it so `release()` drops it. `exec` creates **no `Statement` at all** — nothing to destruct, no cleanup hook. Caching would only have moved it into the same narrowed-window-no-guarantee bucket as everything else, since `release()` makes a statement collectable *earlier* and `better-sqlite3` exposes no public `finalize()`. **Eliminate the object rather than lengthen its life.**

**One of their three cited sites was wrong; a fourth they missed is real.** `del` / `ins` in `_prepare()` are locals but are *captured* — `delete: del` is returned and `replaceTxn` closes over both — so they live exactly as long as `_stmts` and `release()` does drop them. `_readExistingDimension` prepares a throwaway `sqlite_master` probe on every `create()` / `open()` and **cannot** become `exec` (bound parameter, returned row). So one `Statement` per construction survives: the residue shrinks from *every rebuild plus every construction* to *every construction*, and the platform question is **not** closed by this. Said in the consumer note rather than left to be discovered.

**The larger finding was a defect in *our* artifact.** `perf/statementTeardown.js` drove `add` / `addFragments` / `query` and **never a `rebuild`** — and `rebuild` is the sole caller of `_clear`. The probe therefore exercised only the cached statements and was structurally blind to the one statement `release()` could not reach. **A green arm64 run of it would have read as "the fix holds" while the consumer's boot path — which rebuilds on start — went untested.** That is `TESTING_GUIDELINES.md` § "Measurement Harnesses" in its worst form: not a harness reporting a wrong number, but one reporting a *right number about the wrong lane*. Found by the consumer reading source, not by anyone running the probe.

**Widened three ways.** Every pass now drives a rebuild **and a failing rebuild** — not redundant, since a passing rebuild clears once at the top and the rollback `_clear()` is reachable no other way. And a **matched pair** of passes, 4 and 5, isolates the throwaway statement: pass 5 restores the pre-`exec` `_clear` by own-property override (the trick pass 1 uses to neuter `release`), pass 4 is its control, and they differ in **one axis** — same `release`, same `close`, same GC policy. Read **asymmetrically**: 5 aborting where 4 survives implicates the statement; a survival **exonerates nothing**, since an unreferenced statement may simply have been collected mid-run.

**Two review rounds landed on the same file, and the second correction is the more instructive.** The first draft claimed a green pass 4 exonerated the statement. The fix for that introduced a *second* confound in the same edit — pass 4 skipped the forced GC while pass 2 did not, so the pair being compared differed in two axes and an abort was equally explained by a released-but-uncollected cached statement. Both were CodeRabbit's. Hence the one-axis rule now stated at the top of the harness rather than re-derived per pair: a harness whose green result reads as a clean bill of health is this stream's own defect one level up, and a harness whose **red** result is attributed to the wrong variable is the same defect wearing the opposite sign. And `sqlite-vec-statement-lifetime`'s `result.md` and ledger entry now state what the probe did not drive.

**Four tests, watched failing first.** `jest.spyOn(db, 'prepare')` around a rebuild asserting **zero** calls — everything the index reuses is prepared before the rebuild starts, so a rebuild reaching only cached statements prepares nothing. Reverting both `_clear` bodies turned exactly those four red, two per class, one per lane, and nothing else. A coverage gate cannot see this class: the line ran before and runs now.

**Follow-up after merge — the consumer's arm64 repro does not reach the statement it tests** (`.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-23-arm64-repro-review.md`, shipped via **#656**, `352f237a`). `_clear()` early-returns when `_stmts === undefined`, and `_stmts` stays undefined until a dimension is established; their script opens a **fresh** database and rebuilds without ever adding. Measured with the pre-`exec` `_clear` body restored so the statement would exist if it could: **0 prepares** for their shape, **2** once an `add` establishes the dimension. So on arm64 it would print `SURVIVED` while never having created the statement under test — a false negative on precisely its own question, which also means their linux/x64 `SURVIVED` was never the control it was taken for. **Symmetric to the defect they caught in our probe:** ours drove `add` and `query` but never `rebuild`; theirs drives `rebuild` but never `add`. It also targets `5.1.0-53`, before this stream removed that statement — but it remains a **valid narrow probe** of `_readExistingDimension`'s `sqlite_master` statement, the residue named above, so the note gives a run order rather than discarding it.

### `filetree-faithful-copy` ✅ (shipped 2026-08-22 via #653 — additive)

**Status:** ✅ shipped to `release` (#653, squashed as `cc204066`). Gates green — build / lint / test at **100%** in `@fgv/ts-json-base`, repo-wide `rush rebuild`, change file present.
**Package surface:** `@fgv/ts-json-base` (`copyItemInto` / `copyContentsInto` and their option/report types; `IMutableBinaryFileTreeDirectoryItem` + `isMutableBinaryDirectoryItem`; `DirectoryItem.canCreateChildFileBytes` / `createChildFileBytes`), plus `.ai/instructions/LIBRARY_CAPABILITIES.md`.
**Artifacts:** `.ai/tasks/completed/2026-08/filetree-faithful-copy/`
**Origin:** a PersonAIlity ask (§ 1 of the 2026-08-22 note), filed with one premise corrected and the one open design question answered by the consumer before implementation.

**Shipped:** a capability-aware copy — `copyItemInto(source, destinationDir)` for one item by name, `copyContentsInto(sourceDir, destinationDir)` for a directory's contents — with a single guarantee: **every file that lands is byte-identical to its source, or the copy says so.**

**The consumer's bug was a text read feeding a text write.** `getRawContents()` → `createChildFile(name, contents)` in two places, lossless right up until a SQLite file entered the tree, at which point snapshot-then-restore produced a mangled database. Both ends were byte-native the whole time; nothing in the API made the downgrade visible.

**The premise in the ask was misattributed, and correcting it made their position better than they thought.** They cited `isBinaryAccessors` as documenting "narrows but does not promise success" — that caveat belongs to the **file-item** guards. The accessor guards *are* real capability checks, so the "four combinations each with a live failure path" they described are decidable up front. That correction went to them before any code, since it was actionable on their side immediately.

**`'fail'` is the default, and the consumer's argument for it is stronger than ours was.** We argued honesty at the boundary (the `getFileTextStrict` precedent: refuse rather than return a plausible value). They argued the failure is **diagnostic** — the file that broke them was their derived record index, reconstructible and already flagged as dead weight, so it should never have been in the snapshot set. A `'skip'` default would have absorbed a modelling error into a silent omission. Two implementation consequences follow and are pinned by tests: the failure **names the path**, and `'skip'` stays a deliberate opt-in rather than the convenient one-word fix.

**A strict decode is not sufficient, which is the finding this stream would not have had without writing the check.** The obvious implementation of "carry as text when the bytes are text" is a `fatal: true` decode. That is wrong: `TextDecoder` **strips a leading BOM** and `TextEncoder` does not put it back, so a BOM-prefixed file decodes without error and arrives three bytes shorter. The copy therefore verifies by construction — decode, re-encode, compare — rather than reasoning about which files are "just text". Paired tests copy the same BOM file to a byte destination (preserved) and a text destination (refused).

**The copy reads bytes and only bytes.** Falling back to a text read when a source cannot produce bytes would yield a file whose faithfulness nothing had established — the outcome the surface exists to prevent — so that is a `Failure`, not a quiet text copy. Every shipped adapter implements `getFileBytes`, so this costs no real consumer anything.

**The byte-native create is the narrower half of the ask and is load-bearing for the wider one.** `createChildFile` is string-only, so a faithful write was create-a-placeholder-then-`setRawBytes`, which leaves an **empty file behind** when the byte write turns out to be unsupported. `createChildFileBytes` checks the capability before creating anything; a test asserts the directory is untouched after a refusal. Its companion `canCreateChildFileBytes()` exists because the item-level guard cannot promise success and `FileItem._hal` is protected — so unlike the file-item case, the answer *is* reachable from the item, in the same spirit as `getIsMutable()`.

**Additive, not a widening.** The capability is a new optional interface plus guard, mirroring the existing binary/strict-text convention, rather than a new required member on `IMutableFileTreeDirectoryItem` — so no implementation outside this packlet has to change, on a package every other library depends on.

**The report splits by mechanism, not outcome.** `filesCopiedAsBytes` and `filesCopiedAsText` are both byte-faithful; the split is there because `filesCopied: 500` reads the same whether a snapshot took the verbatim route or a text round trip. That is the `IVectorRebuildReport` rule applied on a second surface: totals are derivable by summing, the breakdown is derivable from nothing else.

**Two properties documented because they are surprising, both pinned by tests.** A copy is **not atomic and does not roll back** — every file is attempted, so a failure names *every* offending path (the useful form when the answer is "these files should not be in this set") and the destination keeps whatever succeeded. And a copy into a location beneath its own source cannot be detected from the items alone — two different stores can present the same absolute path, so a path-prefix test would refuse legitimate copies — so it surfaces as a **depth-bounded failure** instead of a hang.

**One branch removed rather than covered.** The byte comparison was first written as an indexed loop whose "same length, different bytes" arm is unreachable through the public API, since a strict decode plus re-encode can only differ by the stripped BOM and that changes the length. Rewritten as `length === length && every(...)`, which is the same check with no uncoverable line — per `TESTING_GUIDELINES.md`, the question is whether the branch should exist, not how to reach it.

**Layer 1 ran twice — inline, then the agent — and the second pass earned its keep by attacking rather than re-reading.** The inline pass (a session constraint against spawning subagents, since lifted) found three: a shared `skipped: []` aliased into every per-file report, the merge reducer carrying that alias into results, and the missing depth bound. The `code-reviewer` pass then returned **no P1s**, having tried to construct an input where a file lands changed and the copy reports success — BOM stripping, JSON-seeded lone surrogates, overlong and invalid UTF-8, empty files, byte-array aliasing — and having re-traced every `ICopyReport` construction to verify the aliasing fixes rather than take the exit artifact's word for them. Its four adopted findings were all about the surface reading stronger than it is: the two `createChildFile*` methods were near-duplicate boilerplate (extracted — and the evidence for acting was that the copies *had already drifted*), `canCreateChildFileBytes` reads like a mutability check when it reports the store's mechanism, and "byte-identical to its source" is really "to what the source's `getRawBytes` reports". Two were dispositioned rather than applied, both because the fix would trade a justified asymmetry for a cosmetic one — see `result.md`.

### `ai-assist-structured-output` ✅ (shipped 2026-08-22 via #652 — breaking for constructors, additive for readers)

**Status:** ✅ shipped to `release` (#652, squashed as `0765a206`). Gates green — build / lint / test at **100%** in `@fgv/ts-extras`, `@fgv/ts-json-base` and `samples/testbed`, repo-wide `rush rebuild` at exit 0 with zero warnings, change files for all three published packages. **The live gate is CLOSED**: four testbed scenarios were written for this stream and run against the real APIs, every schema path green on all four providers.
**Package surface:** `@fgv/ts-extras` (`IProviderCompletionParams.structuredOutput`, `IAiCompletionResponse.structuredOutput`, `IAiProviderDescriptor.structuredOutput`, `resolveStructuredOutputCapability` / `supportsStructuredOutput`, the new `structuredOutputTypes` module), `@fgv/ts-json-base` (`JsonSchema.isSchemaValidator`), `@fgv/ts-app-shell` and `samples/testbed` (test doubles).
**Artifacts:** `.ai/tasks/completed/2026-08/ai-assist-structured-output/`
**Origin:** a PersonAIlity ask, surface settled with the consumer over two rounds before implementation.

**Shipped:** a caller that has already declared the shape it wants can now **tell the provider** — `structuredOutput: { mode: 'schema', schema }` (a `JsonSchema.ISchemaValidator`, the same object the caller validates with) or `{ mode: 'json-object' }` — and learn **which enforcement was actually applied**, on all four providers plus the proxy path.

**The report is the load-bearing half, and it is required rather than optional.** Three questions hide inside *"did it honour my schema"*: did we send a constraint (the client knows), which constraint did the provider apply (the client knows, from the resolved model's capability), and does *this* response conform (the caller's converter knows, and nothing else). The library answers the first two and deliberately not the third — reporting conformance would mean re-validating against the caller's own schema to re-derive an answer they already hold. Required-not-optional is the consumer's argument and it is this repo's own: an optional field makes absence three-ways ambiguous (no capability / not requested / a build predating the feature), which is exactly what the report exists to disambiguate — the `MemoryEmbedOutcome` remedy applied to the same defect.

**It has to ride on the response rather than be a lookup**, because `resolveProviderModel` resolves aliases and tiers at *call* time and a `tier` request can cascade. The concrete model that will serve a request is not knowable to a caller up front, so the consumer's "second half" was a precondition for the first being usable at all, not a nice-to-have.

**Lenient-by-default is only safe because the report is required.** `onUnsupported` defaults to `'degrade'`; degrade-and-tell-me is safe, degrade-silently is the failure the whole ask exists to remove. The two questions the consumer asked separately turned out to be one question, and the interlock is in the docstring rather than only in the ledger. A **conflict** is not a degradation and does not obey `onUnsupported`: Anthropic and Gemini both refuse structured output alongside server-side tools, for **different reasons** — Anthropic's mechanism *is* `tools` + `tool_choice` (a wire-level clash), while Gemini's `responseMimeType` / `responseSchema` live in `generationConfig` nowhere near `tools` and the exclusion is API-enforced. Conflating the two would mislead the next maintainer, which is what the first draft did.

**Four wire formats, and `'tool-forced'` is not a spelling of `'schema'`.** Anthropic has no response-format field at all — its mechanism is a forced synthetic tool, and **the reply arrives in a `tool_use` block rather than as text**. The library re-serializes that block's `input` into `content`, so `content` stays a JSON string on every provider and a caller's converter never branches on which enforcement it got; a side effect is that on that path the string comes from `JSON.stringify` rather than from the model, so it is syntactically valid by construction. An absent forced-tool block **fails loudly** rather than falling back to text, because `structuredOutput: 'tool-forced'` would otherwise be a lie.

**`generateJsonCompletion` adoption dissolved rather than being decided.** The consumer flagged the adopt-or-not question as a probable false binary and was right, but the resolution is better than the optional parameter they sketched: `ISchemaValidator<T> extends Validator<T>`, so a caller could **already** pass `JsonSchema.object({...})` as `converter` — the library simply did not look. It does now. **No new parameter** (which would have reintroduced exactly the converter/schema drift `JsonSchema` exists to remove), no possible drift, and existing plain-`Converter` callers byte-for-byte unchanged reporting `'none'`. The one thing needed was a guard, and per "extend the primitive rather than work around it" it went **into `@fgv/ts-json-base` as `JsonSchema.isSchemaValidator`** rather than being hand-rolled as a `'_type' in v` check in `ts-extras`. It narrows to `ISchemaValidator<unknown>` deliberately — `_type` is a node-*kind* discriminant carrying no evidence about `T`, so a guard claiming `T` would be asserting rather than checking.

**Three self-hosted providers declare no capability on purpose.** `groq`, `ollama` and `openai-compat` report `'none'`: any model can sit behind a self-hosted endpoint, and a confidently wrong capability claim is worse than none — the mistake `resolveImageCapability` made once already, which is also why the resolver is alias-first.

**The live run settled it, and found a fifth defect nothing else could have.** Four `<provider>-structured-output` testbed scenarios, run against the real APIs: **every schema path green on all four providers**. The OpenAI `/responses` pass is the live confirmation of the route-coercion fix — it establishes `text.format` as the correct field, which no unit test could, because a wrong field name there is *accepted and ignored*. The Anthropic pass confirms the forced-tool round trip. And the Gemini run surfaced a **pre-existing library defect unrelated to this stream**: `callGeminiCompletion` read `candidate.content.parts[0].text` and discarded every other part while the streaming adapter concatenated, so the same response yielded different text depending on the path — a truncated document that often still *parses*, the worst way to be wrong. Bundled and fixed here, and disclosed as a bundled latent-bug fix in the change file.

**A prediction this stream made and got wrong, recorded because the correction matters more than the claim.** It predicted the parts fix would *not* change the Gemini `json-object` outcome, reasoning that a stray **extra** brace is more content and dropping parts cannot produce more. The re-run passed. The mechanism is therefore **not** established: one passing re-run cannot distinguish "the fix cured it" from "Gemini's schema-less JSON mode is nondeterministic and this draw was clean". Left open in `result.md` rather than written up as cured.

**The probe was wrong before the library was.** The first live OpenAI run failed `json-object` — because the *probe* demanded schema conformance in the one mode that promises arbitrary shape. The library had behaved correctly throughout, including suppressing the code fence the hostile prompt asked for. The same run also hung, so probes now carry an `AbortSignal.timeout`; a probe that can hang is not a gate.

**The `max-lines` prerequisite was real, and it fired twice.** The sweep that widened the `TECH_DEBT` entry found three `ai-assist` **test** files at 0–3 lines of headroom and named this stream as the thing that would hit them, so they were split first (**#650**). What the sweep did *not* predict is that `model.ts` — listed at 1957 with 43 lines of headroom — would also blow the cap: the capability, request and response types took it to **2132**, which `rushx build` reports as a warning and `rush rebuild` would have failed on. The remedy was a clean cut rather than one chosen under pressure: the structured-output types depend on nothing in `model.ts`, so they became `structuredOutputTypes.ts` and `model.ts` imports them. **The do-it-first discipline half-worked** — it removed the test-file wall and left the source-file one, which argues for the sweep being a routine pre-stream step rather than a one-off.

**Two bugs in this stream's own implementation, both found by re-reading rather than by the suite** — and both would have produced a *confidently wrong report*, the one thing this feature exists to prevent. (1) The OpenAI wire format is not a function of the model alone: the route depends on whether the call carries server tools, and `response_format` in a `/responses` body is **silently ignored**, so the request would have looked constrained while the reply was not, with the report saying `'schema'`. (2) `JSON.stringify(undefined)` returns `undefined` rather than throwing, so `captureResult` wrapped it as a Success and put `undefined` behind a `content: string` contract whenever a forced `tool_use` block carried no `input`. Both are now pinned — the second by tests asserting a **Failure** explicitly, since `toSucceedWith({ content: undefined })` would have passed against the broken version.

**Review: 3 P2 and 4 P3, all resolved, none dispositioned away.** The P2 that mattered: `generateJsonCompletion`'s inference read `converter` even when `jsonConverter` overrode it, so a schema-shaped converter alongside a different `jsonConverter` would constrain the *request* to a schema unrelated to what validates the *reply* — the exact drift this design exists to remove, in the one place two validation paths coexist. Gated, and the tests were watched failing against the ungated version first.

**The doc-block slip recurred, twice, and the second one was worse.** Inserting the new capability resolver consumed `resolveEmbeddingCapability`'s TSDoc — the identical mistake the `result.ts` split made 24 hours earlier when its cut took `Success`'s block. The review then found a *second* instance in the same diff: the new descriptor property was inserted between `responsesOnlyModelPrefixes`' TSDoc and its declaration, so that older property **silently lost its documentation entirely** (`api.md` flipped it to `(undocumented)`). The pattern is that a text insertion anchored on a declaration line lands *inside* the preceding symbol's docs, and the compiler never complains.

**One defect the review's own fix introduced, caught while applying it.** Making `SCHEMA_NODE_TYPES` a total `Record` was right, but the membership test was written as `_type in SCHEMA_NODE_TYPES` — and `in` walks the prototype chain, so `{ _type: 'constructor' }` would have passed. Now an indexed read compared to `true`, pinned by a test.

**An `api.md` corruption worth knowing about.** Mid-stream the checked-in report was found rewritten into 132 relative-path re-exports in place of 868 lines of real API — the API Extractor signature of an unresolved rollup, and committing it would have shipped a gutted public-API report. It was a partial-build artifact, confirmed by a clean rebuild. The cheap tell is `grep -c "from './" etc/*.api.md`, which is **0** on a healthy report.

### `agent-memory-kind-collision-guard` ✅ (shipped 2026-08-21 via #648 — behaviour-changing, pre-1.0)

**Status:** ✅ shipped to `release` (`6afde57d`). Gates green — build / lint / test at **100%** in `@fgv/ts-agent-memory`, repo-wide `rush rebuild`, two change files (the guard and the split, separately).
**Package surface:** `@fgv/ts-agent-memory` (`verifyOccupantKind` in `storeIdentity.ts`, threaded through the store's read and write paths; the new `storeFileAccess.ts` from the split).
**Artifacts:** `.ai/tasks/completed/2026-08/agent-memory-kind-collision-guard/`
**Origin:** a PersonAIlity ask, itself filed from a defect they had fixed as far as their side could reach.

*Narrated retroactively 2026-08-22 — this entry did not exist for a day after the stream shipped, which is what prompted the consumer to ask whether it had been dropped. The code shipped with its brief, both change files and its consumer note; only the ledger was silent. Recorded plainly because a ledger that omits a shipped stream is the same defect as one that describes a shipped stream as in flight.*

**Shipped:** one invariant, enforced at the one layer that can see both sides — **a record loaded from an address derived from kind K is a record of kind K.** Guards `put` (flat and versioned), `delete` (flat and versioned) and `get`; `getById` stays address-first and unguarded, pinned by a test.

**The failure was worse than an overwrite, which is why nobody saw it.** A record is addressed by `(scope, idStem)` and the address carries **no kind component**, so two kinds whose codecs mint the same address name one file. The store read the occupant and never compared its kind, so the second write applied as an **update**: `KnowledgeLwwPolicy._rebuild` spreads `...existing.envelope` and sets `body: merged.body`, and `kind` is immutable to every policy — so the victim kept its own kind and took the intruder's body, while the intruder's own `list` returned nothing and `put` returned success.

**The consumer had already established where the check belongs, and was right.** Their vault-side guard could not reach the ingest orchestrator's writes (no host seam), and `IWritePolicy.admit` cannot close it either: its admission cohort is same-scope same-kind by contract, so a policy is **structurally never shown a foreign occupant**. The store is the only layer that sees both the incoming record and the existing occupant on every write path. All seven of their claims were verified against source before commissioning; every one held.

**Three things the ask did not have.** (1) The **versioned path has the same hole with a larger blast radius** — `_versionsForEntity` filters on scope and nothing else, so an intruder would have read the victim's versions as its own history and *invalidated* them before minting a new one alongside. (2) `delete` and `get` have the read-side version, so `delete(kindB, id)` removed a `kindA` record through a typed API that looked correct — a `put`-only fix would have left that open. (3) The **quarantined-record case they hoped this would close was already closed**, by a different mechanism: `_readRecord`'s parse and verify both fail on an unreadable occupant and that already fails the write, loudly but with a parse error rather than a collision error. Told to them directly, since their own guard genuinely cannot compare there.

**What was refused, and the consumer had ruled it out first.** A registration-time check is **undecidable** — `encode` is an opaque total function over an unbounded domain with no declared range — and scope equality is neither necessary (two kinds sharing a root that never collide is a *working* configuration a scope check would reject) nor sufficient (one scope with disjoint stems is safe; both sides now hold a passing control test for exactly that). A declared scope accessor on `IIdentityCodec` was rejected on their side for the right reason: a declaration the codec does not honour is the same half-guard in different clothes.

**The sequencing call was taken the expensive way on purpose.** `fileTreeMemoryStore.ts` was at **1989 lines against a 2000-line `max-lines` cap**, which is a CI failure rather than a warning, and eleven lines does not fit a helper plus threading across six call sites. Four prior streams had cleared that cap with an ad-hoc extraction chosen under time pressure — which is why the `TECH_DEBT.md` **P1** split entry existed. This stream did the split **first, on a seam, as a separate commit**, `api.md` byte-identical: 1989 → 1885. Taking the shortcut would have been the fifth instance of the thing that entry exists to stop.

**CodeRabbit found a real hole nothing else could have.** The first version threaded `expectedKind` into `_readVersionedCurrent` and **never consumed it** — accepted, passed, ignored — so the versioned read path looked guarded and was not. A 100% coverage gate cannot see this, because every line still ran. It is `TESTING_GUIDELINES.md` § "100% coverage cannot see a predicate that is never called" one layer in: not a caller that stopped passing a value, but a callee that stopped reading one. Fixed, with the missing test added and watched failing first.

### `sqlite-vec-statement-lifetime` ✅ (shipped 2026-08-22 — additive)

**Status:** ✅ shipped to `release`. Gates green — build / lint / test at **100%** in `@fgv/ts-agent-memory-sqlite-vec`, repo-wide `rush rebuild` at exit 0 with zero warnings, change file present.
**Package surface:** `@fgv/ts-agent-memory-sqlite-vec` (`SqliteVecVectorIndex.release`, `SqliteVecFragmentIndex.release`), plus `.ai/instructions/LIBRARY_CAPABILITIES.md` and the package README.
**Artifacts:** `.ai/tasks/completed/2026-08/sqlite-vec-statement-lifetime/`
**Origin:** a PersonAIlity report, whose code half was confirmed and found to be **one class wider** than reported.

**Shipped:** `release()` on both index classes — it drops the index's prepared statements and marks it unusable, and **never touches the connection**. `open()`'s handle calls it before closing, so a closed connection never has live `Statement` objects pointing at it. A `create()`-made index (which owns no connection) can call it too, which matters because a shared-connection deployment holds a record index *and* a fragment index over one connection and therefore carries **two** instances of the shape.

**The reporter found it on the record index only; the fragment index had the identical wiring.** Same disposer, same absence of statement cleanup.

**The naive fix is wrong, and the tests are written to prove it.** `_stmts === undefined` was already the sentinel for *"no dimension established yet"*, so clearing `_stmts` on close would make a released index answer `size === 0` and `has → false` — a confident lie indistinguishable from an empty index — where today it fails. The fix needs an explicit released state alongside the dimensionless one. Nine tests pin that distinction, and they were **watched failing** against the naive shape first: 5 of 6 red on the record index, 4 of 5 on the fragment index. The one that stays green either way is the "leaves the consumer connection open" test, which does not depend on the flag.

**`size` throws where everything else fails**, because `IVectorIndex` declares it a synchronous `number` with no `Result` to fail into. That is not new behaviour — verified by probe that a `count` statement against a closed `better-sqlite3` connection throws `TypeError: The database connection is not open` — so the explicit state preserves it rather than introducing it. Answering `0` was the alternative and is the thing being prevented.

**What the fix does NOT establish, stated in the release note and the consumer reply.** `better-sqlite3` exposes no public `finalize()`, so dropping the last reference does not finalize a statement — it makes it collectable *earlier*, while the environment is alive, rather than surviving to teardown. That narrows the window producing the reporter's `Statement::~Statement()` → `RemoveEnvironmentCleanupHook` with `env == nullptr` abort. **It is not a proof against it**, and the platform question is still open.

**The platform half, and why a green suite could not settle it.** `perf/statementTeardown.js` drives the real adapter — not a hand-rolled imitation of its shape — through three passes (pre-fix shape closed, post-fix closed, never closed), holding every index at module scope to process exit so the destructors *must* run during teardown. Exit 0 on **linux-x64 under both Node 22.22.2 and Node 24.19.0** (the latter with `better-sqlite3@12.11.1` rebuilt from source against Node 24's own headers). Combined with the maintainer's green suite on **darwin-arm64 / Node 24.18.0**, that clears Node 24, arm64, and the two together — **the suspect is linux/arm64 specifically**. It lives under `perf/` rather than in the suite because it needs `--expose-gc`, which is a rig-level change, and because what it asserts is a process outcome rather than a value: a green check would carry no information about the thing at issue. The prediction was written down before the first run, per `TESTING_GUIDELINES.md` § "Measurement Harnesses" — on x64 it is a regression guard, not evidence; the deciding measurement is pass 1 aborting where pass 2 survives, and only linux/arm64 can produce it. **Correction, 2026-08-22:** those three passes drove `add` and `query` and nothing else, so they exercised only the **cached** statements in `_stmts` — the probe never ran a `rebuild`, and therefore never reached `_clear`, the one place that prepared a statement `release()` could not drop. The consumer found that by reading source, not by running the probe. Widened in `sqlite-vec-throwaway-clear-statement`; the claim above was true of what it drove and silent about what it did not, which is the more dangerous shape for a harness.

**Coverage cannot see this class at all.** `Statement::~Statement()` is a native destructor invoked by V8's GC; `c8`/`istanbul` instrument JavaScript statements and have no visibility into it. 100% is fully compatible with the defect being present and firing — the extension of `TESTING_GUIDELINES.md` § "100% coverage cannot see a predicate that is never called" to a predicate that is not JavaScript.

### `fragment-query-scoping` ✅ (shipped 2026-08-18 — breaking, pre-1.0)

**Status:** ✅ shipped to `release` from `integration/fragment-query-scoping` (docs **#638**, implementation **#639**), promoted as one squash. Every gate green — build / lint / test at 100% in both packages, repo-wide `rush rebuild` at exit 0 with **zero** warnings, change files for both packages.
**Package surface:** `@fgv/ts-agent-memory` (`IFragmentQuery`, `IFragmentVectorIndex`, `IIdentityResolver`, `IMemoryStore`, `FragmentSemanticRetriever`, `InMemoryFragmentCosineIndex`), `@fgv/ts-agent-memory-sqlite-vec` (`SqliteVecFragmentIndex`), `.ai/instructions/LIBRARY_CAPABILITIES.md`, `samples/testbed`.
**Artifacts:** `.ai/tasks/completed/2026-08/fragment-query-scoping/` (`brief.md`, `result.md`, `README.md`, `meta.yaml`)
**Origin:** a PersonAIlity ask, every load-bearing claim of which was re-verified against `release` before filing.

**Shipped:** a fragment-semantic search can now be **narrowed to one record**, with the narrowing applied **during selection, before the `topK` cut** — `IFragmentQuery` gains `entityId` + `kind`, and `IFragmentVectorIndex.query` takes an `IFragmentQueryOptions` bag (`{ maxPerRecord?, scope?, id? }`) replacing the positional `maxPerRecord`. A new `IIdentityResolver` seam, implemented by `IMemoryStore`, turns `(kind, entityId)` into a storage address without reading the record.

**Why the `topK` placement is the whole feature.** Before this, a document-scoped passage search had to over-fetch globally and discard, so the requested `topK` was not the `topK` that reached the index — and no amount of consumer-side work could fix it, because the truncation happened before they saw anything.

**Why `kind` is required rather than decorative.** `kind` selects the identity codec and the codec *computes* the address, so `(kind, entityId) → target` is a **function, not a search**. The consumer's reply is what made this load-bearing: colliding ids across kinds are **the normal case** for them, not the rare one — a document `acme-corp` in `knowledge` and the entity `acme-corp` in `entities` are both produced by ingestion, by design. That inverted the brief's stated default (fail-loudly-on-ambiguity would have fired on the primary path) and, once `kind` was in hand, dissolved the question: ambiguity became structurally impossible rather than merely unlikely, and the index-walk resolution an earlier draft designed was deleted as solving a problem the codec had already solved.

**The correction this stream had to make to its own paper trail.** The brief and **both** handoff notes said the per-entity subtree layout meant "no `asOf` axis" — as though versioning fell out of the layout completely. It does not. `TemporalVersionedPolicy._invalidateCurrents` stamps `invalid_at` and **never calls `fragmentIndex.remove`**, so a versioned narrowing returns every version's fragments, current and superseded alike, and **nothing on an `IVectorQueryHit` distinguishes them**. What the layout removed is the *ambiguity*, not the filtering. Verified against source rather than assumed, corrected in five places including a note already sent, and the consumer was given the read-side workaround plus an explicit invitation to ask for a currency filter as a real ask.

**The gate that earned its keep.** The brief required a test proving the narrowing precedes `topK`, and warned that "a post-filter passes every naive version of this test." Both halves proved out when the in-memory index was temporarily rewritten to post-filter: the before-the-cut test went red (`expected 2, received 0`), and **the other two narrowing tests stayed green** at `topK: 10`, which is generous enough that a post-filter still finds everything. Had the suite contained only those two it would have passed a post-filter implementation and pinned nothing. *A regression test you have not watched fail is a guess* — `TESTING_GUIDELINES.md` says so, and this is what it looks like when the rule is followed literally.

**The fourth max-lines toll, and the promotion it triggered.** `fileTreeMemoryStore.ts` was at **1999** lines with no room for the identity resolution this stream needed; `storeIdentity.ts` was extracted, landing at 1989. That is the fourth consecutive `ts-agent-memory` stream to pay an unplanned extraction to clear the cap, which is exactly the condition `TECH_DEBT.md`'s entry named for itself — so that entry is now **P1**, and the split is scheduled work rather than something to fold into the next feature.

**Review.** Layer 1 (`code-reviewer`) found one P1 (a dead branch masking a coverage gap), two P2s (a narrowing validated *after* the paid `embedQuery` call; every versioned test using mocks) and one P3, all resolved. Layer 2 (Copilot) ran **2 rounds and stopped on diminishing returns** — round 1 returned three real findings (an un-normalized consumer hook, a brand asserted where the library ships a validator, and an already-partition-restricted query over-fetching the whole table), round 2 returned nothing. **Two of the three were pure-TS repo-pattern issues layer 1 should have caught**; only the `fetchK` one falls under the known native-boundary blind spot. CodeRabbit ran **1 round on the promotion PR** (auto-review is disabled for a `release` base, so it was triggered by hand) and returned two 🟡 Minor items — one accepted (a decision-shortcut lead-in saying "ONE record" where a versioned narrowing means one *entity*), one **declined with reasoning on the thread**: `as unknown as Kind` over `as Kind` is a real guideline whose purpose is to make a cast possible where the direct form will not compile, and the prevailing pattern here is 97-to-1 in this package (109-to-1 repo-wide), so changing six sites would leave the file inconsistent with ~215 siblings. If that standard is meant literally it wants one mechanical repo-wide sweep, not six sites in a feature branch.

**A note on where the review layers actually paid.** Layer 1 found the design-shaped problems (a dead branch, a paid call ordered before its own validation, a whole class of test that didn't exist). Copilot found the contract-shaped ones (an un-normalized hook, an asserted brand, an over-fetch). CodeRabbit found prose. Three passes, three distinct yields, and the ordering was not coincidental — each layer sees what the one before it is not built to look for.

**Cost recorded rather than paid.** `SqliteVecFragmentIndex` pushes a `scope` + `id` narrowing into the `vec0` `PARTITION KEY`, which is where the predicted win lands. **Scope-only cannot** — `target_key` equality cannot express a prefix — so it scans the full ranked set and prefix-filters ahead of the `topK` cut. Correct either way, but it makes the *versioned* kind the expensive case precisely because it is the more structured one, while `InMemoryFragmentCosineIndex` has no such asymmetry — the two agree on results and diverge on cost, which is how it stays easy to miss. Filed to `docs/FUTURE.md` with a trigger that folds it into the next `vec0` schema change rather than forcing its own.

### `agent-memory-derived-state-reconciliation` ✅ (shipped 2026-08-16 — breaking, design-first)

**Status:** ✅ shipped to `release` via **#633** (`23a9f96`, 2026-08-16), squashed onto `feat/vector-rebuild-report-by-kind` from `integration/agent-memory-derived-state`. Every gate green (build / lint / test at 100% / repo-wide `rush rebuild` / four change files). **Breaking** on `IVectorIndex`, `IFragmentVectorIndex` and `IMemoryStore`, all pre-1.0. Consumer notified and **acknowledged** — `.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-16-derived-state-shipped.md` (leads with the `reconcileRank` → `reconcile(kind, 'rank')` removal, the one break in a method the consumer already calls).
**Package surface:** `@fgv/ts-agent-memory` (`IMemoryStore`, `IVectorIndex`, `IFragmentVectorIndex`, `FileTreeMemoryStore`, three retrievers), `@fgv/ts-agent-memory-sqlite-vec` (both index classes), `.ai/instructions/LIBRARY_CAPABILITIES.md`.
**Artifacts:** `.ai/tasks/completed/2026-08/agent-memory-derived-state-reconciliation/` (`brief.md`, `design.md`, `result.md`, `README.md` + Appendix A, `meta.yaml`)
**Origin:** filed as `agent-memory-index-coverage-accessor`; **renamed and rescoped 2026-08-15** after applying `CODING_STANDARDS.md` § "We Build General Capabilities" — the narrow framing was an artifact of taking a consumer's ask as the unit of work rather than deriving the capability. The rescope made the stream *larger*, and that is the point of the correction.

**Mission, and it closed.** `IMemoryStore.coverage()` and `IMemoryStore.reconcile(kind, artifact)`: every artifact the store derives from its records now has a coverage query and a targeted repair, in one shape. The matrix the brief was written against:

| derived artifact | coverage — before → after | repair — before → after |
|---|---|---|
| `rank` | none → per-kind | `reconcileRank(kind)` → `reconcile(kind, 'rank')`, behaviour unchanged |
| record vectors | `size`, a scalar → per-kind with a denominator | destructive `rebuild` → targeted `reconcile` |
| fragment vectors | none → aggregate | **nothing on the contract** → `rebuild` + targeted `reconcile` |

Fragment vectors closes **E4 on that lane** — the defect fixed for the record lane in `-48` and left open here, worse because `SqliteVecFragmentIndex` had no `rebuild` to promote.

**The one idea everything falls out of: coverage is cheap and total; repair is expensive and targeted.** `coverage()` takes no argument because its inputs are an envelope walk plus one count per wired index. `reconcile` names both its kind **and** its artifact because the lanes are independently wirable, their units are incommensurable (one vector per record vs. N), and their costs differ by orders of magnitude — a measured case put 68 fragments behind a single 56 KB record.

**`has(target)` is the load-bearing addition, and building it produced a better argument than the design had.** The design justified it as upgrading the numerator from *"the store believes"* to *"the index confirms"*. The implementation found the sharper reason: **it makes a state detectable that is otherwise invisible** — the index holds the vector, the envelope lost its `embeddingRef` (a failure swallowed after the vector was committed). From the envelope, that record is indistinguishable from a never-embedded one, and repairing it needs a restamp and **no embedder call at all**. That is also what makes `reconcile` targeted rather than a rebuild; a test counts embedder calls to pin it.

**Two things the report refuses to collapse.** `covered` is a **belief** (envelopes carrying an `embeddingRef`) and `indexSize` is a **fact** (vectors held). With a persistent index they agree; with an in-memory index at open they do not, and `covered` lies in the confident direction. Collapsing them into one percentage would destroy the only free signal distinguishing the two deployment modes. And **absent is never zero**: each artifact member is optional, `undefined` meaning *not derived here at all* — the same three-way-ambiguity defect as `embeddingRef`, one level up.

**Four refinements came from building rather than designing.** `recordCount`/`fragmentCount` rather than the designed `size`, because a one-to-many index makes `size` two-ways readable and a reader arriving from `IVectorIndex.size` takes the wrong one silently. Fragment coverage is **aggregate-only** for a structural reason the design missed — the fragment lane has no per-record envelope marker, so a per-kind numerator would cost one index query per record, which coverage is contractually not allowed to spend. The lane guard must check the **embedder** as well as the index, since an index wired without one is a legal store and the first implementation reported a cheerful success with every record in `failed`. And two package-internal extractions (`storeCoverage.ts`, `storeReconcile.ts`) the brief did not anticipate, forced by the 2000-line `max-lines` cap — the third consecutive `ts-agent-memory` stream to pay that toll.

**The most important thing this stream produced is a bug it did not write.** A `/code-review` pass at high effort over the whole diff returned six findings, and **the two serious ones predate the stream**:

- **`query.filter` was being silently ignored by five retrievers.** The predecessor moved the predicate out of the shared `indexedRecordMatchesQuery` pre-filter — correctly, since that helper takes an envelope and the predicate takes a whole record — and re-applied it in `resolveQuery`. But five retrievers call the pre-filter **directly** and materialize on their own. They stopped applying the predicate and returned records that had been excluded. **Nothing failed. Every test passed. Coverage was 100% throughout**, because the lines were covered and the behaviour was not. That surface had had a `code-reviewer` pass *and* an independent antagonist pass two days earlier. Fixed with `materializePage` as the single route, carrying the ordering rule the five sites were open-coding wrong (no filter → order and page over envelopes, read only the page; with a filter → read the survivors, filter, **then** page), and their `materializeEntries` / `limitEntries` imports removed so the old shape is not reachable by habit. **Codified in `TESTING_GUIDELINES.md` § "100% coverage cannot see a predicate that is never called"**: when you move a behaviour out of a shared helper, enumerate the callers and pin the behaviour at each one — and verify each test by reverting its call site and watching it go red.
- **`get()` on a temporal kind read N files while its docstring promised one** — and that docstring had been written in this same stack as the fix for a *different* stale claim. One wrong assertion replaced by another.

**The antagonist pass then returned seventeen findings over the closure record, two of them blocking.** The more serious: `docs/FUTURE.md`'s fragment entry was marked resolved in four places across the ritual's output and **had not been edited** (`git diff` +30/−0), with the title-correction credit misattributed to this stream rather than to commit `e16db5d61` in the predecessor. The other: the `query.filter` fix above was pinned by no per-retriever test — five were added and negatively verified. The remainder were doc-accuracy defects, all actioned; `README.md` carries them in Appendix A with each original quoted verbatim, and `design.md` is left uncorrected where implementation improved on it.

**The `samples/testbed` recurrence is resolved rather than recorded a fourth time.** Fourth consecutive stream on this contract family; the documented remedy was applied instead of firing again — **`rush rebuild` is now an acceptance-criteria checkbox** in `CODING_STANDARDS.md` for any shared-contract change. The choice between the two candidate remedies is settled by evidence: of the four casualties three were test doubles but one was a *source* file, so the shared-double remedy covers half the observed cases and the checkbox covers all of them. The shared double is downgraded to P3. Ten hand-rolled index doubles across six files were widened by hand here rather than replaced — that is a chore, and mixing a six-file test refactor into a breaking contract diff would make it materially harder to review.

**Deferred, and filed rather than lost** (`docs/FUTURE.md`): a restamped `embeddingRef` synthesizes the scoped key rather than recovering the reference the index minted, because no contract member returns it — correct for both shipped indexes, undecided for a third-party one because no consumer has a non-key reference and picking under that condition would be guessing. Plus the design's two open questions: no progress callback on `reconcile` (OQ-1), and `coverage()` does not cross-reference the observation store to split a shortfall into declined-vs-failed (OQ-2, and `reconcile` learns that split authoritatively anyway).

**The CodeRabbit pass then found three more real bugs, and the best of them was a *value*, not a branch.** `IMemoryEnvelope.embeddingRef` is `string | null | undefined` where `null` is the **documented** "not embedded" sentinel — so both obvious presence checks are wrong, in opposite directions, and all three in-repo call sites had one of them: `coverage` counted a `null` as covered (inflating health in the confident direction), `reconcile` read a `null` as a reference and skipped the restamp, and `declineEmbedding` spent an index round trip the comment beside it says it avoids. Neither mistake is a type error, and neither is visible to a coverage gate, for exactly the reason codified two findings earlier: **the sentinel is a value rather than a branch.** Collapsed onto one exported `embeddingRefOf(envelope)`, which returns the reference rather than a boolean so a caller needing the string gets the check for free.

Also from that pass: the repair path called all four **consumer-supplied** hooks bare, so an embedder that *throws* rather than fails escaped as a rejected promise out of `IMemoryStore.reconcile` — a Result-contract break at a public boundary, forty lines from the write path that had always captured the identical calls. And `MemoryListSelection`'s two members were not mutually exclusive, so `{ scanEveryRecord: true, kind }` type-checked and `list` took the scan branch and **silently discarded the narrowing** — a whole-vault read wearing a narrowed call's clothes, on the surface whose entire purpose is that whole-vault reads be deliberate. Fixed with `never` markers and pinned by a `@ts-expect-error` that becomes the build failure if they are removed.

Three of the five findings were ours to have caught; the third `embeddingRef` site was one CodeRabbit itself missed and the verification pass found. Every fix is pinned by a test that was **watched failing** against the reverted code first.

**Outstanding:** the cross-repo note.

### `agent-memory-index-partial-read` ✅ (shipped 2026-08-16 — breaking, coordinated)

**Status:** ✅ shipped to `release` via **#633** (`23a9f96`, 2026-08-16), from `feat/agent-memory-index-partial-read` stacked over `feat/vector-rebuild-report-by-kind`. Every mechanical gate green (build / lint / test at 100% / repo-wide rebuild / change files). **Two gates did not close at stream close and "all gates green" overstated it** (corrected 2026-08-15): the Copilot review loop never ran, and — the substantive one — this stream shipped a **live regression that every gate it passed was structurally unable to see**, found later by the successor stream's review and fixed there. See "the regression it could not see" below. *(Closed 2026-08-16: external review ran at PR level on #633 — five CodeRabbit rounds over the combined diff, five further real defects, two of them inside fixes to earlier rounds' findings. Rounds 1–3 never reached `materializePage` or the sqlite-vec boundary, both unchanged against the squash base and so deduped as "similar to previous changes"; a requested non-incremental read in round 4 is what reached them. Full account in the derived-state stream's `README.md` Appendix B.)* **Breaking** on a pre-1.0 surface — and unusually, **reviewed and accepted by the consumer before implementation started**, which is what a design-first stream is for.
**Package surface:** `@fgv/ts-agent-memory` (`IMemoryIndex`, `MemoryIndex`, `IMemoryStore`, `FileTreeMemoryStore`, every retriever, `memory_search`), `samples/testbed`, `.ai/instructions/LIBRARY_CAPABILITIES.md`.
**Artifacts:** `.ai/tasks/completed/2026-08/agent-memory-index-partial-read/` (`brief.md`, `design.md`, `result.md`, `README.md`, `meta.yaml`)
**Predecessor:** `agent-memory-index-injection-seam` (#582), which shipped the injection point and named this as the sequel.

**Mission.** Lower `FileTreeMemoryStore`'s resident-memory ceiling — for real, rather than making it measurable.

**What shipped.** Every `IMemoryIndex` read projects to `IIndexedMemoryEntry` (scope + envelope, **no body**); `rebuild` takes projected entries while `patch` keeps whole records; a new O(1) `get(target)` replaces the two full-index scans `SemanticRetriever` and `LinkTraversalRetriever` were doing per query; bodies resolve on demand through a one-method `IMemoryRecordResolver`. The "only a faithful delegating decorator is safe" rule is replaced by a **completeness-and-faithfulness** invariant — an implementation may change where entries live and how they are found, never which exist or what an envelope says, *because the write path reads it too*.

**The second break is the one that will bite, and it was not in the brief** (it entered at design revision 3; the consumer's adopt verdict is revision 4, so they did see it). `IMemoryStore.list` now requires a selection that **narrows**: `list()` is a compile error, `list({})` and `list({ asOf })` fail (`asOf` projects, it does not narrow), and a whole-vault read is spelled `scanEveryRecord()`. This came out of the design review as the answer to "how do we absorb the read-latency cost of materializing on demand" — the accepted answer being not to absorb it but to make it unincurrable by accident. It is `safer-fetch`'s `addressGuard` / `allowAnyAddress()` idiom on a second surface. It buys **explicitness, not a cost bound**, and the docs say so rather than claiming more. `listEntries()` is the free escape hatch for the callers that only need envelopes.

**Two reversals worth not re-deriving**, both kept in `design.md` rather than tidied away:

- **Draft 1 recommended DELETING four `@public` accessors** on an in-repo census showing zero callers. That is not a meaningful measure in a **published utility library** — a `@public` method with no internal callers is the normal shape of API that exists *for* consumers, and this repo cannot see them. The census measures whether the internal refactor is *blocked*, nothing more. Projection preserves every capability and lifts the ceiling just as completely. The consumer's later census happened to confirm they call none of the four, which does **not** vindicate the argument: it was wrong independent of the answer.
- **`rebuild` had been classified as a write** because it sits beside `patch`. The consumer caught it, and source made it worse than their case: `_initialIndex` collected every record in the vault, **whole, into one array**, so the store's own open path held N whole records at peak no matter what the index retained. *That peak was the resident-memory moment the stream existed for.* Now one record — parse, fully validate, project, discard.

**It is measured, which was a gate rather than a nicety.** The brief demanded a metric and a harness stated *before* implementing, or "the stream will end with a plausible-sounding claim nobody checked". Result: what the index retains falls **9.0 MiB → 1.1 MiB (88.3%)**, and a store open costs **17.3%** of body volume, inside the design's own `< 25%` bar. **The harness printed confident meaningless numbers twice first**, and both failure modes generalize past this stream: a corpus shared between the two A/B passes retains every body itself, so the whole-record side costs one pointer per entry and the comparison reports no difference for the wrong reason; and `padEnd`-built bodies are **not resident at all** — 2000 4-KiB strings measured 1.15 MiB of their 8.2 MiB of characters and freed 0.04 MiB, because V8 shares the padding's backing store. Codified as a lesson: any memory harness must sanity-check that its fixture frees what it claims to hold before a single number it prints is believed.

**One delivery-form deviation:** the measurement shipped as `perf/residentMemory.js`, a script run on demand under `--expose-gc`, not the `src/test/perf/*.test.ts` the design proposed. A test that must be excluded from the coverage gate is a signal it does not belong in the suite — it would put a machine-dependent number behind CI and make CI's runtime a function of N.

**Coordination is written and, again, not acknowledged.** `.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-15-index-partial-read-shipped.md` leads with the migration — retriever construction widens from `(index)` to `({ index, resolver: store })`, and that is the whole of it — and flags separately the three breaks their `IMemoryIndex` census could not have caught: `list`'s required selection, `IMemoryStore` gaining a required `listEntries()` **and** extending `IMemoryRecordResolver`, and the two `@public` free functions `indexedRecordMatchesQuery` / `selectByQuery` (the latter's *return* type changed). Their bump tooling takes the whole `@fgv` set at once. **Confirm they have read it before the alpha publishes.**

**The regression it could not see** *(added 2026-08-15, found by the successor stream)*. This stream moved `query.filter` out of the shared `indexedRecordMatchesQuery` pre-filter — correctly, since that helper is handed an envelope and the predicate takes a whole record — and re-applied it in `resolveQuery`. But **five retrievers call the pre-filter directly** and materialize on their own. They silently stopped applying the predicate and began returning records that had been excluded. Nothing failed; every test passed; **coverage was 100% before and after**, because every line still ran. A `code-reviewer` pass *and* an independent antagonist pass had both been run on this surface days earlier and neither caught it, because neither was looking for a caller that had gone quiet. Fixed in `agent-memory-derived-state-reconciliation` with a single `materializePage` route and one negatively-verified regression test per call site. Codified in `TESTING_GUIDELINES.md` § "100% coverage cannot see a predicate that is never called" — **when you move a behaviour out of a shared helper, enumerate its callers and pin the behaviour at each one.**

**An independent antagonist pass over the closure record produced thirteen findings, all actioned** — and one was a live regression rather than a documentation defect. (Thirteen was the count *that pass* produced; it is not a claim that thirteen was all there was — the `query.filter` break above survived it.) The layer-1 reviewer's `listScoped` finding had been fixed by making it **drop-tolerant**, and a dropped record lands in none of `records` / `excluded` / `indexed` / `declined` / `skipped`, so coverage undercounts *in the direction of looking healthier* — verbatim the failure the predecessor stream shipped, that same week, to close. Reverted to fail-loud; the underlying eviction race is filed in `FUTURE.md` rather than improvised. The general form is worth keeping: **a robustness fix that converts a failure into a silence is not a robustness fix** unless something downstream can still count what was lost. The pass also caught a whole date cohort a day in the future, an `IMemoryQuery`-was-reshaped claim that the API diff shows is empty, a line-count pair matching no commit in the range, and this entry's own omission of the free-function breaks.

**This is the third consecutive stream to break `samples/testbed`**, and it widened the class: the casualty was a *source* file (`scenarios/memoryToolsGate/index.ts`), not a test double, so the shared-test-double remedy in `TECH_DEBT.md` would not have caught it. Only the repo-wide `rush rebuild` did — reweighting that entry toward putting the repo-wide build on the acceptance-criteria list.

**The predecessor's carried-forward item is dispositioned, not dropped.** #582's self-review-only pass: **declined**, because this stream rewrote that seam's entire read surface and re-derived every write-path read, which is where a #582 defect would have lived — a retroactive pass would review code that no longer exists in that shape. The independent pass that *was* commissioned covers the superseding surface.

### `vector-rebuild-report-by-kind` ✅ (shipped 2026-08-16 — breaking, coordinated)

**Status:** ✅ shipped to `release` via **#633** (`23a9f96`, 2026-08-16). All gates green. **Breaking** on a pre-1.0 surface, by agreement with the consumer. Delivery coordination closed: all three notes on this alpha are **acknowledged** by the consumer (2026-08-16) — see below.
**Package surface:** `@fgv/ts-agent-memory` (`IVectorRebuildReport`, `IMemoryRecordSource`, `InMemoryCosineIndex`), `@fgv/ts-agent-memory-sqlite-vec` (contract follower), `.ai/instructions/LIBRARY_CAPABILITIES.md`.
**Artifacts:** `.ai/tasks/completed/2026-08/vector-rebuild-report-by-kind/` (`brief.md`, `result.md`, `README.md`, `meta.yaml`)
**Origin:** four-round exchange with PersonAIlity, 2026-08-15, out of their ask 1 of 9 — which had already shipped in `5.1.0-48`.

**Mission.** Resolve every count in `IVectorRebuildReport` by kind, add `excluded` (which needs `IMemoryRecordSource.list()` to report what it filtered), and decouple coverage reporting from the error-handling mode.

**The rule the stream exists to install**, and the reason it is worth a stream rather than a patch: *every count in a coverage report is resolved by kind, because such a report exists to answer "is my coverage what I intended?", and no bare total can answer that in either direction.* The tempting exception — that `indexed` is the positive case and recoverable from the index — was tested against the API report and is **false**: hits carry `target`, not `kind`; `query` needs a probe vector and a `topK`; there is no enumeration. `indexed` is in fact the more dangerous count to leave bare, being the one a coverage surface renders.

**How it got here is the justification.** The consumer's first proposed fix was in the wrong layer and they conceded it; their counter caught us about to reproduce the thread's own defect one layer down; and their final question — *what is the rule, so the next person is not deciding a fourth field by re-running this argument?* — inverted the answer we were about to give. The brief carries the rejected alternatives with their reasons so they are not re-litigated.

**Coordination is not optional.** Their bump tooling takes the whole `@fgv` set at once, so a breaking seam change would otherwise arrive with everything else and be discovered by a red build rather than by reading. Flag the alpha that carries it. The flag is written: `.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-15-rebuild-report-shipped.md`, naming both breaks, the migration, and the rollback-report trap.

**What shipped, and where it differs from the brief.** All four deliverables landed in one change rather than the staged pair the consumer left open — staging meant two breaking releases against the same three fields, the second breaking every reader the first had just made them fix. Three things the brief did not anticipate:

- **`indexed` stopped being read back off the index.** Both implementations tally per successful `add` instead — the in-memory one used `_vectors.size`, the SQLite one a `COUNT(*)`. Forced (neither knows kinds) and better twice over: `indexed` becomes a per-record tally consistent with its siblings so the sum-of-buckets invariant holds exactly, and the SQLite side lost the one fallible step in assembling a report.
- **`asRecordSource()`'s filter moved to a new package-internal `store/vectorRecordSource.ts`.** `fileTreeMemoryStore.ts` was at 1995 lines against a 2000-line `max-lines` cap and the inline tally took it to 2012. The extraction leaves it at 1991 — **4 lines bought, 9 of headroom left**, neither of which is a solution. This file has crossed the line before: `CODING_STANDARDS.md` § "A local warning is a CI failure" is written from it. Filed as a P2 in `TECH_DEBT.md` by this stream, since the ledger carried no standing entry — the only max-lines entry was `apiClient.ts`, retired 2026-08-14.
- **The fragment index was modified despite being explicitly out of scope**, forced by the seam change — and editing it surfaced that `InMemoryFragmentCosineIndex.rebuild` reset **before** listing, so a transient list failure emptied a healthy index. That is the exact data-loss ordering the record-granular sibling documents as already corrected, and on the durable sibling it had been real loss. Fixed here along with the test that was pinning it.

The repo-wide `rush rebuild` earned its place: it caught exactly the casualty the brief predicted — a fake `IVectorIndex` in `samples/testbed` that neither library's own suite can see. **That is the second consecutive stream against this contract to break that same file** (the first broke #614), with the rule codified in `CODING_STANDARDS.md` in between and written from that very fake. The recurrence is filed as tech debt proposing a mechanical gate; a third restatement of the rule would not have helped.

**Open, and not discharged by the close:** the coordination flag is **written but not acknowledged**. The brief called coordination "required and not optional" because a silent arrival is the failure mode, and writing the note is only half of it. Confirm PersonAIlity has read it before the alpha carrying this publishes.

An independent antagonist pass over the closure record produced eleven findings, all actioned — including this entry's own stale `TECH_DEBT.md` citation and a premature ✅. Dispositions in the stream's `result.md`; the substantive ones in its README's Appendix A.


### `sqlite-vec-path-open` ✅

**Status:** ✅ shipped to `release` 2026-08-16. Additive — `create()` untouched on both index classes. Artifacts at `.ai/tasks/completed/2026-08/sqlite-vec-path-open/`.
**Package surface:** `@fgv/ts-agent-memory-sqlite-vec` (both index classes + `model.ts` + new `connection.ts`), `.ai/instructions/LIBRARY_CAPABILITIES.md`, the package README.
**Origin:** PersonAIlity ask, 2026-08-14, against `5.1.0-49`. Consumer-marked **low** priority with a shipped workaround — picked up when the consumer turned out to have a fix waiting on it.

**What shipped.** `open({ path })` beside `create({ database })` on **both** classes, returning a handle `{ index, close() }`. The disposer travels on the handle rather than on the class because a `create()`-made index holds a connection the consumer owns and must stay incapable of closing it. The driver's only value import is isolated to a lazy `connection.ts`, so merely importing the package still does not load the native binding. A failed `open` closes what it opened — and says so if that close itself fails, folded via the package's own `withRollbackNote`.

**Two findings worth carrying forward.** The first leak test **pinned nothing**: it reopened the path and wrote to it, which succeeds just as happily against a leaked connection, since SQLite permits many connections to one file. Caught only by reverting the fix and watching it stay green; replaced with an open-descriptor count that fails without the cleanup. And **`rushx coverage` and `heft test` disagreed** on the same tree (85.71% vs 100% on `connection.ts`) — both honest, different scripts, CI gates on the latter; the substance held either way and two untested error formatters were covered. `rushx coverage` is not currently usable as a gate in this package: it globs `src/**/*.ts` and `dist/**/*.js` alongside `lib/`, and the raw TypeScript suites fail to parse.

**Mission.** Add a path-based factory beside the existing bring-your-own-`Database` one, so the single-index case needs neither a consumer value-import of `better-sqlite3` nor a hand-rolled `captureResult` around a constructor that throws.

**Why it is worth doing at all.** All four of the ask's claims re-verified against source, and one is sharper than the ask states: our three source files import `better-sqlite3` as `import type` **only**. The consumer's value-import is not shared discomfort — it exists solely because our factory signature forces it. This really is the one place the wrapper leaks its own dependency into consumer source.

**Two corrections to the ask, both in the brief.** It names one class; `SqliteVecFragmentIndex.create` has the same shape and the same leak, so a fragment-only consumer is unhelped — do both or neither. And `close()` cannot just be a method: `create()`-made instances hold a consumer-owned handle and must stay incapable of closing it, so the disposer should travel with `open()`'s return rather than sit on the class. That second one changes their call site, so it is worth telling them before we build.

### `personaility-asks-2026-08` (Stream A — the embedding lane) 🟢

**Status:** 🟢 **shipped to `release`** — all five units merged 2026-08-12, plus one unplanned refactor that unblocked them. Nothing published yet; the alpha still has to go out. Artifacts: `.ai/notes/cross-repo-handoffs/personaility-asks-2026-08-triage.md`, `…-reply-2026-08-11-ask-package.md`, `…-status-2026-08-12-stream-a.md`, `…-status-2026-08-12-shipped.md`.

**Origin.** One consolidated ask package from PersonAIlity, 2026-08-11 — nine open items, none blocking them, every one carrying a workaround they are already running. They explicitly invited "not now" on the whole package. We re-verified every load-bearing mechanic against our own source before acting (both sides shipped a wrong sweep this month); **all their claims held**, down to exact control flow.

**The through-line, adopted as ours.** Four of the nine are one species — **a failure reported as a success**. We already solved it well once on the record path (`onRecordError: 'skip'` + structural `skippedRecords`); items 1, 4 and 5 ask for that same shape in three more places.

| item | change | shipped |
|---|---|---|
| **4** | `MemoryEmbedder` may resolve `undefined` to **decline** a record — no `embeddingRef`, no failure, and the decline itself logs nothing. A decline on an already-embedded record drops the inherited reference *and* prunes the vector it named, **after** the commit | #611 |
| **2** | `embedKinds?: ReadonlySet<Kind>` + `IMemoryStore.embedsKind`; absent means every kind participates. The gate sits **before** the embedder call, so an excluded kind costs nothing, and narrowing it on an existing vault retires the embeddings it no longer maintains | #612 |
| **1** | partial-tolerant `rebuild` returning `IVectorRebuildReport` (`indexed` / `declined` / `skipped`), `onRecordError` defaulting to `'fail'` | #613 |
| **3** | `size` + `rebuild` promoted onto `IVectorIndex`, with `SqliteVecVectorIndex` implementing both | #614 |
| **5** *(added mid-stream, at the consumer's ask)* | `embed?: MemoryEmbedOutcome` on write observations + a matching query axis — the write-path axis the first status note told them was still open | #615 |

**One unplanned unit: #616.** CI rejected the stack on a `max-lines` warning; the store had crossed 2000 lines. Extracting a `VectorMaintenance` collaborator took it from 1991 → 1758 with no test file changed and a byte-identical `api.md`.

**Two bugs this stream found in its own work, both worth recording.** `rebuild` cleared the index *before* attempting to list — so a transient list failure destroyed a healthy index, **durably** on the sqlite sibling. A pre-existing test pinned the destructive behavior as intended, and the package was at 100% coverage the whole time; no test had ever seeded a populated index before a failing list. And the decline path pruned its stale vector *before* `_persist`, so a failed write would have deleted a vector that was still accurate for the content actually on disk.

**Three process lessons, all codified in `CODING_STANDARDS.md`:** a local warning is a CI failure (`rush rebuild` exits non-zero on "success with warnings" where `rushx build` exits 0); widening a shared interface needs a repo-wide build, not a per-package one (a test double in `samples/testbed` broke #614); and a green Copilot check only means the job ran — three of the five PRs had substantive findings recorded solely in *suppressed* comments.

**Answered without scheduling:** item 5's original scope (strict text read — half already shipped in `-47`), 6 (provenance query axis — **intent stated so they can design against it existing**), 7 (index read surface — deferred deliberately, breaking, wants its own design), 8 (prompt-slot writability — the one-sentence "advisory" doc remedy), 9 (`ts-res` `addResource` — fold into the next touch).

**Published as `5.1.0-48`** (alpha tag, 2026-08-13T04:23Z) — and the consumer found the version before we named it, because the status note that promised to tell them was drafted hours before the publish and never revisited.

**Still owed back to them:**

| item | state |
|---|---|
| An **alpha is sitting on the `latest` tag** for two packages | **Open, and narrower than we had been describing it.** The established packages are correct — `ts-utils` / `ts-extras` / `ts-json-base` are all `latest: 5.0.2` (a real release), `alpha: 5.1.0-48`. But `ts-agent-memory` (`latest: 5.1.0-36`) and `ts-agent-memory-sqlite-vec` (`latest: 5.1.0-42`) have never had a stable release, and an accidental publish left an **alpha** on their `latest` tag. **The harm is misrepresentation, not staleness:** pre-1.0 consumers track `@alpha` and were never going to install from `latest`, so this did not hide Stream A from anyone — but anyone who does install from `latest` gets a months-old alpha *presented as a stable release*. **Correct the earlier framing:** we had recorded this as "the mechanism by which our shipped work looks unshipped" and told the consumer a tag fix would help them. Both overstated it. Fix: leave `latest` unset on a pre-1.0 co-developed package until there is a deliberate release, and stop accidental publishes moving it. |
| 21-of-25 unreachable `types` condition | Open. Needs a browser API-Extractor rollup the build does not yet emit (module-resolution stream, finding 1). |

### Why these packages stay in alpha — the co-development posture

`ts-agent-memory`, `ts-agent-memory-sqlite-vec` and the surfaces around them are **co-developed with
consumers**, currently PersonAIlity (active) and chocolate-lab (dormant). Staying on the alpha channel
is **deliberate**, not a backlog item: it is what lets us take the breaking changes we keep discovering
*while* the consumer adopts brand-new code, without a compatibility tax on work whose shape is still
being learned. `rebuild`'s signature change breaking their one call site is the system working, not
failing.

Two things follow, and both have already been got wrong once:

- **The alpha tag is the product channel for these consumers.** Do not describe `@alpha` to them as a
  workaround, and do not offer a `latest` fix as though it would change what they install. Both were
  said in a draft of the 2026-08-13 note and corrected before sending.
- **`latest` on a package that has never had a stable release should be unset**, not pointed
  somewhere. There is no "current stable" to name, and naming an alpha misrepresents it as one.

The corollary for reviewers: on these packages, "this is breaking" is not an objection by itself. The
objection is "this is breaking *and* the new shape isn't better", or "this breaks silently".

### Open asks carried forward — the 2026-08-12 delta

Three items from their post-`-48` sweep, **tracked here with verdicts so "deferred" has somewhere to live**. Their §3 diagnosis was that our ledger had no state between *done* and *silent*, and they were right: items 2 and 3 below were in the original package, answered with intent rather than a verdict, and decayed into silence.

| ask | verdict | notes |
|---|---|---|
| **`rank` has no backfill** — a projector registered on a populated store ranks nothing already written, and because absent-`rank` sorts last, every pre-registration record lands *below* every post-registration one regardless of score | **Will do** | **Verified in source, not taken on faith:** `_stampRank` is called only from the two write paths and nothing walks; `_compareByRank` returns `1` for absent-vs-present before any value comparison. Not a partial ordering — **inverted relative to the projector's intent, and it looks like it works.** The docs are complicit (`rank` says "on every put/update", never "only after you register"). **Never sent to us before** — found after their package was assembled. **Design wrinkle:** a reconcile routed through `put` would bump `updated`/`seq` and fire a write observation per record, trading a wrong `rank` order for a wrong recency order; it needs a path that restamps `rank` only. That is the work — the walk is trivial. A plain count is enough; no report shape. |
| **No query axis for provenance** | **Will do**, small | Exact-match on `provenance.source`, `StructuredFilterRetriever` as the home. We asked for the shape twice; they described the same use three times ("show me everything this source produced"). Building to the stated use rather than asking again. |
| **Strict UTF-8 text read** (`ts-json-base`) | **Will do** — *reversed from an initial won't-do* | The initial answer pointed at `getFileBytes` + a fatal `TextDecoder`. On learning the consumer is moving to the **HTTP** adapter we checked it properly: `HttpTreeAccessors` is seeded from the REST payload's `contents: string`, so `JSON.parse` has already decoded leniently and substituted U+FFFD **before this code runs**; the inherited `getFileBytes` then re-encodes that string. A fatal decode over those bytes **succeeds, having nothing left to check** — the recommended escape hatch is a green light on a check that cannot fail. **Its class docstring asserted the opposite and is corrected in this PR** (a live doc bug, independent of the feature). **Shape:** strict read on byte-faithful adapters, and a **loud unsupported** on HTTP rather than a success — the precedent is browser `safer-fetch` refusing `validate-each-hop` at option resolution instead of failing later. **Open question back to them:** do they need detection *over HTTP*? That needs a bytes-native transport (a wire-format change), not a flag. |

**Closed by them, not to be re-actioned:** record-index read surface (we declined in the contract text; they agree), empty-index-vs-unmatched-query (`size` + `declined` answer it a different way), `addResource` input type (bundle or drop).

**Owed process change:** alpha release notes should carry a "breaking on the active surface" line — `rebuild`'s signature change broke their call site and no release note surfaced it.

---


### `task-corpus-index` 🔵 → `agent-memory-mcp-server` 🔵 (a conditional pair)

**Status:** 🔵 both **proposed, neither started**. Briefs at
`.ai/tasks/active/task-corpus-index/brief.md` and
`.ai/tasks/active/agent-memory-mcp-server/brief.md`.
**Ordering is a hard dependency and the second is conditional on the first's outcome.**

**Scope moved during drafting.** It began as an index; it is now **two skills and the metadata
contract between them** — `/finalize-task` (write side) and `/task-corpus` (read side).
**If only one half ships, ship the write side**, because the index is only as good as the metadata
under it.

**Why `/finalize-task`, and why the evidence is unusually strong.** Closing a stream is a
multi-part ritual — generate metadata, migrate `active/` → `completed/`, write the polished
README, update this ledger, update `LIBRARY_CAPABILITIES.md`, verify change files. The rule is
already written down and unambiguous (`artifact-protocol.md`: *"the migration ships in the same PR
as the work"*), and it **already failed twice**: the protocol names its own recurrence on the
`ai-assist-client-tools` cluster close (#451 → #452), where *"the codified rule existed; the
failure was the orchestrator's pre-promotion checklist not gating on it"* — and the fix applied
then was *another checklist gate*. The result today is **68 stream directories against 43 ledger
entries**. Writing it down did not work; adding a gate did not work. The remaining move is to make
it **one invocation** rather than a list a tired agent is asked to remember at the end of a long
stream.

**And an antagonist pass before anything is handed over.** Every artifact the ritual produces is a
claim about what happened, written by whoever just spent a long stream forming a view of what
happened — the exact condition under which a confidently wrong claim goes unnoticed. `STATUS.md`
already measured this: *"Independent layer-1 passes earn their cost … commissioning independent
`code-reviewer` passes retroactively found: a real P2 on #582."* So the pass is independent where a
reviewer can be spawned, refute-first by framing, and required to state what it checked — *"looks
right"* is not an output. It targets **inaccuracies** (every claim traces to a quotable line;
`sourceLine` appears verbatim; PR numbers belong to this stream) and, harder and more valuable,
**omissions** — the highest-yield being *"`diverged` is empty: true, or unexamined?"*, since an
empty `diverged` on a stream that visibly changed shape is the characteristic failure of the whole
ritual. It is **not optional in retroactive mode** — more important there, not less, since you are
reconstructing a stream you did not run.

**The design line: script what cannot be wrong, prompt what needs judgment.** Directory moves,
bucket derivation, index regeneration and `rush change --verify` get automated. The
`WORKSTREAMS.md` entry is **drafted for review**, and `LIBRARY_CAPABILITIES.md` is **prompted, not
written** — auto-generated prose would degrade two artifacts whose whole value is that they are
curated. Must run **retroactively** — and in that mode it **moves nothing**, since those streams already
sit in `completed/`; it backfills metadata and ledger entries in place, skipping the migration and
the change-file gate. And it should close *itself*: if `/finalize-task` cannot finalize its own
stream, it is not finished.

**The skill is written and usable now** — `.claude/skills/finalize-task/SKILL.md`, authored ahead
of the tooling because every step is doable by hand. The generator would make some steps cheaper;
it was never a prerequisite. So the retroactive backfill can start immediately, and what remains
in this stream is tooling that accelerates a ritual already running.

**Origin.** Erik, 2026-08-14: *"Can you suggest a memory tool to index our task files so you can
read them? Prefer to just adopt if there's something that meets our needs but we can build if
needed."*

**The problem, stated precisely.** `.ai/tasks/` is **269 markdown files / 3.1 MB** across 14
active and 52 completed streams, and it is the repo's institutional memory. An agent picking up
cold cannot use most of it — but **not because retrieval is hard**. 3 MB is instantly greppable
and every agent already has `Grep`/`Glob`/`Read`. The failure is **discovery**: you cannot grep
for a stream whose existence you do not suspect. Demonstrated in the same session — the
branch-migration plan existed, complete and current, and took four searches across three wrong
guesses to find. One search less and it would have been re-derived.

**Why two streams and not one.** The corpus already has strong file conventions (`brief.md` 59,
`state.md` 47, `result.md` 32, `README.md` 28, `design.md` 16) and a documented two-tree layout —
but **no frontmatter and no index**. So the cheap hypothesis is that discovery is a *metadata*
problem, not a *search* problem, and `task-corpus-index` tests it: frontmatter plus a generated
`INDEX.md` plus a generator that fails loudly rather than emitting a partial index.

`agent-memory-mcp-server` is the expensive half, and it is **deliberately gated on evidence**.
It builds `@fgv/ts-agent-memory-mcp` — a Result-integration boundary over the MCP SDK's *server*
side — and ingests the corpus into a vault. Worth doing if the index falls short; a large build
in search of a justification if it doesn't. **Start it only on a recorded instance of a real
question the index failed to surface.**

**The adopt-vs-build finding.** Surveyed before proposing a build, per the ask:
- **Off-the-shelf MCP memory servers** are knowledge-graph shaped (entities/relations for
  conversational recall), not corpus indexers for an existing markdown tree. Adopting one still
  leaves the ingest pass — which is the actual work. Poor fit. *(Not exhaustively surveyed;
  worth a second look before committing to the build.)*
- **Our own `@fgv/ts-agent-memory` is the right substrate** and is unreachable for one specific,
  verified reason: `createMemoryTools` returns `AiAssist.IAiClientTool[]` for ai-assist loops
  (`memoryTools.ts:693`), and `@fgv/ts-extras-mcp` is an MCP **client** that adapts the other
  direction and puts a server explicitly out of scope. **The missing piece is a server, not a
  capability.**

**Invocation decided (2026-08-14): on demand, not pre-commit.** A `rush index-tasks` custom
command, and a `/task-corpus` skill that **regenerates before reading**. The hook was declined on
evidence: `common/git-hooks/pre-commit` already exists, and it was bypassed repeatedly in the very
session that motivated this — agents committing from bare worktrees where the rush autoinstaller
was never installed, so the hook would have failed the commit. It does not run in exactly the
bulk-work sessions where freshness matters, and it would conflict across parallel worktrees on one
shared generated file. Because the skill regenerates first, no agent depends on the committed copy
being fresh, which removes the need for a CI verify gate too — consistent with the change-file
lesson about gates invisible to the local suite.

**Metadata is a per-stream `meta.yaml`, built once at stream completion (decided 2026-08-14).**
Not hand-authored frontmatter across 269 files. It hooks the completion transition that already
exists, lands in the stream-closing PR where a human still has context to review it, and — because
each stream writes only its own directory — **removes the shared-file conflict class entirely**.
**`summary` is a generated synthesis** across `brief.md` and `result.md` — because the most useful
fact about a closed stream is the delta between what it was asked to do and what it actually did,
including what got cut, and no authored line contains that (it spans two files). An extraction-only
draft was considered and **rejected as over-cautious**: it yields the outcome while silently
dropping that the outcome changed shape, which is exactly where `orchestrator.md` says drift
lives. The risk was never generation but *unreviewed* generation, and building at completion
already puts it in the closing PR in front of someone with full context. Made auditable by
structuring it (`intended` / `shipped` / `diverged` as named fields, so a wrong claim is visible
rather than buried) and by carrying the extracted authored line verbatim as `sourceLine`, a
free check a reader can compare against without opening the stream. **`keywords` are generated**
too — that is where a model adds recall, and a bad keyword costs one wasted grep rather than a
false belief. Blank beats fabricated wherever `result.md` is thin. A `sourceHash` makes
post-close edits detectably stale rather than quietly wrong.

**`INDEX.md` is gitignored (decided 2026-08-14).** The question was whether it is useful to
someone browsing from outside the repo — and that audience is already served, better, by *this
file*: 803 lines, 41 curated stream entries, Active and Completed. The generated index would
duplicate that for humans while being worse at it. Its unique value is **completeness for
machines**: **68 stream directories exist on disk against 41 narrated entries here**, and
**31 of those directories have no entry under their own name — 20 of them are not mentioned
anywhere in this file, even in passing.** Agents need all 68; humans want the curated 41.
Different audiences, different artifacts, no reason to commit the machine one — which also
removes the merge-conflict class and the risk of an agent hand-merging a generated file into
something corrupt that reads as authoritative. **Side benefit taken:** the generator also reports
stream dirs missing a ledger entry, turning that 31-stream gap into a worklist.

*(Counts measured 2026-08-14. An earlier draft of this section said "43 narrated entries" and
"~25 streams" — both wrong. The 43 counted this file's two prose section headings as if they
were streams, and the 25 was a subtraction of two totals rather than a set difference, which
silently nets naming mismatches against genuine gaps. Four ledger entries name a stream with no
matching directory (`ai-assist-thinking-events`, `fetch-primitive-threat-model`,
`personaility-asks-2026-08`, `ts-prompt-assist-features`); some of those are the same stream as
a differently-named directory, which is exactly the reconciliation a set difference surfaces and
a subtraction hides.)*

**The open question that sizes the second stream** — resolve it before anything else there:
does `ISchemaValidator.toJson()` drop straight into MCP tool registration? If yes the adapter is
small, generic, and belongs beside its inverse in `ts-extras-mcp`. If not, the estimate moves.

---

### `module-resolution-upgrade` ✅

**Status:** ✅ shipped to `release` via **#608** (`af2178cde`) and **#609** (`74523fa29`), 2026-08-09/10 — `moduleResolution` stated explicitly through an fgv-owned tsconfig layer, the freestanding overrides reconciled, plus a files allowlist and audited node-only declarations. **Still open:** the `node16`/`nodenext` evaluation remains gated behind a dual-emit decision this stream did not take. Artifacts at `.ai/tasks/completed/2026-08/module-resolution-upgrade/`.

**Mission.** The repo resolves modules under **node10 and nobody chose it** — the rig never sets `moduleResolution`, so `module: commonjs` defaults it. Under node10 **TypeScript does not read the `exports` map at all**, which is the structural reason `ts-web-extras-webauthn`'s `default` condition could name a file that never existed for the package's entire life with every build green.

**What shipped.** `moduleResolution: "node10"` is now **stated** in all 31 rig-inheriting projects, and the three freestanding webpack tsconfigs agree on `bundler`, each with the reason recorded. Verified free the way the brief demanded — full `rush rebuild` before and after, hashing every emitted `.js`/`.d.ts`/`.map`/`.json` plus every checked-in `etc/*.api.md`: **8,836 artifacts, zero differences.** No shipped code changed; no change files needed.

**The load-bearing correction — step 3 is not available at the price it was quoted.** `moduleResolution: bundler` **cannot be set on a `module: commonjs` project**, and 29 of those 31 are (the other 2 are the `heft-web-rig` libraries, which declare `module: ES2020`); `node10` is the only legal value there (`bundler` → TS5095, `node16`/`nodenext` → TS5110). The design amendment's probe varied `module` and `moduleResolution` *together* and so never asked whether its `bundler` row was reachable from where the repo sits. **Every path off node10 changes the emit, so steps 3 and 4 share one prerequisite and are one decision, not a cheap rung and an expensive one.**

**OQ-2 answered in the negative, with the substitute ruled out.** A type-check-only `bundler` overlay was built and swept across all 29 projects: **73 errors, of which 70 are one cause** — `bundler` does not set the `node` export condition, so every dual-entry `@fgv` package resolves to its **browser** build and legitimately lacks the Node-only surface. `customConditions: ["node"]` takes it to 3, but only by pinning the resolver to `node` so the pass **never evaluates `default`** — exactly what webauthn got wrong. Neither pass is a gate, and both are weaker than `verify-esm-entrypoints` / `verify-tarball-exports`, which assert every condition at every subpath unconditionally. **Recommendation: do not build it.** **OQ-3** answered too: the per-project shape was **forced, not chosen** — Heft rejects a TS 5.0 `extends` array, and a workspace-symlinked rig's relative paths resolve into the rig's own tree.

**Findings filed (9).** The largest is not from the brief: **21 of 25 published packages declare a `types` condition that can never be selected**, because it sits after `default`, which matches unconditionally — the same *shape* as the webauthn defect. Nothing has broken (TypeScript falls back to the `.d.ts` beside the resolved `.js`), but **our gates check that each named file exists; none checks that it is reachable** — that blind spot, not the ordering itself, is the finding. Note the obvious fix is a trap: there is one API-Extractor rollup per package and it describes the *Node* entry, so hoisting a single `types` key above the branches would hand browser consumers the Node surface. The correct shape needs a browser rollup the build does not yet emit. Also: `@fgv/ts-utils` imported `jest-snapshot/build`, a subpath that package does not export (confirmed `ERR_PACKAGE_PATH_NOT_EXPORTED` at runtime; latent only because the import is type-only and erased) — the sweep's one real defect, **fixed here** by importing `Context` from the package root as `@fgv/ts-utils-jest` already does. And: the three webpack apps compile via `babel-loader` and are **never type-checked**; `ts-res-ui-playground` has 22 pre-existing errors and `apps/sudoku` 13.

**Reframing the emit decision.** Asked what changing the emit would cost consumers, and the answer is *nothing, because none of them are on it*: **25 of 25 packages route `node.import` at `./lib/index.js`, the CommonJS build**, and `main` is `lib/index.js` everywhere. The ESM tree in `dist/` is built and packed and reached by one browser branch (`@fgv/ts-bcp47`). So the choice is stop shipping `dist`, or fix and activate it — and the ~3,520-specifier change usually costed as "the price of `node16`" is really **the price of having a working ESM emit at all**, which we currently pay for and do not get. Note the ordering trap in option 2: adding `dist/package.json` `{"type":"module"}` *first* is what would break the bundler path that works today, by engaging webpack's `fullySpecified` before the specifiers are fixed.

**Gates untouched and green**, as the brief required — and per OQ-2 this work cannot replace them.

---

### `publish-tarball-gate` ✅

**Status:** ✅ shipped to `release` — the content reached `release` inside **#607** (`71787e798`, 2026-08-09) together with the ESM-entry-point and browser gates. **Its own PR #606 was closed unmerged**, which reads like lost work and is not: `common/scripts/verify-tarball-exports.mjs` is on `release` and wired into CI and all six publish workflows. The previously-recorded *"⚠️ rebase still owed"* is obsolete — that dependency was discharged by the #607 route, not by a rebase. Artifacts at `.ai/tasks/completed/2026-08/publish-tarball-gate/`.

**Origin:** direct consumer ask from PersonAIlity, 2026-08-09.

**Mission.** Verify that every path named in a published package's `exports` map exists **in the tarball that ships**, not merely in the working tree. Three defects of one class shipped in a single week — `ts-utils`'s unloadable ESM entry, `ts-web-extras-webauthn`'s `default` naming a file that has never existed, and 5.1.0-27 publishing only `src/` with no build output at all. The gate on #603 checks the working tree, which covers the first two and **cannot** cover the third: `lib/` existed locally and never entered the tarball. **This stream builds a detector, not fixes**; anything it flags is a finding.

**What shipped.** `common/scripts/verify-tarball-exports.mjs` + the `rush-pack-check` autoinstaller (`npm-packlist`; shared shrinkwrap untouched). It walks the **whole** `exports` map — every condition, every subpath, plus `main`/`types`/`module`/`browser` — against the packed file list. Superseding the sibling's tree-based existence check was considered and **declined with reasoning**: the two cannot disagree in the dangerous direction, and what remains genuinely the sibling's is loadability, not existence. Cross-referenced in both headers.

**Instrument, measured.** `npm-packlist` costs **5.2 s for all 25 packages**; `npm pack --dry-run --json` costs **7.6–8.2 s per package** (~3.3 min for the repo) — so the brief's ~12.8 s/package held in shape if not in magnitude on this container. Output verified **byte-identical to `npm pack`** on four packages spanning both `.npmignore`/no-`.npmignore` shapes. The cost is in getting `npm-packlist` a tree, not in `npm-packlist`: `Arborist.loadActual()` is 7.7 s/package, so the gate passes a minimal tree node instead and **fails loudly** on `bundleDependencies` rather than under-checking silently.

**OQ-1 (placement) — resolved as both.** Publish-time is the hard gate and is wired into **all six** publish workflows, including the three `-legacy` ones, which are `workflow_dispatch`-triggerable and therefore real bypass paths. Per-PR CI too, because ~5 s is unnoticeable. **OQ-3 (does it *load*?) — existence only**; the loading half is recorded in `docs/FUTURE.md` with its cost and the narrow residual case it would close, and stated plainly in the consumer note since they asked for both.

**Neutralizations — three, all demonstrated.** Reverting the webauthn `default` fix fails the gate (and fires on a condition Node never selects, which a single-condition resolver would miss); a `.npmignore`-excluded build output fails it; and the true 5.1.0-27 shape — build output absent from disk — fails it with the no-build-output diagnosis. Tree restored clean after each.

**Findings filed (2).** 11 packages ship `src/`, compiled tests, and `.rush/` internals — split exactly on presence of `.npmignore`; recommend a `files` allowlist. And: **npm will not prune the directory containing `main`**, so an `.npmignore` `lib/` line is silently inert — reproduced against real `npm pack`, and it corrected the gate's own no-build-output heuristic into a reported count.

---

### `agent-memory-ingest-dedup-scope` 🟢

**Status:** ✅ shipped — PR [#600](https://github.com/ErikFortune/fgv/pull/600) merged to `release` as `02ba90459`. Branch `agent-memory-ingest-dedup-scope` from `release` @ `b392e1534`. All five deliverables landed; suite green at 100% coverage; `code-reviewer` clean, Copilot loop stopped at round 2 on diminishing returns. Ran in parallel with `safer-fetch-s3`; no code overlap, but both edit `.ai/instructions/LIBRARY_CAPABILITIES.md` and this file — **own section only**.
**Substrate:** `.ai/tasks/completed/2026-08/agent-memory-ingest-dedup-scope/{brief.md, state.md, result.md, findings/inbox/}`
**Package surface:** `@fgv/ts-agent-memory` (`ingest`, `store/fileTreeMemoryStore.ts` — `IMemoryStore` lives there, not in the `types/memoryStore.ts` the brief named; that file does not exist).
**Behavior change (OQ-3, intended, unflagged):** ingest layer-1 now honors `dedupScope`, so `'entity'` kinds (`MemoryCapCullPolicy` / `TemporalVersionedPolicy`) stop collapsing distinct entities with identical bodies on the `ingestItem` path. Kinds with no registered policy are unaffected — they resolve through the store's default `KnowledgeLwwPolicy`, which declares `'content'`.
**Origin:** problem report from PersonAIlity (2026-08-04) against 5.1.0-46, triaged and verified against source.

**Mission.** `dedupScope` is honored by the store and ignored by the ingest orchestrator, so a kind declaring `'entity'` still gets `'content'` behavior through `ingestItem` and the declaration is dead on that path. **`dedupScope` has zero references anywhere in `ingest/`.** Blast radius is wider than the report, though narrower than the brief stated: the affected kinds are those registering an `'entity'`-declaring policy (`MemoryCapCullPolicy` / `TemporalVersionedPolicy`) **whose codec puts distinct entities in one scope** — MTM turns and LTM conversations. A kind with no registered policy resolves through the store's default `KnowledgeLwwPolicy` to `'content'` and is unaffected; temporal kinds were already isolated because `TemporalIdentityCodec` gives each entity its own scope. (The brief's "every experience and versioned kind is affected" was corrected in-stream — see `result.md`.) Fixing it needs a seam first — the orchestrator holds an `IMemoryStore`, which exposes no policy accessor, which is why the consumer's proposed fix is not currently expressible. Carries a second, sharper fix the report surfaced: a `duplicate-of` collapse removes an address that sibling edges in the same pass were built against, failing the **whole** ingest item — true even for `'content'` kinds where the collapse is correct. Also writes `.claude/project/agent-memory-ingest-design.md`, the note three source files already cite but which did not exist.

---

### `private-key-storage` ✅

**Status:** ✅ implemented + reviewed (PR #427, gates green) — ready for squash to `release`
**Integration branch:** `private-key-storage` (off `release`) → squash to `release` at close
**Workflow shape:** single implementation PR onto integration branch (both impls together)
**Substrate:** `.ai/tasks/completed/2026-05/private-key-storage/{brief.md, state.md, result.md, README.md}`
**Package surface:** `@fgv/ts-extras/crypto-utils` (encrypted-file impl, Node) + `@fgv/ts-web-extras/crypto-utils` (IndexedDB impl, browser) + `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Out-of-scope:** changes to the `IPrivateKeyStorage` interface, to `KeyStore.addKeyPair` semantics, or to `@fgv/ts-chocolate`. Multi-process/multi-tab concurrency (single-process/single-tab assumption; documented limit). Password-derivation helper for the file impl's encryption key (consumer concern).

**Mission.** Ship the two `IPrivateKeyStorage` implementations the existing JSDoc promises but doesn't deliver: `IdbPrivateKeyStorage` in `@fgv/ts-web-extras/crypto-utils` (IndexedDB, `supportsNonExtractable: true`) and `EncryptedFilePrivateKeyStorage` in `@fgv/ts-extras/crypto-utils` (directory-on-disk, AES-256-GCM-encrypted JWK content, FileTree I/O, `supportsNonExtractable: false`). Both satisfy the interface verbatim — additive, no interface changes. Also fixes the JSDoc that points at non-existent impls (textbook L18). Closes the gap hardback's agent surfaced when `KeyStore.addKeyPair` failed with `'No private key storage configured'`.

**Origin.** Cross-repo gap surfaced 2026-05-28 (hardback agent investigating agent/hub private-key persistence). ts-extras crypto surface is **established** → additive only. Gap-then-fix: every `KeyStore.addKeyPair` consumer currently rolls their own backend or skips the feature; we ship in fgv so consumers benefit + the JSDoc becomes accurate.

### `messages-log-levels` 🟢

**Status:** ✅ implementation complete — PR open onto `messages-log-levels`; ready to squash → `release`
**Integration branch:** `messages-log-levels` (off `release`) → squash to `release` at close
**Workflow shape:** single implementation PR onto integration branch
**Substrate:** `.ai/tasks/completed/2026-05/messages-log-levels/{brief.md, state.md, result.md, README.md}`
**Package surface:** `@fgv/ts-app-shell` `messages` packlet + `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Out-of-scope:** ts-utils log-level types (consumed as-is; no `'success'` added there); the shipped `RetainingLogger`/`MultiLogger`; non-messages ts-app-shell packlets.

**Mission.** Align the `messages` packlet's filter to `@fgv/ts-utils`'s canonical `MessageLogLevel`/`ReporterLogLevel` so the panel can filter at logger granularity — making the `RetainingLogger` → panel bridge lossless. Current `MessageSeverity` filter lacks `detail`/`quiet` (coarser than the logger) and conflates verbosity-filter with display-styling. Fix (fork a): two axes — `IMessage.level: MessageLogLevel` drives filtering (`shouldLog`-based threshold); `severity?: MessageSeverity` (incl. `'success'`) is styling-only, defaulting via a level→severity derivation. Breaking on the messages packlet — cheap, ts-app-shell is active-dev.

**Origin.** Gap in the observability journey (same as `logging-observability`): `RetainingLogger` retains rich levels server-side; this completes the display half. Cross-library semantic alignment (L19 family). Soft-blocker for personaility's client-side observability.

### `logging-observability` 🟢

**Status:** ✅ implementation complete — PR #418 review satisfied; ready to squash → `release`
**Integration branch:** `logging-observability` (off `release`) → squash to `release` at close
**Workflow shape:** single implementation PR onto integration branch
**Substrate:** `.ai/tasks/completed/2026-05/logging-observability/{brief.md, state.md, result.md, README.md}`
**Package surface:** `@fgv/ts-utils` logging packlet (`LoggerBase` additive `_logStructured` hook + `RetainingLogger` + `MultiLogger` + `ILogRecord`) + `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Out-of-scope:** changing the existing `_log` seam / `InMemoryLogger`; `IDetailLogger` fan-out; template-substitution formatting; the consumer's log-query endpoint + display (consumer side; `ts-app-shell` messages packlet covers display).

**Mission.** Add two observability primitives to `@fgv/ts-utils`'s `logging` packlet (consumer request from personaility): `RetainingLogger` (bounded most-recent-N structured-record ring with severity + since-cursor query API) and `MultiLogger` (fan-out one log call to N children, each with its own threshold — feeds both `ConsoleLogger` and a retainer from one pinned `ILogger`). Plus the enabler: an additive `LoggerBase._logStructured` hook (default no-op) that exposes the structured `(level, formatted, message, params)` to retaining subclasses without breaking the existing `_log` seam.

**Origin.** Cross-repo handoff (`.ai/notes/cross-repo-handoffs/logging-observability-2026-05.md`). Extend-the-primitive: general logging infra, not consumer-specific. `@fgv/ts-utils` established surface → additive-only, 100% coverage. Soft-blocker for a downstream observability stream. Q5 (record shape) resolved to structured via the `_logStructured` hook — see brief.

### `prompt-assist-screeners` 🟢

**Status:** 🟢 ready to commission (substrate prep in flight)
**Branch base:** `release`
**Workflow shape:** single-PR breaking-change feature
**Substrate:** `.ai/tasks/completed/2026-05/prompt-assist-screeners/{brief.md, state.md}`
**Package surface:** `@fgv/ts-prompt-assist` (safety packlet) + `.ai/instructions/LIBRARY_CAPABILITIES.md` + in-repo consumers of the dropped fields
**Out-of-scope:** the local-classifier screener itself (B-3 of `local-ai-exploration`); LLM-based screening; screener caching; parallel execution; whole-prompt/post-render screening hook.

**Mission.** Replace `@fgv/ts-prompt-assist`'s regex-only / sync / closed-kind safety pipeline with a pluggable `IScreener` model. Consumers wire arbitrary screening logic (async ML classifiers, network calls, custom rule engines) into prompt resolution. Breaking change; no compat shims. The existing regex screener becomes a built-in `createPatternScreener` factory; `IPromptSafetyPolicy.screeners` replaces `suspiciousPatterns`/`screenedSources`/`onSuspicious`; `applySafeguards` becomes async; findings carry per-finding disposition + optional structured metadata; finding kinds open via `string & {}`.

**Origin / dependency.** Upstream gap-fix for `local-ai-exploration` B-3 (local classifier → `IPromptSafetyPolicy` backend), which can't be built against today's surface. Per the gap-then-fix tenet, fix the primitive here first → ship to `release` → `local-ai-exploration` absorbs (merge `release` → integration) before B-3. Runs parallel to `local-ai-exploration` B-2 (independent surfaces). Independent of the local-ai experiment's outcome — benefits any consumer wanting custom screeners.

### `ai-assist-thinking-events` 🟡

**Status:** 🟡 ready; sequencing after `ai-assist-thinking-config` phase B lands (now satisfied; ai-assist cluster shipped via #336)
**Branch base:** `release` HEAD with `.ai/tasks/completed/2026-05/ai-assist-thinking-config/` and `ai-assist-image-generation/` available as reference
**Package surface:** `@fgv/ts-extras/ai-assist` (streaming adapters, model.ts, apiClient.ts), `@fgv/ts-app-shell/ai-assist`, `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Out-of-scope:** the core thinking-config architecture (already shipped via `ai-assist-thinking-config`); sudoku packages

**Mission.** Surface thinking/reasoning content to callers in streaming and non-streaming responses. The `ai-assist-thinking-config` stream silently discards thinking content; this stream adds the explicit surface. Likely scope:
- New `IAiStreamEvent` variant for thinking deltas (or alternative shape)
- Non-streaming response shape: `thinking?: string` field (or similar) on `IAiCompletionResponse`
- Opt-in plumbing (`IGeminiThinkingOptions.config.includeThoughts` placed by thinking-config stream — wire it up here for all providers)
- Per-provider surfacing logic (Anthropic `thinking_delta` events; Gemini `thought: true` parts; OpenAI encrypted reasoning items if exposed)
- Token accounting (`thinkingTokens?: number` on response)

Design-triage-implement shape is likely; new public API has real consequences.

**Origin.** Carved out of `ai-assist-thinking-config` phase A v2 (D9). Required because v1's "future extension point" hand-wave didn't meet the bar of "concrete trackable followup."

**Phase A artifacts:** TBD when stream is commissioned; will live at `.ai/tasks/active/ai-assist-thinking-events/`.

---

### `ai-assist-tool-annotations` ✅

**Status:** ✅ shipped to `release` via PR #524. Precursor to `agent-memory-l2-tools` (L2's write tools consume it). Consumer: PersonAIlity (mediated agent writes).
**Package surface:** `@fgv/ts-extras/ai-assist` (`model.ts`, `clientToolContinuationBuilder.ts`, `index.ts`) + `@fgv/ts-extras-mcp` (`sdk.ts`, `operations.ts`, `model.ts`, `adapter.ts`).
**Brief:** `.ai/tasks/completed/2026-07/ai-assist-tool-annotations/brief.md`.

**Mission.** Add client-tool **behavior annotations** + a **before-execute gate hook** to the ai-assist client-tool surface. Three components: (1) `IAiToolAnnotations` + `IAiClientToolConfig.annotations?` (MCP-native names; host-advisory-only — no provider wire slot, so serialization is unaffected); (2) thread MCP `Tool.annotations` → the field through `adaptMcpTools` (validated, per the untrusted-server warning — currently dropped at 3 layers); (3) `onBeforeToolExecute?` gate on `executeClientToolTurn` (deny → synthesized denial tool-result, turn continues — reuses the tested failure→continuation path). Additive on both active surfaces. **Full design (incl. deny-semantics, locked) is in the brief** — built up front because it's well-understood, low-medium effort, and ships *with* the write tools it protects (avoiding the shovel-ready-then-forgotten carrying cost).

---

### `agent-memory-temporal` ✅

**Status:** ✅ shipped to `release` via PR #526. Keystone of the three (L3 hard-depends on it). Consumer: PersonAIlity.
**Package surface:** `@fgv/ts-agent-memory` (types/envelope, identityCodec, store/fileTreeMemoryStore, writePolicy, retrieve).
**Brief:** `.ai/tasks/completed/2026-07/agent-memory-temporal/brief.md`.

**Mission.** Build the temporal versioned write path + temporal retrievers. All seams ship in v1 but are stubbed to fail loudly (three `if (addr.isVersioned) return fail(...)` fail-stops; every retriever `supportsTemporalQuery:false`; no `temporal-versioned` policy). Adds a versioned codec, the invalidate-don't-delete policy, versioned store branches, and `AsOfRetriever`/`CurrentValidRetriever`/`HistoryRetriever`. **OQ-11 → subtree-per-entity (consumer-backed).** Consumer-pinned: merge-patch `put()` on a temporal-versioned kind = new version + `invalid_at` on prior (composes with versioning); flat/`isVersioned:false` guarantee for Knowledge/LTM/MTM preserved (zero impact until a kind opts in). Converters already round-trip `temporal?`/`valid_at`/`invalid_at` — no serialization work.

---

### `agent-memory-l2-tools` ✅

**Status:** ✅ shipped to `release` via PR #525. Depended on `ai-assist-tool-annotations` (shipped, #524); independent of temporal/L3. Consumer: PersonAIlity (agent-writable memory tools).
**Package surface:** new `@fgv/ts-agent-memory/tools` packlet; consumes `@fgv/ts-extras` ai-assist `IAiClientTool` + `@fgv/ts-json-base` `JsonSchema`.
**Brief:** `.ai/tasks/completed/2026-07/agent-memory-l2-tools/brief.md`.

**Mission.** Expose memory ops as an `IAiClientTool` suite via `createMemoryTools({ store, retriever, registry, tools?, kinds? })`, `JsonSchema.object` schemas (MCP dual-path via `JsonSchema.fromJson`). **Consumer-locked:** scope isolation is constructor-fixed via a **pre-scoped store** — no tool arg carries `scope` (adoption make-or-break); **per-tool `tools?` subset** (default = read-only `search`+`context`; writes opt in) replaces the coarse `readOnly?`; `memory_search` results carry a host-suppliable **mnemonic handle** (`handleFor?`). Still open: tool-boundary safety (admit-reject surfacing, behavior hints); tool count beyond the five.

---

### `agent-memory-l3-ingest` ✅

**Status:** ✅ shipped to `release` via PR #527. Shipped after temporal (#526) for the full `contradicts`→temporal interlock. Largest of the three. Consumer: PersonAIlity.
**Package surface:** new `@fgv/ts-agent-memory/ingest` packlet; reads `retrieve`+`vector`, writes via `store`.
**Brief:** `.ai/tasks/completed/2026-07/agent-memory-l3-ingest/brief.md`.

**Mission.** The fgv-side ingest orchestrator — host brings classify/extract/relate judgment; fgv owns the typed validation boundary, dedup (exact + new similarity layer), write-time edge/cycle safety, provenance stamping, and the `contradicts`→temporal interlock. Green-field packlet composing shipped seams. **Consumer-locked:** OQ-10 → **staged host interfaces** (consumer plugs its own classifiers/extractors); OQ-13 → `IEntityResolver` **optional** (deterministic-key hosts skip it); **single-item incremental ingest first-class** (per-turn streaming, not batch-only); provenance fields land **additive/optional** (no migration of persisted `mtm`/`ltm`).

---

### `ai-assist-alias-capability-guard` ✅

**Status:** ✅ shipped to `release` (2026-07-31); both capability resolvers resolve the alias before prefix-matching, so an unresolved `@alias` no longer falls through to the catch-all `modelPrefix: ''` rule and returns a confidently wrong capability. Artifacts at `.ai/tasks/completed/2026-07/ai-assist-alias-capability-guard/`. Consumer: PersonAIlity (round-2 ask B + A).
**Package surface:** `@fgv/ts-extras/ai-assist` (`registry.ts`, `model.ts` TSDoc only), `samples/testbed` (`scenarios/imageGeneration/`).
**Out-of-scope:** `packlets/ai-assist/jsonResponse.ts` (owned by `ai-assist-fenced-json-diagnostics`), all of `@fgv/ts-agent-memory`, `docs/WORKSTREAMS.md` (orchestrator-owned).
**Brief:** `.ai/tasks/active/ai-assist-alias-capability-guard/brief.md`.

**Mission.** `resolveImageCapability` and `resolveEmbeddingCapability` prefix-match a raw model id with no alias resolution and no `MODEL_ALIAS_SIGIL` guard, so an fgv alias falls through to the catch-all `modelPrefix: ''` and returns a **confidently wrong capability** — verified by execution: the xAI image alias flips both wire format and `acceptsImageReferenceInput`; the OpenAI embedding alias drops `supportsDimensions` + `maxBatchSize`. Guard both resolvers, fix the in-repo instance in the testbed image-generation scenario, and add the `@remarks` note that `tools`/`thinking` are deliberately not model selectors (ask A — the absence of a `'tools'` key has now sent two consumers down an unnecessary hand-rolled walk).

---

### `ai-assist-fenced-json-diagnostics` ✅

**Status:** ✅ shipped to `release` via **#579** (`26c38a484`, 2026-07-31) — `classifyJsonParseFailure`, a structural classifier that never regex-matches the engine's `JSON.parse` message. Artifacts at `.ai/tasks/completed/2026-07/ai-assist-fenced-json-diagnostics/`. Consumer: PersonAIlity (round-2 P3).
**Package surface:** `@fgv/ts-extras/ai-assist` (`jsonResponse.ts` + its tests).
**Out-of-scope:** `registry.ts`, `model.ts`, `apiClient.ts`, `samples/testbed`, `docs/WORKSTREAMS.md`.
**Brief:** `.ai/tasks/active/ai-assist-fenced-json-diagnostics/brief.md`.

**Mission.** A property-name-position `JSON.parse` failure surfaces the bare engine message with no typed reason, offending token, or offset — so unquoted key / single-quoted key / unterminated name / elision are indistinguishable, and they want opposite handling (repair vs re-prompt vs fail). Add a typed failure reason in the shape of the `found`/`unclosed`/`none` scan result that #573 introduced. Note #573's truncation diagnosis fires in the *extractor*, before `JSON.parse`, and does not cover this case.

---

### `agent-memory-provenance-contract-doc` ✅

**Status:** ✅ shipped to `release` (2026-07-31). Documentation + tests only, **no behaviour change** — and the four-row evidence table was independently re-executed against built output rather than taken on faith. Artifacts at `.ai/tasks/completed/2026-07/agent-memory-provenance-contract-doc/`. Consumer: PersonAIlity (round-2 P0, doc-only outcome).
**Package surface:** `@fgv/ts-agent-memory` (README + `writePolicy.ts` TSDoc).
**Out-of-scope:** all of `@fgv/ts-extras`, any behavior change to the merge path, `docs/WORKSTREAMS.md`.
**Brief:** `.ai/tasks/active/agent-memory-provenance-contract-doc/brief.md`.

**Mission.** The provenance merge contract is already correct and pinned — the ask is answered *yes* on both halves. Document the guarantee where a consumer will find it so the next one doesn't have to ask: per-key merge over `provenance`, sub-key `null` clearing sanctioned, whole-block `null` rejected loudly. **No behavior change** — this stream fails if the merge semantics move.

---

## Completed workstreams

### `esm-emit-impl` ⚠️

**Status:** ⚠️ **shipped to `release` 2026-08-09 inside #607** (`71787e798`) — implemented, and it found that the design's central recommendation does not work. Branch `esm-emit-impl`, based on `fix/esm-node-entry-points` @ `cebf10bae`. **PR #603 was deliberately not shipped on its own** — this branch contains all of it and supersedes it, and #603 has no commit on any ref. **R2 and R3 were implemented, measured, and then reverted: both break the repo's own webpack build.** What ships is R5, two real defect fixes it found, and the evidence. Full monorepo build + test green; both entry-point gates green.
**Paired with `esm-emit-design`** (`.ai/tasks/completed/2026-08/esm-emit-design/`), which is **deliberately left uncorrected**: that a signed-off design was wrong and step-zero verification caught it is the most valuable thing the pair records, and editing it would make the divergence read as an oversight.
**Substrate:** `.ai/tasks/completed/2026-08/esm-emit-impl/{brief.md, state.md, result.md, findings/inbox/}`
**Package surface:** `libraries/ts-bcp47/src` + config, `libraries/ts-web-extras-webauthn/package.json` (`exports` only), `common/scripts`, `common/autoinstallers/rush-bundler-check`, `.github/workflows/ci.yml`.

**The headline.** The `dist` ESM emit contains extensionless directory imports — which is *why* Node could not load it, and is the bug that started all this. The design assumed bundlers were fine with that ("bundlers resolve extensionless directory imports happily") and built R2 and R3 on it. **That is true of esbuild and false of webpack 5**, which applies `fullySpecified` to anything it treats as ESM. Bisected on an otherwise identical tree: `tools/ts-res-ui-playground` goes **0 webpack errors → 6** with R2, and back to **0** when the single generated `dist/package.json` is deleted. R3 fails the same way on whatever it routes.

So **R2 is not the safe, independent one-liner §4 called it** — it converts a harmless Node warning into a hard webpack failure — and **R3 is not gated on a bundler-resolution check, it is gated on Option B** (explicit specifiers, the ~3,520-edit codemod the design deferred for want of a consumer asking). Option B is the precondition for *any* correct consumer of the ESM emit, browser bundlers included; R3's measured win is not available without it. They are one change, not two competing ones — which materially changes Option B's cost/benefit as the design weighed it.

**What ships.** The R5 gate (`verify-bundler-resolution.mjs`) + CI wiring, which actually bundles every published package's browser entry with node builtins unpolyfilled; **two real shipped defects it found** — `ts-bcp47`'s browser entry pulled `fs`/`path` into a browser graph (fixed), and `ts-web-extras-webauthn`'s non-Node condition pointed at a file that is never built, so no bundler/Deno/edge consumer could resolve the package at all (fixed, `exports`-only); the §5.1 `BUNDLER_ONLY` reason amendment; **6 packages declared node-only** on the record rather than skipped silently. Gate green at 19 checked / 6 declared / 0 failed.

**Measurements kept for the follow-up**, taken before the revert: `ts-app-shell` **7.26×**, `ts-json-base` **3.19×** (corroborating the design's independent 3.48×), `ts-extras` 1.62×, `ts-res` 1.30× — but `ts-json` **0.95×** and `ts-web-extras` **1.01×**, i.e. *larger* as ESM. §7 flagged "the wins generalize" as inferred; the inference was wrong in both directions. A clean bundler probe is a precondition for routing, not a reason to route.

**The gate now encodes what was learned:** `--probe-esm` marks a package **BLOCKED** when esbuild bundles it but its emitted specifiers are not fully specified, so the next attempt fails fast with the reason instead of rediscovering it by breaking a build. Current verdict: **10 dual-rig packages BLOCKED, 4 clean.**

**Open for the orchestrator.** **Option B should be commissioned as its own stream, scoped as the enabler for R2+R3 rather than as native-ESM support** — that is the recommendation this stream ends on. **OQ-3** — #603 contains nothing this branch does not; recommend closing it. The 6 node-only declarations are **inferred, not owner-confirmed**, which the sibling gate's own comment calls the weaker basis; filed as a finding asking for a yes/no per package.

---

### `ts-utils-async-detailed-result` ✅

**Status:** ✅ shipped — PR [#602](https://github.com/ErikFortune/fgv/pull/602) to `release`. Branch `ts-utils-async-detailed-result` from `release` @ `b85b094b7`. All four deliverables landed; full monorepo build green; `ts-utils` and `ts-extras` suites pass at 100% coverage on the touched files. `code-reviewer` returned no P1s; its two P2s and two P3s are all resolved — including a real one, below.
**Substrate:** `.ai/tasks/completed/2026-08/ts-utils-async-detailed-result/{brief.md, state.md, result.md, findings/inbox/}`
**Package surface:** `@fgv/ts-utils` (`base/result.ts`) + `@fgv/ts-extras` (`safer-fetch/saferFetch.ts`, as the first consumer).

**Mission.** Chaining an async step off a `DetailedResult<T, TD>` silently degraded it to a plain `Result<T>` and lost `TD`. `DetailedSuccess`/`DetailedFailure` extend `Success`/`Failure` and inherited `thenOnSuccess<TN>(cb): AsyncResult<TN>`, which carries no detail type, and no `AsyncDetailedResult` existed. **It type-checked** — the loss surfaced later or not at all, so a package whose failure taxonomy *is* its product could lose it by writing idiomatic code. Surfaced by `safer-fetch-s3` (#601), whose Result-chaining deliverable landed only partially for exactly this reason. Extended the primitive rather than tidying the one consumer; `safer-fetch` rode along as the first real caller so the extension didn't ship speculatively.

**Open questions, as resolved.** **OQ-1** — shape (a), an `AsyncDetailedResult<T, TD>` sibling, as recommended. It **extends `AsyncResult<T>`**, which turned out to be forced rather than stylistic: an override's return type must be assignable to the base method's, exactly as `DetailedSuccess extends Success` is what lets `onSuccess` return `DetailedResult`. The brief's escalation trigger (a contravariant position → prefer option (c)) did fire, but only on the **static** `from`, where renaming to `fromDetailed` costs nothing; the instance surface was clean and compiled first try. **OQ-2** — built the ladder, exactly as far as `AsyncResult`'s existing methods; no new combinators, and deliberately no `captureAsyncDetailedResult` (a captured throw has no detail to supply). **OQ-3** — did **not** force the `safer-fetch` pass; see below.

**Measured `saferFetch.ts` pass (the OQ-3 answer).** Of **21** `isFailure()`/`isSuccess()` checks, **7** are on an awaited `DetailedResult` and **3** converted. The other 4 are exempt for reasons unrelated to this gap — 3 are `_walk`'s hop-loop control flow (the `CODING_STANDARDS` exemption, upheld by S3's own reviewer) and 1 is `_runAttempt`'s retry branch, which reads `walked.detail` to decide whether to recurse. The remaining 14 are on synchronous results or plain `Result`s that never had a detail to lose. Net: checks 21→18, chaining calls 12→15, and `_propagate` — a helper that exists *only* because a detail could not survive a chain — dropped from 11 call sites to 8. **The ts-utils gap explained a minority of the file's imperative checks and most of `saferFetch.ts` legitimately stays imperative**, which the brief anticipated and which is recorded rather than papered over.

**Brief numbers corrected in-stream.** The brief's cross-package count (49 non-test files across 7 packages, `ts-utils` 14) measured **51 / 7**, with `ts-utils` at **16**. The `saferFetch.ts` figures were exact on lines (1,174) and chaining calls (12) but the check count is **21, not 22** — 22 *lines* match, and one of them is a comment carrying two occurrences.

**Caught in review (P2, fixed).** Moving `_receive` into a `thenOnSuccess` callback changed the *shape* of one failure: an internal throw used to propagate to `_execute`'s top-level `captureAsyncResult` and be reported as `{kind:'unknown'}` with a `saferFetch: unexpected error:` prefix, but `AsyncDetailedResult` now catches it earlier and yields `detail: undefined`. Verified empirically against both revisions — a public entry point could return a failure carrying **no `FetchFailureReason` at all**, so a caller switching on `detail.kind` would fault. Fixed by re-stamping a detail-less failure as `'unknown'` at `_execute`, the single boundary where an `Outcome` becomes the caller's result; output is now byte-identical to the pre-change behavior, with a regression test pinning it on all three entry points.

**Finding: nothing else is losing detail.** A sweep of all 34 `thenOnSuccess`/`thenOnFailure` call sites outside `ts-utils` found **none on a `DetailedResult`**. The five other `DetailedResult` consumer packages (`ts-json`, `ts-res`, `ts-json-base`, `ts-utils-jest`, `ts-web-extras`) do not use the async bridge at all; `ts-agent-memory`, `ts-prompt-assist` and `tools/ks`, which use it heavily, never reference `DetailedResult`. The trap was armed and only `safer-fetch` had walked into it — so this fix is **preventive, not remedial**, and a future migration stream would be adopting a capability rather than repairing damage. Per the brief, no other consumer package was migrated.

---

### `fetch-primitive-threat-model` ✅

**Status:** ✅ **complete — design landed and fully implemented across four streams.** **S1** (core, #594) and **S2a** (address classification, #592) — both integrated via #597 — **S2b** (DNS-resolving guard + redirect walk, #599 — squashed to `release` @ `b392e1534`), and **S3** (`safer-fetch-s3` — retry, the loop-detection restructure, the Result-chaining pass, the `@fgv/ts-web-extras` browser packlet, both guarantee tables, the `LIBRARY_CAPABILITIES` entry, and a testbed scenario). The design doc's status line reads *fully implemented*, and every place the implementation departed from it is recorded in its **Appendix D**. Consumer: PersonAIlity.
**Workflow shape:** design-first, then phased implementation per design § 14.
**Deliverable:** `.claude/project/fetch-primitive-threat-model.md` (design) + the `safer-fetch` packlets.
**S3 artifacts:** `.ai/tasks/completed/2026-08/safer-fetch-s3/{README.md, brief.md, state.md, result.md}`.
**Package surface:** `@fgv/ts-extras` (`safer-fetch` packlet + conditional export) and `@fgv/ts-web-extras` (`safer-fetch` packlet), plus one `samples/testbed` scenario (`safer-fetch-guard`).
**Out-of-scope:** all source under `libraries/`, the four existing `ai-assist` `fetch(` sites (deliberately left alone — bearer auth + provider error mapping + an SSE site where a buffering size cap is semantically wrong), `docs/STATUS.md`.

**Mission.** PersonAIlity asked for a `Result`-returning fetch primitive with timeout, size cap, allowlist, and a structured failure taxonomy. Write and land the **threat model** before any code, because the security posture is the product. Three findings drive the design: (1) the redirect policy and the SSRF guard are **one mechanism**, not two bullets — a guard on URL₀ alone is defeated by a single `302` to the cloud metadata endpoint, so `redirect: 'manual'` plus per-hop revalidation plus cross-origin credential stripping ship together or not at all; (2) the guard **cannot exist in the browser** (no DNS API, and `redirect: 'manual'` yields an unreadable opaque redirect), so it splits along the established `crypto-utils` cross-runtime pattern with an explicit per-runtime guarantee table; (3) DNS rebinding is a **documented limit**, closed later via seams designed now — `IGuardVerdict.pinnedAddress?` **and** an injectable `IFetchTransport` (a swappable resolver alone cannot close it; pinning is a property of the connect). Framed deliberately **not** as a Result-integration boundary package — there is no upstream to wrap and the opinion is the entire deliverable.

**S3 open questions, as resolved.** **OQ-1** — the browser path keeps `redirect: 'manual'` rather than switching to `'error'`; the guarantee is identical either way and `'error'` would degrade the failure reason from `'redirect-opaque'` to an undifferentiated `'network'`, so §5.4's row was restated instead (design Appendix D-a). **OQ-2** — the browser entry points refuse `'validate-each-hop'` at option resolution, naming the runtime, rather than failing at the first redirect (D-f). **OQ-3** — `classifyAddress` and the pure policies now ship from the browser barrel too, with an explicit note that they cannot substitute for the resolved-address guard (D-g). **OQ-4** — `allowHosts` / `allowPorts` / `allowInsecureHttp` added, so §13 L6's Ollama example is literally runnable; §12's `{443}` *default* was deliberately not adopted, since it would reject a public `:8443` endpoint with a failure reading as an SSRF block (D-c).

**Original exit gate.** Erik answers the eight open questions in § 16 of the design doc (packlet-vs-sibling-package placement; `DetailedResult`'s `@beta` release-tag cost; required-`guard`-with-no-default; whether the primitive ships with zero in-repo consumers; loopback posture given this repo's own Ollama `http://localhost:11434` path; `maxResponseBytes` default; whether retry belongs in v1; whether the browser package earns its keep). Implementation is a separate stream.

---

### `agent-memory-antagonist` ✅

**Status:** ✅ shipped to `release` via PR #528. Adversarial "antagonist" stream (phase 1): hole-driven torture tests over the seven near-miss invariant classes in `@fgv/ts-agent-memory` (write-path union/replace, bi-temporal boundaries, crash-mid-write self-healing, corrupt on-disk data, host-boundary hostility, cycle-guard graphs, enum/convert-validate parity). **Found and fixed two real store bugs** the happy-path suite + single review missed: content-hash dedup swallowing a same-id metadata-only update (all three write paths), and a tampered `envelope.entityId` loading undetected.
**Package surface:** `@fgv/ts-agent-memory` (tests; two `store/fileTreeMemoryStore.ts` fixes).
**Brief:** `.ai/tasks/completed/2026-07/agent-memory-antagonist/brief.md`.

### `ai-assist-antagonist` ✅

**Status:** ✅ shipped to `release` via PR #529. Antagonist phase 2 over the `@fgv/ts-extras/ai-assist` provider surface (finishReason decline-vs-benign, model routing, convert/validate symmetry, thinking↔temperature param-rejection, streaming drift/SSE, client-tool continuation projection, Gemini tool mutual-exclusion). Classes 1–6 held; class 7 surfaced a real gap — **fixed**: `executeClientToolTurn` now fails fast when a Gemini turn combines `web_search` grounding with client tools (Gemini's API 400s on that combination).
**Package surface:** `@fgv/ts-extras/ai-assist` (tests; one `clientToolContinuationBuilder.ts` guard).
**Brief:** `.ai/tasks/completed/2026-07/ai-assist-antagonist/brief.md`.

### `ai-assist-model-tiers` ✅

**Status:** ✅ shipped to integration branch `ai-assist-model-tiers` (B1–B5 via PRs #511–#515; design Phase A + revision ride the branch); **live-verified** (keyed canary: all three providers LIVE across every tier); promotion PR `hmw86u` → `release` open. Constituent commits squash to `release` at cluster-close.
**Branch base:** `release` (integration branch `claude/ai-assist-model-tiers-hmw86u`)
**Package surface:** `@fgv/ts-extras/ai-assist` (`model.ts`, `registry.ts`, `apiClient.ts`, `streamingClient.ts`, streaming adapters, `converters.ts`, README) + `samples/testbed` (per-provider tier canaries) + `.ai/instructions/LIBRARY_CAPABILITIES.md`, `docs/FUTURE.md`

**Mission.** A cross-provider **quality-tier axis** (`base`/`advanced`/`frontier`) on the ai-assist `ModelSpec` with cascade fallback, built on the shipped alias layer; adopt aliases for OpenAI + Anthropic (Gemini already aliased); advance stale/EOL OpenAI defaults.

**What shipped.** `ModelSpecKey = base|advanced|frontier|image|embedding`; a `tier?` request param; `TIER_FALLBACK` cascade (`frontier→advanced→base`). **Composition, not competition:** thinking/tools are orthogonal params/capabilities, never model selectors (the `thinking`/`tools` keys were removed) — every base model is thinking-capable so `tier + thinking` composes freely. OpenAI + Anthropic alias adoption + tiered defaults; DALL·E retirement; `claude-sonnet-5` thinking-detection fix. Plus two completion-path bugs the **live canary** caught (the "100% mocked coverage on an unexercised wire" failure mode): unconditional default `temperature` (now sent only when explicit) and OpenAI frontier `gpt-5.5-pro` being Responses-API-only (frontier now cascades to advanced=`gpt-5.5`).

**Outcome.** Breaking on the active/alpha surface (tier keys added, `thinking`/`tools`/DALL·E removed). Build + lint + 100% coverage green; `none`/`minor` change files. **Live-verified** end-to-end on the real wire. **Locked decisions:** 3 tiers + cascade; composition (thinking orthogonal); OpenAI base=gpt-5.4-mini, Anthropic base=claude-sonnet-5; Anthropic/Gemini/OpenAI frontier cascade to advanced.

**Fast-follow:** OpenAI frontier via Responses routing — ✅ shipped via the `ai-assist-openai-frontier-responses` stream (`responsesOnlyModelPrefixes` marker + `isResponsesOnlyModel`; `frontier: '@openai:pro'` restored, routed on completion + streaming).

**Artifacts:** [`.ai/tasks/completed/2026-07/ai-assist-model-tiers/`](../.ai/tasks/completed/2026-07/ai-assist-model-tiers/) (brief, design, README).

### `ai-assist-model-aliases` ✅

**Status:** ✅ shipped to integration branch `ai-assist-model-aliases` (Tiers 1–3 via PRs #505–#507 + folded-in Gemini `thoughtSignature` fix; design Phase A #503 rides the branch); promotion PR #508 → `release` (CI build green; live Gemini canaries green). Constituent commits squash to `release` at cluster-close.
**Branch base:** `release` (integration branch `ai-assist-model-aliases`)
**Package surface:** `@fgv/ts-extras/ai-assist` (`registry.ts`, `model.ts`, new model-alias module + tests, `streamingAdapters/gemini.ts`, `streamingAdapters/clientToolContinuationBuilder.ts`, packlet README) + `samples/testbed` (canary scenario) + `.ai/instructions/LIBRARY_CAPABILITIES.md`, `docs/TECH_DEBT.md`

**Mission.** An fgv-owned **canonical model-alias layer** (`@<provider>:<role>` sigil) so `defaultModel` and consumers reference stable aliases that resolve centrally to the current concrete provider model — ending the recurring breakage where the registry pins dated snapshots providers later retire. Forcing function: Google retiring the entire Gemini 2.5 line + Imagen (Oct 2026).

**What shipped.** Generic alias core (`MODEL_ALIAS_SIGIL`, `IModelAliasMap`, `resolveModelAlias`/`resolveProviderModel`) resolved at the completion/image/embedding/tool chokepoints (downstream of `ModelSpecKey`, upstream of `idPattern`); raw IDs still work (back-compat). Gemini migrated to alias-based `defaultModel` (incl. `thinking: '@google-gemini:pro'`), Imagen capability removed, `*ModelNames` bumped to 3.x, `/^gemini-3/` idPattern added. Plus a folded-in Gemini wire-fidelity fix: round-trip the part-level `thoughtSignature` on thinking-enabled client-tool continuations (pre-existing latent 400, surfaced by the live canary).

**Outcome.** Additive (Imagen removal is the one break, on the active surface). Build + lint + 100% coverage green; `none` change file. Live Gemini canaries green: `@google-gemini:flash -> gemini-3.5-flash` (client-tools + continuation) and `@google-gemini:embedding -> gemini-embedding-001` (embedding search). **Locked decisions:** thinking alias = Pro; Imagen removed (not aliased); aliases live on the descriptor.

**Fast-follows (deferred):** OpenAI alias adoption (`@openai:reasoning -> gpt-5.1`); retire residual manual axes (idPattern + `*ModelNames`) so a line-bump is a pure map edit (TECH_DEBT P3).

**Artifacts:** [`.ai/tasks/completed/2026-06/ai-assist-model-aliases/`](../.ai/tasks/completed/2026-06/ai-assist-model-aliases/) (brief, design, state, thoughtSignature-fix brief, README).

### `ts-agent-memory` ✅

**Status:** ✅ shipped — `@fgv/ts-agent-memory` v1 (knowledge + memory + semantic recall) promoted to `release` via PR #501 (2026-06-26). Constituent PRs #496–#500 + #502 squashed onto the integration branch; design spike #495 superseded/closed.
**Package surface:** new `libraries/ts-agent-memory` (`@fgv/ts-agent-memory`) + `.ai/instructions/LIBRARY_CAPABILITIES.md`.

**What shipped.** App-agnostic storage + retrieval substrate for agent memory and knowledge: FileTree markdown+frontmatter vault; typed identity envelope + per-kind Converter-validated bodies (knowledge + experience); domain-keyed identity (`IIdentityCodec`, no minted UUIDs); attributed cycle-safe edges; content-hash dedup with per-kind `dedupScope`; injectable `IWritePolicy` (LWW / cap-cull-oldest + RFC-7386 merge-patch); retrieval stable against a future semantic/temporal backend; ring-backed observation; and **operational semantic recall** (`InMemoryCosineIndex` + embed-on-write, consumer-injected embedder). 314 tests, 100% coverage. Consumer #1: PersonAIlity (knowledge-first behind `IKnowledgeSearchProvider`).

**Fast-follows (deferred; seams present):** temporal versioned write path + retrievers; L2 agent-tool surface; L3 ingest orchestrator. See `docs/FUTURE.md`.

**Artifacts:** [`.ai/tasks/completed/2026-06/ts-agent-memory/`](../.ai/tasks/completed/2026-06/ts-agent-memory/) (+ `ts-agent-memory-vector/`).

### `ai-assist-embeddings` ✅

**Status:** ✅ shipped to integration branch `ai-assist-embeddings` (Phases 1–4 via PRs #481–#484; each squash/merge into the integration branch, promotion to `release` to follow with the rest of the branch).
**Branch base:** `release` (integration branch `ai-assist-embeddings`)
**Package surface:** `@fgv/ts-extras/ai-assist` (new `embeddingClient.ts` + shared `http.ts`; `model.ts`, `registry.ts`, `apiClient.ts`, `index.ts`) + `.ai/instructions/LIBRARY_CAPABILITIES.md`

**Mission.** Add the missing third ai-assist modality — `text → vector` embeddings — as a cross-provider HTTP primitive mirroring the completion and image-generation primitives.

**What shipped.** `callProviderEmbedding` + `callProxiedEmbedding` over a two-member `AiEmbeddingApiFormat` dispatch: `openai-embeddings` (OpenAI / Ollama-via-`/v1` / openai-compat / Mistral) and `gemini-embeddings` (Gemini `batchEmbedContents`, `taskType` + `outputDimensionality`). Additive `embedding?` descriptor capability + `'embedding'` `ModelSpecKey` + `supportsEmbedding`/`resolveEmbeddingCapability`. Cross-provider `dimensions`/`taskType` knobs are no-op-where-unsupported (logged, never a failure), preserving Gemini's retrieval asymmetry. `number[][]` result; empty-input short-circuit; `maxBatchSize` fail-fast; OpenAI response-alignment validation.

**Outcome.** Additive only; all phases green (`build` + `lint` + `test` @ 100% coverage; api report regenerated; `none` change files). Shared `http.ts` (`fetchJson` + `IAiApiConfig`) extracted from `apiClient.ts`, reused by both clients. **Resolved ollama-native OQ-1: native Ollama `embed` is CUT** — Ollama embeddings flow through `callProviderEmbedding` via `/v1`.

**Artifacts:** [`.ai/tasks/completed/2026-06/ai-assist-embeddings/`](../.ai/tasks/completed/2026-06/ai-assist-embeddings/) (brief, design, result, README).

### `json-schema-derives-t` ✅

**Status:** ✅ shipped via PR #441 to integration branch `json-schema-derives-t`; cluster-close PR open
**Workflow shape:** alignment stream (single-PR new packlet on integration branch + cluster-close squash to release)
**Substrate:** `.ai/tasks/completed/2026-06/json-schema-derives-t/{state.md, README.md}` + `.ai/tasks/completed/2026-06/json-schema-converter-alignment/{brief.md, state.md, research.md, derives-t-feasibility-brief.md, derives-t-feasibility.md, README.md}` (alignment spike rides with this stream's squash)
**Package surface:** `@fgv/ts-json-base` (new `json-schema-builder` packlet, consumer-facing `JsonSchema` namespace) — ~505 lines impl + ~620 lines tests; no surface change to existing exports.

**Mission.** Typed JSON Schema with derived static types for the LLM-tool subset. **Schema IS the validator.** Each factory returns an `ISchemaValidator<T>` that extends `Validator<T>`, carries the phantom `__staticType?: T` for `Static<typeof schema>` extraction, and exposes `validate()` / `convert()` / `toJson()` as methods. *(Field name corrected 2026-08-14 — this line read `static: T`, which is not what shipped and is not a legal property name to write in TypeScript source.)* `fromJson(rawJsonObject)` parses incoming JSON Schema (e.g. from MCP) into an `ISchemaValidator<JsonValue>` via `Converters.discriminatedObject` with arms recursing through `self` (enabled by PR #442's discriminatedObject self-fix). Consumer authors a single typed value and gets verified-not-asserted type safety end-to-end.

**Origin.** Surfaced during `ai-assist-client-tools` Phase A review: a consumer authoring both JSON Schema (wire) and Converter/Validator (runtime) over the same shape is error-prone. Two-phase spike (`json-schema-converter-alignment`) tested feasibility; phase-1 broad survey + phase-2 schema-derives-T feasibility verdict, both shipped as substrate artifacts. Erik chose Option 1 (commission alignment now, hold ai-assist-client-tools Phase B/C). Four Copilot review rounds + structural pivots; round 3 surfaced a load-bearing validator/convert symmetry bug; loop converged on diminishing returns at round 4 (4 of 10 used per L33).

### `discriminated-object-self-fix` ✅

**Status:** ✅ shipped to `release` via PR #442 (2026-06-03).
**Workflow shape:** single implementation PR direct to `release`
**Substrate:** `.ai/tasks/completed/2026-06/discriminated-object-self-fix/{brief.md, state.md, README.md}`
**Package surface:** `@fgv/ts-utils` — `conversion/{converter.ts, baseConverter.ts, basicConverters.ts}` + tests + api-extractor report + `minor` change file.

**Mission.** Three-part additive fix to `Converters.discriminatedObject` so per-arm converter invocations thread `self` (and `context`) — bringing the primitive in line with every other Converter combinator and unblocking recursive discriminated-union parsers. (1) `Converter.convert` interface gained optional `selfOverride?: Converter<T, TC>`; (2) `BaseConverter.convert` honors it via `_converter(from, selfOverride ?? this, context)`; (3) `discriminatedObject` body wraps a `ConverterFunc` and threads `self`/`context` to arms, with `isValidator(arm)` discriminating the in-place validator path from the recursion-capable converter path. `ValidatorBase.validate` needed no change (already threads `self` correctly). 5 new tests cover the recursive-tree case end-to-end including a direct `self === outerConverter` identity assertion.

**Origin.** Surfaced during `json-schema-derives-t` (PR #441) review — the procedural `_parseNode` switch inside `fromJson` is the manual-type-check-with-cast anti-pattern fgv forbids. Correct shape is `Converters.discriminatedObject('type', { ... })` with arms recursing through `self` for nested schemas. Erik called the missing-`self` an outright bug rather than a workaround-worthy debt; this stream fixed the primitive once instead of accumulating lazy-thunk-closure workarounds in every recursive parser. Unblocks the `json-schema-derives-t` revision.

### `capture-async-result-upgrade` ✅

**Status:** ✅ implementation merged to integration branch (PR #433); cluster-close PR #434 open
**Integration branch:** `capture-async-result-upgrade` (off `release`) → squash to `release` at close
**Workflow shape:** single implementation PR onto integration branch
**Substrate:** `.ai/tasks/completed/2026-05/capture-async-result-upgrade/{brief.md, state.md, README.md}`
**Package surface:** `@fgv/ts-utils` (`base/result.ts` — `captureAsyncResult`, `AsyncSuccessContinuation`, `AsyncFailureContinuation`, `AsyncResult` constructor + tests + api-extractor report); opportunistic call-site cleanups in `@fgv/ts-extras` and `@fgv/ts-prompt-assist`.

**Mission.** Made `AsyncResult<T>` the canonical chainable shape across the async-Result API via three coordinated additive surface changes: (1) `captureAsyncResult<T>` returns `AsyncResult<T>` instead of `Promise<Result<T>>`; (2) `AsyncSuccessContinuation` / `AsyncFailureContinuation` widened to accept `PromiseLike<Result<...>>` so the chaining slots accept what the factory produces (brief amendment surfaced mid-stream); (3) `AsyncResult` constructor parameter widened to `PromiseLike<Result<T>>` so the chaining methods can pass the widened callback return through without re-wrapping (natural cascade from delta 2). Strictly additive at every call site — all 86 monorepo call sites compile unchanged because `AsyncResult` is `PromiseLike<Result<T>>`, every existing `(value) => Promise<Result<TN>>` callback satisfies `(value) => PromiseLike<Result<TN>>`, and every existing `new AsyncResult(somePromise)` still satisfies `PromiseLike`. Three opportunistic call-site cleanups under the 15-site budget; full-repo `rush build` + `rush test` sweep green (modulo one unrelated pre-existing `mutableFsTree` root-uid test failure routed to TECH_DEBT P4).

**Origin.** Surfaced in `.ai/tasks/completed/2026-05/private-key-storage/result.md` Follow-ups (chain seam in `_encryptAndWrite`); commissioned ahead of the -33 publish so the cleanup lands in the same alpha as `ts-app-shell-styling-hardening`. Mid-stream brief amendment for delta 2 demonstrated the cascade-completeness pattern (L29) in action.

### `ts-app-shell-styling-hardening` ✅

**Status:** ✅ shipped to `release` via PR #432 (squash of integration branch).
**Integration branch:** `ts-app-shell-styling-hardening` (off `release`) → squashed to `release` at close
**Workflow shape:** single implementation PR onto integration branch
**Substrate:** `.ai/tasks/completed/2026-05/ts-app-shell-styling-hardening/{brief.md, state.md, README.md}`
**Package surface:** `@fgv/ts-app-shell` `messages` packlet (icon SVGs + `MessagesProvider` + `IMessageAction` discriminated union + `ToastItem`) + README setup section + `.ai/instructions/LIBRARY_CAPABILITIES.md`

**Mission.** Hardened `@fgv/ts-app-shell` against the most common consumer misconfiguration — forgetting to add `'./node_modules/@fgv/ts-app-shell/lib/**/*.{js,jsx}'` to the Tailwind `content` array. Three layers: (1) defensive inline geometry on catastrophic-failure icon SVGs and absolutely-positioned overlays in the `messages` packlet (including inline `position: relative` on the search wrapper — caught in review); (2) self-diagnosing probe in `MessagesProvider` using a sentinel arbitrary-value Tailwind utility (`h-[7.3215px]`, uniquely-named so it can only be generated by Tailwind scanning ts-app-shell's built JS — also caught in review, replacing the original `h-3.5` probe that could be masked by consumer-side usage); (3) targeted README nudges (top-of-doc Required-setup callout, stable `## Setup` anchor, troubleshooting section). `IMessageAction` refactored to a discriminated union (`IMessageHrefAction | IMessageCallbackAction`) so "exactly one of `href` or `onAction`" is enforced at the type level.

**Origin.** Cross-repo debug 2026-05-29: personaility on `@fgv/ts-app-shell@5.1.0-32` reported "no filter button visible" — DOM proved Tailwind geometry classes present without CSS, root cause was missing `content` path entry. README was correct but easy to miss; failure mode silent and catastrophic enough to warrant in-package defenses.

### `local-summarization` ✅

**Status:** ✅ shipped to `release` (integration branch `local-summarization` squash-merged).
**Branch base:** `release` (integration branch `local-summarization`)
**Package surface:** `@fgv/ts-extras-transformers` + `@fgv/ts-web-extras-transformers` (added `summarize`) + `samples/testbed` (CLI scenario) + `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.** `summarize(summarizer, text, options?) → Promise<Result<SummarizationOutput>>` in both facades (surface parity; thin `captureAsyncResult` boundary over the `summarization` pipeline) + a CLI-only `local-summarization` testbed scenario (`Xenova/distilbart-cnn-6-6`; surfaces via the shell's `no-web` path). Third facade task type (`classify` → `embed` → `summarize`). Consumer-driven: local is the cheap/fast path; cloud (ai-assist) stays for quality on long/complex docs.

**Outcome.** `loadPipeline` task-typing needed no extension; no unsafe cast. Facades 28 tests each @ 100%; testbed 143 @ 100%; full `rush build` + `build:web` green; `minor` change files; api reports regenerated.

**Artifacts:** [`.ai/tasks/completed/2026-05/local-summarization/`](../.ai/tasks/completed/2026-05/local-summarization/) (brief, state, result, README).

### `local-ai-exploration` ✅ (cluster)

**Status:** ✅ shipped — all sub-phases (B-1…B-5) merged into integration branch `local-ai-exploration`; promotion PR `local-ai-exploration` → `release` open (see PRs in the artifacts). (First promotion #410 was closed as premature — reopened for B-5, then re-promoted.)
**Integration branch:** `local-ai-exploration` (off `release`)
**Package surface (new):**
- `samples/testbed/` — long-lived sample-browser app (web + CLI), themed (light/dark), with two working scenarios: `local-classifier-safety`, `local-embedding-search`.
- `@fgv/ts-extras-transformers` + `@fgv/ts-web-extras-transformers` — Result-integration boundary over `@huggingface/transformers` (`loadPipeline`, `classify`, `classifyAll`, `embed`; `generate` deferred).
- `@fgv/ts-app-shell` — gained a default light/dark theme (54-token CSS-var system + Tailwind preset) as a gap-fix; the testbed was its first visual consumer.

**Outcome.** The B-3 done-or-discard gate decided **SHIP**: the facade read cleaner than raw `pipeline()`, survived a real composition (classifier → `ts-prompt-assist` screener), and B-4a confirmed it survives a second model type (embedder). B-5 wired the shell/CLI to actually run scenarios and, via gap-then-fix, gave ts-app-shell a shippable theme. The dual-target consumption pattern (facade-agnostic core; browser facade on web / Node facade via `webpackIgnore` on CLI) proved repeatable. `LIBRARY_CAPABILITIES.md` entries added.

**Sub-phases (all merged to `local-ai-exploration`):** research #402 · substrate #403 · B-1 #404 · B-2 #405 · B-3 #408 · B-4a #409 · B-5 (shell+CLI + ts-app-shell theme + styling) #411.

**Follow-ups (deferred / tracked):** `generate` primitive + a local text-generation scenario; port `samples/ai-image-gen-sample` scenarios into the testbed (P3 tech debt); optional Heroicons theme-toggle icon; palette retuning (CSS-var overridable); a "remaining gaps → which yield real value" review thread.

**Artifacts:** [`.ai/tasks/completed/2026-05/local-ai-exploration/`](../.ai/tasks/completed/2026-05/local-ai-exploration/) (brief, all phase briefs/results, state).

### `ts-prompt-assist-features` ✅ (cluster)

**Status:** ✅ shipped — cluster integration branch `claude/ts-prompt-assist-features` promoted to `release` via [#397](https://github.com/ErikFortune/fgv/pull/397) (`88545a5dc`). *(Corrected 2026-08-14: this line read "ready for promotion to `release`" long after the promotion landed, and four later prompt-assist streams — #407, #460, #490, #538 — had already built on top of it.)*
**Directory:** `.ai/tasks/completed/2026-05/ts-prompt-assist/` — note the directory name differs from this entry's id, so id-matching tools report this stream as un-narrated; `meta.yaml` carries a `ledgerEntry:` field recording the mapping.
**Cluster scope:** `@fgv/ts-prompt-assist` v0.1 (new library) + `@fgv/ts-extras/mustache` additive extension + `@fgv/ts-res` typed-conditions support (sub-stream below) + sample-app demonstration in `samples/ai-image-gen-sample`
**Sub-stream:** [`ts-res-typed-conditions`](#ts-res-typed-conditions-) (below)

**What shipped.**
- `PromptLibrary.create` factory; `resolve` (lookup-then-compose), `resolveJsonOutput<K>` (runtime-evidenced kind dispatch), `resolveFreeTextOutput`, `describe` (cross-scope structural-equality check).
- `IPromptStore` storage abstraction (read-only at v0.1); `FileTreePromptStore` canonical adapter; `PromptStoreFixture.build(seed)` canonical in-memory test/demo fixture.
- `PromptRegistry<TResponse>` with three typed sub-registries (`converters` / `slotKinds` / `outputValidations`).
- `IPromptSafetyPolicy` — length cap, suspicious-pattern screen with `lastIndex` reset, slot-source allowlist, `onSuspicious: 'warn' | 'reject'`, consumer-supplied `antiJailbreakPreface` seam.
- `buildSimpleDescriptor` helper for trivial free-text chat case (JSON-output paths still use full `IPromptDescriptor` to preserve `output.kind` dispatch).
- Resource bindings as first-class with RFC 8785 canonical-JSON cycle detection + depth cap.
- `MustacheTemplate.create(template, { escape: 'none' | 'html' | callback })` additive extension on `@fgv/ts-extras`.

**Decomposition history.** Phase A (#357 design lock) + Phase B (#358 brief) opened the cluster. PR #359's single-agent Phase B attempt retired after mid-run context drift produced ~35 reviewer-flagged issues; rescoped into sub-phase commissions (B-0a / B-0b / B-1a / B-1b / B-2 / B-3 / B-4 / B-5) per `brief-phase-b.md`. All sub-phases landed clean under the decomposed discipline. Orchestrator-driven post-merge cleanup PRs (#367, #370) absorbed sub-phase nits per the cluster's ship-then-tidy mechanic. Surface-tidy round (#372) split `resolveAndValidateOutput<T>` into `resolveJsonOutput<K>` + `resolveFreeTextOutput`, replacing the last caller-asserted-`T` boundary with a runtime-evidenced kind check.

**Pressure-test refinement.** Round 1 (#373 held; findings cherry-picked via #374) — 14 findings; ergonomics absorbed via #375 (`withType()`) + #376 (mixed-shape `QualifierCollector` + `IQualifierContext` Partial-widen) + #377 (ts-extras Yaml browser export bug + L13 cross-runtime micro-test) + #380 (F3 + F9 + F12 + F14 ergonomics). Round 2 (#384) — fresh sample-app integration "materially smoother than round-1"; F1/F2/F6 absorbed via the `ts-res-typed-conditions` sub-stream (sample updated to demonstrate the typed flow end-to-end).

**Artifacts:** [`.ai/tasks/completed/2026-05/ts-prompt-assist/`](../.ai/tasks/completed/2026-05/ts-prompt-assist/) (root README plus full design / brief / state / findings / phase-result docs).

**Followup streams (queued in `docs/FUTURE.md`):** `ts-prompt-assist-samples`, `ts-prompt-assist-editor-ui`, typed qualifier VALUES (round-2 F5).

### `ts-res-typed-conditions` ✅

**Status:** ✅ shipped — three sub-phases merged into `claude/ts-prompt-assist-features` (sub-stream of the `ts-prompt-assist-features` cluster above)
**Package surface:** `@fgv/ts-res` (`resource-json/` Decl tree + `conditions/convert/` Converter pipeline) + `@fgv/ts-prompt-assist` (B-3 consumer port)

**What shipped.**
- **B-1 (#391)** — Decl-tree type cascade. 17 types in `resource-json/json.ts` + `conditions/` parameterized on `TQualifierNames extends string = string` with default-string back-compat. Two latent fixes (`getKeyFromLooseDecl` undefined-handling; type-guard `'id' in decl && typeof decl.id === 'string'` runtime soundness) carried forward from closed PR #386.
- **B-2 (#394)** — Sibling `typed*` Converter exports over a shared parameterized core. 16 typed siblings (4 in `Conditions.Convert`, 12 in `ResourceJson.Convert`); existing untyped exports preserved at signature and behavior level. Drift-protection markers (`// keep in sync with X`) inline. `IConditionDecl` / `IConditionSetDecl` parameterized.
- **B-3 (#395)** — `@fgv/ts-prompt-assist` consumer port. 6 container types parameterized; `typedPromptFileConverter<T>(qc)` factory; `qualifierNameConverter?` threaded into `FileTreePromptStore.create` and `PromptStoreFixture.build`. F2 (`buildSimpleDescriptor`) and F6 (README React-wiring) absorbed from closed PR #385; F1's local sibling types obsoleted by the ts-res-layer ownership.

**Sample-app demo (#384).** `samples/ai-image-gen-sample/src/promptLibrary.ts` wires a typed `qualifierNameConverter` for `'tone'`; the round-2 pressure-test integration now demonstrates the cluster's deliverable end-to-end.

**Decision-track.** PR #386 (leaf-only parameterization) closed superseded after a senior-developer stress-test addendum (#389) caught the structural correction: #386 had no plumbing through container types, so the narrow couldn't reach the leaf from any realistic authoring chain. Option D (sibling `typed*` exports over a shared core) chosen as the non-breaking shape that preserves existing call sites. Full design-track at [`ts-res-typed-conditions-design.md`](../.ai/tasks/completed/2026-05/ts-prompt-assist/ts-res-typed-conditions-design.md) + [evaluation.md](../.ai/tasks/completed/2026-05/ts-prompt-assist/ts-res-typed-conditions-evaluation.md).

**Artifacts:** [`.ai/tasks/completed/2026-05/ts-res-typed-conditions/`](../.ai/tasks/completed/2026-05/ts-res-typed-conditions/) (brief, design notes, all three phase-result docs, polished README).

### `crypto-batch-2-hpke` ✅

**Status:** ✅ shipped — merged in [#348](https://github.com/ErikFortune/fgv/pull/348) into `claude/crypto-batch-2-features` integration branch; phase A design in [#343](https://github.com/ErikFortune/fgv/pull/343); phase B brief in [#346](https://github.com/ErikFortune/fgv/pull/346); branch `claude/crypto-batch-2-hpke-impl-pR3QU`
**Package surface:** `@fgv/ts-extras/crypto-utils`, `@fgv/ts-web-extras/crypto-utils`, `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.**
- `HpkeProvider` class (private constructor + static `create(subtle)` factory) implementing HPKE base mode (RFC 9180) with cipher suite DHKEM(X25519, HKDF-SHA256) + HKDF-SHA256 + AES-256-GCM
- Public surface: `sealBase`, `openBase`, `hkdf`, `encodeEnvelope`, `decodeEnvelope`. Internal Encap/Decap/KeySchedule stay private.
- Single implementation in `ts-extras` re-exported from `ts-web-extras` for browser callers; `CryptoUtils.HpkeProvider` namespace path works for both `moduleResolution: node` and `bundler` consumers
- B.0 RFC verification caught a design-vs-RFC discrepancy: design.md §1 used label `"dh"` in ExtractAndExpand; RFC 9180 §4.1 specifies `"eae_prk"`. Agent stopped, surfaced, corrected (confirmed via OpenSSL happykey + multiple independent implementations)
- Cross-runtime anchor vectors: Node-sealed ciphertext opens correctly on jsdom Web Crypto. 24 Node tests + 18 browser tests, 100% coverage.

**Artifacts:** `.ai/tasks/completed/2026-05/crypto-batch-2-hpke/`

### `crypto-batch-2-argon2id` ✅

**Status:** ✅ shipped — merged in [#349](https://github.com/ErikFortune/fgv/pull/349) into `claude/crypto-batch-2-features` integration branch; phase A design in [#344](https://github.com/ErikFortune/fgv/pull/344); phase B brief in [#346](https://github.com/ErikFortune/fgv/pull/346); branch `claude/crypto-batch-2-argon2id-impl-bOXwM`
**Package surface:** NEW packages `@fgv/ts-extras-argon2` (Node, wraps `argon2`) and `@fgv/ts-web-extras-argon2` (browser, wraps `hash-wasm`); model additions in `@fgv/ts-extras/crypto-utils`; `KeyStore` integration; `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.**
- `IArgon2idProvider`, `IArgon2idParams`, `ARGON2ID_OWASP_MIN`, `ARGON2ID_PASSPHRASE` in `@fgv/ts-extras/crypto-utils/model.ts`
- `IKeyDerivationParams` converted to discriminated union (`'pbkdf2'` | `'argon2id'`)
- `NodeArgon2Provider` in `@fgv/ts-extras-argon2` backed by `argon2` (kelektiv v0.44.0)
- `BrowserArgon2Provider` in `@fgv/ts-web-extras-argon2` backed by `hash-wasm` v4.12.0 — pure WASM, runs identically in Node and browsers
- `KeyStore.addSecretFromPasswordArgon2id` and `verifySecretFromPasswordArgon2id` (explicit `IArgon2idProvider` injection — KeyStore does not hold one by default)
- Cross-runtime byte-identical output verified: RFC 9106 §B.3 vector produces `03aab965...6d0c2e` on both providers; plus 7-case parameter sweep. 100% coverage across all three packages.

**Artifacts:** `.ai/tasks/completed/2026-05/crypto-batch-2-argon2id/`

### `crypto-batch-2-webauthn` ✅

**Status:** ✅ shipped — merged in [#347](https://github.com/ErikFortune/fgv/pull/347) into `claude/crypto-batch-2-features` integration branch; phase A design in [#342](https://github.com/ErikFortune/fgv/pull/342); phase B brief in [#346](https://github.com/ErikFortune/fgv/pull/346); branch `claude/crypto-batch-2-webauthn-impl-6XN80`
**Package surface:** NEW packages `@fgv/ts-extras-webauthn` (wraps `@simplewebauthn/server`) and `@fgv/ts-web-extras-webauthn` (wraps `@simplewebauthn/browser`); `common/config/rush/common-versions.json`; `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.** Result-integration boundary — six primitive functions, nothing else:
- Server: `generateRegistrationOptions`, `verifyRegistrationResponse`, `generateAuthenticationOptions`, `verifyAuthenticationResponse`
- Browser: `startRegistration`, `startAuthentication`
- Each a one-line `captureAsyncResult(() => upstream(options))` over `@simplewebauthn/*` v13
- No challenge generators, no PRF helpers, no autofill validators, no credential builders, no ceremony orchestration (four temptations explicitly considered and rejected per OQ-4)
- Type re-exports limited to direct-signature types; `jest.mock` upstream entirely (no real WebAuthn ceremony in tests). 100% coverage in both packages.

**Followup**: `integrations/` vs `libraries/` directory convention (parked to FUTURE.md); see also TECH_DEBT P3 entry on `"sideEffects": false` field consistency for new pure-library packages.

**Artifacts:** `.ai/tasks/completed/2026-05/crypto-batch-2-webauthn/`

### `crypto-batch-2-misc` ✅

**Status:** ✅ shipped — merged in [#345](https://github.com/ErikFortune/fgv/pull/345) into `claude/crypto-batch-2-features` integration branch; branch `claude/add-crypto-provider-methods-hHMYd`
**Package surface:** `@fgv/ts-extras/crypto-utils`, `@fgv/ts-web-extras/crypto-utils`, `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.** Five new methods on `ICryptoProvider` (and both concrete implementations):
- `sign(privateKey, data)` / `verify(publicKey, signature, data)` — Ed25519 and ECDSA-P256, algorithm inferred from key
- `timingSafeEqual(a, b)` — constant-time byte comparison (Node `crypto.timingSafeEqual`; browser XOR-walk accumulator)
- `hmacSha256(key, data)` / `verifyHmacSha256(key, signature, data)` — HMAC-SHA256 MAC with constant-time verification via `timingSafeEqual`

`sign`/`verify`/`timingSafeEqual` were specified in the stream brief; `hmacSha256`/`verifyHmacSha256` added during implementation per orchestrator review request (cross-repo consumer surfaced the need).

**Artifacts:** `.ai/tasks/completed/2026-05/crypto-batch-2-misc/`

### `ai-assist-thinking-config` ✅

**Status:** ✅ shipped — merged in [#334](https://github.com/ErikFortune/fgv/pull/334) into `claude/ai-assist-features` integration branch; phase A v2 design in [#332](https://github.com/ErikFortune/fgv/pull/332); commission prep in [#330](https://github.com/ErikFortune/fgv/pull/330) + [#333](https://github.com/ErikFortune/fgv/pull/333); phase B branch `claude/ai-assist-thinking-phase-b-aIY1Y`
**Package surface:** `@fgv/ts-extras/ai-assist`, `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.**
- Layered thinking-config architecture: `IThinkingConfig` with generic `effort?: 'low' | 'medium' | 'high'` + `providers?: ReadonlyArray<IThinkingProviderConfig>` array of per-provider blocks (Anthropic, OpenAI, Google, xAI, Other escape hatch). Per-provider configs expose full provider knobs first-class (Anthropic `'max'`, OpenAI `'xhigh'`/`'none'`/`'minimal'`, Gemini `thinkingBudget`, xAI `'none'`)
- `thinkingOptionsResolver.ts`: 4-tier merge logic + `checkTemperatureConflict` (temperature + thinking = `Result.fail` on Anthropic / OpenAI non-'none' / xAI conservative; Gemini accepts both)
- Registry signaling: `AiModelCapability` + `ModelSpecKey` gain `'thinking'`; `IAiProviderDescriptor.thinkingMode` (`'optional'`/`'required'`/`'unsupported'`); capability rules per provider
- xAI registry staleness fix: retired `grok-4-1-fast`/`grok-4-1-fast-reasoning` removed; defaults updated to `grok-4.3`
- Anthropic non-streaming validator fix: `extractAnthropicText` used unconditionally (handles thinking blocks, tools, plain text)
- All four chat-completion paths (non-streaming + streaming) updated with thinking wire encoding; proxy passthrough wired
- OpenAI `'none'` edge case correctly handled: setting `effort: 'none'` on gpt-5.x disables reasoning AND accepts temperature

**Followup**: `ai-assist-thinking-events` (queued; thinking-event surfacing to callers; the `includeThoughts?: boolean` field placed but inert in this stream gets wired up there)

**Artifacts:** `.ai/tasks/completed/2026-05/ai-assist-thinking-config/`

### `ai-assist-image-generation` ✅

**Status:** ✅ shipped — PR [#329](https://github.com/ErikFortune/fgv/pull/329) → `claude/ai-assist-features`; branch `claude/implement-image-generation-m7xMi`
**Package surface:** `@fgv/ts-extras/ai-assist`, `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.**
- Layered image generation options architecture: `IAiImageGenerationOptions` with generic top-level fields (`size`, `quality`, `seed`, `count`) + `models?: ReadonlyArray<IModelFamilyConfig>` for family-scoped blocks (`IDallEModelOptions`, `IGptImageModelOptions`, `IGrokImagineModelOptions`, `IImagen4ModelOptions`, `IGeminiFlashImageModelOptions`, `IOtherModelOptions` escape hatch)
- `imageOptionsResolver.ts`: 4-tier merge logic (generic → family-generic → model-specific ≈ Other) + registry-driven validation
- Registry updated: deprecated models dropped (`imagen-3.*`, `grok-2-image-1212`, `grok-imagine-image-pro`); xAI default corrected to `grok-imagine-image-quality`; all models annotated with `acceptedSizes`, `supportsQualityParam`, `acceptedQualities`, `maxCount`, `outputParamStyle`
- `apiClient.ts`: gpt-image-1 `output_format` fix (edits + generations paths); xAI JSON-body edits adapter; Imagen 4 params; Gemini aspect-ratio support; fail-fast for >3 xAI reference images
- Root cause fixes: gpt-image-1 HTTP 400 on `response_format`; dall-e-3 `count > 1`; dall-e-3 quality `'hd'` encoding

**Artifacts:** `.ai/tasks/completed/2026-05/ai-assist-image-generation/`

### `auth-primitives-batch1` ✅

**Status:** ✅ shipped — merged in [#322](https://github.com/ErikFortune/fgv/pull/322) (`bb913392`); published in `5.1.0-26` alpha
**Package surface:** `@fgv/ts-extras` (crypto-utils), `@fgv/ts-web-extras` (crypto-utils), `@fgv/ts-utils` (base/normalize), `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Cross-repo consumer:** [`ErikFortune/personaility`](https://github.com/ErikFortune/personaility) — `claude/auth-primitives-foundation-h34cG` (unblocked on `5.1.0-26` publish)

**What shipped.** Four primitives:
1. X25519 keypair (`'x25519'` added to `KeyPairAlgorithm`; both providers picked it up table-driven)
2. RFC 8785 `canonicalize()` on the base `Normalizer` (moved from `HashingNormalizer` per code review)
3. Multibase/SPKI helpers in `@fgv/ts-extras/crypto-utils` (`exportPublicKeyAsMultibaseSpki`, `importPublicKeyFromMultibaseSpki`, `multibaseBase64UrlEncode`/`Decode`)
4. `LIBRARY_CAPABILITIES.md` cryptography + canonicalization sections

**Artifacts:** `.ai/tasks/completed/2026-05/auth-primitives-batch1/` ([README](../.ai/tasks/completed/2026-05/auth-primitives-batch1/README.md))

---

## Backfilled entries — streams that shipped without a ledger entry

**Added 2026-08-18.** These 23 streams shipped between 2026-05-20 and 2026-08-09 and had complete
artifacts under `.ai/tasks/completed/` but **no entry here under their own name**. They are grouped
rather than interleaved so the backfill stays reviewable as a unit; each is otherwise an ordinary
entry.

**Every PR number, SHA and date below was re-verified against `origin/release` commit *titles*** —
not artifact claims, and not full commit messages. That distinction is load-bearing: grepping whole
messages matches a later commit that merely *cites* a PR, which is how an earlier pass briefly
"confirmed" wrong dates for #585 and #582. The verification pass corrected **eight** of the drafted
entries, listed at the end of this section, and recovered two PR numbers previously written off as
unrecoverable.

Two drafted entries were **discarded** rather than added: `json-schema-converter-alignment` and
`ts-agent-memory-vector` are already narrated under `json-schema-derives-t` and `ts-agent-memory`
via `ledgerEntry:` pointers in their `meta.yaml`. Adding them would have given the ledger two
accounts of one stream.

---

### `ai-assist-client-tools` ✅ (cluster parent)

**Status:** ✅ shipped to `release` 2026-06-04 via **#451** (`12ab4613e`, cluster promotion), cluster-closed via **#452** (`ff3a08591`).
**Artifacts:** `.ai/tasks/completed/2026-06/ai-assist-client-tools/`
**Package surface:** `@fgv/ts-extras/ai-assist` (additive), plus a browser-barrel fix.

The harness-supplied (Layer 1) half of tool use: `executeClientToolTurn` and the `IAiClientTool` / `IAiClientToolConfig` surface, so a caller can implement tools the provider then calls, across providers.

**Why it is worth reading.** This is the stream `TESTING_GUIDELINES.md` § "Coverage Gap Resolution" cites as its canonical reference observation. Its exit artifact claimed a live testbed run had succeeded while `executeClientToolTurn` never merged client tools into the request `tools` array and three `call*Stream` signatures had never been widened — the model could not have called a client tool. **All three were fixed inside #451 itself**; what shipped broken was the *claim*, not the code. The lesson codified from it is the sequencing one: run `code-reviewer` **before** chasing measured coverage.

### `ai-assist-client-tool-id-fix` ✅

**Status:** ✅ shipped to `release` 2026-06-30 via **#504** (`b946a3bda`).
**Artifacts:** `.ai/tasks/completed/2026-06/ai-assist-client-tool-id-fix/`
**Parent:** `ai-assist-client-tools`.

A field-reported bug fix, and the reason it deserves its own line rather than a mention: **this defect survived its parent's PR, its 100% coverage gate, and its live testbed run**, and was reported 26 days later by PersonAIlity as intermittent Anthropic "malformed identifier" errors on client-tool turns. Same package, same files the parent's own review had touched. It is *not* one of the three fixes bundled into #451, and not one of the coverage-sequencing defects `TESTING_GUIDELINES.md` cites — those were caught inside the parent. This one got past everything.

### `ai-assist-cross-provider-continuation` ✅

**Status:** ✅ shipped to `release` 2026-06-04, carried by the `ai-assist-client-tools` cluster promotion (**#451**). The stream's own PR **#453** targeted the integration branch and has no commit on `release`.
**Artifacts:** `.ai/tasks/completed/2026-06/ai-assist-cross-provider-continuation/`

Extended client-tool continuation wire-forwarding from Anthropic-only to **all four providers**. The per-provider fidelity difference is the durable fact: OpenAI Responses and xAI pass entries through verbatim, while Anthropic and Gemini project to `{role, content}` / `{role, parts}` and drop extra fields — so a consumer must not assume arbitrary fields round-trip everywhere.

### `ai-assist-tool-continuation` ✅

**Status:** ✅ shipped to `release` 2026-06-09 via **#488** (`5cc4b76ff`).
**Artifacts:** `.ai/tasks/completed/2026-06/ai-assist-tool-continuation/`

Made `IAiClientToolContinuation.messages` **cumulative** across `executeClientToolTurn` rounds, so the natural consumer pattern — replace `continuationMessages` each round — is the correct one. Before this, the natural-looking call was wrong in a way that only showed up on multi-round conversations.

### `ai-assist-message-ordering` ✅

**Status:** ✅ shipped to `release` 2026-06-06 via **#480** (`7b614ff32`).
**Artifacts:** `.ai/tasks/completed/2026-06/ai-assist-message-ordering/`

**The two turn entry points put conversation history on opposite sides of the current user turn** — completion used `tail:`, the client-tool turn prepended. Unified on `{ system?, messages }`, where the last entry is the current turn and everything before it is history, and the proxy wire body changed to match. A breaking wire change, deliberately taken rather than preserving two orderings.

### `per-provider-testbed-scenarios` ✅ (cluster parent)

**Status:** ✅ shipped to `release` 2026-06-05 via **#459** (`202c9f6be`, cluster promotion). The cluster closeout **#458** targeted the integration branch and has no commit on `release`.
**Artifacts:** `.ai/tasks/completed/2026-06/per-provider-testbed-scenarios/`

Stood up live-wire-verification testbed scenarios for **OpenAI Responses**, **Gemini** and **xAI grok**, paralleling the existing Anthropic one. The point of the cluster is that these scenarios hit the real APIs, which is how several of the library fixes below were found.

### `ai-assist-cross-provider-fixes` ✅

**Status:** ✅ shipped to `release` 2026-06-05, carried by the `per-provider-testbed-scenarios` cluster promotion (**#459**). The stream's own PR **#457** targeted the integration branch.
**Artifacts:** `.ai/tasks/completed/2026-06/ai-assist-cross-provider-fixes/`
**Parent:** `per-provider-testbed-scenarios`.

The library fixes the live scenarios surfaced — the class of defect that only appears when you call the real API.

### `ai-assist-responses-reasoning-events` ✅

**Status:** ✅ shipped to `release` 2026-06-05, carried by **#459**. Its own PR **#458** (the cluster closeout) targeted the integration branch.
**Artifacts:** `.ai/tasks/completed/2026-06/ai-assist-responses-reasoning-events/`
**Parent:** `per-provider-testbed-scenarios`.

Bundled a library fix, a Gemini scenario fix, **provider-drift instrumentation**, and the live-run verification. The drift instrumentation is the piece with ongoing value: the `ai-assist:unrecognized-event` warn prefix that lets a deployment alert when a provider's SSE wire shape changes.

### `ai-assist-gemini-image-refusal` ✅

**Status:** ✅ shipped to `release` 2026-07-07 via **#520** (`e824d57d8`).
**Artifacts:** `.ai/tasks/completed/2026-07/ai-assist-gemini-image-refusal/`

Gemini's API forbids combining built-in grounding (`web_search`) with function calling in one request. This turns the provider's opaque `INVALID_ARGUMENT` 400 into a named `Result.fail` **before any wire call**. Among the first streams to ship under the newly enforced coverage gate (#517/#518, landed the day before) — its artifact notes 100% coverage was real and had to be hit for real.

### `ai-assist-openai-frontier-responses` ✅

**Status:** ✅ shipped to `release` 2026-07-07 via **#522** (`3a2234249`).
**Artifacts:** `.ai/tasks/completed/2026-07/ai-assist-openai-frontier-responses/`

OpenAI frontier-model routing over the Responses API, including the `responsesOnlyModelPrefixes` routing that keeps Responses-only models reachable via `modelOverride` without making them a tier default. Also shipped under the enforced coverage gate.

### `ollama-native` ✅

**Status:** ✅ shipped to `release` 2026-06-06 via **#477** (`c750e3b82`).
**Artifacts:** `.ai/tasks/completed/2026-06/ollama-native/`

First-class Ollama support across two activities: the `/v1`-compat completion path owned by `ai-assist`, and `@fgv/ts-extras-ollama` for the native-only surface (model management, streamed pull, grammar-constrained `chatStructured`). **Native `embed` was CUT** (OQ-1, resolved by `ai-assist-embeddings`): Ollama embeddings are owned by `AiAssist.callProviderEmbedding` via `/v1`, and a parallel native path would have added only marginal diagnostics.

### `ts-extras-mcp` ✅

**Status:** ✅ shipped to `release` 2026-06-06 via **#479** (`7a8f19f90`, promotion); the stream's own **#469** and **#471** targeted the integration branch.
**Artifacts:** `.ai/tasks/completed/2026-06/ts-extras-mcp/`

`@fgv/ts-extras-mcp` — the MCP → ai-assist client-tools bridge, so any MCP server's tools become callable across all four providers with no per-provider work. The load-bearing behaviour is **graceful degradation**: a tool whose `inputSchema` is outside the `JsonSchema.fromJson` subset is excluded from `tools`, surfaced structurally on `skipped`, and NOISY-warned — the model is never offered a tool whose arguments cannot be validated.

### `agent-memory-fragment-id` ✅

**Status:** ✅ shipped to `release` 2026-07-31 via **#585** (`67e128480`).
**Artifacts:** `.ai/tasks/completed/2026-07/agent-memory-fragment-id/`

Durable, opaque fragment identity: optional `fragmentId` (stored and returned verbatim, never parsed) alongside the **advisory** `locator`, with at-least-one-of enforced by the converter and both index implementations. **Neither field discriminates a fragment hit from a record hit** — that is determined by which index produced it — and the consumer's own proposed fix (discriminate on `fragmentId`) has the same flaw one level down.

> Its `result.md` says PR #585 "not merged"; it merged. Corrected in the stream's README appendix, with `result.md` left unedited per the artifact protocol.

### `agent-memory-index-injection-seam` ✅

**Status:** ✅ shipped to `release` 2026-07-31 via **#582** (`6593668ad`).
**Artifacts:** `.ai/tasks/completed/2026-07/agent-memory-index-injection-seam/`

One additive optional `index?: IMemoryIndex` param on the store factory; omitting it is byte-identical to before. **Its premise was later found wrong** and is worth recording as such: the seam was read as the resident-memory fix, but the ceiling was in the read *contract* — every read returned whole records by construction — which `agent-memory-index-partial-read` then corrected.

### `async-result-family` ✅

**Status:** ✅ shipped to `release` 2026-08-02 via **#596** (`1220dae50`); design **#595** (`3afbd5bd6`, 2026-08-01).
**Artifacts:** `.ai/tasks/completed/2026-08/async-result-family/`

Five bounded-parallel collectors plus two serial-by-contract members, each mirroring its sync sibling's name, parameter order and fold. **They take deferred work, never materialized promises** — a promise that already exists has already started, so a collector handed one has nothing left to bound. That constraint is the design, not an ergonomic detail.

> Reconstructed from git history; no `result.md` was ever written, so there is no record of what diverged during implementation.

### `testbed-web-scenarios` ✅

**Status:** ✅ shipped to `release` 2026-07-27 via **#570** (`9af7826bd`, Phase B) over **#569** (`f9ba07975`, Phase A, 2026-07-26).
**Artifacts:** `.ai/tasks/completed/2026-07/testbed-web-scenarios/`

An additive `ICliScenarioImpl.webRunnable?: boolean` opt-in plus a shell-generic `ScenarioRunnerPanel`, so browser-clean CLI scenarios run from the testbed web UI without a bespoke React component each. Absent/false preserves CLI-only behaviour.

> Reconstructed from git history; no `result.md` survives.

### `heft-rig-coverage-gate` ✅

**Status:** ✅ shipped to `release` 2026-07-07 via **#518** (`8e84cf0e6`), with **#517** (`e0300c1c4`, 2026-07-06) enforcing jest coverage-threshold misses as build failures.
**Artifacts:** `.ai/tasks/completed/2026-07/heft-rig-coverage-gate/`

Made the coverage gate **actually enforced in CI** rather than nominally required — CI now runs `rush test`. Several later streams' artifacts note they were the first to ship "under the enforced gate", which is how you can tell it changed behaviour.

> Reconstructed from git history; no `result.md` survives.

### `crypto-utils-base64url-hardening` ✅

**Status:** ✅ shipped to `release` 2026-07-07 via **#519** (`479e20bd3`).
**Artifacts:** `.ai/tasks/completed/2026-07/crypto-utils-base64url-hardening/`

base64url-no-pad helpers and a branded `MultibaseSpkiPublicKey`. Two PersonAIlity V2 identity asks (RFC 9421 signatures + WebAuthn), bundled because both are additive on `crypto-utils` and tightly coupled. This is the stream behind the guidance that `fromBase64Strict` — not `fromBase64`, and not `Buffer.from(s, 'base64')` — is what you reach for when the base64 came from somewhere you do not control.

### `ks-encoding` ✅

**Status:** ✅ shipped to `release` 2026-05-27 via **#425** (`a587495c4`).
**Artifacts:** `.ai/tasks/completed/2026-05/ks-encoding/`

A top-level `--encoding <text|base64|hex>` flag on `ks get` / `ks export`; default `text` preserves prior behaviour exactly. Enables binary-safe secret retrieval.

**Left open deliberately:** whether `ks get` / `ks export` should ever *auto-detect* non-UTF-8 secret bytes and default to base64. Recorded rather than decided — and see `docs/FUTURE.md`, which closed it as moot on a sharper precondition: `@fgv/ks` still exposes no way to get non-UTF-8 bytes *into* a keystore.

### `prompt-assist-horizontal-composition` ✅

**Status:** ✅ shipped to `release` 2026-06-19 via **#490** (`1daac07c5`) — design + Phase A (`IResolvedPrompt.slots`) + Phase B (`HorizontalComposer`) in one promotion.
**Artifacts:** `.ai/tasks/completed/2026-06/prompt-assist-horizontal-composition/`

`HorizontalComposer` — provenance-ordered, directive-aware merge of N peer contributors into one composed prompt. The load-bearing rule: **`constraint`-directive contributions are always concatenated first and never dropped, regardless of strategy**. It closes the safety gap of the consumer-side external-composer path, which read `IResolvedPrompt.slots` directly and had to self-screen.

Four open questions were resolved in-stream (composed descriptor YAML-authored; `ILogicalSlotConfig` code-first; `'\n\n'` separator, per-slot overridable), and the phase-B implementation forked from the ratified design in named ways — both recorded in the artifact.

### `ts-prompt-assist-observability` ✅

**Status:** ✅ shipped to `release` 2026-06-05 via **#460** (`c9211811c`, cluster promotion). Phases ran on a dedicated integration branch — Phase A **#455**, Phase B (`34ef9443`), Phase C **#456** — none of which has a commit on `release` under its own number.
**Artifacts:** `.ai/tasks/completed/2026-06/ts-prompt-assist-observability/`
**Workflow:** `design-triage-implement`.

`PromptObservationStore` and the `IPromptObserver` fan-out, plus **`RetainingRingBuffer` in `@fgv/ts-utils`** — the generic bounded most-recent-N ring underneath it. The ring is the piece with reach beyond this package: it is the answer for any retain-and-page surface, and exists because this stream declined to hand-roll one.

### `retaining-logger-ring-buffer-refactor` ✅

**Status:** ✅ shipped to `release` 2026-06-05 via **#461** (`8f4bf5e6c`).
**Artifacts:** `.ai/tasks/completed/2026-06/retaining-logger-ring-buffer-refactor/`

Moved `RetainingLogger` onto the shared `RetainingRingBuffer` rather than its own circular buffer — the follow-through that made the primitive above actually shared instead of merely available. Also carved out the `logging-interface` packlet.

> Its artifact records **PR: TBD (see commit SHA)** and the SHA is not in the file, so the backfill's first pass left this blank as unrecoverable. It is recoverable: a title search of `release` finds `refactor(ts-utils): RetainingLogger composes RetainingRingBuffer; logging-interface packlet (#461)`.

### `result-should-not-fail` ✅

**Status:** ✅ shipped to `release` 2026-05-21 via **#400** (`d1e4e2fb1`), over substrate-prep **#399** (`534fede82`, 2026-05-20).
**Artifacts:** `.ai/tasks/completed/2026-05/result-should-not-fail/`

`Result.shouldNotFail()` for declaration-time invariants — the case where a failure means the program is wrong rather than the input is.

---

### Corrections the verification pass made to the drafts

Recorded because the drafting pass was careful and still got eight of twenty-three wrong in ways
only a title-level check against `release` would catch. **The general shape of the error is citing
the stream's own PR — the one it authored into an integration branch — as though it were the commit
that reached `release`.** `finalize-task` says a sub-stream's PRs are the ones it authored rather
than the one that carried it; the ledger wants both, and must not conflate them.

| stream | drafted | verified |
|---|---|---|
| `ai-assist-message-ordering` | shipped via #478 | **#480** (`7b614ff32`); #478 has no commit on any ref |
| `prompt-assist-horizontal-composition` | #490 / #491 / #492 | **#490** only; #491 and #492 have no commit on any ref |
| `ts-prompt-assist-observability` | no promotion named; dated 2026-06-04 | **#460** (`c9211811c`), **2026-06-05** |
| `retaining-logger-ring-buffer-refactor` | "PR number not recoverable"; 2026-06-06 | **#461** (`8f4bf5e6c`), **2026-06-05** |
| `ollama-native` | "2026-06" | **#477** (`c750e3b82`), 2026-06-06 |
| `ai-assist-gemini-image-refusal` | "2026-07, off `release` directly" | **#520** (`e824d57d8`), 2026-07-07 |
| `ai-assist-openai-frontier-responses` | "2026-07" | **#522** (`3a2234249`), 2026-07-07 |
| `ks-encoding` | "2026-05" | **#425** (`a587495c4`), 2026-05-27 |

Two further drafted claims were checked and found **already satisfied**, needing no action:
`safer-fetch-s3` already carries its `ledgerEntry: fetch-primitive-threat-model` pointer, and
`ai-assist-thinking-events` — flagged as "a ledger entry with no directory, worth a look" — is
correct as it stands: it is a 🟡 *queued* stream that was never commissioned, and its own entry says
artifacts are "TBD when stream is commissioned".

**One residue item is left open deliberately.** `finalize-task` § 8's reconciliation compares
directory names to heading names and does not read `meta.yaml`'s `ledgerEntry:`, so the five
pointer-resolved streams are reported as gaps on every run — and this backfill re-derived entries
for two of them before catching it. Teaching the reconciliation to honour the pointer is a small
change to the skill, and it is what stops this being re-done.
