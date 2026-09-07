# Stream brief — `ai-assist-prompt-caching`

**Status:** 🔵 phase A research complete; phase B (design) next
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

> **Revised 2026-09-07 after phase-A research.** This section originally claimed
> a three-shape model in which shape was a property of the *provider*, and that
> on OpenAI "there is nowhere to send" a cache directive. **That was wrong**, and
> the correction is the most useful thing phase A produced. The original claim is
> preserved in this note so the reasoning trail stays legible; the corrected model
> is below. See `research.md`.

**Shape is a property of (provider, model, request) — not of provider.** OpenAI
now ships inline breakpoint control that is structurally the same as Anthropic's:
`prompt_cache_breakpoint: {mode: 'explicit'}` on an input content block, plus a
request-level `prompt_cache_options: {mode: 'implicit' | 'explicit', ttl: '30m'}`
governing whether OpenAI also places its own automatic breakpoint. So OpenAI
occupies **both** the automatic and the caller-placed cell at once, and the caller
picks per request.

Verified independently of the research agent, against `openai/openai-openapi`
`master` (fetched 2026-09-07): `prompt_cache_breakpoint` appears 22 times across
Responses and Chat Completions input blocks; `prompt_cache_options`,
`prompt_cache_diagnostics` and a deprecated `prompt_cache_retention` are all
present.

| mechanism | who | notes |
|---|---|---|
| inline breakpoint | Anthropic; OpenAI on `gpt-5.6`+ | both cap **writes at 4 per request** |
| automatic only | xAI; Gemini implicit; OpenAI on older models, and OpenAI's default `implicit` mode | nothing to emit; the only lever is prefix stability |
| out-of-band resource | Gemini explicit `CachedContent` | create-then-reference by handle; immutable except expiry; hourly storage billing |

Two of four providers now implement the breakpoint model, so it is **not
Anthropic-specific** and the design should treat it as the emerging convention
rather than as a special case.

**What still generalizes is prefix stability.** Every mechanism above rewards the
same property — stable content first, volatile last, byte-identical across calls.
That part of the original reasoning survives intact, and so does the conclusion
drawn from it: the section-level authoring concept belongs as **stability
annotation** (*"this section is frozen / per-conversation / per-request"*), not as
a cache directive. What changed is the argument's force. It is no longer "a
directive is write-only on most providers"; it is that a stability annotation is
the one input from which *all three* mechanisms can be driven — breakpoint
placement, prefix-ordering diagnostics, and the explicit-cache payload alike.

### The four-breakpoint problem is shared, and OpenAI fails it in the worst direction

Both breakpoint providers cap writes at four. OpenAI resolves overflow **silently
by recency — it keeps the latest four**. An over-annotated composition therefore
loses its *earliest* breakpoints, which are exactly the most stable and most
valuable ones. A design that maps N stability transitions onto breakpoints must
choose which four survive; letting the provider choose picks the worst four.

(OpenAI matches against up to the latest 80 breakpoints in a conversation but
writes at most 4 — different caps for matching and writing. Don't conflate them.)

### Two OpenAI footguns to design against

- **`mode: 'explicit'` with zero breakpoints disables caching entirely.** From the
  spec: *"If there are no explicit breakpoints, the request does not use prompt
  caching."* That is a reachable setting strictly worse than doing nothing, and
  any API that lets a caller turn on explicit mode must make it unreachable.
- **`ttl` currently accepts only `'30m'`.** The field is present and looks like a
  knob; it has one legal value today. Do not build a TTL abstraction on it.

### OpenAI ships native cache diagnostics — which bounds ours

`prompt_cache_diagnostics` returns a hit/miss discriminated union; on a miss it
gives `reason`, `cache_missed_tokens` (estimated tokens affected after the first
divergence) and `comparison_reusable_tokens`. The nine miss reasons are
`model_changed`, `prompt_cache_key_changed`, `tools_changed`,
`text_format_changed`, `reasoning_effort_changed`, `verbosity_changed`,
`context_compacted`, `input_changed`, `service_tier_changed`.

This tempers — but does not remove — the brief's claim that diagnostics are the
highest-value deliverable. On OpenAI, miss causes are no longer silent. Two of the
nine (`reasoning_effort_changed`, `service_tier_changed`) are **invisible to any
prefix analysis**, which is a hard ceiling on what a home-grown diagnostic can
ever detect. Design ours to *normalize and supplement* OpenAI's, not to duplicate
it, and expect it to be the only such signal on the other providers.

Note that `reasoning_effort_changed` is OpenAI independently confirming the
thinking/caching coupling flagged at the bottom of this brief.

## Why `ts-prompt-assist` is the right home for the annotation

`IPromptComposition` shipped in #663 (`prompt-composition-metadata`) and already
reports the document order and absolute size of every section composing a
resolved prompt. That is the substrate this design needs, and it is already
there. A cache-aware prompt-assist can, without any per-provider directive:

- **Diagnose cache-hostile ordering** — a volatile section ahead of a stable one
  silently costs the entire prefix. No provider reports this.
- **Report cacheable prefix size against the thresholds.** Anthropic's minimum
  cacheable prefix is 512–4096 tokens depending on model, and a shorter prefix
  **silently does not cache**. **Do not hard-code a threshold for any other
  provider.** Phase A could not verify a single threshold or discount figure for
  OpenAI, Gemini or xAI — their prose documentation is egress-blocked from this
  environment, and the brief's earlier "~1024 tokens" guess for OpenAI was
  neither confirmed nor refuted. By this brief's own reasoning a wrong threshold
  produces a silently-non-caching implementation, which is the exact failure this
  stream exists to prevent, so thresholds must be caller-supplied (or re-verified
  from an unrestricted network) rather than baked in as constants.
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

## Phase A — research ✅ complete; see `research.md`

**Outcome: mechanism established, numbers not.** The split is structural and the
designer must know it. Every provider's *prose* documentation is egress-blocked
from this environment (403 on CONNECT for all OpenAI hosts, `ai.google.dev`,
`cloud.google.com`, `docs.x.ai`). What survived is machine-readable and, for API
surface, better than a guide page would have been: OpenAI's OpenAPI spec,
Google's live discovery documents (Gemini v1beta rev `20260904`, Vertex v1 rev
`20260831`), and xAI's official SDK protos.

So `research.md` is strong on mechanism and **has no numbers**. Every threshold
and every discount for OpenAI, Gemini and xAI is `[unverified]`. Third-party
search results are quarantined in it as leads for a verifier, never as answers —
treat them that way.

**Still open, and worth a second pass from an unrestricted network:** thresholds
and discounts for all three providers; Gemini's implicit-cache thresholds
(including an unverified hint that they may be **non-monotonic**, which if true
means "is my prefix above the threshold" is not even a well-formed question
there); and Gemini explicit caching's hourly storage rate.

### Findings to carry into design, beyond the shape correction

- **Gemini implicit caching has no API surface at all.** The string `implicit`
  appears nowhere in either discovery document — no request parameter, no
  distinct usage field. The only control found is a Vertex-only, project-level
  admin singleton `cacheConfig.disableCache`. Nothing to model per-request.
- **Gemini explicit `CachedContent` is immutable except for expiry.** Changing
  cached content is delete-plus-create with a new handle. That is a real
  lifecycle burden and strengthens the case for deferring explicit caching.
- **Cached-token accounting differs in a way that breaks naive normalization.**
  Cached tokens sit *inside* `promptTokenCount` on Gemini and *outside* the total
  on OpenAI. Any normalized "uncached input tokens" figure must special-case this
  or it will be wrong on one of them.
- **Chat Completions cannot report cache writes at all** (`cache_write_tokens`
  exists only on Responses), so a normalized write-token field is structurally
  unfillable there. Design the reporting shape to admit "not available" rather
  than defaulting it to zero.
- **xAI has no cache field in the request whatsoever** — verified against the
  full `GetCompletionsRequest` field list. Usage is `cached_prompt_text_tokens`,
  text-only, reads-only. **But `ai-assist` most likely reaches xAI over the
  OpenAI-compatible REST path**, where the field is probably
  `prompt_tokens_details.cached_tokens` instead. Verify against a live response
  before coding to either; this is a concrete, cheap thing to check early.
- **`user` is deprecated at OpenAI**, split into `safety_identifier` and
  `prompt_cache_key`. `prompt_cache_retention` is itself now deprecated in favour
  of `prompt_cache_options.ttl`, and the two express *different quantities* —
  maximum retention versus minimum lifetime, explicitly non-interacting. ZDR
  organizations get a different default.
- **OpenAI's caching surface is actively churning** (gated on `gpt-5.6`, with a
  parallel `Beta*` family in the spec). Gemini and xAI show no churn evidence.
  Re-check OpenAI's surface at implementation time; do not trust a months-old
  reading of it.

### The questions as originally posed

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
- **How the boundary maps to the shared 4-breakpoint cap** when a composition has
  more stability transitions than four. This is now the design's central
  mechanical question rather than an Anthropic footnote, because *both*
  breakpoint providers cap at four and OpenAI's silent overflow-by-recency drops
  precisely the breakpoints worth keeping. Which four survive, and on what rule?
- **Whether explicit mode is even worth exposing on OpenAI.** Its default
  implicit breakpoint is free and reasonable; explicit mode adds a footgun
  (zero-breakpoint = no caching) and a cap to manage. A defensible outcome is
  "annotate for Anthropic, leave OpenAI implicit," with explicit mode deferred
  until there is a measured reason.
- **Whether the annotation is advisory or authoritative.** If a caller annotates
  eight sections and only four breakpoints exist, does the library pick, refuse,
  or warn? Silently picking is what OpenAI already does badly.
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
- **The diagnostics.** Still the lowest-risk deliverable and a candidate to ship
  *first*, independently of emit-side work — but scope it against OpenAI's native
  `prompt_cache_diagnostics` rather than in ignorance of it. Ours should normalize
  OpenAI's nine miss reasons into a cross-provider shape and supply the same
  signal where no provider offers one, not re-derive what OpenAI already reports.
  Remember the ceiling: `reasoning_effort_changed` and `service_tier_changed` are
  undetectable by prefix analysis, so a prefix-only diagnostic can never be
  complete on its own.

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
