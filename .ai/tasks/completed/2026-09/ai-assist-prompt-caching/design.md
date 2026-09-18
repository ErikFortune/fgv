# Design — `ai-assist-prompt-caching`

**Status:** phase B complete; the original five open questions are closed (OQ-1 and OQ-3 on
2026-09-15/17, OQ-2/4/5 on 2026-09-17). Ready for phase C implementation, **with one new
question opened by the 2026-09-18 verification pass — see §14 (OQ-6).**

**Date:** 2026-09-08 (open questions closed 2026-09-17)
**Inputs:** `brief.md` (three revisions), `research.md` (phase A), the tree at
`claude/ai-assist-prompt-caching`.

> **Note on process.** This design did **not** go through `/triage-cycle`. That skill and
> `docs/DESIGN_PROCESS.md` are built for high-fidelity UI-prototype bundles — `design/pages/`,
> a staging tree, a port/discard packaging recommendation — and this repo has no `design/`
> directory at all. Three of that process's four triage buckets (visuals, assets, staging) have
> no referent for a document-shaped library-API design; the fourth (followups) was already
> discharged to `TECH_DEBT.md` and `FUTURE.md`. The open questions were decided directly
> instead, each with its reasoning recorded in §12.

> **Read §14 before starting C1.** An independent pre-C1 verification against the merged
> branch found no falsification, but two things that change phase C: a token-accounting
> collision with the `ai-assist-thinking-events` stream that neither stream's brief can see
> (**OQ-6**), and the finding that C1 is validator-widening across five response shapes rather
> than field-reading on one — which OQ-5 was decided without.

This design does not re-derive the brief's three findings. It accepts them, and §0
records four things the tree says that the brief did not have — one of which
resolves a research open question, one of which names an axis the brief's own
"(provider, model, request)" tuple is missing, and two of which supply the
implementation template.

---

## 0. What the tree says — verification, and four additions

### The brief's factual claims all hold

| claim | verdict |
|---|---|
| Greenfield: no caching code in `ts-extras` / `ts-prompt-assist` | ✅ the grep returns only `crypto-utils` ephemeral-key hits |
| `IPromptComposition` reports document order + absolute size per section | ✅ `trace.ts` — `IPromptSection.start` / `.chars` / `.measured`, contiguous and gapless |
| `Crc32Normalizer` is the repo's canonical structural hash | ✅ `ts-utils/src/packlets/hash/crcNormalizer.ts` |
| Anthropic sends `system` as a plain string | ✅ `completionClient.ts:504` — `system: prompt.system`, and `AiPrompt.system` is `public readonly system: string` |
| We surface none of the cache usage fields | ✅ `IAiCompletionResponse` (`model.ts:922`) is `{ content, truncated, structuredOutput }` and nothing else |

No falsification. Four additions follow.

### F1 — the dependency direction is already enforced by the graph, and it points the useful way

`libraries/ts-prompt-assist/package.json` declares `"@fgv/ts-extras": "workspace:*"`,
and `packlets/output/outputPipeline.ts:7` already does `import { AiAssist } from
'@fgv/ts-extras'`.

So the brief's warning — *"the dependency direction must not invert"* — describes a
mistake that **cannot be made silently**: an `ai-assist` import of `ts-prompt-assist`
is a cycle and fails the build. The constraint is structural, not a discipline
problem.

The corollary is the more useful half, and it settles §6 before the argument starts.
**The cache-plan type belongs in `ai-assist`, and `ts-prompt-assist` produces one.**
That is not an invention — `outputPipeline` already consumes
`AiAssist.fencedStringifiedJson` in exactly this shape.

### F2 — the tuple has a third axis the brief did not name: the *wire endpoint*

The brief establishes that mechanism is a property of `(provider, model, request)`.
The tree says the middle term is doing work that "model" does not cover.

`AiApiFormat` is `'openai' | 'anthropic' | 'gemini'` (`model.ts:876`) — nine of the
registry's providers share `'openai'`, xAI among them. That one format then splits at
**runtime** into two different wire shapes (`completionClient.ts:745`):

```ts
const usesResponsesApi: boolean =
  descriptor.apiFormat === 'openai' && (hasTools || isResponsesOnlyModel(descriptor, model));
```

Research §1.5 established that `cache_write_tokens` exists on the **Responses** API and
**not** on Chat Completions. Put those together: **whether cache writes are observable
at all flips on a boolean computed from whether the caller passed `tools`.** That is
not a property of the provider, and not a property of the model.

The codebase has already learned this lesson once, in the comment two lines above
that assignment:

> *a capability keyed on the model alone cannot know which of the two OpenAI wire
> shapes applies*

The design takes it as given: every cache-capability lookup is keyed on
`(descriptor, model, usesResponsesApi)`, resolved at request-assembly time, exactly
where `resolveStructuredOutput` is resolved today.

### F3 — xAI is reached over the OpenAI-compatible path; research §3.2's field names are the wrong ones

Research §3.4 flagged this as *"a concrete, cheap thing to check early."* Checked:
`registry.ts:282-287` gives `xai-grok` `apiFormat: 'openai'` and
`baseUrl: 'https://api.x.ai/v1'`.

So `ai-assist` never speaks xAI's gRPC protos, and `SamplingUsage.cached_prompt_text_tokens`
— the field research §3.2 confirmed — is **not** a field our code will ever see. It will
see whatever xAI's OpenAI-compat layer emits, presumably
`usage.prompt_tokens_details.cached_tokens`, still `[unverified]`.

A second consequence, and a live risk: grok-4.3/4.5 declare the `tools` capability, so a
tools-bearing request sets `usesResponsesApi` and posts to `https://api.x.ai/v1/responses`.
`completionClient.ts:384` asserts *"Shared by OpenAI and xAI — both route through the
Responses API"*. Whether xAI's usage block on that route carries a cached-token field at
all is unverified. **OQ-1.**

> **Settled 2026-09-17 by a live run** of the `xai-cache-probe` testbed scenario — see OQ-1
> in §12 for the full result. Both guesses above were half right. The endpoint **does** exist;
> the field on that route is `usage.input_tokens_details.cached_tokens`, **not** the
> `prompt_tokens_details` spelling guessed here (that one is the *Chat Completions* name, and
> both are real — one per route). Neither route reports a cache **write** field, so xAI is
> `reports: 'reads'` on both, which is where it parts company with OpenAI.

### F4 — `IAiStructuredOutputCapability` is the implementation template, and `IAiEmbeddingUsage` is the reporting one

Two existing surfaces solve the two hard shapes this design needs:

- **Model-keyed capability with longest-prefix-wins.**
  `IAiStructuredOutputCapability` is `{ modelPrefix: string, format }`
  (`structuredOutputTypes.ts:68`), declared per-provider in the registry, resolved to an
  internal `IResolvedStructuredOutput { enforcement, wire }` at assembly. Anthropic's
  non-monotonic 512/1024/2048/4096 minimums are a `modelPrefix` table in exactly this
  shape. §7 uses it verbatim.
- **Optional usage on a response.** `IAiEmbeddingResult.usage?: IAiEmbeddingUsage`
  (`model.ts:1383`), documented as *"when the provider reports it … absent for Gemini"*.
  Adding usage to `IAiCompletionResponse` is a sibling move, not a novelty.

A third precedent is a *rule* rather than a shape, and §8 leans on it hard:
`IAiCompletionResponse.structuredOutput` is **required, not optional**, because
*"an optional field would make absence three-ways ambiguous."* The cache-usage shape has
the identical defect available to it and takes the identical remedy.

---

## 1. The governing principle

Every ambiguous call in this design is decided by one asymmetry, so it is stated once:

> **A false *volatile* costs a discount not taken. A false *stable* costs the entire
> prefix, on every request, silently.**

From it, three rules that recur below and are not re-argued at each site:

- **R-a. The default is `'per-request'`.** Absence of a hint never means "assume stable".
- **R-b. The library may only ever *downgrade* a stability claim, never upgrade one.**
  This keeps every present and future inference pass monotone and safe by construction.
- **R-c. Unknown is reported as unknown, never defaulted to a number.** An unverified
  threshold becomes "I decline to judge", not a guess. A missing usage field becomes
  "not reported", not `0`.

---

## 2. Sequencing — three slices, and the brief's diagnostics-first case survives with a correction

The brief argues the diagnostics may be worth shipping first, independently of emit-side
work. **Agreed, and phase C is structured that way** — but the argument as stated has a
gap worth naming, because closing it changes *which* diagnostic leads.

**The gap.** The refutation check guards the false-stable failure. But a false-stable hint
costs nothing until something *acts* on it. Before breakpoints exist, a wrong `'frozen'`
is an unread annotation. So shipping refutation first is shipping a guard for a hazard that
does not yet exist.

**Why the conclusion survives anyway.** The set of diagnostics contains one member whose
value does not depend on any emit work at all: **cache-hostile *ordering*.** Every provider
in the registry rewards prefix stability — Gemini implicit, xAI, and OpenAI's default mode
have no directive to send, and the *only* lever is the order of the bytes. A volatile
section ahead of a stable one costs money **today**, on every one of them, with no
annotation, no wire change, and nothing reporting it. That is the strongest member of the
set, and it is the beachhead.

So the phases:

| slice | package(s) | depends on | can it make anything worse? |
|---|---|---|---|
| **C1 — observability** | `ts-extras/ai-assist` | — | Almost — see the correction below. |
| **C2 — diagnostics + vocabulary** | `ts-prompt-assist` | — | No. Computes and reports; emits nothing. |
| **C3 — emit** | both | C1 **and** C2 | Yes — it changes the wire. |

C1 and C2 are independent of each other and may run in parallel or in either order.
**C3 is gated on both**, and the gate is not bureaucratic: without C1 there is no way to
tell whether C3 works, and the failure mode is silent by construction. Shipping C3 before
C1 means shipping an unverifiable change to the request body.

> **Correction, 2026-09-18, from C1 as built (PR #668).** C1's row above said *"No. Reads
> fields off responses we already receive."* That is now not quite true, and the claim matters
> because C1's inertness is what justified shipping it first. **C1 sends one additive request
> field**: `stream_options: { include_usage: true }` on OpenAI Chat Completions streaming,
> because that API reports no usage at all while streaming unless asked. With OQ-5 putting
> streaming in scope, the choice was that field or no streaming observability.
>
> It is tightly gated — `supportsStreamUsageOption` is `true` only for `'openai'`, precisely
> because self-hosted `openai-compat` servers have unverified tolerance for an unrecognized
> field — and it has no caching or billing effect. So the accurate claim is **"inert except for
> one additive request field on one route, sent only to a descriptor confirmed to accept it,"**
> not "cannot make anything worse." §14 A3 separately notes the cannot-make-anything-worse
> property survives in the sense it was argued for (admitting an optional field rejects nothing
> previously accepted); this correction is about the *request* side, which A3 does not cover.

If only one slice ships, it should be **C1** — it is the precondition for validating
everything else and it is the only slice that converts a silent failure into a visible
number.

---

## 3. The annotation vocabulary

```ts
/** How often a section of a prompt changes between requests. @public */
export type PromptCacheStability = 'frozen' | 'per-conversation' | 'per-request';
```

| level | contract | typical |
|---|---|---|
| `'frozen'` | byte-identical on **every** request that resolves this prompt for this model | role instructions, policy text, tool descriptions, few-shot exemplars |
| `'per-conversation'` | byte-identical across turns **within one conversation**; differs across conversations | retrieved documents, a user profile, session context |
| `'per-request'` | may differ on any request. **The default.** | the user's question, timestamps, per-call parameters |

**Closed set, and exactly three.** These are the only distinctions any mechanism in
`research.md` can act on: a breakpoint is placed *between* levels, and a cache is either
shared or conversation-scoped. A fourth level (`'per-user'`, `'per-tenant'`) buys nothing
until a provider exposes a scoping axis that distinguishes it. OpenAI's `prompt_cache_key`
is the one field that would, and it is a *routing* key rather than a stability level — see
§6.3. Resist inventing levels no provider can act on; the brief is right about this.

**Ordering is total and meaningful:** `frozen > per-conversation > per-request`. Every rule
in §5 is expressed over that order.

### Provenance, per the brief's constraint

```ts
/** Where a stability claim came from. @public */
export type PromptCacheStabilityOrigin = 'authored' | 'call-site' | 'derived';

/** @public */
export interface IPromptCacheStabilityHint {
  readonly stability: PromptCacheStability;
  readonly origin: PromptCacheStabilityOrigin;
}
```

`'derived'` exists from day one and is **not speculative** — C2 populates it (§5.2, D2/D3
signals). That matters more than reserving a name: a vocabulary whose inference branch is
never exercised is a vocabulary that will not fit an inference pass when one arrives. This
one is exercised on the first commit.

**Refutation is deliberately *not* an origin.** An origin is provenance; refutation is an
outcome, and conflating them would make "who said this" unanswerable after a downgrade. A
refuted hint keeps its origin, has its `stability` lowered per **R-b**, and produces a
finding that names both.

---

## 4. Where the annotation lives, and precedence

Two homes, as the brief requires, plus a third that is derived rather than declared.

**1. Declaration site — `IPromptSlot`** (`ts-prompt-assist/src/packlets/types/slot.ts`).
One additive optional field:

```ts
export interface IPromptSlot {
  // ... existing fields unchanged ...
  /** Declared cache stability for this slot's value. Default `'per-request'`. */
  readonly cacheStability?: PromptCacheStability;
}
```

**2. Call site — `IPromptResolveRequest`.** One additive optional field:

```ts
  /** Per-slot stability overrides. Wins over any `IPromptSlot.cacheStability`. */
  readonly cacheStability?: ReadonlyMap<SlotName, PromptCacheStability>;
```

**Precedence: the call site wins, unconditionally.** The brief's reasoning is correct and
is not restated. Concretely it is what rescues the *false volatile* case: a `caller-sub`
that is an app-held constant is invisible to the library and knowable only where it is
supplied.

**3. Derived — template, preface, and body candidates.** `IPromptSection.kind` is
`'preface' | 'template' | 'slot'`. Preface and template text come from checked-in files
and carry no slot to annotate. They are assigned `{ stability: 'frozen', origin: 'derived' }`
**subject to refutation D2** — a body whose winning candidate matched on a non-empty
condition set is qualifier-conditional and is downgraded. This is the first `'derived'`
producer and it validates the vocabulary against its own future.

**Neither field is required, and an un-annotated resolve behaves exactly as today** — no
sections change, no plan is produced, nothing is emitted. Presence opts in, matching the
precedent `IPromptResolveRequest.composition` already set.

---

## 5. The four-breakpoint cap — the central mechanical question, and why it is not the hard part

The brief calls this the design's central mechanical question. Working it through inverts
the framing: **in a well-ordered composition the three-level vocabulary produces at most
two breakpoints, so the shared cap of four is never binding.** The cap only becomes
reachable in compositions that are already defective for an unrelated and worse reason,
which makes the overflow rule a *symptom detector* rather than an allocation policy.

### 5.1 The derivation

Fold the document-ordered sections into maximal runs of equal stability. A **transition**
is a boundary between adjacent runs; it is **downward** if stability decreases across it
(`frozen → per-conversation`, `frozen → per-request`, `per-conversation → per-request`)
and **upward** otherwise.

Three facts settle the allocation:

**(i) Only downward transitions are candidate breakpoints.** A breakpoint marks the end of
a reusable prefix. A prefix ending at an upward transition contains the less-stable content
that preceded it, so it is exactly as volatile as that content.

**(ii) Everything at or after the first upward transition is unreachable as a prefix.** Once
a `'per-request'` section appears at offset *p*, every prefix `[0, q)` with `q > p` contains
it and will not match on the next request. A breakpoint placed there is a guaranteed
write-with-no-read: it pays the write premium (~1.25× on Anthropic) for bytes that are never
read back.

> This is the same argument as the brief's *"automatic caching is a surcharge on one-shot
> calls"* — automatic places its breakpoint on the **last** cacheable block, which on a
> one-shot request is the user's question, i.e. after the first upward transition. The two
> hazards are one hazard, and §5.3 reports it as one finding.

**(iii) Ranking downward transitions by prefix *size* is wrong, and wrong in OpenAI's
direction.** Breakpoints denote **nested** prefixes, not disjoint segments: breakpoints at
`p1 < p2` produce cache entries `[0,p1)` and `[0,p2)`. Every later breakpoint therefore has
a larger prefix, so "keep the largest prefixes" keeps the *latest* boundaries — which is
precisely OpenAI's silent drop-by-recency, the rule the brief identifies as picking the
worst four.

The value of a breakpoint at `p` is *(bytes it protects when content after `p` changes)*
× *(probability that content after `p` changes while content before `p` does not)*. The
stability level **is** that probability estimate. So:

> **Rank downward transitions by the stability of the run they close, descending. Break
> ties by earliest position.**

### 5.1a Empty runs — settled by C2, and **C3 inherits this**

**Added 2026-09-18.** §5.1's fold says nothing about a run whose sections render to zero bytes,
and §9 said nothing either. C2 (#669) discovered the answer the expensive way: **five
consecutive Copilot rounds** circled it, round 4 reverting round 3 outright. The rule below is
what they converged on, recorded here rather than left in a comment in
`cacheStabilityAnalysis.ts`, because **C3 folds sections into runs in exactly the same way** and
would otherwise re-derive the whole argument.

| run's level | empty on this resolve → |
|---|---|
| `'frozen'` (unrefuted) | **collapse it** — remove from adjacency checks entirely |
| `'per-conversation'` | **keep it** |
| `'per-request'` | **keep it** |

**Why `'frozen'` is the exception and the other two are not.** An unrefuted `'frozen'` claim is
invariant across *every* resolve of the prompt, so empty now means empty forever — there are no
bytes there to strand or reorder, on this resolve or any other. `'per-conversation'` guarantees
stability only *within* one conversation, so a different conversation resolving the same prompt
could render it non-empty; an empty sample here is not evidence it can never contribute bytes.
`'per-request'` says nothing at all about the next resolve.

**And why collapsing beats merely skipping the run's own bytes.** D4 and D5 both compare a run
against its **neighbour**. Left in place, an empty frozen run between two non-empty runs absorbs
the check meant for the pair on either side of it — D4 compares against the empty run instead of
the real predecessor, and D5 stops its prefix walk there instead of continuing through to
genuinely cacheable bytes beyond. The same neighbour-comparison structure is what §5.1's
downward-transition scan does, which is why this is C3's problem too.

**One further trap, from the same rounds.** A zero-length section is **not** excluded from the
per-section stability walk — only from the run-adjacency checks. A `'per-request'` slot that
renders empty *this* time can render non-empty next time at the same position, which is exactly
the byte-instability D4/D5 exist to catch; excluding it would suppress the warning in the case
that matters most.

### 5.1b A zero-byte section contributes zero tokens — **open, and C3 must not inherit the bug**

**Added 2026-09-18, from a post-merge backstop review of #669.** §5.1a settled *which runs
collapse* and is silent on *what an empty run's `measured` does to the reported prefix total*.
C2 shipped with that gap open, and it is a live defect in `checkThreshold`.

`prefixEnd` is a single boundary index walked over the **collapsed** run list, but the prefix is
then taken as `sections.slice(0, prefixEnd)` — contiguous over the **raw** section array. A
collapsed run therefore contributes its `measured` iff it happens to sit interior to the walked
region. Verified by executing the shipped code:

| shape | reported prefix |
|---|---|
| empty `'frozen'` run mid-prefix, walk continues past it | **25** = 10+7+8 — the empty run's 7 counted |
| *the same run*, sitting just before the run that ends the walk | **10** — the same 7 not counted |

**The collapse asymmetry is a symptom, not the defect.** Any zero-`chars` section distorts the
total, collapsed or not — an empty `'per-conversation'` slot (never collapsed) with `measured: 7`
reports **17** where removing it reports **10**.

The governing fact: `IPromptSection.start`/`chars` partition `IResolvedPrompt.body` exactly, with
no per-section framing. A section with `chars === 0` contributes **no text** to the prefix that
would be sent, so whatever a caller's `measure('')` returns for it is an artifact of an arbitrary
callback, not tokens in the prompt.

**The rule, for C3 and for the C2 fix:** a section with `chars === 0` contributes `0` to the
measured total, wherever a prefix is sized. This subsumes the collapse asymmetry (both shapes
above → 10) and closes the non-collapsed case in one invariant, rather than patching
`prefixEnd`'s index arithmetic. It belongs beside `checkThreshold`'s existing guard against a
hostile measure (NaN / Infinity / negative) — that guard already declines to trust the callback
three lines above the sum that trusts it.

**Why this is stated as a rule rather than left to C3's judgement:** C3 sizes breakpoints by the
same fold and would re-derive — or re-miss — the same thing. Tracked in `docs/TECH_DEBT.md`.

### 5.2 The resulting rule, and its consequence

1. Fold to runs; take the maximal **monotone non-increasing** stability prefix.
2. Its downward transitions are the breakpoints, in document order.
3. Everything from the first upward transition onward gets **no breakpoint** and produces
   an ordering finding (§5.3, D4).
4. Cap the emitted count at `min(levels - 1, targetCap - reserved)` — see §6.2 for
   `reserved`.
5. Emit in document order.

With three levels, step 1 admits at most two downward transitions — *end of frozen* and
*end of per-conversation*. **So the emitted count is ≤ 2, always, and step 4 never fires.**

Two consequences worth stating plainly:

- **We never let a provider choose which breakpoints survive.** OpenAI's drop-by-recency
  only fires when a request carries more than the cap. We never send more than the cap, so
  its rule never engages. That is the design's complete answer to *"which four survive"*:
  the question is made unreachable rather than answered.
- **The cap binds only on an interleaved composition** (`frozen, per-request, frozen, …`),
  and an interleaved composition's real problem is its ordering. Step 3 already refuses to
  place breakpoints past the interleave and reports it. So the case that would stress the
  cap is the case the diagnostic exists to tell you to fix.

### 5.3 Advisory or authoritative?

The brief offers three options — pick, refuse, or warn — and the answer is none of them,
because the premise dissolves. **The library never picks among too many, because it never
produces too many.**

What it produces is a **plan plus findings**: the ≤2 breakpoints it will emit, and one
finding for every annotation that could not be honored, naming why. So:

- **Authoritative about what it emits**, and it always says what it discarded and why.
- **The annotations are advisory-with-veto**: an authored `'frozen'` may be downgraded by
  refutation (**R-b**), never upgraded. A downgrade is always loud, because a downgrade
  means the author was wrong about something that costs money silently.

---

## 6. What `ai-assist` accepts

### 6.1 The shape, and why it is offsets rather than blocks

`ai-assist`'s request is `AiPrompt { system: string, user: string }` plus
`head?: IChatMessage[]`. There are no content blocks, so a breakpoint cannot index into
anything that exists. Two ways out:

- **(a) Segment `AiPrompt.system`** into an ordered array of `{ text, cacheStability? }`.
  Rejected: it restructures a `public readonly system: string` that every caller and every
  adapter reads, to express something a caller without `ts-prompt-assist` would have to
  hand-segment.
- **(b) Accept offsets into the existing string.** Chosen.

Offsets win on three counts. They are minimal — `AiPrompt` does not change. They are usable
without `ts-prompt-assist` — *"the first 4,000 characters of my system prompt are stable"*
is a one-line call. And they are **already the currency**: `IPromptSection.start` and
`.chars` are UTF-16 code units into `IResolvedPrompt.body`, so producing them is a
projection rather than a translation.

```ts
/** A request-level prompt-caching plan. @public */
export interface IAiCacheRequest {
  /**
   * Strictly ascending UTF-16 offsets into `AiPrompt.system`, each marking the end of a
   * cacheable prefix. At most the resolved model's write cap; each must be `> 0` and
   * `< system.length`.
   */
  readonly systemBreakpoints?: ReadonlyArray<number>;
  /**
   * Opaque cache-routing key, sent where the provider has one (OpenAI `prompt_cache_key`).
   * Ignored elsewhere.
   */
  readonly cacheKey?: string;
}
```

Attached as one additive optional field on `IProviderCompletionParams`:

```ts
  /** Prompt-caching plan for this request. Omitted, nothing cache-related is sent. */
  readonly cache?: IAiCacheRequest;
```

The adapters split `system` at the offsets into provider-native content blocks internally.
On Anthropic that turns `system: prompt.system` (`completionClient.ts:504`) into
`system: [{ type: 'text', text, cache_control: { type: 'ephemeral' } }, …]` — the brief
correctly notes this is *not* a one-liner, and it is the bulk of C3's Anthropic work. On
OpenAI it becomes content parts carrying `prompt_cache_breakpoint: { mode: 'explicit' }`.

**Validation fails loudly.** Non-ascending, out-of-range, or over-cap offsets return
`fail()`, never a clamp. A silently-clamped breakpoint is precisely the silent failure this
stream exists to remove.

**Dependency direction.** `IAiCacheRequest` is made of `number` and `string` and lives in
`ts-extras/ai-assist`. `ts-prompt-assist` gains a function it owns —
`toCacheRequest(composition, hints): Result<AiAssist.IAiCacheRequest>` — mirroring
`outputPipeline`'s existing consumption of `AiAssist`. `ai-assist` never learns
`ts-prompt-assist` exists, and per **F1** it structurally cannot.

### 6.2 The head/tail channel is deliberately out of scope

Breakpoints are offered on `system` only. The brief establishes the documented robust
combination as *an explicit marker on the last block of the static system prefix, plus the
provider's automatic behaviour for the growing tail* — so system-only breakpoints plus an
untouched conversation tail **is** that combination, not a truncation of it. Multi-turn
growth is where automatic caching already performs well; adding a second annotated channel
buys nothing measured.

`reserved` in §5.2 step 4 is therefore `1` on OpenAI (the implicit breakpoint, §6.3) and
`0` elsewhere. Since the emitted count is ≤2 either way, it never binds.

### 6.3 OpenAI: emit breakpoints, never touch `prompt_cache_options`

The brief asks whether explicit mode is worth exposing. **No — not in C3**, for three
reasons that compound:

1. `mode: 'explicit'` with zero breakpoints disables caching entirely. The only way to make
   that unreachable is to never send the field. Sending breakpoints while leaving `mode` at
   its default `implicit` is strictly safe: OpenAI keeps its own implicit breakpoint and
   writes up to the latest **three** of ours.
2. **The footgun costs us nothing to avoid**, because §5.2 emits at most 2 and implicit mode
   allows 3. The slot we surrender was never going to be used.
3. The surface is model-gated on `gpt-5.6`+ and actively churning, with a parallel `Beta*`
   family in the spec (research §1.8). A mode switch we cannot verify against live 5.6
   traffic should not ship.

`prompt_cache_key` is a different matter — it is pure additive request plumbing with no
vocabulary, no cap, and a real effect on hit rate for multi-tenant routes. It is carried on
`IAiCacheRequest.cacheKey` above. Whether it lands in C1 or C3 is **OQ-3**.

---

## 7. Thresholds — model-keyed capability, caller override, and "unknown" as a first-class answer

No constant is hard-coded, at either level. Two homes.

**1. Model-keyed, in the registry**, mirroring `IAiStructuredOutputCapability` exactly
(**F4**), with longest-prefix-wins and the same one-entry-edit ergonomics:

```ts
/** Prompt-caching capability of a matching model on this provider. @public */
export interface IAiCacheCapability {
  /** Prefix matched against the resolved model id; `''` is the catch-all. Longest wins. */
  readonly modelPrefix: string;
  readonly mechanism: 'inline-breakpoint' | 'automatic';
  /** Cache writes per request. Omitted when unknown — never defaulted. */
  readonly maxBreakpointWrites?: number;
  /** Minimum cacheable prefix, in tokens. **Omitted means unknown, not zero.** */
  readonly minCacheablePrefixTokens?: number;
  /** What this model's wire shape can report back. See §8. */
  readonly reports: AiCacheReportingLevel;
}
```

The **only** table populated with verified minimums is Anthropic's, because it is the only
one `research.md` could source from primary documentation:

| `modelPrefix` | `minCacheablePrefixTokens` |
|---|---:|
| `claude-opus-5`, `claude-fable-5` | 512 |
| `claude-opus-4-8`, `claude-sonnet-5`, `claude-sonnet-4-6`, `claude-sonnet-4-5` | 1024 |
| `claude-opus-4-7` | 2048 |
| `claude-opus-4-6`, `claude-opus-4-5`, `claude-haiku-4-5` | 4096 |

Every OpenAI, Gemini and xAI entry ships with `minCacheablePrefixTokens` **omitted**. Not
zero, not a guess, not the third-party "~1024" quarantined in research §1.7.

Note the ordering is non-monotonic and Haiku — the model reached for on exactly the cheap
high-volume routes where caching matters most — carries the highest floor. This is the
concrete reason the field cannot be a per-provider constant even in principle.

**2. Caller-supplied override**, on the diagnostic:

```ts
export interface IPromptCacheDiagnosticOptions {
  /** Overrides any registry-declared minimum for this run. */
  readonly minCacheablePrefixTokens?: number;
}
```

**The rule that makes this safe (R-c): when the minimum is unknown, the diagnostic reports
the prefix size and declines to judge it.** A finding that says *"stable prefix ≈ 2,300
tokens; this model's minimum is not known to this library — supply one for a verdict"* is
honest and actionable. A finding that says *"above threshold"* against a guessed 1,024 is
the silent non-caching failure this stream exists to prevent, dressed as a green check.

**Token counting is not ours, and this design does not reverse that.** `PromptSectionMeasure`
already states the settled position: *"Segmentation is the library's job; measurement is the
caller's … a bundled tokenizer would be confidently wrong for every model it was not built
for."* The threshold diagnostic runs on `IPromptSection.measured` and is **unavailable**
when no measure was supplied — reported as unavailable, with the reason, following the
precedent `IPromptComposition.unavailable` already set for the same class of problem.

---

## 8. What is reported back — C1

One additive optional field on the completion response, sibling to
`IAiEmbeddingResult.usage` (**F4**):

> **Corrected at C1 implementation, 2026-09-17.** `'none'` is dropped from
> `AiCacheReportingLevel` below. As specified it had no producer: every C1 normalizer
> either returns a populated `IAiCompletionUsage` (with `reports` as `'reads'` or
> `'reads-and-writes'`) or returns nothing at all when the wire response carried no
> usage block — `IAiCompletionResponse.usage` being `undefined` already **is** the
> "nothing reported" signal, so a `reports: 'none'` value would have been a second,
> unreachable-except-by-bug way to say the same thing (caught by `code-reviewer`
> before this PR opened). The type is `'reads' | 'reads-and-writes'`.

```ts
/** What a provider's wire shape is able to report about caching. @public */
export type AiCacheReportingLevel = 'reads' | 'reads-and-writes';

/** Token accounting for a completion, normalized across providers. @public */
export interface IAiCompletionUsage {
  /**
   * What this response's wire shape *can* report. **Required, not optional** — without it
   * an absent `cacheWriteTokens` is three-ways ambiguous (no write happened / this API
   * cannot report writes / a build predating the field), and disambiguating exactly that
   * is what this field is for. Same remedy as `IAiCompletionResponse.structuredOutput`.
   */
  readonly reports: AiCacheReportingLevel;
  /** Input tokens **not** served from cache. Normalized — see the table below. */
  readonly uncachedInputTokens?: number;
  /** Input tokens served from cache. */
  readonly cachedInputTokens?: number;
  /** Input tokens written to cache. Meaningful only when `reports` is `'reads-and-writes'`. */
  readonly cacheWriteTokens?: number;
  /** Generated output tokens. */
  readonly outputTokens?: number;
  /** Total input = uncached + cached, when both are known. */
  readonly totalInputTokens?: number;
  /** The provider's own usage block, unnormalized, for anything this shape drops. */
  readonly raw?: JsonObject;
}
```

```ts
export interface IAiCompletionResponse {
  // ... existing fields unchanged ...
  /** Token usage, when the provider reports it. */
  readonly usage?: IAiCompletionUsage;
}
```

`reports` being required is the whole ergonomics of the type. Under `'reads-and-writes'`,
an absent `cacheWriteTokens` genuinely means zero were written — the actionable signal that
a breakpoint did not take. Under `'reads'` it means the API cannot say, and inferring "zero
writes" from it would be a fabricated fact. Research §6.6 names this exact hazard for Chat
Completions; the required discriminator removes it by construction rather than by docstring.

### Interpreting the numbers: use a ratio, never a raw count

**Nothing in this design consumes these fields yet** — C1 reports them, C2's checks are
composition-side and never read them — so this is guidance for whoever does first: a consumer,
C3, or a later diagnostic that correlates composition against observed usage.

The 2026-09-17 xAI run (OQ-1) reports **128 cached tokens on a genuinely cold call**, on both
routes, against a prefix the provider had never seen — fixed scaffolding, not caller content.
So `cachedInputTokens > 0` is true on effectively every request to that provider and means
nothing. 128/4822 is 2.7%; 4800/4822 is 99.5%; only the second is a working cache. Any check
phrased on the raw count reports success unconditionally.

Judge `cachedInputTokens` as a fraction of total input, or against a per-provider floor — and
where that floor is unknown, **R-c** applies: report the ratio and decline to judge, rather
than assuming the floor is zero.

### Normalization, per provider

| target | `reports` | `uncachedInputTokens` | `cachedInputTokens` | `cacheWriteTokens` |
|---|---|---|---|---|
| Anthropic Messages | `reads-and-writes` | `usage.input_tokens` (already the remainder) | `usage.cache_read_input_tokens` | `usage.cache_creation_input_tokens` |
| OpenAI Responses | `reads-and-writes` | `usage.input_tokens` **minus** `input_tokens_details.cached_tokens` | `input_tokens_details.cached_tokens` | `input_tokens_details.cache_write_tokens` |
| OpenAI Chat Completions | `reads` | `usage.prompt_tokens` minus cached | `prompt_tokens_details.cached_tokens` | — structurally unfillable |
| Gemini `generateContent` | `reads` | `promptTokenCount` **minus** `cachedContentTokenCount` | `cachedContentTokenCount` | — no write concept |
| xAI Chat Completions | `reads` | `usage.prompt_tokens` minus cached | `usage.prompt_tokens_details.cached_tokens` | — none reported |
| xAI Responses | `reads` | `usage.input_tokens` minus cached | `usage.input_tokens_details.cached_tokens` | — none reported |

The Gemini subtraction is the footgun research §6.5 names: cached tokens sit **inside**
`promptTokenCount` on Gemini and **outside** the total on OpenAI. Normalizing without the
special case yields a number that is wrong on exactly one provider and looks fine on both.
The row above is the special case; `raw` is the escape hatch for anyone who needs the
unnormalized figures.

### The standing assertion is a harness, not a unit test

The brief requires a standing assertion that a second identical request shows
`cachedInputTokens > 0`. That is a live-traffic measurement, and per
`TESTING_GUIDELINES.md` § *Measurement Harnesses* it belongs under the package's `perf/`
directory, run on demand, with its output pasted into the stream's `result.md` — **not**
behind the coverage gate, which would put CI's runtime and its green/red behind a network
call and a bill.

Per the same section, **the prediction is written down before the first run**: the second
request's `cachedInputTokens` should approximately equal the stable prefix's measured token
count, and `uncachedInputTokens` should fall by the same amount. A miss means the design is
wrong, and the response is to revise the design — not to lower a threshold until the
harness goes green.

---

## 9. The diagnostics — C2

Computed at resolve time in `ts-prompt-assist`, from data the resolve already holds. No
provider, no wire change, no thresholds required.

```ts
export type PromptCacheFindingKind =
  | 'stability-refuted'      // D1, D2 — a claim contradicted by resolve data
  | 'cache-hostile-ordering' // D4 — a stable section after a less-stable one
  | 'no-cacheable-prefix'    // D5 — hints yield zero breakpoints
  | 'threshold-unknown'      // §7 — prefix measured, minimum not known
  | 'below-threshold';       // §7 — prefix measured, minimum known, prefix short

export interface IPromptCacheFinding {
  readonly kind: PromptCacheFindingKind;
  readonly slot?: SlotName;
  readonly detail: string;
  /** For a refutation: the claim as made, and the level it was lowered to. */
  readonly claimed?: IPromptCacheStabilityHint;
  readonly downgradedTo?: PromptCacheStability;
}
```

### The checks

> **Misplaced when written; corrected 2026-09-18 after C2 shipped.** This slot carried a rule
> that *"every cache-effectiveness check must be a ratio, never a raw count"*, on the strength
> of the 128-token cold floor OQ-1 found. **It does not bind on any check in this section**, and
> C2 (#669) was right to ignore it: D1, D2, D4 and D5 are all **composition-side** — they read
> `IPromptComposition`, and none of them reads a provider's usage block. `ts-prompt-assist` has
> no reference to `IAiCompletionUsage` at all. D5's threshold check compares an *absolute*
> prefix size against a caller-supplied `minCacheablePrefixTokens`, which is the right shape;
> a ratio there would be meaningless.
>
> The hazard is real but belongs where **observed usage** is interpreted, which this design does
> not yet reach. It is restated in §8 beside the type that carries the numbers.

**D1 — multi-scope binding (refutation, downgrades).** A slot claiming better than
`'per-request'` whose winning binding is one of **≥2** bindings for that slot across the
resolve's `chain`. `bindingMerger.ts` already walks every scope's `_bindings.yaml` and
holds exactly this, so the check is a counter on an existing loop.

*Honest scope, and it goes in the finding text:* this is **chain-relative**. It establishes
that the slot's value depends on which scope wins in *this* chain — so an application that
always resolves with one chain sees a false positive. The finding says **"may vary"**, not
"does vary". Per the governing principle the downgrade is still correct by default: a false
volatile costs a discount; a false stable costs the prefix, silently.

**D2 — conditional body (refutation, downgrades).** A `'template'` section whose
contributing candidate matched with a non-empty, non-`matchAsDefault` condition set
(`ICandidateMatchTraceEntry.conditions`). The body text is qualifier-conditional and is not
frozen. This is what keeps §4's derived `'frozen'` for template text honest.

D1 and D2 together are the brief's *false stable* case — and note what they confirm: **the
library's central feature is what makes its own authored bindings unstable.** Conditional
resolution is the reason `ts-prompt-assist` exists, so provenance carries no information
about byte-stability. These two checks are the closest the resolve can get to observing
that directly, and nothing else in the stack is positioned to run them.

**D3 — derived signals with no hints at all.** D1 and D2 fire on *evidence of variability*,
which does not require a hint to exist. So a resolve with **zero annotations** still yields
a partial stability map: sections with variability evidence are demonstrably
`'per-request'`; the rest are unclassified (not `'frozen'` — **R-b** forbids the upgrade).
That partial map is enough to run D4, which is why C2 is useful on day one and why it is
the beachhead the brief asked for.

**D4 — cache-hostile ordering.** Any upward stability transition in document order: a
section with variability evidence appearing *before* one without. **This is the check that
pays for itself before any emit work exists**, because it costs money today on every
automatic provider — Gemini implicit, xAI, and OpenAI's default mode all reward prefix
stability and none of them reports when you break it. Per §5.2 step 3 it also fires when a
composition would strand breakpoints past an interleave, so the two hazards report as one.

**D5 / threshold checks.** Per §7, with `'threshold-unknown'` as a first-class outcome
rather than a silent pass.

### Scope against OpenAI's native diagnostics — normalize and supplement, do not duplicate

Research §1.6 establishes that OpenAI natively answers "why did my cache miss" with a
nine-value `CacheMissReasonTypeEnum` and an affected-token estimate. So ours must not
re-derive it:

| OpenAI miss reason | ours |
|---|---|
| `input_changed` | **overlaps** — D1/D2/D4 are a *pre-flight* version of it, available before the request and on providers that report nothing |
| `tools_changed`, `text_format_changed`, `model_changed`, `prompt_cache_key_changed`, `context_compacted`, `verbosity_changed` | request-shape facts, not prompt-text facts — **out of scope**; surface OpenAI's answer verbatim via `raw` |
| `reasoning_effort_changed`, `service_tier_changed` | **the hard ceiling.** Not properties of the prompt text at all. No prefix analysis can ever detect them |

The last row is a bound, and the design states it rather than quietly hoping it does not
matter: **a prefix-only diagnostic is structurally incomplete, on every provider, forever.**
`reasoning_effort_changed` is also OpenAI independently confirming the thinking/caching
coupling the brief flags — which makes the soft dependency on `ai-assist-thinking-anchoring`
(shared files) also a *semantic* interaction: a design that lets callers vary effort per
turn invalidates the message cache on most models. C3 should sequence after that stream
lands, and should document the coupling wherever effort is settable.

---

## 10. Gemini explicit `CachedContent` — out of scope, with reasons

The brief marks this explicitly open and says *"implicit only, explicit deferred"* is
defensible. **That is the recommendation.** Five reasons, in descending force:

1. **It is not a request-assembly concern.** Everything in `ai-assist` is stateless per
   call. `CachedContent` is a control-plane resource with `create` / `get` / `list` /
   `delete` / `patch` and a handle whose lifetime spans requests. Modelling it as a field on
   a completion request would misrepresent what it is.
2. **The library cannot own invalidation, and the consumer already does.** The resource is
   immutable except expiry, so any content change is delete-plus-create with a *new* handle
   that every caller must re-reference. A library that returns the handle has added a
   wrapper; one that holds it has added state to a stateless packlet.
3. **An abandoned handle is a recurring charge**, not a one-time one. A leak here bills
   hourly until someone notices. That is a materially different risk class from anything
   else in `ai-assist`, and it is not one to take on speculatively.
4. **We cannot tell a consumer what it costs.** The storage rate is `[unverified]` and
   `ai.google.dev/pricing` is egress-blocked. Shipping a billing-bearing primitive whose
   price we cannot state is not defensible.
5. **There is nothing else to do on Gemini anyway.** Implicit caching has *zero* API
   surface — the string `implicit` appears nowhere in either live discovery document, and
   the only control found is a Vertex project-level `cacheConfig.disableCache` admin
   singleton. So the entire Gemini work item in scope is the §8 usage normalization, which
   C1 delivers regardless.

**If it is ever built**, it belongs as its own primitive — a `GeminiCacheHandle` with
explicit `create` / `release` and a documented ownership contract — not as a field on a
completion request. Record in `docs/FUTURE.md` at C1 time so the reasoning is not re-derived.

One unverified hazard to carry: research §2.1 surfaced an unread report of a *non-monotonic*
Gemini implicit threshold (`cached_content_token_count` dropping to 0 between ~9K–17K prompt
tokens). If real, *"is my prefix above the threshold"* is not a well-formed question on
Gemini. §7's `minCacheablePrefixTokens: undefined` for every Gemini entry is already the
correct behaviour under that hypothesis — the diagnostic declines to judge — so no rework is
implied either way. Noted so it is not treated as an oddity if it turns up.

---

## 11. Surface summary

| package | addition | slice |
|---|---|---|
| `ts-extras/ai-assist` | `IAiCompletionUsage`, `AiCacheReportingLevel`, `IAiCompletionResponse.usage?` | C1 |
| `ts-extras/ai-assist` | per-adapter usage extraction + normalization (5 rows, §8) | C1 |
| `ts-extras/ai-assist` | `IAiCacheCapability`, registry entries, `IAiProviderDescriptor.cache?` | C1 |
| `ts-prompt-assist` | `PromptCacheStability`, `…Origin`, `IPromptCacheStabilityHint` | C2 |
| `ts-prompt-assist` | `IPromptSlot.cacheStability?`, `IPromptResolveRequest.cacheStability?` | C2 |
| `ts-prompt-assist` | `IPromptCacheFinding`, D1–D5, `IPromptCacheDiagnosticOptions` | C2 |
| `ts-extras/ai-assist` | `IAiCacheRequest`, `IProviderCompletionParams.cache?`, offset validation | C3 |
| `ts-extras/ai-assist` | Anthropic `system` string → content blocks; OpenAI content-part breakpoints | C3 |
| `ts-prompt-assist` | `toCacheRequest(composition, hints): Result<AiAssist.IAiCacheRequest>` | C3 |

Every entry is **additive and optional**. Both packages are on the active-development
surface per `ACTIVE_DEVELOPMENT.md` (`ts-extras`' `ai-assist` packlet by name;
`ts-prompt-assist` in full), so no compatibility shims and no aliases. `AiPrompt` does not
change shape. An un-annotated caller's request body is byte-identical before and after every
slice.

---

## 12. Open questions for triage

**OQ-1 — xAI's OpenAI-compat cache surface. — ✅ CLOSED 2026-09-17.**

F3 establishes that we reach xAI at `https://api.x.ai/v1` with `apiFormat: 'openai'`, and that
a tools-bearing request routes to `/responses`. Unknown: whether that endpoint exists on xAI,
and what its usage block calls cached tokens. Blocks the `reports` level for `xai-grok` in §8.

A testbed scenario now answers it, rather than a one-off `curl` whose output would rot:
**`samples/testbed` → `xai-cache-probe`** (`rushx cli xai-cache-probe`, needs `XAI_API_KEY`).

It is **differential and name-agnostic**, which matters more than it first appears. Asking
"is `usage.prompt_tokens_details.cached_tokens` present?" can only ever confirm a guess, and
reports a false negative if xAI spells it differently. The probe instead sends one
byte-identical request **twice** on each route and diffs the two usage blocks: a field that is
absent-or-zero cold and positive warm *is* the cached-token field, whatever it is called. The
flattened key list is printed either way, so a run with no cache hit still records the usage
schema — a negative result is a result.

### Ran 2026-09-17 against `grok-4.3`. Settled:

- **`POST https://api.x.ai/v1/responses` exists** and returns a real usage block. The
  tools-bearing route is live, so F3's "a tools-bearing request routes to `/responses`" has no
  hole under it.
- **The cached-token field name differs per route**, splitting exactly as OpenAI's does:
  `usage.prompt_tokens_details.cached_tokens` on Chat Completions,
  `usage.input_tokens_details.cached_tokens` on Responses. Direct corroboration of **F2** —
  this is a per-*endpoint* fact, not a per-provider one, and a lookup keyed on the descriptor
  alone would get one of the two wrong.
- **Neither route reports a cache *write* field.** So xAI is `reports: 'reads'` on **both**
  routes, and §8's table now says so. This qualifies F2 rather than contradicting it: *write*
  observability flipping on the route is an **OpenAI** property, not a property of the
  Responses shape. Both providers still need the `(descriptor, model, usesResponsesApi)` key —
  they simply disagree about what the Responses arm yields.
- xAI also emits `cost_in_usd_ticks` and `num_sources_used`, which the normalized shape drops.
  That is what `IAiCompletionUsage.raw` is for; no schema change needed.

### Not settled, and the probe was wrong before it was right

The first run reported `input_tokens_details.cached_tokens` at **4416 of 4462 input tokens on
the *cold* call** — a call that was by construction the first of its pair. It cannot have been
cold, and the cause was the probe, not xAI: both routes shared one prefix and ran in sequence,
so the Chat Completions pair warmed the cache before Responses was ever called. Each route now
builds a **salted** prefix of its own.

Two further defects surfaced in the same run, and both are now regression-tested:

- The cold→warm *differential* alone could not see either real field. Chat Completions moved
  `cached_tokens` 128 → 192 — non-zero cold, so the `0 → positive` rule never flagged it.
  Responses reported 4416 on **both** calls — identical, so it was not even a delta and
  vanished from the report entirely. **A warm cache is the normal case against a live API**,
  and a probe that can only see a transition is blind precisely when caching works best. The
  report now names any field whose *name* matches `/cach/` with both absolute values,
  regardless of movement.
- The no-delta branch claimed "no cache hit observed", which is wrong for exactly that reason.
  It now says so and points at the cached-token line instead.

### Corrected probe re-run, 2026-09-17 — the remaining question closes, and one new fact

With per-route salting the two routes behave **identically**, which retires the "Chat
Completions caches weakly" hypothesis the first run suggested. That was contamination plus
write-propagation lag, not a property of the route.

| route | input tokens | cached cold | cached warm | cost ticks cold → warm |
|---|---:|---:|---:|---|
| Chat Completions | 4822 | 128 | **4800** (99.5%) | 62,181,000 → 12,675,000 |
| Responses | 4582 | 128 | **4544** (99.2%) | 60,981,000 → 12,863,000 |

**Both routes cache a stable prefix effectively.** `reports: 'reads'` on both stands — still no
write field on either — and the field names are confirmed a second time.

#### The 128-token cached floor — a trap for the C2 diagnostics

**Both routes report exactly 128 cached tokens on a genuinely cold call**, against a prefix
freshly salted so neither had ever seen it. Whatever those 128 tokens are, they are **not our
prefix** — most plausibly fixed chat-template scaffolding shared by every request to the model,
though the cause is `[unverified]` and the design does not depend on it.

The consequence is concrete and belongs in C2: **`cachedTokens > 0` is not evidence that your
prefix cached.** A diagnostic phrased that way reports success on every request to this
provider, including ones that cached nothing of yours. The honest signal is cached tokens as a
**fraction of input tokens**, or materially above a per-provider floor — 128/4822 is 2.7% and
means nothing; 4800/4822 is 99.5% and means everything. §9's checks must be written in the
ratio, not the raw count, and R-c applies: where the floor is unknown, say so rather than
assuming zero.

#### Cost: indicative, not measured

Cost fell ~4.9× on Chat Completions and ~4.7× on Responses for near-identical input. That is
strong directional evidence the cached-input discount is large, and it is **not a measurement**:
output tokens varied between the two calls (reasoning 129 → 111, and 202 → 132), so the drop is
not attributable to caching alone. Treat it as motivation for C1, not as a discount rate; the
rate stays `[unverified]` per OQ-2.

**OQ-2 — is a second research pass a gate on C3? — ✅ RESOLVED 2026-09-17: not a gate on C3,
but a wanted input to C2.**

The recommendation stands, on a stronger footing than it was written with. Caller-supplied is
permanent **not because we lack numbers** but because Anthropic's *verified* minimums are
non-monotonic (512 on Opus 5, 4096 on Opus 4.6 and Haiku 4.5) — so even perfect knowledge does
not collapse to a per-provider constant. A second pass cannot change §7's shape.

**One thing changed, and it points at C2 rather than C3.** The xAI run (OQ-1) found a
**128-token cached floor on a cold call**, which means a cache-effectiveness check must be
phrased as a ratio against a per-provider floor. Verified floors are therefore a genuine input
to §9's checks in a way they are not to the emit path. Run the second pass before C2 ships if
it is cheap; **C3 waits on nothing**, and R-c covers the gap either way — an unknown floor is
reported as unknown, not assumed to be zero.

**OQ-3 — does `prompt_cache_key` land in C1 or C3? — ✅ RESOLVED 2026-09-15: C3.**

The design recommended C1 with a caveat. Decided the other way, for two reasons.

The argument offered for C1 — that the lever is valuable and low-risk — is an argument about
the *feature*, not about *sequencing*. C1 earns its place first by being provably inert: it
reads fields off responses we already receive. A slice whose safety needs a caveat in the PR
description is no longer the inert slice, and inertness is the whole of C1's claim.

There is also a concrete short-term regression available, which "no failure mode worse than a
cache miss" understates. Traffic that shares one implicit cache namespace today gets
**partitioned** the moment a per-tenant key starts being sent. That is correct long-run and a
hit-rate *drop* immediately after deploy — precisely the shape that would be misread as "C1
broke caching" on the one slice built to be above suspicion.

C3 changes the wire anyway, and by then C1's usage reporting exists to measure the
partitioning as it happens.

**OQ-4 — is Anthropic's top-level auto-cache worth exposing? — ✅ RESOLVED 2026-09-17: not in
C3.**

The recommendation stands, and the OQ-1 run supplies an argument it did not have. Auto-cache's
whole selling point is *no breakpoint bookkeeping* — and §5 has us doing that bookkeeping
anyway, deliberately, because letting a provider choose which breakpoints survive picks the
worst ones. Meanwhile the xAI run shows explicit placement against a stable prefix caching
**99.5%** of input. So auto-cache buys nothing on the path this design builds, and costs one
of the four slots.

If it ever lands it is an explicit caller opt-in on the multi-turn paths only, never a
default, and it reopens §6.2's `reserved` arithmetic.

**OQ-5 — is C1's per-adapter usage extraction one stream or two? — ✅ RESOLVED 2026-09-17: one
stream. Do not split.**

Decided against this section's own suggested narrowing, for a reason the section did not reach.

The size argument is weak on inspection: §8's table is now **six** rows (xAI split into its two
routes once OQ-1 showed they use different field names), but they are six rows of *data
mapping*, not six pieces of logic. And the streaming path is where the silent failure is
**worst**, because continuations repeat the prefix most.

The decisive argument is a soundness one. Splitting leaves a window in which
`IAiCompletionUsage` exists on the non-streaming path and is absent on streaming responses —
and a caller cannot distinguish *"streaming does not report usage"* from *"not implemented
yet"*. **That is exactly the three-way ambiguity the required `reports` discriminator exists to
kill** (F4, §8). A split would reintroduce, at the slice boundary, the defect the type's central
design decision was made to prevent.

---

## 13. Gates this design commits to

Standard repo gates per `CODING_STANDARDS.md` § *Pre-PR Validation Checklist*, plus the two
this change specifically triggers:

- **Repo-wide `rush test`, not just `rush rebuild`.** Every addition is optional, so nothing
  fails to compile — but C1 changes what `IAiCompletionResponse` *carries* and C3 changes
  what the adapters *send*. That is a widened behaviour with no moved signature, which
  `CODING_STANDARDS.md` names as precisely the class a compiler cannot see.
- **Caller enumeration for the offset split.** C3 moves `system` from a string to content
  blocks inside the Anthropic adapter. Per `TESTING_GUIDELINES.md` § *"100% coverage cannot
  see a predicate that is never called"*, the tests that matter are the ones that assert the
  **request body** — verifying that the blocks concatenate back to the original `system`
  byte-for-byte, and that `cache_control` lands on the intended block. A response-side test
  cannot see either.
- **The live harness of §8 runs before C3 is called done**, with its prediction recorded
  first, and its actual output pasted into `result.md`.

---

## 14. Pre-C1 verification pass — 2026-09-18

**Why this section exists.** §§0–13 declare the design ready for phase C. This is an
independent re-verification of its code-anchored claims against the branch as merged
(`609dcfb2`, carrying `release` @ `dbe028ea`), run before any implementation starts.

**Outcome: no falsification.** Every claim in §0 and every code-anchored claim in §§4–9
holds. Three additions follow. **A1 is bookkeeping; A2 and A3 change phase C** — A2 opens a
new question after §12 closed the previous five, and A3 resizes C1.

### Line-citation drift

§0's citations were taken before `release` was merged in. Recorded here rather than edited in
place, because they were right when written and will drift again:

| cited in §0 | on `609dcfb2` |
|---|---|
| `completionClient.ts:504` — `system: prompt.system` | **520** |
| `completionClient.ts:745` — `usesResponsesApi` | **773** |
| `model.ts:876` — `AiApiFormat` | **874** |
| `model.ts:922` — `IAiCompletionResponse` | **920** |
| `model.ts:1383` — `IAiEmbeddingResult.usage?` | **1369** |
| `registry.ts:282-287` — `xai-grok` | **274-280** |
| `structuredOutputTypes.ts:68` — `IAiStructuredOutputCapability` | 68 (unmoved) |
| `completionClient.ts:384` — the "both route through the Responses API" comment | **moved**; the line now holds `buildOpenAiResponsesUserContent`. F3's conclusion is unaffected and OQ-1 has since settled it by live run |

Substance re-checked and unchanged: the greenfield grep (only `crypto-utils` ephemeral-key
hits, all in tests); `IPromptSection`'s `start` / `chars` / `measured` / `kind` / `source` /
`winningScope`; `IPromptComposition.unavailable`; `ICandidateMatchTraceEntry.matchType` and
`.conditions`, so D2 remains checkable from data the resolve already holds; `IPromptSlot`
carrying no `cacheStability`; `IPromptResolveRequest.composition?` as the opt-in precedent;
`IAiCompletionResponse` still exactly `{ content, truncated, structuredOutput }`.

### A1 — §9's sequencing gate is discharged, and more cleanly than the brief expected

§9 closes with *"C3 should sequence after that stream lands."* **`ai-assist-thinking-anchoring`
shipped via #667** and its artifacts are now in-tree at
`.ai/tasks/completed/2026-09/ai-assist-thinking-anchoring/`. That sentence is now history
rather than a gate, and an implementer reading §9 cold would otherwise conclude C3 is blocked.

The stronger half is in that stream's own scorecard: it declared `completionClient.ts` and
`streamingClient.ts` in scope and **needed a change in neither**, because the Anthropic emit
site already gated on `anthropicEffort !== undefined`. The file collision the brief warned
about ("expect a rebase") never materialized. C3's request-assembly path is unblocked and
uncontended.

**The semantic coupling §9 names is untouched by this** — a mid-conversation effort change
still invalidates the message cache, and `reasoning_effort_changed` is still one of OpenAI's
nine miss reasons. §9's instruction to document the coupling wherever effort is settable
stands, and now has a concrete new destination: #667 added `'none'` to the *generic* effort
vocabulary, which is a new, provider-oblivious way for a caller to vary effort per turn.

### A2 — a token-accounting collision with `ai-assist-thinking-events`. **OQ-6 — ✅ RESOLVED 2026-09-18**

> **Resolved as recommended.** `IAiCompletionUsage` is the token-accounting home;
> `thinkingTokens` belongs inside it as a field `ai-assist-thinking-events` adds. The decision
> is recorded where that stream will actually read it — its own `docs/WORKSTREAMS.md` entry,
> whose "token accounting" bullet previously said the opposite — rather than only here.
>
> One qualification to this section's ordering argument: it frames the fix as a race
> (*"whichever stream ships first sets the shape"*), but `ai-assist-thinking-events` is 🟡
> **ready, not started**, so there is no race to lose. The real risk is a cold start months
> from now reading a ledger entry that told it to add a sibling. That is why the ledger edit,
> not the merge timing, is the load-bearing half.

`docs/WORKSTREAMS.md` lists `ai-assist-thinking-events` as 🟡 **ready**, and its declared
scope includes, verbatim:

> - Non-streaming response shape: `thinking?: string` field (or similar) on `IAiCompletionResponse`
> - Token accounting (`thinkingTokens?: number` on response)

C1's central deliverable is `IAiCompletionResponse.usage?: IAiCompletionUsage`.
Thinking-events plans a **second, parallel token-accounting home on the same interface**.

**What makes this structurally invisible rather than merely overlapping:** this stream's
ledger entry lists *"the `ai-assist-thinking-events` surface"* as out-of-scope, and
thinking-events' entry claims token accounting as its own — `ai-assist-thinking-anchoring`'s
entry confirms that assignment by listing token accounting as out-of-scope *because it belongs
to thinking-events*. So each brief correctly defers to the other, and **neither owns the
relationship between `usage` and `thinkingTokens`.** Nothing in either stream's gates would
catch it; both would go green shipping `usage.outputTokens` and a sibling `thinkingTokens`
describing the same generation with no stated relationship — the *"absence is three-ways
ambiguous"* defect §8 was built to remove, reintroduced from outside §8's reach.

**Recommendation, for the stream owner to accept or reject:** `IAiCompletionUsage` is *the*
token-accounting home on `IAiCompletionResponse`, and `thinkingTokens?: number` belongs
**inside it** as a field thinking-events adds — not beside it. Output-token accounting and
input-token accounting are one concern; `reports` already exists to say what a given wire
shape can and cannot fill, and thinking tokens are exactly the per-provider-optional figure
that discriminator is for. This costs thinking-events one field's worth of coordination and
costs this stream nothing.

**Ordering consequence, and it is the actionable half.** Whichever stream ships first sets the
shape. If C1 is first it establishes the container and `thinkingTokens` is a field; if
`thinkingTokens` is first it establishes a sibling and the container becomes a migration.
**This is an argument for C1 not waiting**, and for saying so in C1's PR description so
thinking-events inherits the decision rather than rediscovering it.

### A3 — C1 is validator-widening, not field-reading. This resizes the slice

§2's table describes C1 as *"reads fields off responses we already receive."* The
cannot-make-anything-worse property survives intact — admitting an optional field rejects
nothing that was accepted before, so C1 is still the safe slice. But the phrasing understates
the work, and §12's OQ-5 was decided on that phrasing.

**`grep -c usage completionClient.ts streamingClient.ts` returns `0` and `0`.** No completion
path parses any usage field today. Each provider has a hand-written wire interface plus a
`Validators.object` validator that simply does not declare `usage`, so the block is discarded
at validation. C1 is therefore, per response shape, a wire interface **plus** a validator entry
**plus** a mapper — across `openAiResponse` (188), `responsesApiResponse` (226),
`geminiResponse` (275), the Anthropic path, and the streaming client. **Five sites, not one.**
§8's five-row table is the output spec, not the work estimate.

**OQ-5 should be re-read against this**, and the natural cut is by response shape rather than
by streaming-vs-non-streaming.

**One site is a design decision rather than a volume one.** The Anthropic completion path has
**no validator at all**: it reads `(jsonResult.value as Record<string, unknown>).content` and
`.stop_reason` (`completionClient.ts:581-582`) and hand-checks them with `Array.isArray` /
`typeof === 'string'`. That is the shape `CODE_REVIEW_CHECKLIST.md` names as a **Priority-1**
anti-pattern, in shipped code. Adding two more hand-checked reads for
`cache_read_input_tokens` and `cache_creation_input_tokens` would deepen it, and C1's own
layer-1 review would flag it.

**C1 should introduce an `anthropicResponse` validator** matching the `openAiResponse` /
`geminiResponse` pattern already in the same file, and read usage off it. That converts a
pre-existing anti-pattern into the file's own convention, on the one path that has to change
anyway. It is additive, it is the `/type-safe-validation` discipline, and it is a scope
expansion worth approving deliberately rather than having an implementer discover mid-slice.

**And the extraction template is more complete than F4 recorded.** F4 cites
`IAiEmbeddingResult.usage?` as the *reporting* template. `embeddingClient.ts` also supplies
the *extraction* template end to end: an `IOpenAiEmbeddingUsage` wire interface, an
`openAiEmbeddingUsage.optional()` validator entry, and a `toEmbeddingUsage` mapper — including
the rule §8 needs, that an all-fields-absent usage block maps to `undefined` rather than to a
zero-filled object. C1 should follow it rather than re-derive it.

### What this pass does not change

Every decision in §§1–13 stands, and every one of §12's five closures stands. The three-level
closed vocabulary with provenance, the two-homes-plus-precedence rule, the ≤2-breakpoint
derivation that makes the shared four-cap unreachable, offsets rather than blocks at the
`ai-assist` boundary, no `prompt_cache_options` on OpenAI, model-keyed thresholds with
"unknown" first-class, and Gemini explicit `CachedContent` deferred — all unaffected. The
open-question count goes from zero back to one: **OQ-6**.

---

## 15. C2 implementation findings — 2026-09-18

C2 (diagnostics + vocabulary, `@fgv/ts-prompt-assist` only) shipped via PR #669. Implementation
surfaced two corrections to §0/§4's factual claims and opens one new question — **OQ-7**, below —
that C3 should read before placing breakpoints on a preface.

**§4's premise for preface stability does not match the tree.** §4 says *"Preface and template
text come from checked-in files."* True for template (the candidate body). False for preface:
`IPromptSafetyPolicy.antiJailbreakPreface` is `(descriptor: IPromptDescriptor) => Result<string>`
(`types/safety.ts`) — a **consumer-supplied callback invoked fresh on every resolve**, not file
content the library reads. C2 still treats a `'preface'` section as `'frozen'` by default (per
§4's actual instruction, independent of the premise that justified it), on a narrower, explicit
assumption: the callback is a **deterministic function of `descriptor`** — same trust the design
already places in template body content, which nothing here verifies either. There is no trace
data to check this against; unlike D1/D2, there is no refutation path for a preface that breaks
the assumption.

**OQ-7 — should an unannotated preface default to `'frozen'` or `'per-request'`? ✅ RESOLVED
2026-09-18 (C3): neither blanket default — an explicit third option on `IPromptSafetyPolicy`.**
Copilot's review raised this independently, three times across #669's review rounds, and the
disagreement is real rather than a nitpick: a dynamic preface treated as `'frozen'` is exactly the
design's worst case (§1) — a false-frozen prefix that never cache-hits, silently, forever. But the
reverse default is not free either: `'per-request'` would make **every** resolve with a preface
report `'cache-hostile-ordering'` against any stable content that follows it (the preface is
always section 0, so anything more stable after it is an upward transition) — for what is very
likely the common, correct shape (fixed framing text, then stable instructions). Neither default
is strictly safer once usability is weighed.

**Decided as recommended, not overruled.** `IPromptSafetyPolicy.antiJailbreakPrefaceStability?:
PromptCacheStability` — an explicit, optional declaration beside `antiJailbreakPreface`, giving the
policy author the same call-site-style override slots every other stability claim already has
(§4). **Default, when omitted, is `'frozen'`** — preserving C2's shipped behavior for every
existing caller (no silent behavior change for a stream that predates this option) — but a policy
author who knows their callback varies its output (per-descriptor text, a rotated warning,
anything short of a pure function of `descriptor`) can now say `'per-request'` or
`'per-conversation'` and get the honest treatment instead of the risky default.

This is not a refutable claim, unlike D1/D2's slot-level checks: `antiJailbreakPreface` is a
consumer-supplied callback invoked fresh on every resolve with no trace of what it returned on a
prior resolve, so there is still no resolve-time evidence to check a declared value against — the
`'stability-refuted'` finding never fires for a preface section, declared or defaulted, exactly as
before. The declaration is advisory-trusted, the same trust already placed in Mustache template
body content and now made an explicit, overridable assumption rather than a hard-coded one.

Implemented in `ts-prompt-assist`: `IPromptSafetyPolicy.antiJailbreakPrefaceStability?` (types/safety.ts),
threaded through `PromptLibrary._buildComposition` into
`IPromptCacheStabilityAnalysisParams.prefaceStability?` (default `'frozen'` inside
`analyzePromptCacheStability`), consumed by `effectiveSectionStability`'s `'preface'` branch.

**D1 needed a field the design's own text assumed already existed.** §9 describes D1 as "a
counter on an existing loop" over `bindingMerger.ts`'s scope walk, but the count was never
surfaced past that function before C2 — `IBindingTraceEntry` had no field for it
(`chainBindingCount?: number`, added in C2, set only when `source === 'binding'`). Not a
falsification of §9 — the counter genuinely was on an existing loop — but the surfaced count
was not, and "a counter on an existing loop" undersold the work by exactly that gap. Recorded
here as the same class of drift §14 tracked for C1: right when written, worth re-verifying
before the next slice reads it as settled.

**A resource-bound slot's stability is unverifiable, not merely unverified — treated
accordingly.** Neither §4 nor §9 discusses `kind: 'resource'` slot bindings, whose value comes
from a full recursive `PromptLibrary.resolve` of an inner prompt with its own qualifier context
and its own trace (`resourceBindingResolutions[].innerTrace`). C2 does not recurse into that
inner trace — doing so correctly would need the same D1/D2/D4/D5 analysis run at every nesting
level, which is a real feature, not a bug fix, and out of scope here. Instead, any
better-than-`'per-request'` claim on a resource-bound slot is refuted unconditionally. This is
more conservative than the analogous D1 multi-scope check (which only refutes when there is
*positive* evidence of ≥2 candidate bindings) — here the absence of any way to gather that
evidence is itself treated as refuting evidence, per the governing asymmetry. A future slice
that threads recursive analysis through would be a genuine capability increase, not a bug fix to
this one.
