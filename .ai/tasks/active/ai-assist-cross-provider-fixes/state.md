# `ai-assist-cross-provider-fixes` — state

**Stream:** `ai-assist-cross-provider-fixes`
**Parent cluster:** `per-provider-testbed-scenarios`
**Integration branch (shared with cluster):** `per-provider-testbed-scenarios`
**Status:** commissioned 2026-06-05 — awaiting agent kickoff

---

## Phases

### Phase 1 — Read surface
- [ ] Read the Gemini `additionalProperties` finding on `claude/magical-newton-S53ZO`
- [ ] Read the OpenAI/xAI empty-completion finding on `claude/magical-newton-S53ZO`
- [ ] Read `toGeminiTools` + `JsonSchema.object(...).toJson()` output shape
- [ ] Read `responsesCompletedPayload` + the `done` event emit site

### Phase 2 — Fix 1 (Gemini schema sanitization)
- [ ] Add `toGeminiParameterSchema(schema)` recursive sanitizer
- [ ] Wire into `toGeminiTools`'s `case 'client_tool':` arm
- [ ] Unit test: nested-object schema → emitted Gemini declaration has no `additionalProperties` at any nesting level
- [ ] Unit test: schema with `$schema` → stripped
- [ ] Unit test: schema without any stripped keys → passed through unchanged

### Phase 3 — Fix 2 (incomplete_details.reason capture)
- [ ] Extend `responsesCompletedPayload` to capture `incomplete_details.reason`
- [ ] Add optional `incompleteReason?` (or chosen name) to the done event type in `model.ts`. `@public`
- [ ] Thread captured value to done event emit site
- [ ] Unit tests: status=incomplete + reason; status=completed (no reason); status=incomplete without details

### Phase 4 — Code review + coverage closure
- [ ] `code-reviewer` agent run on the cumulative diff BEFORE chasing 100% coverage (L37)
- [ ] Findings resolved or dispositioned
- [ ] 100% coverage closed
- [ ] `rushx fixlint` run

### Phase 5 — Final gates + PR
- [ ] `rushx build` PASS
- [ ] `rushx lint` PASS (no warnings)
- [ ] `rushx test` PASS with 100% coverage
- [ ] `etc/ts-extras.api.md` regenerated and committed (expected diff: one new `incompleteReason?` field on the done event type)
- [ ] PR opens against `per-provider-testbed-scenarios` integration branch
- [ ] Finding docs updated with disposition
- [ ] Copilot loop driven; stopped on diminishing returns or 10-round cap

---

## Decisions made

(empty — agent records architectural decisions here)

---

## Follow-up findings filed

(empty — agent files findings in `findings/inbox/<YYYY-MM-DD>-<topic>.md`)
