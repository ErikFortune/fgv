# Design — `ai-assist-prompt-caching`

**Status:** DRAFT — phase B complete, awaiting triage (`/triage-cycle`).
**Date:** 2026-09-08
**Inputs:** `brief.md` (three revisions), `research.md` (phase A), the tree at
`claude/ai-assist-prompt-caching`.

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
| **C1 — observability** | `ts-extras/ai-assist` | — | No. Reads fields off responses we already receive. |
| **C2 — diagnostics + vocabulary** | `ts-prompt-assist` | — | No. Computes and reports; emits nothing. |
| **C3 — emit** | both | C1 **and** C2 | Yes — it changes the wire. |

C1 and C2 are independent of each other and may run in parallel or in either order.
**C3 is gated on both**, and the gate is not bureaucratic: without C1 there is no way to
tell whether C3 works, and the failure mode is silent by construction. Shipping C3 before
C1 means shipping an unverifiable change to the request body.

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

```ts
/** What a provider's wire shape is able to report about caching. @public */
export type AiCacheReportingLevel = 'none' | 'reads' | 'reads-and-writes';

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

### Normalization, per provider

| target | `reports` | `uncachedInputTokens` | `cachedInputTokens` | `cacheWriteTokens` |
|---|---|---|---|---|
| Anthropic Messages | `reads-and-writes` | `usage.input_tokens` (already the remainder) | `usage.cache_read_input_tokens` | `usage.cache_creation_input_tokens` |
| OpenAI Responses | `reads-and-writes` | `usage.input_tokens` **minus** `input_tokens_details.cached_tokens` | `input_tokens_details.cached_tokens` | `input_tokens_details.cache_write_tokens` |
| OpenAI Chat Completions | `reads` | `usage.prompt_tokens` minus cached | `prompt_tokens_details.cached_tokens` | — structurally unfillable |
| Gemini `generateContent` | `reads` | `promptTokenCount` **minus** `cachedContentTokenCount` | `cachedContentTokenCount` | — no write concept |
| xAI (OpenAI-compat) | **OQ-1** | presumed as OpenAI Chat/Responses per route | presumed `prompt_tokens_details.cached_tokens` | **OQ-1** |

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

**OQ-1 — xAI's OpenAI-compat cache surface.** F3 establishes that we reach xAI at
`https://api.x.ai/v1` with `apiFormat: 'openai'`, and that a tools-bearing request routes to
`/responses`. Unknown: whether that endpoint exists on xAI, and what its usage block calls
cached tokens. Blocks the `reports` level for `xai-grok` in §8. **Cheap to settle with one
live request; do it before C1's normalization table is written.**

**OQ-2 — is a second research pass a gate on C3?** Every OpenAI/Gemini/xAI threshold is
`[unverified]` because the prose docs are egress-blocked. *Recommendation: not a gate.*
Caller-supplied is the permanent answer regardless of what a second pass finds (§7), and a
verified number only improves a registry table that already handles its own absence
correctly. A second pass is worth running for its own sake, but nothing waits on it.

**OQ-3 — does `prompt_cache_key` land in C1 or C3?** It needs no vocabulary, no cap, and no
composition, and it is the one lever that materially improves hit rate on a multi-tenant
route. That argues C1. Against: it *changes what we send*, so C1 would lose its "cannot make
anything worse" property, which is the property that justifies shipping C1 first.
*Recommendation: C1, with the caveat stated in the PR description* — it is a routing hint
with no failure mode worse than a cache miss.

**OQ-4 — is Anthropic's top-level auto-cache worth exposing?** The brief establishes it is a
one-line change that makes the bill **worse** on the single-shot path and better on
multi-turn. *Recommendation: not in C3.* If it lands later it must be an explicit caller
opt-in on the multi-turn paths only, never a default — and it consumes one of the four
breakpoint slots, which reopens §6.2's `reserved` arithmetic.

**OQ-5 — is C1's per-adapter usage extraction one stream or two?** Five normalization rows
across four adapters plus the streaming path is not small, and §8's table is the whole of it.
If triage wants C1 narrower, the natural cut is non-streaming first — but note the brief's
silent-failure argument applies to streaming continuations at least as strongly, so a cut
here is a deferral, not a descope.

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
