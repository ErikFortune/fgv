# Brief — ai-assist antagonist (phase 2): adversarial torture tests for the provider-shape & param-rejection near-miss classes

> **STATUS: COMMISSIONED (phase 2).** Phase 1 (`agent-memory-antagonist`, #528) found and fixed two real substrate
> bugs and merged to `release`; the principal gave GO for phase 2. This phase points the SAME hole-driven charter at
> `@fgv/ts-extras/ai-assist` — the provider response-shape + param-rejection + convert/validate-symmetry class, drawn
> from the near-misses on #520 (Gemini image-refusal), #522 (OpenAI frontier/Responses routing), and #524 (annotations
> converter field-drop).

**Surface:** `libraries/ts-extras/src/packlets/ai-assist` (**active** surface). Test-only work under
`libraries/ts-extras/src/test/unit/ai-assist/**` — **no production behavior change unless a torture test surfaces a
real bug, in which case STOP and report it, don't paper over it.**
**Ships under the enforced 100% coverage gate.** New tests only; existing coverage must not regress.

## Charter — hole-driven, not coverage-driven (identical to phase 1)

You are an **antagonist**, not an SDET writing happy-path coverage. For each invariant below: **assume it is subtly
violable, construct the minimal input or sequence that breaks a plausible-but-wrong implementation, and write the test
that would FAIL against that wrong impl.** A torture test that passes on the first run is only interesting if you can
name the wrong implementation it guards — record that one-liner per test. Where a test surfaces a *real* current bug:
**STOP, do not fix it silently, report it** (per TESTING_GUIDELINES "never paper over failures"). The bug is the
deliverable.

**Output form is open — choose per target:** adversarial unit tests for pure functions (converters, resolvers, routing
predicates, SSE parse); integration-style tests over the real client with a stubbed `fetch`/SSE transport (mirror the
existing `apiClient.test.ts` / `streamingClient.test.ts` / `streamingAdapters.test.ts` fixtures — do NOT invent a new
mock shape); one-shot property/fuzz harnesses where the input space is large (finishReason × provider matrices, tier
cascade permutations), kept deterministic/seeded if CI-gated.

## Target inventory — the near-miss invariant classes (each an actual late-caught miss this arc)

For each, the "wrong implementation" to hunt is in parentheses. Real code sites are named — read them first.

### 1. Provider response-shape: decline vs. benign-terminal disambiguation (#520 near-miss)
`apiClient.ts` (`benignGeminiImageFinishReasons` set ~line 1174; the `declined` detection ~1227-1239) and
`streamingAdapters/gemini.ts`. The shipped bug: the image adapter required `content` and never inspected
`finishReason`; the *fix* then over-corrected to "any finishReason = decline," mislabeling a normal `STOP` completion
(text-instead-of-image) as a refusal — a P1 regression caught only because it broke an untouched test.
- Torture: **every** finishReason value across the matrix — `STOP`, `MAX_TOKENS` (benign) vs `SAFETY`, `RECITATION`,
  `PROHIBITED_CONTENT`, `OTHER`, `''`, `undefined`, an unknown-future value — asserting benign→fall-through-to-no-image,
  refusal→loud `Result.fail` with the reason surfaced. (Wrong impls: "any finishReason = decline"; "only SAFETY =
  decline" missing RECITATION; treating `undefined` as a decline.)
- Torture: a candidate with a text part AND `finishReason: STOP` must yield the no-image message, not a refusal.
- The **completion** (non-image) path: `truncated: candidate.finishReason === 'MAX_TOKENS'` (~688) and
  `IAiStreamDone.incompleteReason` — assert truncation flags line up with the reason, and a normal STOP does not set
  `truncated`.

### 2. Model routing — Responses-only + tier cascade + alias resolution (#522 near-miss)
`registry.ts`, `model.ts` (`isResponsesOnlyModel` / `responsesOnlyModelPrefixes`; the `@`-sigil alias resolution
`resolveModelAlias` / `resolveProviderModel`; the `frontier → advanced → base` tier cascade). The shipped issue: a
stale registry test asserting the *old* frontier-cascade behavior lived outside the diff and only failed when the
suite ran.
- Torture: a Responses-only model (`gpt-5.5-pro`) routes to the Responses path, a chat model does NOT; a model whose
  prefix is a *substring* but not a real prefix must not false-match; case sensitivity.
- Torture: tier cascade — a provider declaring only `base` resolves `frontier`→`base`; one declaring `advanced`
  resolves `frontier`→`advanced`; assert first-present-key-wins over the ordered fallback. (Wrong impl: cascade picks
  last, or throws on a missing intermediate tier.)
- Torture: `@`-alias resolution — an unregistered `@alias` fails LOUD (not a silent wire call); a raw id (no `@`) passes
  through verbatim (Ollama `model:tag`, dated snapshots, `modelOverride`); one `@fgv-alias → provider-native-alias` hop
  is followed and a cycle is guarded. (Wrong impl: treats a raw id as an alias and rejects it; infinite-loops a cycle.)

### 3. Convert/validate symmetry — no silent field-drop (#524 near-miss — the concrete bug)
`converters.ts` (`aiClientToolConfig` ~137, `aiToolAnnotations` ~121, `aiServerToolConfig`, `modelSpec`,
`aiAssistProviderConfig`, `aiAssistSettings`, `aiWebSearchToolConfig`, `aiToolEnablement`). The shipped bug:
`aiClientToolConfig` dropped the newly-added `annotations` field — a convert/type asymmetry CodeRabbit caught, not the
suite. This is the ai-assist analog of phase 1's `antagonistRoundTrip` class.
- Torture: for **every** exported converter in `converters.ts`, round-trip a value with **every** optional field
  populated simultaneously and assert (whole-object `toEqual`) that none is silently dropped; a companion
  "absent-stays-absent" case guarding null/undefined drift. Pay special attention to nested optionals
  (`annotations` inside `aiClientToolConfig`, per-provider blocks inside `modelSpec`/thinking config). (Wrong impl: a
  `Converters.object` whose field map omits a field the interface carries.)

### 4. Param-rejection & composition — thinking ↔ temperature (#524-era)
`thinkingOptionsResolver.ts`. The matrix: Anthropic + non-`'none'` OpenAI + xAI **reject** temperature+thinking
(`Result.fail`); Gemini **accepts** both; OpenAI `'none'` effort re-enables temperature; unknown/unsupported providers
silently ignore `thinking`.
- Torture: exercise EVERY provider arm of the conflict matrix; assert the reject arms fail with context and the accept
  arms succeed; assert `'none'` flips OpenAI from reject to accept; assert an unknown provider ignores rather than
  throws. (Wrong impl: a single global "reject if both set" that wrongly fails Gemini, or misses one provider arm.)
- Composition: `tier` selects the model; `thinking`/`tools` ride on top and NEVER select a model — assert a
  `base + thinking` request resolves the base model and still sends thinking (no capability branch).

### 5. Streaming drift instrumentation & SSE parse
`sseParser.ts`, `streamingAdapters/{anthropic,openaiResponses,gemini}.ts` (the `RECOGNIZED_*_EVENTS` allowlists;
one-warn-per-stream-per-unrecognized-name dedup; the `ai-assist:unrecognized-event` tag; the default-safe payload
preview — top-level keys + length, **never field values**).
- Torture: an unrecognized SSE event name warns exactly ONCE per stream per name (not per occurrence); two different
  unknown names warn twice; a recognized name never warns. (Wrong impl: warns per-occurrence, or dedups across streams.)
- Torture: the payload preview never leaks a field VALUE (assert the warn text contains keys/length but not a seeded
  secret value); `AI_ASSIST_UNRECOGNIZED_EVENT_FULL_PAYLOAD` opt-in flips it. Split/partial SSE frames reassemble.

### 6. Client-tool continuation — cumulative semantics & per-provider projection
`streamingAdapters/clientToolContinuationBuilder.ts` (existing `clientToolContinuationBuilder.test.ts` — extend
adversarially). `continuation.messages` is **cumulative** (replace each round, library prepends the inbound tail — do
NOT manually concat); per-provider projection: Anthropic → `{role,content}` (extra fields dropped, invalid entries
skipped), Gemini → `{role,parts}` (same guard), OpenAI Responses / xAI → verbatim `JsonObject` passthrough.
- Torture: a multi-round continuation where round N's array must cover ALL prior rounds (guard against a builder that
  only carries the latest round); an entry with extra fields on Anthropic/Gemini is projected (fields dropped) while on
  OpenAI/xAI it round-trips verbatim; an invalid (non-object) entry is skipped, not crashed on. (Wrong impl: concats and
  double-counts; or applies the OpenAI verbatim rule to Anthropic and leaks non-`{role,content}` fields.)

### 7. Gemini web_search × function-calling mutual exclusion
Gemini's `generateContent` HTTP-400s if built-in grounding (`web_search`) and function calling are combined. Torture:
does ai-assist guard this before the wire call (fail-fast with a clear message) or pass it through to a 400? If it
passes through, that's a report-worthy gap; if it guards, lock the guard. (Wrong impl: no pre-flight check → opaque 400.)

## Constraints
- No `any`; `Result<T>`; declarative `@fgv/ts-utils-jest` matchers; reuse the existing ai-assist test fixtures /
  stubbed-`fetch` shapes (no new over-mocking that hides the real adapter path). Deterministic/seeded for CI-gated fuzz.
- **If a torture test surfaces a real bug: STOP and report it** with the failing input + the invariant it violates. Do
  NOT fix production silently and do NOT weaken the test to pass. A found bug is the deliverable.
- New tests must not drop existing 100% coverage. Do NOT spawn a code-reviewer subagent (it orphans in this harness) —
  the orchestrator runs the code-reviewer pass on the diff.

## Sequence
Per target class: enumerate the wrong impls → construct the breaking input → write the test → run it → (pass: note the
wrong-impl it guards; fail: STOP + report). Then `rushx fixlint`/`lint`/`build`/`test` @ 100% in `libraries/ts-extras`
→ `rush change` (`--bump-type patch` if any prod fix, else `none`) → report to the orchestrator (no PR; the orchestrator
drives the PR + review + merge to `release`).

## Proof of work
`git log`; gate tails (100%, no regression); per-target-class the tests added + a one-line "wrong implementation this
would catch"; **any real bug found reported prominently at the top** with failing input + violated invariant.

## Why this stream exists
Phase 1 converted "we got lucky on the second review" into "we hunted these classes deliberately" and found two real
substrate bugs. The ai-assist provider surface has the same profile: #520, #522, and #524 each shipped a
plausible-but-wrong implementation that passed its happy-path tests and was caught late (a regression that broke an
untouched test; a stale out-of-diff test; a CodeRabbit-caught converter drop). An explicit antagonist over the
corrected provider surface is the same cheap insurance.
