# `ts-prompt-assist-observability` — stream brief

**Status:** ready to commission Phase A (design spike)
**Workflow shape:** `design-triage-implement` on its own integration branch (`ts-prompt-assist-observability` → `release` as one cluster-close squash when Phase C ships)
**Source:** Erik framing 2026-06-04 — "add a hook that can observe all prompts as they go by, preferably with a filter."

---

## Big picture

`@fgv/ts-prompt-assist` v0.1 resolves prompts via `PromptLibrary.resolve()` and returns a rich `IPromptResolveTrace`. There's currently no hook for an observer to see prompts/traces as they flow — production deployments will need this for audit, debugging, prompt-engineering iteration, and offline analysis.

Erik's high-level framing (load-bearing constraints on the design):

1. **Record both the trace and the rendered prompt.** Both as durable observability records.
2. **Provide a default storage implementation, but let the caller instantiate, manage, and inject it.** Same DI pattern as the rest of the toolkit. Library ships a default; consumer is free to substitute.
3. **Storage implementation handles size/privacy/filtering constraints** — those are deployment policy, not library policy. Library doesn't bake in retention rules.
4. **`MultiLogger`-shaped fan-out.** Multiple observers wireable; errors in one don't break others or the `resolve()` call.
5. **Open spike question:** can we reuse or extend `RetainingLogger` from `@fgv/ts-utils/logging`, or do we need a similar-but-different primitive?

---

## Stream shape — three phases

### Phase A — design spike (this brief commissions Phase A only)

Phase A is the **load-bearing decision phase**. Output is a `design.md` answering the four prioritized questions below. **No implementation in Phase A.**

### Phase B — design triage (commissioned after Phase A lands)

Erik (orchestrator) reviews Phase A's `design.md`, raises open questions, locks decisions. Output is a small set of triage decisions captured in the integration branch's substrate.

### Phase C — implementation (commissioned after Phase B locks)

Implementation against the locked design. Touches `@fgv/ts-prompt-assist` and possibly `@fgv/ts-utils/logging` (if the spike concludes RetainingLogger reuse/extension is the right path).

---

## Phase A — the four questions

The Phase A spike must answer these four questions, in this order:

### Q1: RetainingLogger fit (the load-bearing question)

Four candidate substrates for the storage primitive:

| Option | Shape | When this wins |
|---|---|---|
| **A. Reuse `RetainingLogger` as-is** | Treat prompt records as structured log records; level stands in for outcome (success/failure); `args[0]` carries the full record | Filtering on prompt-specific axes is acceptable as consumer-side post-filter; we ship fastest |
| **B. Extend `RetainingLogger`** | Add `filter?: (record) => boolean` parameter to `getRecords` | We want library-side filtering but don't want a new primitive; filter is generic |
| **C. New `RetainingObserver<T>` sibling primitive in `@fgv/ts-utils`** | Generic over record type; same seq + ring + eviction machinery; type-safe schema-aware queries | Observability is a recurring shape (prompt today, LLM call tomorrow, file-tree access after that); abstraction earns its keep |
| **D. Sui generis `PromptObservationStore` in `@fgv/ts-prompt-assist`** | Schema-aware from day one; no genericization attempt | We ship now, and observability genuinely IS prompt-specific |

For each option, Phase A must:

- Read the actual `RetainingLogger` source (`libraries/ts-utils/src/packlets/logging/retainingLogger.ts` or equivalent) and verify what extension actually fits / doesn't fit. **No speculating about RetainingLogger's surface — read it.**
- Sketch what reuse/extension looks like concretely (interface + 5-10 line consumer-facing example).
- Name the rejection reason for the three non-chosen options.

Phase A's recommendation should be falsifiable — if option C is recommended, the recommendation must name a second observability use case plausible within 6 months that would justify the genericization. If no such use case is plausible, default to D.

### Q2: Hook firing surface

Where does the observer hook fire inside `PromptLibrary`? Probably:

- One hook fire per `PromptLibrary.resolve()` call, covering both success and failure
- Separate hook fires for `resolveJsonOutput` / `resolveFreeTextOutput` (those are post-resolve LLM round-trips with their own concerns)
- Nested resource-binding resolutions roll up under the outer record's trace — NOT a separate hook fire

Phase A confirms or refines this with reference to the actual `PromptLibrary` code, then sketches the wiring point(s).

### Q3: Record shape (what gets stored)

The `IPromptObservationRecord` fields. Probably:

- `id` — monotonic seq for ordering + content-hash for dedupe (both side-by-side; consumer picks which to use as key). Content-hash is RFC 8785 canonical of `(promptId, scope, qualifierContext, bindings)` via `Hash.Crc32Normalizer.canonicalize()` or `HashingNormalizer`.
- `timestamp`
- `promptId`, `scope`, `qualifierContext`
- `outcome: 'success' | 'failure'`
  - success: rendered body, `output.kind`, output binding
  - failure: error message + last-known trace state
- Full `IPromptResolveTrace` (the existing trace structure)
- `safeguardFindings` (already on trace, but worth surfacing as a top-level filter axis)
- `durationMs`

Phase A finalizes the field list with reference to `IPromptResolveTrace` and `PromptLibrary.resolve()` return shapes.

### Q4: Filter axis API (storage-layer queries)

The query API on the default storage impl. Probably:

- `promptId`, `scope`, `qualifierContext` (partial-match)
- `output.kind`
- `outcome`
- `safeguardFindings` (presence + disposition: 'reject' / 'warn' / 'info')
- `timestamp` range, `seq` range (since/until cursor)

Phase A finalizes the axis list and the predicate/builder API shape (echoing `RetainingLogger.getRecords` if Q1 chose A/B/C, or designing fresh if Q1 chose D).

---

## Critical semantics (load-bearing for the API — Phase A must surface these)

Two semantics that must be locked into the API shape, not added post-hoc:

1. **Observer errors must not break `resolve()`.** Library swallows observer errors (or logs them to a fallback `ILogger` if injected). Same shape as `MultiLogger` today.
2. **Privacy/redaction is a storage-layer concern, NOT a library-layer concern.** The library's default storage impl is most-permissive (no redaction). Production consumers wrap with a filtering/redacting observer or substitute the storage entirely. The brief explicitly forbids baking deployment policy into the library.

Phase A sketches both semantics in the proposed interface.

---

## Open questions Phase A may surface for Phase B triage

(These are NOT for Phase A to decide; just to name if they arise.)

- **id-key choice if the spike doesn't lock it cleanly.** Seq alone? Content-hash alone? Both side-by-side?
- **Observer-error fallback wiring.** Default to silent swallow? Inject an `ILogger`? Per-observer error handler?
- **Async vs sync observer interface.** Probably async (`observe(record): Promise<Result<unknown>>`) — but Phase A confirms with reference to where the hook fires.
- **Hook ordering relative to safeguard screeners.** The screeners run pre-render; the observer fires post-resolve. Does the observer record show the screener findings (yes, via trace) but NOT see pre-screening state (correct)?
- **Cross-library reuse decision (if Q1 chose C or a hybrid).** If `RetainingObserver<T>` lands in `@fgv/ts-utils`, is the prompt-specific observer a thin wrapper in `@fgv/ts-prompt-assist`, or does `ts-prompt-assist` import the generic directly?

---

## In scope (Phase A)

- New file: `.ai/tasks/active/ts-prompt-assist-observability/design.md` — the Phase A deliverable.
- Reading `RetainingLogger` source (`libraries/ts-utils`) to verify Q1 candidates.
- Reading `PromptLibrary` source (`libraries/ts-prompt-assist`) to identify hook firing points and record shape.
- Reading existing `ILogger` / `LogReporter` / `MultiLogger` / `LoggerBase` source for the DI + fan-out + error-swallow patterns.
- Reading `IPromptResolveTrace` definition to nail down the record shape.
- Updating `.ai/tasks/active/ts-prompt-assist-observability/state.md` as Phase A progresses.

## Out of scope (Phase A)

- ANY implementation. No new source files in `libraries/`. No tests. No converters. The output is `design.md` and nothing else.
- Phase B triage decisions (Erik runs Phase B).
- Phase C implementation (commissioned after Phase B locks).
- Anything outside `@fgv/ts-prompt-assist`, `@fgv/ts-utils` (read-only), and the task substrate.

---

## Package surface (Phase A)

| Path | May modify (Phase A) |
|------|----------------------|
| `.ai/tasks/active/ts-prompt-assist-observability/design.md` | ✅ create |
| `.ai/tasks/active/ts-prompt-assist-observability/state.md` | ✅ update progress |
| `.ai/tasks/active/ts-prompt-assist-observability/findings/inbox/` | ✅ file follow-up findings if surfaced during reading |
| `libraries/ts-prompt-assist/**` | ⚠️ read-only |
| `libraries/ts-utils/**` | ⚠️ read-only |
| Anything else | ❌ |

---

## Required reading (Phase A)

1. **`libraries/ts-utils/src/packlets/logging/`** — read the entire logging packlet. Especially: `RetainingLogger`, `MultiLogger`, `LoggerBase`, `ILogger`, `LogReporter`, `ILogRecord`. **This is the load-bearing read** — Q1 cannot be answered without it.
2. **`libraries/ts-prompt-assist/src/packlets/`** — read enough of `PromptLibrary` to identify the `resolve()` / `resolveJsonOutput()` / `resolveFreeTextOutput()` paths and the `IPromptResolveTrace` shape.
3. **`.ai/instructions/LIBRARY_CAPABILITIES.md`** — the `@fgv/ts-prompt-assist` entry (frames v0.1 surface; names what's out-of-scope for v0.1 like `watch` / change-notification).
4. **`.ai/instructions/CODING_STANDARDS.md` § "Extending Core Libraries Over Working Around Them"** — load-bearing for the Q1 decision. The default is to extend the lower library, not work around it.
5. **`docs/FUTURE.md`** — check for related observability entries that might shape scope.
6. **`docs/ACTIVE_DEVELOPMENT.md`** — `@fgv/ts-prompt-assist` is on the active-development surface (v0.1 not fully shipped); the observability surface should be designed alongside other surface decisions, not bolted on later. This is relevant context for Q2 (firing surface).

---

## Skills to load

- `/published-primitives-reflex` — before sketching any new primitive (the spike's whole point is checking if a published primitive fits first).
- `/result-pattern` — the observer interface returns `Result<T>` for fallible operations.
- `/ts-utils-logging` — required for understanding the `ILogger` / `LogReporter` / `MultiLogger` patterns the design parallels.
- `/value-hashing` — relevant if Q3 settles on content-hash ids.

---

## Phase A acceptance criteria

- [ ] `design.md` exists at `.ai/tasks/active/ts-prompt-assist-observability/design.md` with the four-question outputs.
- [ ] Q1 answered with a falsifiable recommendation (Option A/B/C/D + reasoning + rejection rationale for the other three).
- [ ] Q2 sketches the hook firing point(s) with reference to actual `PromptLibrary` code.
- [ ] Q3 specifies the `IPromptObservationRecord` field list with reference to `IPromptResolveTrace`.
- [ ] Q4 specifies the filter axis API.
- [ ] Critical semantics (observer-error swallow + storage-layer privacy) sketched in the proposed interface.
- [ ] Open questions for Phase B triage named.
- [ ] `state.md` updated to "Phase A complete; Phase B ready to commission."
- [ ] No source-code changes outside the task substrate.

## Phase A exit artifact

Just `design.md` + an updated `state.md`. No `result.md` until Phase C lands.

---

## Branching

This stream uses **integration-branch posture** (per L36):

- **Integration branch:** `ts-prompt-assist-observability` (already created off `release`; this brief is committed there).
- **Agent's Phase A work branch:** fork off the integration branch — `chore/ts-prompt-assist-observability-phase-a` (or whatever the agent prefers).
- **PR target:** the integration branch (NOT `release`). Phase A's PR merges onto integration.
- **Phase B / Phase C** open subsequent PRs onto the same integration branch.
- **Cluster-close PR:** orchestrator opens this when Phase C is ready, bundling the artifact migration to `completed/`. Squash-merges to `release` as one feature commit.

## Resume protocol

If the Phase A session is interrupted: read `state.md` to determine which question is in progress. Resume at the next question boundary.
