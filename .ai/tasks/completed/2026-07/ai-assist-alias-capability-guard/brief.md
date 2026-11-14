# Stream brief — `ai-assist-alias-capability-guard`

Recorded verbatim from the orchestrator kickoff (2026-07-31).

## Branch

`ai-assist-alias-capability-guard`, branched from `origin/release`.

> Brief stated base `b689c99ca`; at fetch time `origin/release` was `fbb08cd55`
> (one commit ahead — a rush-shim lockfile repair, #575). Branched from
> `origin/release` per the instruction; noted in `state.md`.

## Context (verified by the orchestrator)

PersonAIlity (a consumer) reported that `AiAssist.resolveImageCapability` matches raw
model-id prefixes with no alias resolution and no `MODEL_ALIAS_SIGIL` guard. The
orchestrator confirmed it by execution and found it is WORSE than reported, and that a
sibling function has the same flaw.

The exported capability resolvers live in
`libraries/ts-extras/src/packlets/ai-assist/registry.ts`:

- `resolveImageCapability(descriptor, modelId)` — filters `descriptor.imageGeneration` by
  `modelId.startsWith(cap.modelPrefix)`, longest prefix wins.
- `resolveEmbeddingCapability(descriptor, modelId)` — identical shape over
  `descriptor.embedding`.

Because every provider declares a catch-all rule with `modelPrefix: ''`, an unresolved fgv
alias (a string starting with `MODEL_ALIAS_SIGIL`, i.e. `'@'`) matches the catch-all and
returns a **confidently wrong capability** rather than failing or returning undefined.
Reproduced on `release`:

| Provider | Alias passed in | Capability returned | Correct capability (from concrete id) |
|---|---|---|---|
| `openai` | `@openai:image` | `{modelPrefix:'', outputParamStyle:'response-format'}` | `{modelPrefix:'gpt-image-', acceptsImageReferenceInput:true, outputParamStyle:'output-format'}` |
| `xai-grok` | `@xai-grok:imagine` | `{format:'xai-images', acceptsImageReferenceInput:false}` | `{format:'xai-images-edits', acceptsImageReferenceInput:true}` |
| `openai` (embedding) | `@openai:embedding` | `{modelPrefix:''}` | `{modelPrefix:'text-embedding-3', supportsDimensions:true, maxBatchSize:2048}` |
| `google-gemini` | `@google-gemini:flash-image` | (no mismatch — single catch-all rule) | same |

Note the xAI row flips the **wire format** and `acceptsImageReferenceInput`; the embedding
row silently drops `supportsDimensions` and the `maxBatchSize` guard. A consumer branching
on these builds a wrong request.

**The library's own paths are already safe** — `apiClient.ts` resolves the alias via
`resolveProviderModel` (~line 1336) BEFORE calling `resolveImageCapability` (~line 1341).
Do not "fix" that; verify it and leave it. The hazard is exclusively for consumers calling
the exported helpers directly, which is what they are exported for.

**In-repo instance to fix:** `samples/testbed/src/scenarios/imageGeneration/index.tsx`.
`defaultModelFor()` (~line 45) returns `AiAssist.resolveModel(descriptor.defaultModel, 'image')`,
which yields the ALIAS form (e.g. `'@openai:image'`), and that value is fed to
`AiAssist.resolveImageCapability` (~line 89). Result: wrong capability for the OpenAI and
xAI defaults, which suppresses the "use as reference" affordance and offers wrong
size/quality options.

## Scope

**1. Guard both capability resolvers (the core fix).** Decide between two designs and
justify the choice:

- (a) **Fail loudly** on a sigil-prefixed id — returning `undefined` is NOT acceptable
  because `undefined` already means "no rule matched". Consider changing the return to
  `Result<T>`, but that is a BREAKING signature change on an established export.
- (b) **Resolve the alias first** inside the helper (it already receives the `descriptor`,
  which carries `aliases`), so passing either form works.

The orchestrator's lean is toward a design where an unresolved alias cannot silently
produce a wrong answer. The chosen design must make the wrong-capability outcome
impossible, and must not change behavior for concrete (non-alias) ids.

**2. Fix the testbed call site** so the scenario resolves the correct capability for
OpenAI and xAI defaults. Consider whether `defaultModelFor` should return the concrete id
(via `resolveProviderModel`) rather than the alias — the value is also displayed in the UI
and used as the `model` in settings. Add/extend tests that would have caught the
wrong-capability outcome.

**3. TSDoc for the adjacent ask (A).** Add a `@remarks` block to `resolveProviderModel` and
a note on `ModelSpecKey` (both in `libraries/ts-extras/src/packlets/ai-assist/model.ts`)
recording that `tools` and `thinking` are deliberately NOT model selectors. Doc-only — do
not add a `'tools'` key.

## Files this stream may modify

- `libraries/ts-extras/src/packlets/ai-assist/registry.ts`
- `libraries/ts-extras/src/packlets/ai-assist/model.ts` — **TSDoc only**
- `libraries/ts-extras/src/test/unit/ai-assist/**`
- `libraries/ts-extras/etc/ts-extras.api.md` (regenerated)
- `common/changes/@fgv/ts-extras/*.json`
- `samples/testbed/src/scenarios/imageGeneration/**` and its tests under `samples/testbed/src/test/`
- `.ai/tasks/active/ai-assist-alias-capability-guard/**`

## Files this stream must NOT touch

- `libraries/ts-extras/src/packlets/ai-assist/jsonResponse.ts` + tests — `ai-assist-fenced-json-diagnostics`
- `libraries/ts-agent-memory/**` — `agent-memory-provenance-contract-doc`
- `docs/WORKSTREAMS.md` — orchestrator-owned
- `libraries/ts-extras/src/packlets/ai-assist/apiClient.ts` — verify only

Both sibling streams also regenerate `etc/ts-extras.api.md`; that conflict is expected and
the orchestrator resolves it at integration by rebuilding.

## Acceptance criteria

- [ ] `rushx build` passes in every modified package
- [ ] `rushx lint` passes in every modified package
- [ ] `rushx test` passes with 100% coverage in every modified package
- [ ] `rushx fixlint` run before the final commit
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] Scenario-driven tests BEFORE chasing measured coverage; `code-reviewer` on the diff
      BEFORE the coverage-closure pass
- [ ] `code-reviewer` agent run on the final diff; findings resolved or dispositioned
- [ ] Rush change file added
- [ ] `etc/ts-extras.api.md` regenerated and committed
- [ ] A test exists that fails against the pre-fix behavior

## Deliverable

Commit, push, open a PR targeting `release`. Do NOT merge. Report the PR number, the
design choice, and any surprising finding.
