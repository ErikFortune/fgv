# Stream brief — `ai-assist-fenced-json-diagnostics`

Priority: **P3 / opportunistic** — no consumer is blocked.

## Problem

PersonAIlity reports that when an LLM returns malformed JSON, a
**property-name-position** parse failure surfaces the bare `JSON.parse` engine
message with no typed reason, no offending token, and no offset. Four cases are
indistinguishable to a caller:

1. unquoted key — `{ key: 1 }`
2. single-quoted key — `{ 'key': 1 }`
3. unterminated name — `{ "key: 1 }`
4. elision — `{ , "key": 1 }` / `{ "a":1, , "b":2 }`

They want opposite handling per case: some are cheaply repairable, some warrant
a re-prompt, some should fail outright. Today they cannot branch.

**Scoping note the consumer got right:** PR #573 added a truncation-aware
message for an ADJACENT case — a structure that opened but never closed. That
fires in the extractor (`findBalancedJsonSubstring`) BEFORE `JSON.parse` and
does not touch the property-name-position case. Do not conflate; preserve
existing truncation behavior exactly.

## Scope

Add a typed failure reason to the JSON-parse path carrying at minimum:
- a discriminated `kind` covering the four cases plus a catch-all,
- the offending token/character where determinable,
- the offset/position where determinable.

Design constraints:
- Follow the `found`/`unclosed`/`none` discriminated-result precedent in
  `jsonResponse.ts`.
- Do NOT regress the #573 truncation message or the generic "no JSON-shaped
  substring found" message.
- Classification must be **conservative** — fall back to the catch-all rather
  than guessing. A confident wrong classification is worse than an honest
  unknown.
- Do NOT build the classifier by scraping `error.message` if the case is
  determinable structurally from input + offset (V8 message formats vary across
  Node versions).
- `@public`-documented, appears in the API report, additive only.

## Files in scope

- `libraries/ts-extras/src/packlets/ai-assist/jsonResponse.ts`
- `libraries/ts-extras/src/packlets/ai-assist/index.ts` (new export only)
- `libraries/ts-extras/src/test/unit/ai-assist/**`
- `libraries/ts-extras/etc/ts-extras.api.md` (regenerate)
- `common/changes/@fgv/ts-extras/*.json`
- `.ai/tasks/active/ai-assist-fenced-json-diagnostics/**`

## Files out of scope (parallel streams own these)

- `ai-assist/registry.ts`, `ai-assist/model.ts` (`ai-assist-alias-capability-guard`)
- `ai-assist/apiClient.ts`
- `samples/testbed/**`
- `libraries/ts-agent-memory/**`
- `docs/WORKSTREAMS.md`

Sibling streams also regenerate `etc/ts-extras.api.md`; that conflict is
expected and the orchestrator resolves it at integration by rebuilding.

## Acceptance criteria

- [ ] `rushx build` / `rushx lint` / `rushx test` pass with 100% coverage in `libraries/ts-extras`
- [ ] `rushx fixlint` run before the final commit
- [ ] No `any`; fallible operations return `Result<T>`
- [ ] Each of the four named cases has a test asserting its distinct typed reason
- [ ] A test asserts the #573 truncation case is UNCHANGED, and one asserts the generic no-JSON case is UNCHANGED
- [ ] `@fgv/ts-prompt-assist` still builds
- [ ] Scenario-driven tests BEFORE chasing measured coverage; `code-reviewer` BEFORE the coverage-closure pass
- [ ] `code-reviewer` run on the final diff; findings resolved or dispositioned
- [ ] Rush change file added; `etc/ts-extras.api.md` regenerated

## Deliverable

Commit, push, open a PR targeting `release`. Do NOT merge.
