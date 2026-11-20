# Stream brief — `ai-assist-thinking-anchoring`

**Status:** 🟢 ready
**Branch base:** `release` HEAD
**Package surface:** `@fgv/ts-extras/ai-assist` — `model.ts`, `registry.ts`,
`thinkingOptionsResolver.ts`, `completionClient.ts`, `streamingClient.ts`,
`etc/ts-extras.api.md`, plus the ai-assist tests under
`src/test/unit/ai-assist/`
**Out-of-scope:** `@fgv/ts-app-shell` (its ai-assist packlet consumes responses,
not descriptors); the `ai-assist-thinking-events` stream's surface (streaming
event shapes, `thinking?: string` on the response, token accounting); every
other packlet in `ts-extras`
**Artifact pointer:** `.ai/tasks/active/ai-assist-thinking-anchoring/`

---

## Mission

Thinking config in `ai-assist` bundles three separable things, and two of them
are anchored wrong. Fix the two that are cheap and unambiguous: remove a
per-provider availability field that nothing reads, and close the one hole in
the generic effort vocabulary that forces callers into per-provider blocks to
express "off".

## Where this came from

A consumer (PersonAIlity) rolled forward to newer models and found chat
noticeably slower, and asked whether the library was pinning thinking to a high
effort. It is not — `resolvedThinking` stays `undefined` unless the caller
passes `thinking`, so the latency is the new models' own defaults. But the
investigation surfaced the anchoring question below, which is real and
independent of that consumer's problem.

## The finding

Three things travel under the name "thinking", anchored at three different
levels:

| concern | anchored at | assessment |
|---|---|---|
| effort **vocabulary** | provider (`IThinkingConfig.providers[]`) | correct — the vocabularies genuinely don't align |
| wire **shape** | model (`adaptiveThinkingModelPrefixes`, `responsesOnlyModelPrefixes`) | correct — prefix-matched on the model id |
| **availability** | provider (`IAiProviderDescriptor.thinkingMode`) | wrong, and dead |

Two independent pieces of evidence that the third row is not a considered
choice.

**`thinkingMode` is never read.** `registry.ts` sets it on nine descriptors and
the test fixtures set it because it is a required field. Nothing under
`libraries/`, `tools/` or `samples/` consults `.thinkingMode` — verify with
`grep -rn '\.thinkingMode' --include=*.ts libraries/ tools/ samples/`, which
returns nothing. The real temperature/thinking compatibility gating goes
through `providerDiscriminatorForId(descriptor.id)`
(`thinkingOptionsResolver.ts:53`), which switches on the provider **id**, not on
`thinkingMode`. So `thinkingMode` is a required public field carrying a
paragraph of design rationale that gates nothing.

**A per-model representation already exists.** `AiModelCapability`
(`model.ts:1620`) includes `'thinking'`, and `DEFAULT_MODEL_CAPABILITY_CONFIG`
(`registry.ts:531`) already encodes which models think, per provider, by RegExp
on the model id — `/^gpt-5/`, `/^o\d/`, `/^gemini-2\.5/`, `/^claude-opus-/`,
`/^grok-4/` and so on. The library therefore has two representations of "can
this think": a per-model one used for listing and filtering, and a per-provider
one used for nothing. The `ModelSpecKey` doc comment (`model.ts:514`) writes off
the resulting hole as a known limitation: *"a provider that declares support may
still have individual models its own API rejects thinking on."*

## In scope

### Item 1 — remove `thinkingMode`

Delete `IAiProviderDescriptor.thinkingMode` and the `AiThinkingMode` type if it
has no other use. Remove it from the nine registry descriptors, from every test
fixture that sets it, and from `etc/ts-extras.api.md`.

Before deleting, **re-run the grep yourself** and confirm the field is genuinely
unread. If you find a consumer this brief missed, stop and surface it rather
than deleting around it.

Also correct the `ModelSpecKey` remarks at `model.ts:508-519`, which describe
`thinkingMode` as the mechanism by which availability is declared. That
paragraph is the main reason the field looks load-bearing; it must not outlive
the field.

This is **breaking for anyone constructing a descriptor** — the field is
required, so every external construction site needs a one-line delete.
`@fgv/ts-extras`'s `ai-assist` packlet is on the active-development list in
`.ai/instructions/ACTIVE_DEVELOPMENT.md`, so break it cleanly; do not leave the
field as an ignored optional. Say so plainly in the change file and the PR body,
because the downstream consumer will feel it.

### Item 2 — add `'none'` to the generic effort vocabulary

`IThinkingConfig.effort` (`model.ts:1905`) is `'low' | 'medium' | 'high'`.
OpenAI and xAI both accept `'none'`; Gemini's equivalent is
`thinkingBudget: 0`; Anthropic has no off value in its effort vocabulary, so
"off" there means not sending the thinking param at all. The result is that
turning thinking **off** is the one operation with no cross-provider spelling,
and callers must drop into a per-provider block for it. The existing antagonist
test demonstrates exactly this — `thinkingParamRejection.antagonist.test.ts:203`
reaches for `providers: [{ provider: 'openai', config: { effort: 'none' } }]`
because there is no generic way to say it.

Widen the generic vocabulary to `'none' | 'low' | 'medium' | 'high'` and map it:

| provider | generic `'none'` maps to |
|---|---|
| OpenAI | `effort: 'none'` |
| xAI | `effort: 'none'` |
| Gemini | `thinkingBudget: 0` |
| Anthropic | no thinking param emitted at all |

**The load-bearing part is the temperature interaction, not the mapping.** The
resolver rejects `temperature` + thinking per provider, and `'none'` re-enables
temperature — there is already an end-to-end test pinning that for OpenAI via a
per-provider block. Generic `'none'` must thread through that matrix identically
for all four providers, including Anthropic, where "no thinking param" and
"temperature is allowed" have to arrive together. Expect this to be where the
bugs are. Verify the Anthropic mapping against the emit site rather than
assuming it; if Anthropic turns out to need something other than omission,
follow the code and say so in `result.md`.

## Explicitly out of scope

**Gating the call path on the per-model capability.** The obvious third move is
to have `callProviderCompletion` reject a thinking request for a model whose
capability set lacks `'thinking'`, reusing `DEFAULT_MODEL_CAPABILITY_CONFIG`.
Do not do it in this stream. That table's own doc comment states its posture:
*"Patterns are intentionally narrow — false positives are worse than missing a
model."* For a **listing filter**, a model the patterns miss is merely absent
from a menu. For a **call gate**, the same miss rejects a valid request. The
narrowness that makes the table right for listing makes it wrong for gating, so
reusing it needs a design pass on whether the table is split, widened, or given
an explicit unknown-means-allow rule. That is a design-triage-implement stream,
not a line change.

File it in `docs/FUTURE.md` when this stream closes, with that reasoning
attached — the reasoning is the valuable part, and without it the next reader
will see an easy reuse and take it.

## Dependencies

**Hard:** none. Both items are self-contained in the ai-assist packlet.

**Soft:** `ai-assist-thinking-events` 🟡 (not started) touches
`model.ts`, `apiClient.ts` and the streaming adapters for a different purpose —
surfacing thinking *content*. If that stream starts while this one is open,
coordinate on `model.ts`; the two edit different regions of it (this stream:
descriptor + `IThinkingConfig`; that stream: response and event shapes) but the
file is shared.

**Coordination:** PR #666 (`claude/gemini-empty-content-validators`) touches
`completionClient.ts` in the Gemini response-validation region. If it has not
merged when you start, base on `release` anyway and expect a small rebase; the
regions do not overlap.

## Missing-input rule

If any file or symbol this brief names does not exist, or a grep this brief
asserts returns something different from what it claims, **stop and surface the
discrepancy** rather than working around it or inferring intent. The brief's
factual claims were verified on `release` @ `30748a0b`; a mismatch means either
the tree moved or the brief is wrong, and both are worth knowing before code
lands.

## Phases

1. **Item 1 — `thinkingMode` removal.** Re-verify the field is unread. Delete
   from the interface, the type, the registry, the fixtures, `api.md`. Correct
   the `ModelSpecKey` remarks. Gates green.
2. **Item 2 — generic `'none'`.** Widen the type. Map per provider at the emit
   sites. Thread through the temperature-compatibility matrix. Add end-to-end
   tests mirroring the existing per-provider `'none'` test — one per provider,
   asserting both that thinking is off on the wire and that temperature
   survives.
3. **Layer-1 review.** `code-reviewer` on the diff **before** coverage closure,
   per `TESTING_GUIDELINES.md` § "Coverage Gap Resolution".
4. **Coverage closure**, then all gates, then PR.

The two items are independent; ship them as one PR unless item 2 grows, in
which case split and say why.

## Acceptance criteria

- [ ] `grep -rn '\.thinkingMode' --include=*.ts libraries/ tools/ samples/`
      returns nothing, and neither does a search for `AiThinkingMode` if that
      type was removed
- [ ] `IThinkingConfig.effort` accepts `'none'`, and one end-to-end test per
      provider pins both the wire shape and the temperature interaction
- [ ] Each new regression test was **watched fail** against a neutered fix, one
      neuter at a time, and `result.md` records which test went red for which
      neuter (see `TESTING_GUIDELINES.md` § "100% coverage cannot see a
      predicate that is never called")
- [ ] `rushx build` passes in every modified package
- [ ] `rushx lint` passes in every modified package
- [ ] `rushx test` passes with 100% coverage in every modified package
- [ ] `rushx fixlint` run before the final commit
- [ ] Change file present for `@fgv/ts-extras`; `rush change --verify
      --target-branch origin/release` clean
- [ ] **`node common/scripts/install-run-rush.js rebuild` passes** — removing a
      required interface member is exactly the shared-contract change that
      per-package gates cannot see
- [ ] `etc/ts-extras.api.md` regenerated and committed
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] `code-reviewer` run on the final diff before coverage closure; findings
      resolved or dispositioned in the PR description
- [ ] Copilot loop driven to diminishing returns or the 10-round cap, with the
      stop reason stated
- [ ] `docs/FUTURE.md` carries the per-model call-path gate with its reasoning
- [ ] `docs/WORKSTREAMS.md` entry updated to shipped **in this PR**, per
      `CODING_STANDARDS.md` § "Docs ship with the code"

## Required exit artifact

`.ai/tasks/active/ai-assist-thinking-anchoring/result.md`, covering:

- what shipped, in the same three-way `intended` / `shipped` / `diverged` shape
  the completed streams use (see
  `.ai/tasks/completed/2026-09/prompt-composition-metadata/meta.yaml`)
- the neuter table — which test went red for which neuter
- the Anthropic `'none'` mapping as actually implemented, and whether it matched
  this brief's prediction
- anything the brief got factually wrong

## Resume protocol

Checkpoint into `state.md` in the artifact directory after each phase: what
landed, what is next, and any brief claim found to be wrong. On resume, read
`state.md` first, then this brief.

## Branch and PR posture

Branch `claude/ai-assist-thinking-anchoring` off `release` HEAD. Single PR to
`release`. Review-loop discipline per `CODING_STANDARDS.md` § "Review-loop
discipline" — layer 1 before the first push, layer 2 driven after.

Note the repo's rule that a PR anticipates its own merge: write the shipped
markers in the PR itself rather than planning to flip them afterward.
