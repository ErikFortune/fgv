# `ai-assist-cross-provider-fixes` — stream brief

**Status:** ready to commission
**Workflow shape:** `stream` — well-specified library fixes; no design exploration needed
**Parent cluster:** `per-provider-testbed-scenarios`
**Integration branch (shared with cluster):** `per-provider-testbed-scenarios`

---

## Why this stream exists

The `per-provider-testbed-scenarios` cluster's live runs surfaced two more wire-shape / diagnostic issues in `@fgv/ts-extras/ai-assist` beyond the continuation-forwarding gap PR #454 already fixed:

1. **Gemini client tools 400 with `INVALID_ARGUMENT`** — `toGeminiTools` emits `additionalProperties: false` in `function_declarations[*].parameters` (the natural output of `JsonSchema.object(...).toJson()`, which is strict-by-default). Gemini's function-declaration schema is an OpenAPI 3.0 subset that **does not recognize** `additionalProperties` and rejects the whole payload rather than ignoring the unknown key. **Client tools are completely non-functional on Gemini.**
2. **OpenAI / xAI scenarios complete with no visible answer** — leading hypothesis is `status: 'incomplete'` truncation (reasoning + server-tool steps consuming the output-token budget). The library already captures `truncated` at the `done` event but **discards `incomplete_details.reason`** — so the failure mode is invisible to the consumer without source inspection.

The full diagnoses live on the testbed agent's branch (`claude/magical-newton-S53ZO`):
- `.ai/tasks/active/per-provider-testbed-scenarios/findings/inbox/2026-06-04-gemini-tool-schema-additionalproperties.md`
- `.ai/tasks/active/per-provider-testbed-scenarios/findings/inbox/2026-06-04-openai-xai-empty-completion.md`

Read both before implementing.

---

## Mission

Land two additive `@fgv/ts-extras/ai-assist` fixes that close the cluster's outstanding library-side gaps so the testbed scenarios reach clean live-run PASS on the next rebase:

1. **Sanitize the Gemini function-declaration parameters schema** in `toGeminiTools` so any `JsonSchema`-authored client tool works on Gemini without consumer awareness of the dialect difference.
2. **Capture `incomplete_details.reason`** in `responsesCompletedPayload` and surface it on the `done` event so "completed but empty" failures (OpenAI / xAI scenarios today, and future similar cases) self-explain.

Both are additive, scoped, and parallel the minimum-additive shape of PR #454.

---

## What's NOT in this stream

- **OpenAI / xAI scenario-side `max_output_tokens`** — IF the re-run after this stream lands confirms `truncated: true`, the scenarios add `otherParams: { max_output_tokens: <N> }`. That's a testbed-scope change, lives in PR #453's resume scope, not here.
- **Default `max_output_tokens` for reasoning models** in the OpenAI Responses adapter — usability call (consumer that opts into thinking should get a reasonable budget by default). Defer to a FUTURE.md entry; not in this stream's scope.
- **Deeper OpenAI / xAI root-cause investigation** — IF the re-run shows `truncated: false`, a new finding spawns a separate stream. Don't pre-commission.
- **Other ai-assist bugs.** This stream's scope is the two named bugs only; scope cap is explicit per L35.

---

## Package surface

| Path | May modify |
|------|---|
| `libraries/ts-extras/src/packlets/ai-assist/toolFormats.ts` (`toGeminiTools`) | ✅ — add a `toGeminiParameterSchema` recursive sanitizer + use it at the client-tool case (~line 229) |
| `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/openaiResponses.ts` (`responsesCompletedPayload`) | ✅ — capture `incomplete_details.reason`; thread it to the done event |
| `libraries/ts-extras/src/packlets/ai-assist/model.ts` (or wherever the streaming `done` event type lives) | ✅ — add an optional `incompleteReason?` (or similar) field to the done event type |
| `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/anthropic.ts` | ⚠️ read-only |
| `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/gemini.ts` | ⚠️ read-only (unless wiring the done-event change requires touching it parallel-symmetrically; if so, keep it cosmetic) |
| `libraries/ts-extras/src/test/unit/ai-assist/**` | ✅ — add tests for both fixes |
| `libraries/ts-extras/etc/ts-extras.api.md` | ✅ — regenerate; commit |
| `samples/testbed/**` | ❌ — scenarios stay paused on PR #453 |
| Anything else | ❌ |

---

## Fix 1: Gemini parameters schema sanitization

**Location:** `toolFormats.ts` in `toGeminiTools`, the `case 'client_tool':` arm (currently lines ~216–230).

**Current shape:**
```ts
case 'client_tool':
  functionDeclarations.push({
    name: t.name,
    description: t.description,
    parameters: t.parametersSchema.toJson()
  } as JsonObject);
  break;
```

**Required change:** introduce a `toGeminiParameterSchema(schema: JsonValue): JsonValue` helper that **recursively** strips `additionalProperties` (the confirmed P1 trigger) and `$schema` (defensive — draft-07 `.toJson()` may emit it). Recursion must cover `properties[*]`, `items`, and any other nested-schema fields the LLM-tool subset uses. Apply at the client-tool case:

```ts
parameters: toGeminiParameterSchema(t.parametersSchema.toJson())
```

**Sketch from the finding:**

```ts
function toGeminiParameterSchema(schema: JsonValue): JsonValue {
  if (Array.isArray(schema)) {
    return schema.map(toGeminiParameterSchema);
  }
  if (schema !== null && typeof schema === 'object') {
    const out: JsonObject = {};
    for (const [k, v] of Object.entries(schema)) {
      if (k === 'additionalProperties' || k === '$schema') {
        continue;
      }
      out[k] = toGeminiParameterSchema(v);
    }
    return out;
  }
  return schema;
}
```

Helper is `@internal` (do not export from the packlet barrel). Implement per `@fgv/*` conventions: returns a normal value (not `Result`) since stripping fields is infallible.

**Tests:**

- Author a `JsonSchema.object({ ... })` parameters schema with a nested object property. Pass it through a `toGeminiTools` call. Assert the emitted Gemini function declaration's `parameters` has **no `additionalProperties` at any nesting level** (top-level + nested object's). Walk the emitted JSON to verify.
- Author a parameters schema where `.toJson()` would emit `$schema`. Assert stripped.
- Sanity test: a schema that contains **none** of the stripped keys is passed through unchanged (deep equality).

---

## Fix 2: capture `incomplete_details.reason` in OpenAI Responses

**Location:** `openaiResponses.ts` — `responsesCompletedPayload` validator + the `done` event emit site.

**Current state (from the finding):** `responsesCompletedPayload` (`openaiResponses.ts:162`-ish) currently extracts only `response.status`. The OpenAI Responses API delivers an `incomplete_details: { reason: string }` field on the completed payload when `status === 'incomplete'`. The reason values include `max_output_tokens`, `content_filter`, etc.

**Required change:**

1. Extend `responsesCompletedPayload` to optionally extract `incomplete_details.reason` as an optional string. Keep the validator infallible (if absent, the field is undefined; the validator doesn't fail).
2. Add an optional field to the done-event shape (probably on `IAiStreamDone` in `model.ts` — name TBD; suggested: `incompleteReason?: string`). Document the field — it is only meaningful when `truncated === true`. Mark `@public`.
3. Thread the captured value from the validator to the done event emit site.

**Tests:**

- Mock a Responses stream whose `response.completed` payload carries `status: 'incomplete'` + `incomplete_details: { reason: 'max_output_tokens' }`. Assert the emitted done event carries `truncated: true` AND `incompleteReason: 'max_output_tokens'`.
- Mock the same with `status: 'completed'` (no `incomplete_details`). Assert `truncated: false` AND `incompleteReason` is undefined.
- Mock `status: 'incomplete'` without `incomplete_details` present (defensive). Assert `truncated: true` AND `incompleteReason` is undefined (do not throw).

---

## L37 reminder (load-bearing)

`code-reviewer` agent runs on the cumulative diff **BEFORE** chasing 100% measured coverage. Sequence: scenario-driven functional tests (the tests sketched above) → `code-reviewer` pass → coverage-gap closure. Trigger for code-reviewer is "I'm about to run `rushx coverage` to identify gaps to close." Reference observation: `.ai/tasks/completed/2026-06/ai-assist-client-tools/README.md` — that cluster reached 100% on a test architecture that mocked the response side and never validated the request body. Don't repeat it. Your tests for Fix 1 must inspect the **emitted Gemini function declaration JSON**, not the call-success path.

---

## Acceptance criteria

- [ ] `toGeminiTools` emits Gemini function declarations whose parameters carry no `additionalProperties` and no `$schema` at any nesting level, for any `JsonSchema`-authored client tool.
- [ ] `responsesCompletedPayload` captures `incomplete_details.reason` (when present).
- [ ] Done event surfaces `incompleteReason` (or chosen field name) for OpenAI Responses streams. `@public` documented.
- [ ] No behavior changes to:
  - Anthropic continuation forwarding.
  - Gemini continuation forwarding (the `rawTail` plumbing PR #454 landed).
  - OpenAI Responses continuation forwarding.
  - Any non-Gemini provider's `tools[]` emission.
- [ ] `rushx build` PASS in `@fgv/ts-extras`.
- [ ] `rushx lint` PASS (no warnings).
- [ ] `rushx test` PASS with 100% coverage in `@fgv/ts-extras`.
- [ ] `rushx fixlint` run before final commit.
- [ ] `code-reviewer` agent run on the final diff **BEFORE** 100%-coverage closure (L37). Findings resolved or dispositioned.
- [ ] `etc/ts-extras.api.md` regenerated; committed. (`incompleteReason` is a public-surface addition; the diff should be exactly that one field.)
- [ ] PR opens against the `per-provider-testbed-scenarios` integration branch (NOT `release`).
- [ ] Both finding docs (`2026-06-04-gemini-tool-schema-additionalproperties.md`, `2026-06-04-openai-xai-empty-completion.md`) updated with the disposition (Gemini: RESOLVED via this PR + squash SHA; OpenAI/xAI: diagnostic gap addressed; root-cause confirmation step still pending the testbed agent's re-run on PR #453).

---

## Exit artifact shape

- `state.md` — phase-by-phase progress + decisions
- `result.md` — what shipped, files changed, code-reviewer pass summary

Artifact migration is the cluster-close PR's job (per the PR #452 codification), not this stream's.

---

## Branching

This stream **shares the `per-provider-testbed-scenarios` integration branch** with PR #453 and the (already merged) PR #454. Per L35's single-commit-per-cluster principle.

- **Integration branch:** `per-provider-testbed-scenarios` (already created; this brief lives there).
- **Agent's work branch:** fork off the integration branch — `chore/ai-assist-cross-provider-fixes-impl` (or whatever the agent prefers).
- **PR target:** `per-provider-testbed-scenarios` (integration — NOT `release`).
- **Cluster-close PR:** opened by the orchestrator after this stream merges AND PR #453 reaches its live-verification gate. Squash to `release`.

After this stream's PR merges onto integration:
- PR #453 rebases onto the new integration HEAD.
- Testbed agent (or user) re-runs OpenAI / Gemini / xAI scenarios live with keys.
- Gemini scenario should pass the previously-400 round-trip on the request side; PASS/FAIL status comes from the live response.
- OpenAI / xAI rerun confirms the leading hypothesis via the new `incompleteReason` field on the done event.

---

## Resume protocol

Standard: read `state.md`, resume at the next phase boundary.
