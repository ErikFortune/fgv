# `ai-assist-cross-provider-fixes` — state

**Stream:** `ai-assist-cross-provider-fixes`
**Parent cluster:** `per-provider-testbed-scenarios`
**Integration branch (shared with cluster):** `per-provider-testbed-scenarios`
**Work branch:** `chore/ai-assist-cross-provider-fixes-impl`
**Status:** implementation complete — gates green, PR open against integration

---

## Phases

### Phase 1 — Read surface
- [x] Read the Gemini `additionalProperties` finding on `claude/magical-newton-S53ZO`
- [x] Read the OpenAI/xAI empty-completion finding on `claude/magical-newton-S53ZO`
- [x] Read `toGeminiTools` + `JsonSchema.object(...).toJson()` output shape
- [x] Read `responsesCompletedPayload` + the `done` event emit site

### Phase 2 — Fix 1 (Gemini schema sanitization)
- [x] Add `toGeminiParameterSchema(schema)` recursive sanitizer (`@internal`, exported from module not barrel)
- [x] Wire into `toGeminiTools`'s `case 'client_tool':` arm
- [x] Unit test: nested-object schema → emitted Gemini declaration has no `additionalProperties` at any nesting level (+ full-shape `toEqual`)
- [x] Unit test: schema with `$schema` → stripped
- [x] Unit test: schema without any stripped keys → passed through unchanged
- [x] Unit test: arrays, primitives, passthrough

### Phase 3 — Fix 2 (incomplete_details.reason capture)
- [x] Extend `responsesCompletedPayload` to capture `incomplete_details.reason`
- [x] Add optional `incompleteReason?: string` to `IAiStreamDone` in `model.ts`. `@public`
- [x] Thread captured value to done event emit site
- [x] Unit tests: status=incomplete + reason; status=completed (no reason); status=incomplete without details

### Phase 4 — Code review + coverage closure
- [x] `code-reviewer` agent run on the cumulative diff BEFORE chasing 100% coverage (L37)
- [x] Findings resolved or dispositioned (P2 full-shape assertion added; P3 `if (payload)` guard refactor applied)
- [x] 100% coverage closed
- [x] `rushx fixlint` run (no changes)

### Phase 5 — Final gates + PR
- [x] `rushx build` PASS
- [x] `rushx lint` PASS (no warnings)
- [x] `rushx test` PASS with 100% coverage
- [x] `etc/ts-extras.api.md` regenerated and committed (diff: one new `incompleteReason?` field)
- [x] PR opens against `per-provider-testbed-scenarios` integration branch
- [~] Finding docs updated with disposition — see Decisions: docs live on `claude/magical-newton-S53ZO`, not on integration; disposition recorded in `result.md` + PR description instead of cross-branch edit
- [ ] Copilot loop driven; stopped on diminishing returns or 10-round cap

---

## Decisions made

- **Sanitizer exported from `toolFormats.ts` module, not the packlet barrel.** `@internal` tag keeps it out of `.api.md`; the test imports it directly from `../../../packlets/ai-assist/toolFormats`, matching the existing pattern for `toGeminiTools`/`toAnthropicTools`. This lets the `$schema`-strip + primitive/array passthrough cases be unit-tested directly while the `additionalProperties` recursion is also verified end-to-end through `toGeminiTools`.
- **`incompleteReason?: string` chosen as the field name** (per brief's suggested name). Documented as meaningful only when `truncated === true`; populated only by the OpenAI/xAI Responses adapter.
- **P3 coverage disposition: adopted the `if (payload)` guard refactor** (code-reviewer's design simplification) rather than a second isolated `c8 ignore`. Collapses both `payload?.` optional-chain null branches under the single existing directive; cleaner defensive intent. Result: openaiResponses.ts back to 100% with no added directive.
- **Finding-doc disposition not written to the testbed agent's branch.** The two finding docs live on `claude/magical-newton-S53ZO` under `per-provider-testbed-scenarios/findings/inbox/` — they are not present on the integration branch this stream forks from. Editing another branch's tree is out of this stream's declared surface. Disposition is recorded in `result.md` and the PR description; the cluster-close PR (or the testbed agent on rebase) folds it into the finding docs with the squash SHA.

---

## Follow-up findings filed

(none)
