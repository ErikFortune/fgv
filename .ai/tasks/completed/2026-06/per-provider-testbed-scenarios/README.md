# `per-provider-testbed-scenarios` — shipped (cluster)

**Shipped:** 2026-06-05 via PR #458 (closeout) + the preceding three sub-stream PRs squash-merged into the integration branch. Cluster-close PR squash-merges `per-provider-testbed-scenarios` → `release`.

**Cluster scope:** stand up live-wire-verification testbed scenarios for **OpenAI Responses**, **Gemini**, and **xAI grok** (paralleling the existing `anthropicClientTools` scenario), **plus close every wire-shape bug the live runs surface**. The cluster's evolved mission was "stand up live verification AND fix the bugs that doing so surfaces" — the empirical safety net the FUTURE.md entry anticipated, with the loop ridden four times to completion.

---

## What shipped

### Public surface

**`@fgv/ts-extras/ai-assist`:**

- **Cross-provider continuation forwarding** (PR #454): `executeClientToolTurn`'s `continuationMessages` now flows through to every provider's request builder via `rawTail`. The Anthropic-only forwarding gap from the prior `ai-assist-client-tools` Phase C work is closed. OpenAI Responses + Gemini + xAI (via `apiFormat: 'openai'` routing) all carry the reconstructed assistant turn + tool outputs on the follow-up request. No public-surface diff (all new converters `@internal`).
- **Gemini function-declaration schema sanitization** (PR #457): `toGeminiTools` now runs `parametersSchema.toJson()` output through a recursive `toGeminiParameterSchema` sanitizer that strips `additionalProperties` + `$schema` keywords (which `JsonSchema.object(...)` emits strict-by-default, but which Gemini's OpenAPI-3.0-subset rejects rather than ignores). Every `JsonSchema`-authored client tool now works on Gemini without consumer awareness of the dialect.
- **`IAiStreamDone.incompleteReason?: string`** (PR #457): the OpenAI/xAI Responses adapter now captures `incomplete_details.reason` from the `response.completed` payload and surfaces it on the done event when `truncated === true`. Made the "completed but empty" failure mode self-explaining instead of requiring source inspection — directly enabled the diagnostic step that ruled out the truncation hypothesis on PR #458's empty-completion investigation.
- **OpenAI Responses `item_id ↔ call_id` correlation** (PR #458): the streaming adapter now correlates the `item_id` carried by `response.function_call_arguments.{delta,done}` events with the `call_id` populated only at `response.output_item.added`. Live captures (2026-06-05) confirmed the SSE wire — the adapter previously looked up by `call_id`, found nothing, and silently no-op'd, so client-tool-call-done events never fired on reasoning models. This was the **L37 reference-observation pattern playing out exactly**: tests passed on a wire shape that did not match the live API.
- **`buildOpenAiContinuation` call_id correctness** (PR #458): the continuation now emits the **required** `call_id` field on function_call input items (was `id`, the optional field). OpenAI's Responses API rejects the prior shape with HTTP 400 (`Missing required parameter: 'input[2].call_id'`) — the 400 surfaced the moment the adapter fix made function-call events flow through. Both bugs had to land together to make OpenAI/xAI scenarios reach PASS.
- **Provider-drift instrumentation** (PR #458): `openaiResponses.ts` and `anthropic.ts` now maintain `RECOGNIZED_OPENAI_RESPONSES_EVENTS` / `RECOGNIZED_ANTHROPIC_EVENTS` allowlists and emit a one-time `logger?.warn(...)` per stream per unrecognized event name. The warning starts with a stable `ai-assist:unrecognized-event` tag (shared `UNRECOGNIZED_EVENT_WARN_TAG` in `common.ts`), includes a length-capped payload preview (200 chars, `<no payload>` for empty data), and names the allowlist constant for triage. **Self-diagnosing adapter**: the next wire-shape gap surfaces as a warn in consumer logs the moment it appears, rather than as silent-drop requiring an empirical-detective process. Symmetry across all three adapters where it makes sense — see Gemini drift instrumentation deferral below.

**`@fgv/ts-json-base`:**

- (Already shipped by the `ai-assist-client-tools` cluster: `JsonSchema` browser-barrel export.) No further changes in this cluster.

**`samples/testbed`:**

- **Three new live-wire-verification scenarios** under `samples/testbed/src/scenarios/`:
  - `openaiClientTools/` — `gpt-5.1` + `reasoning.effort: 'low'` + `recall_memory` client tool + `web_search` server tool
  - `geminiClientTools/` — `gemini-2.5-flash` + `thinkingBudget: 1024` + `recall_memory` client tool (server tool dropped per Gemini API constraint)
  - `xaiClientTools/` — `grok-4.3` + `reasoning.effort: 'low'` + `recall_memory` client tool + `web_search` server tool
- Each scenario is CLI-only, gates on its `<PROVIDER>_API_KEY` env var with a clear missing-key diagnostic, emits a PASS/FAIL summary with a per-gate breakdown matching the anthropic template, and uses a version-pinned model alias (not a dated snapshot, not `*-latest`).
- **Live verification PASSED on all four providers** on 2026-06-05.
- Coverage exclusion: `samples/testbed/config/jest.config.json` excludes `lib/scenarios/[a-zA-Z]+ClientTools/` from coverage collection — live-API CLI scenarios cannot be unit-tested without a live key, and the cluster's briefs forbade forcing 100% via mocking. The exclusion regex retroactively covers the pre-existing `anthropicClientTools/` scenario (previously at ~46%) and fixes a stale registry snapshot.

### Substrate

- `docs/FUTURE.md` — the per-provider-testbed-scenarios entry marked **shipped 2026-06-05** with the cluster-close PR reference. The generic-version-alias library work (companion concern) stays queued.
- New FUTURE.md entries (added by this cluster-close PR):
  - **Gemini-side drift instrumentation** (the closeout's deferred follow-up; see finding `2026-06-05-gemini-drift-instrument-deferred.md`).
  - **Library default `max_output_tokens` for reasoning models** (usability call surfaced during the OpenAI/xAI empty-completion diagnosis).
  - **Provider-side request validation** (fail-fast on Gemini grounding + function calling combination; usability follow-up).

---

## Per-scenario live-run gate matrix (2026-06-05)

| Provider | Model | Final text | Client tool | Server tool events | Continuation | Verdict |
|---|---|---|---|---|---|---|
| Anthropic | `claude-sonnet-4-6` | non-empty | 1 call | 1 (`web_search`) | accepted | **PASS** (regression check) |
| OpenAI | `gpt-5.1` (reasoning low) | 412 chars | 1 call | 0 (model didn't trigger) | accepted | **PASS** |
| xAI | `grok-4.3` (reasoning low) | 256 chars | 1 call | 2 (`web_search`) | accepted | **PASS** |
| Gemini | `gemini-2.5-flash` | 21 chars | 1 call | N/A | accepted | **PASS** |

**Gemini N/A gates (documented in the scenario):**
- "Server tool events emitted" — no server tools requested.
- "Server + client tool coexistence" — Gemini's API forbids the combination (HTTP 400 if attempted).

---

## Empirical safety net — the loop ran four times

The cluster is the canonical reference observation for the **"testbed surfaces wire-shape bug → library sub-stream fixes it → testbed re-runs"** empirical loop. Four iterations played out:

| Round | Surfaced by | Manifest | Root cause | Sub-stream that closed it |
|---|---|---|---|---|
| 1 | Copilot review on PR #453 (testbed scenarios) | OpenAI/Gemini/xAI continuation gate could not be live-verified | `executeClientToolTurn`'s switch forwarded `continuationMessages` only to the Anthropic adapter; OpenAI Responses + Gemini paths silently dropped them | **`ai-assist-cross-provider-continuation`** (PR #454) |
| 2 | Erik's first live run (Gemini) | HTTP 400 with `INVALID_ARGUMENT` — `additionalProperties` rejected | `toGeminiTools` emitted draft-07 schema with `additionalProperties: false`; Gemini's OpenAPI-3.0 subset rejects rather than ignores | **`ai-assist-cross-provider-fixes`** (PR #457, Gemini schema sanitization) |
| 3 | Erik's first live run (OpenAI / xAI) | Completed normally, zero visible events; could not infer cause without source inspection | `responsesCompletedPayload` validator discarded `incomplete_details.reason` | **`ai-assist-cross-provider-fixes`** (PR #457, `incompleteReason` capture) — armed the next iteration |
| 4 | Erik's second live run (OpenAI / xAI) with the `incompleteReason` diagnostic in place | Completed normally, `truncated: false`, `incompleteReason: undefined`, still empty | OpenAI Responses streams `function_call_arguments.{delta,done}` SSE events keyed only by `item_id`; adapter looked up by `call_id` and silently no-op'd. Also: `buildOpenAiContinuation` emitted optional `id` instead of required `call_id` on continuation function_call items | **`ai-assist-responses-reasoning-events`** (PR #458, item_id↔call_id correlation + continuation call_id + drift instrumentation) |

**The structural improvement at round 4 closes the loop's amplification cost going forward.** The drift-instrumentation `RECOGNIZED_*_EVENTS` allowlists turn the next round-N+1 bug (when it appears in a future provider-API evolution) from "silent drop requiring an empirical-detective process" into "warn in consumer logs the moment the wire carries an unknown event." Round 4's work covers both the immediate fix AND the structural future-proofing.

**This cluster's empirical loop is also the canonical L37 reference observation** (codified in PR #445). Each of the four bugs the live runs surfaced was invisible to 100%-coverage unit tests; the live-API gate was load-bearing. The closeout stream (PR #458) explicitly cites L37 in its retroactive analysis — Phase C of the original prior cluster reached 100% coverage on a test architecture that mocked the response side and never validated the request body. Round 4's `item_id ↔ call_id` correlation bug was the same class: tests passed against the assumption that `call_id` arrived on delta events, the live API said `item_id` only.

---

## Architectural decisions (locked across the four sub-streams)

| Decision | Locked by | Rationale |
|---|---|---|
| **OpenAI rawTail items appended verbatim, not projected** | PR #454 | OpenAI Responses items (`function_call` / `function_call_output`) are a `type`-keyed discriminated union whose fields differ per item; projecting to `{ role, content }` (Anthropic shape) would drop distinguishing fields |
| **Gemini rawTail items projected to `{ role, parts }`** | PR #454 | Gemini turns carry all payload in `parts`; the fixed structure makes projection sound. `parts` typed as `unknown[]` — `Array.isArray` cannot soundly assert a richer element type |
| **xAI inherits via `apiFormat: 'openai'`** | PR #454 + PR #458 | No separate xAI adapter; the OpenAI Responses path is the single fix site for both. Verified end-to-end through `executeClientToolTurn` |
| **`toGeminiParameterSchema` sanitizer is `@internal` and exported from `toolFormats.ts` not the packlet barrel** | PR #457 | Matches the existing `toGeminiTools`/`toAnthropicTools` pattern; tests import directly from the module |
| **Strips schema-keyword `additionalProperties` / `$schema` recursively, but preserves them when they appear as user-defined `properties` keys** | PR #457 (Copilot R1 finding) | A consumer could legitimately have a tool parameter named `additionalProperties`; the sanitizer must not corrupt that |
| **`incompleteReason` moves in lockstep with `truncated`** | PR #457 (Copilot R2 finding) | `truncated ? reason : undefined` — the field never leaks or goes stale under unexpected provider streams |
| **`item_id → call_id` map populated by `response.output_item.added` for function_call items** | PR #458 | The only event where `call_id` arrives; delta/done events look up via `item_id`. Validator updated to require `item_id`, drop optional `call_id` |
| **`buildOpenAiContinuation` emits `call_id` (required) not `id` (optional)** | PR #458 | OpenAI Responses API HTTP-400s without it — surfaced live the moment the adapter fix made function-call events flow through |
| **Drift instrumentation: per-stream dedup'd warn with shared `UNRECOGNIZED_EVENT_WARN_TAG` prefix + length-capped payload preview** | PR #458 (Copilot R1/R3 findings) | Stable tag enables consumer log filtering; payload preview enables triage without re-running under debugger; per-stream dedup prevents log spam |
| **Drift instrumentation NOT applied to Gemini** | PR #458 | Gemini's wire is JSON-chunk-shaped, not named SSE events; allowlist concept doesn't translate. Structural alternative deferred — see follow-up below |
| **Gemini scenario drops `web_search`** | PR #458 | Gemini's API forbids combining grounding with function calling (HTTP 400); the "coexistence" gate is provider-impossible, not library-buggy. Marked N/A |
| **Coverage exclusion regex** for live-API scenarios in `samples/testbed/config/jest.config.json` | PR #453 | Live-API CLI scenarios cannot be unit-tested without keys; coverage convention is "do not force 100% via mocking" |

---

## Dependencies + sequencing

- **`ai-assist-client-tools`** (cluster-closed 2026-06-04) — provided the `executeClientToolTurn` surface, the `IAiClientTool` typed-schema contract, and the canonical Anthropic scenario template. This cluster's scenarios mirror that template four-fold. The prior cluster's `findings/inbox/2026-06-04-continuation-message-wire-position.md` pre-declared the `IBuildMessagesOptions.rawTail` field anticipating PR #454's cross-provider extension — the design hook was already in place when this cluster commissioned the work.
- **`ts-prompt-assist-observability`** (in flight in parallel) — independent cluster; no scope overlap. Both happened to land Phase C-equivalent work on the same day.
- **PR #445 codification** (L37 — `code-reviewer` runs BEFORE 100%-coverage closure) — this cluster is the canonical reference observation, cited four separate times across the sub-streams' result.md files. PR #458's `item_id ↔ call_id` bug is the strongest single instance: tests passed because the fixture matched the (wrong) assumption; the live API said otherwise. L37 catches this class via the trigger "I'm about to chase 100% coverage" → run `code-reviewer` first; this cluster's adherence to that ordering across four sub-streams kept the iteration cost bounded.

---

## Sub-streams archived in this cluster's bucket

All four sub-streams' substrates live in `.ai/tasks/completed/2026-06/`:

- **`per-provider-testbed-scenarios/`** — the parent stream (this README + its own `brief.md` / `state.md` / `result.md` + `findings/inbox/` containing all four live-run findings)
- **`ai-assist-cross-provider-continuation/`** (PR #454) — extending continuation wire-forwarding from Anthropic-only to all four providers
- **`ai-assist-cross-provider-fixes/`** (PR #457) — Gemini schema sanitization + `incompleteReason` diagnostic capture
- **`ai-assist-responses-reasoning-events/`** (PR #458) — closeout: item_id↔call_id correlation + continuation call_id + provider-drift instrumentation + Gemini scenario fix

**Findings filed by the cluster (all closed or deferred):**

- `per-provider-testbed-scenarios/findings/inbox/2026-06-04-continuation-roundtrip-anthropic-only.md` — **CLOSED** (PR #454)
- `per-provider-testbed-scenarios/findings/inbox/2026-06-04-gemini-tool-schema-additionalproperties.md` — **CLOSED** (PR #457)
- `per-provider-testbed-scenarios/findings/inbox/2026-06-04-openai-xai-empty-completion.md` — **CLOSED** (PR #457 closed the diagnostic gap; PR #458 closed the root cause)
- `ai-assist-responses-reasoning-events/findings/inbox/2026-06-05-openai-continuation-missing-call_id.md` — **CLOSED** (PR #458, same PR that surfaced it)
- `ai-assist-responses-reasoning-events/findings/inbox/2026-06-05-gemini-drift-instrument-deferred.md` — **DEFERRED** (queued in `docs/FUTURE.md`)

---

## Followups (queued in `docs/FUTURE.md` or future streams)

- **Gemini-side drift instrumentation.** Gemini's JSON-chunk wire shape needs a different structural approach than the named-SSE-event allowlist. Sketch in the deferred finding; commission when a real-world Gemini API evolution surfaces a gap, OR proactively if symmetric self-diagnosing posture is wanted across all three adapters.
- **Library default `max_output_tokens` for reasoning models.** Surfaced during the OpenAI/xAI empty-completion diagnosis — a usability gap (naive consumers can silently truncate). Not a bug per se; queued as usability work.
- **Provider-side request validation** — fail-fast on known provider-impossible combinations (e.g. Gemini grounding + function calling) with actionable error messages. Quality-of-life improvement; the current behavior (HTTP 400 with provider's error) isn't silent corruption.
- **Caller-visible thinking-content events.** Separate `ai-assist-thinking-events` followup stream. Current adapters discard thinking content by design; this stream's drift instrumentation explicitly skips reasoning events as "intentionally silent." Surfacing them is a separate scope decision.
- **Cross-provider generic-version-alias library surface.** Companion concern named in the original FUTURE.md entry. Each provider's SDK has different alias conventions (Anthropic accepts `claude-sonnet-4-6` directly; OpenAI different). Research + design needed before committing implementation.

---

## Files at archive time

- `brief.md` — original cluster brief
- `state.md` — phase-by-phase tracking
- `result.md` — what shipped, files changed, gate matrix
- `findings/inbox/` — the three live-run findings (all closed)
- `README.md` — this file (the polished archive entry per L5 codification)

The three companion sub-streams (`ai-assist-cross-provider-continuation/`, `ai-assist-cross-provider-fixes/`, `ai-assist-responses-reasoning-events/`) carry their own briefs/state/results, plus the closeout stream carries the two 2026-06-05 findings.
