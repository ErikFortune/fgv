# `ai-assist-cross-provider-fixes` — result

**Stream:** `ai-assist-cross-provider-fixes`
**Parent cluster:** `per-provider-testbed-scenarios`
**Work branch:** `chore/ai-assist-cross-provider-fixes-impl`
**PR target:** `per-provider-testbed-scenarios` (integration — NOT `release`)

---

## What shipped

Two additive `@fgv/ts-extras/ai-assist` fixes, both in one PR.

### Fix 1 — Gemini function-declaration schema sanitization

`JsonSchema.object(...).toJson()` is strict-by-default and emits `additionalProperties: false` on every object node. Gemini's `function_declarations[].parameters` is an OpenAPI 3.0 Schema Object subset that **rejects** (does not ignore) `additionalProperties`, so every `JsonSchema`-authored client tool 400'd on Gemini.

- New `@internal` helper `toGeminiParameterSchema(schema: JsonValue): JsonValue` — recursively strips `additionalProperties` (the confirmed P1 trigger) and `$schema` (defensive). Recurses through arrays and object values, so nested object schemas are sanitized at every level. Infallible → returns a plain value, no `Result`.
- Applied at the `case 'client_tool':` arm of `toGeminiTools`.
- Exported from the module (not the packlet barrel) so it stays out of `.api.md` while remaining unit-testable.

**Files:**
- `libraries/ts-extras/src/packlets/ai-assist/toolFormats.ts:26` — added `JsonValue` import.
- `libraries/ts-extras/src/packlets/ai-assist/toolFormats.ts:205-237` — new `toGeminiParameterSchema` helper.
- `libraries/ts-extras/src/packlets/ai-assist/toolFormats.ts:266` — wired into the client-tool case.

### Fix 2 — capture `incomplete_details.reason` on the done event

The OpenAI/xAI Responses `response.completed` payload carries `incomplete_details: { reason }` when `status === 'incomplete'`. The adapter already reported `truncated` but discarded the reason, making the "completed but empty" failure mode invisible.

- Extended `IResponsesCompletedPayload` + `responsesCompletedPayload` validator to optionally capture `incomplete_details.reason` (infallible — absent → undefined).
- Threaded the captured value to the `done` event.
- New `@public` optional field `incompleteReason?: string` on `IAiStreamDone`, documented as meaningful only when `truncated === true`.

**Files:**
- `libraries/ts-extras/src/packlets/ai-assist/model.ts:571-579` — new `incompleteReason?` field + TSDoc.
- `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/openaiResponses.ts:107-112` — payload interface.
- `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/openaiResponses.ts:165-179` — validator (`responsesIncompleteDetails` + extended `responsesCompletedPayload`).
- `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/openaiResponses.ts:214,292-297,310` — local capture + threading to the done event.

### Public-surface diff (exactly one field)

```diff
 interface IAiStreamDone {
     readonly fullText: string;
+    readonly incompleteReason?: string;
     readonly truncated: boolean;
     readonly type: 'done';
 }
```

`etc/ts-extras.api.md` regenerated and committed.

---

## Tests

- `toolFormats.test.ts`:
  - 3 existing `toGeminiTools` client-tool structural tests updated to expect Gemini-sanitized params (explicit, non-circular fixtures).
  - New `toGeminiTools` tests: strips `additionalProperties` top-level; strips at every nesting level (negative assertions + full-shape `toEqual`).
  - New `toGeminiParameterSchema` direct tests: recursive strip through properties/items; `$schema` strip; array-nested nodes; clean-schema passthrough (deep equality); primitives unchanged.
- `streamingAdapters.test.ts` — 3 new tests on the actual emitted done event:
  - `status: 'incomplete'` + `incomplete_details.reason: 'max_output_tokens'` → `truncated: true`, `incompleteReason: 'max_output_tokens'`.
  - `status: 'completed'` → `truncated: false`, `incompleteReason: undefined`.
  - `status: 'incomplete'` without `incomplete_details` → `truncated: true`, `incompleteReason: undefined` (no throw).

Per L37: Fix 1 tests inspect the **emitted Gemini function-declaration JSON**, not a call-success path.

---

## code-reviewer pass summary

Run on the cumulative diff **before** coverage-gap closure (L37). No P1. Findings:

- **P2 — nested-tool Gemini test asserted property-absence but not full shape.** Resolved: added an explicit `nestedGeminiParams` fixture + `toEqual` so an accidental drop of a non-targeted key is caught.
- **P3 — coverage directive at `openaiResponses.ts:294`.** Reviewer offered an `if (payload)` guard refactor that collapses both `payload?.` optional-chain null branches under the single existing directive. Adopted (cleaner defensive intent; no second isolated `c8 ignore`).
- **P3 — `incompleteReason` doc accuracy.** Reviewer confirmed accurate against the implementation; no change.
- Other P3 (test early-return pattern, `@internal` placement) — confirmed consistent with existing file conventions; no action.

Recommendation: Approved with advisory; advisories actioned.

---

## Gates

- `rushx build` — PASS
- `rushx lint` — PASS (no warnings)
- `rushx test` — PASS, **100% coverage** (statements/branches/functions/lines) in `@fgv/ts-extras`
- `rushx fixlint` — run before final commit (no changes)
- `etc/ts-extras.api.md` — regenerated, committed

---

## Finding-doc disposition

The two finding docs live on the testbed agent's branch `claude/magical-newton-S53ZO`, not on the integration branch this stream forks from, so they were not edited cross-branch (out of declared surface). Dispositions for the cluster-close PR / testbed agent to fold in on rebase:

- **`2026-06-04-gemini-tool-schema-additionalproperties.md` → RESOLVED** by this PR. `toGeminiTools` now sanitizes the client-tool parameters schema via `toGeminiParameterSchema`, stripping `additionalProperties`/`$schema` at every nesting level. The `gemini-client-tools` scenario's previously-400 request-side round-trip is now clean; PASS/FAIL awaits the live response on PR #453's rebase + re-run. (Squash SHA TBD at cluster-close.)
- **`2026-06-04-openai-xai-empty-completion.md` → DIAGNOSTIC GAP ADDRESSED.** The done event now surfaces `incompleteReason` so the "completed but empty" class self-explains. Root-cause confirmation (budget exhaustion vs. genuine adapter gap) still pending the testbed agent's live re-run reading `truncated` + `incompleteReason` on PR #453.

---

## Out of scope (per brief, untouched)

- No testbed/scenario edits (PR #453 stays paused).
- No default `max_output_tokens` for reasoning models (deferred to FUTURE.md by the brief).
- No deeper OpenAI/xAI root-cause work (spawns a separate stream only if the re-run shows `truncated: false`).
