# Stream brief — `ai-assist-prompt-caching`

**Status:** 🔵 phase A (research + design)
**Shape:** design-triage-implement — this adds public API to two libraries and the
right shape is not yet obvious
**Branch base:** `release` HEAD
**Package surface (expected):** `@fgv/ts-extras/ai-assist`,
`@fgv/ts-prompt-assist` — exact surface is a phase-A output, not an input
**Out-of-scope:** the `ai-assist-thinking-anchoring` stream's surface
(`thinkingMode`, `IThinkingConfig`); the `ai-assist-thinking-events` surface;
every other `ts-extras` packlet
**Artifact pointer:** `.ai/tasks/active/ai-assist-prompt-caching/`

---

## Mission

`ai-assist` has no prompt-caching support of any kind. Every provider it talks
to supports caching, two of them without being asked, and we are paying full
input price on every repeated prefix. Design the cross-provider abstraction, then
build it.

Verified before writing this brief: `grep -rni 'cache_control|cache_read|
cache_creation|cachedContent|prompt_cache|ephemeral'` across `ts-extras/src` and
`ts-prompt-assist/src` returns only crypto-utils ephemeral-key code and one
unrelated internal `cacheKey` in `promptLibrary.ts`. There is nothing to
extend — this is greenfield.

## The finding that shapes the design

The obvious design — "cache directives on prompt-assist sections" — does not
generalize, because the providers are not variations on one mechanism. They are
three different mechanisms:

| shape | providers | what a directive would attach to |
|---|---|---|
| inline breakpoint | Anthropic | a content block (`cache_control: {type: 'ephemeral'}`), max 4 per request |
| automatic, no directive | OpenAI, xAI, most OpenAI-compatible | nothing — caching is on by default and there is no switch |
| out-of-band resource | Gemini, explicit caching | a separate `CachedContent` create call returning a handle referenced by later calls, with a TTL and hourly storage billing |

A per-section cache directive would be **write-only** for two of the three: on
OpenAI there is nowhere to send it, and on Gemini's explicit path it is not a
directive at all but a resource lifecycle. Do not start from that design.

**What actually generalizes is prefix stability.** All three shapes reward the
same property — stable content first, volatile content last, byte-identical
across calls. Anthropic renders `tools` → `system` → `messages` and any byte
change anywhere in the prefix invalidates everything after it; OpenAI's automatic
caching keys on the same property; Gemini's cached content is a prefix by
construction.

So the section-level authoring concept survives, but as **stability annotation**
rather than as a cache directive. *"This section is frozen / per-conversation /
per-request"* is a fact about the prompt that each provider consumes differently.
*"Cache here"* is an Anthropic instruction wearing a general costume.

## Why `ts-prompt-assist` is the right home for the annotation

`IPromptComposition` shipped in #663 (`prompt-composition-metadata`) and already
reports the document order and absolute size of every section composing a
resolved prompt. That is the substrate this design needs, and it is already
there. A cache-aware prompt-assist can, without any per-provider directive:

- **Diagnose cache-hostile ordering** — a volatile section ahead of a stable one
  silently costs the entire prefix. No provider reports this.
- **Report cacheable prefix size against the thresholds.** This is the highest-
  value item and the least obvious. Anthropic's minimum cacheable prefix is
  512–4096 tokens depending on model, and a shorter prefix **silently does not
  cache**. OpenAI's floor is believed to be ~1024 tokens and is **also silent**.
  Two silent failure modes that a composition-aware library can simply name.
- **Emit the Anthropic breakpoint** at the stable/volatile boundary the
  composition already knows.
- **Derive a cache key** for providers that route on one, from a hash of the
  stable prefix.

`Crc32Normalizer` in `ts-utils` is the repo's canonical structural hash — use it
for any prefix hashing rather than hand-rolling one (`/value-hashing`).

## Anthropic specifics — verified, do not re-research

From the bundled Claude API reference. Treat as established:

- `cache_control: {type: 'ephemeral'}` on a content block, or top-level
  auto-caching for the simple case
- **Maximum 4 breakpoints per request** — a hard constraint on any design that
  maps N sections to breakpoints, and the reason a naive per-section directive
  fails on Anthropic too
- TTL: 5 minutes by default; `ttl: '1h'` available
- Pricing: cache writes ~1.25× (5-minute) or ~2× (1-hour), reads ~0.1×
- Verify hits with `usage.cache_creation_input_tokens` /
  `usage.cache_read_input_tokens`; zero reads across repeated identical-prefix
  requests means a silent invalidator
- Caches are **model-scoped**
- A mid-conversation `effort` change invalidates the message cache on most
  models — caching and thinking config are coupled

## Phase A — research (dispatched; findings land in `research.md`)

Four questions, all concerning providers whose current behaviour post-dates the
briefing model's knowledge. Answers belong in
`.ai/tasks/active/ai-assist-prompt-caching/research.md`, with sources and an
explicit confidence marker per claim.

1. **OpenAI** — still fully automatic with no opt-in? Current token threshold,
   discount rate, and the current name/semantics of the cache-routing key
   (believed `prompt_cache_key`). Any breakpoint-style control added?
2. **Gemini** — current state of implicit vs explicit caching. Is explicit worth
   its lifecycle and storage-billing cost, or does implicit cover our access
   pattern? What are the implicit thresholds?
3. **xAI / Grok** — automatic, or is there a directive? Threshold and discount.
4. **Anyone else** — has any provider added breakpoint-style control since the
   Anthropic model, which would change whether shape 1 is Anthropic-specific or
   an emerging convention?

The research is **fact-finding only**. It does not design, and it does not
propose an API. If a question cannot be answered from primary provider
documentation, it says so rather than inferring from a blog post.

## Phase B — design

Produce a design doc at `.ai/tasks/active/ai-assist-prompt-caching/design.md`
answering, at minimum:

- **The annotation vocabulary.** What stability levels exist, and are they a
  closed set? Candidate: `frozen` / `per-conversation` / `per-request`. Resist
  inventing levels that no provider can act on.
- **Where the annotation lives** — on the prompt-assist section, on the resolve
  call, or both. Note that a section's stability is often a property of the
  *section*, but sometimes of the *call* (the same section is frozen in one
  route and volatile in another).
- **How the boundary maps to Anthropic's 4-breakpoint cap** when a composition
  has more stability transitions than 4.
- **What `ai-assist` accepts.** A resolved cache plan? Raw breakpoints? Note
  that `ai-assist` must remain usable without `ts-prompt-assist` — the two are
  independently consumable and the dependency direction must not invert.
- **What is reported back.** Cache hit/miss and token counts are the only way to
  know any of this works; the usage fields differ per provider and need a
  normalized shape.
- **Whether Gemini explicit caching is in scope at all.** It is a stateful
  resource with a lifecycle and hourly storage billing — a different abstraction
  from everything else here. A defensible phase-B outcome is "implicit only;
  explicit deferred with reasoning."
- **The diagnostics.** Arguably the highest-value, lowest-risk deliverable:
  cache-hostile ordering and below-threshold prefix size, both silent everywhere
  else. Consider whether these ship *first*, independently of any emit-side work.

Phase B goes to triage (`/triage-cycle`) before implementation.

## Phase C — implement

Scoped by phase B's design. Do not pre-commit the surface here.

## Dependencies

**Hard:** none. `IPromptComposition` (#663) is already on `release`.

**Soft:** `ai-assist-thinking-anchoring` (in flight) touches `model.ts` and
`completionClient.ts`. Caching will touch the same request-assembly path.
Sequence phase C after that stream lands, or expect a rebase.

**Interaction to carry into design:** caches are model-scoped and a
mid-conversation effort change invalidates the message cache. Any design that
lets callers vary effort per turn has a caching consequence.

## Missing-input rule

If a factual claim in this brief does not match the tree — the greenfield grep,
the `IPromptComposition` surface, the `Crc32Normalizer` recommendation — **stop
and surface it**. Claims were verified on `release` @ `30748a0b`.

## Acceptance criteria — phase A

- [ ] `research.md` answers all four questions, or states explicitly which could
      not be answered from primary provider documentation
- [ ] Every factual claim carries a source and a confidence marker
- [ ] No API design in `research.md` — that is phase B's job

## Acceptance criteria — phase C (carried forward)

Standard repo gates, per `CODING_STANDARDS.md` § "Pre-PR Validation Checklist":
`rushx build` / `rushx lint` / `rushx test` at 100% in every modified package,
`rushx fixlint` before the final commit, a change file per touched package
verified with `rush change --verify --target-branch origin/release`, no `any`,
`Result<T>` for fallible operations, `code-reviewer` before coverage closure,
Copilot loop driven to diminishing returns or the cap, and docs shipped in the
same PR as the code.

Because this widens what functions accept rather than only how they are typed, a
repo-wide `node common/scripts/install-run-rush.js test` is the gate, not just
`rebuild` — see `CODING_STANDARDS.md` § "`rush rebuild` covers a widened *type*.
Only a repo-wide `rush test` covers a widened *behaviour*".

## Resume protocol

`state.md` in the artifact directory, checkpointed at each phase boundary.
