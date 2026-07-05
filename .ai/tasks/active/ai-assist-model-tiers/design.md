# Design — ai-assist model quality-tier layer + OpenAI/Anthropic alias adoption

Phase A design. **No code ships; no registry edits.** Interface signatures are illustrative only. Every
registry/model claim is cited `file:path:line` against the current tree on `claude/ai-assist-model-tiers`.

Builds directly on the shipped alias layer (`.ai/tasks/completed/2026-06/ai-assist-model-aliases/`): the
`@<providerId>:<role>` sigil (`model.ts:580`), `IModelAliasMap` (`model.ts:566`),
`resolveModelAlias` (`model.ts:628`) and `resolveProviderModel` (`model.ts:649`) already exist and Gemini
is already migrated (`registry.ts:80-96`). This design adds **one new axis** (quality tiers) on top of
that layer and **adopts** the layer for OpenAI + Anthropic.

---

## 0. Context — what exists today

**The spec/key machinery.**
- `ModelSpecKey = 'base' | 'tools' | 'image' | 'thinking' | 'embedding'` (`model.ts:461`);
  `allModelSpecKeys` (`model.ts:467-473`); `MODEL_SPEC_BASE_KEY = 'base'` (`model.ts:479`).
- `ModelSpec = string | IModelSpecMap` (`model.ts:503-510`).
- `resolveModel(spec, context?)` (`model.ts:527-549`) walks the spec: string → verbatim; else
  `context in spec` → recurse; else `'base' in spec` → recurse base; else first value.
- `resolveProviderModel(descriptor, modelOverride, context?)` (`model.ts:649-661`) = `resolveModel` THEN
  `resolveModelAlias`. This is the single chokepoint the four call sites use.

**The four call-time chokepoints and the context each passes:**
- completion — `apiClient.ts:716`, context = `hasThinkingConfig ? 'thinking' : hasTools ? 'tools' : undefined` (`apiClient.ts:714`)
- streaming — `streamingClient.ts:133`, context derived identically (`streamingClient.ts:131`)
- image — `apiClient.ts:1242`, context = `'image'` (literal)
- embedding — `embeddingClient.ts:394`, context = `'embedding'` (literal)

**Capability detection** is a *separate* axis: `DEFAULT_MODEL_CAPABILITY_CONFIG.perProvider`
(`registry.ts:419-465`) is a list of `idPattern` rules; `deriveCapabilities` **accumulates capabilities
across every matching rule** (`apiClient.ts:1446-1458`, `caps.add` in a loop — *not* first-match-wins).
This detail is load-bearing for Q5.

**The typed `*ModelNames` unions** (`model.ts:1129`, `1132`, `1458-1492`) are a third axis: compile-time
enumerations used only by the `models?` applicability filters in the layered options blocks. Aliases and
tiers do not touch them; they must be advanced by hand when a default id changes (README `registry.ts:79-81`).

Provider descriptors today:
- **OpenAI** (`registry.ts:168-233`): `defaultModel: { base: 'gpt-4o', image: 'dall-e-3', embedding: 'text-embedding-3-small' }` (`registry.ts:175`); **no `aliases` block**; image caps = `gpt-image-` / `dall-e-3` / `dall-e-2` / catch-all (`registry.ts:193-232`).
- **Anthropic** (`registry.ts:59-72`): `defaultModel: 'claude-sonnet-4-5-20250929'` (bare string, `registry.ts:66`); no `aliases`; no image/embedding capability arrays (Anthropic has no image/embedding endpoint per `LIBRARY_CAPABILITIES.md`).
- **Gemini** (`registry.ts:73-123`): already tiered-adjacent — `defaultModel` has `base`/`thinking`/`image`/`embedding` keys pointing at aliases (`registry.ts:80-85`); `aliases` block present (`registry.ts:86-96`).

---

## Q1 — `ModelSpecKey` extension

**Recommendation: add `'advanced' | 'frontier'` to the `ModelSpecKey` union (`model.ts:461`) and append
both to `allModelSpecKeys` (`model.ts:467-473`). Purely additive; no consumer breaks.**

```typescript
// model.ts:461 — after
export type ModelSpecKey = 'base' | 'advanced' | 'frontier' | 'tools' | 'image' | 'thinking' | 'embedding';

// model.ts:467 — after
export const allModelSpecKeys: ReadonlyArray<ModelSpecKey> = [
  'base', 'advanced', 'frontier', 'tools', 'image', 'thinking', 'embedding'
];
```

**Why it's safe — every consumer audited:**

1. **`modelSpecKey` converter (`converters.ts:150-151`)** is `Converters.enumeratedValue<ModelSpecKey>(allModelSpecKeys)`
   — data-driven off `allModelSpecKeys`. Adding the two values makes the converter *accept* `advanced`/`frontier`
   keys automatically; it never rejects previously-valid input. A consumer config
   (`IAiAssistProviderConfig.model`, `converters.ts:183`) may now legally carry tier keys, and existing configs
   (which have none) are unaffected.
2. **`modelSpec` recursive converter (`converters.ts:160-169`)** constrains map keys via
   `Converters.recordOf(self, { keyConverter: modelSpecKey })` (`converters.ts:164`) — inherits the same
   data-driven behavior. *(Minor doc drift: the fallback error string at `converters.ts:166` enumerates
   "base, tools, image" — a P3 cosmetic update to list the new keys; not load-bearing.)*
3. **No `switch` over `ModelSpecKey`** exists in the packlet — the only consumers are `index.ts:77-80`
   (re-export), `converters.ts:39-40` (the two converters above), and `resolveProviderModel`'s `context`
   param (`model.ts:652`). `grep` for `ModelSpecKey` returns exactly these sites; none is an exhaustive
   switch that a new member would silently break.
4. `MODEL_SPEC_BASE_KEY` (`model.ts:479`) is unchanged — `base` remains the required floor and the
   universal fallback.

There is **no exhaustiveness obligation** anywhere, so the union widening is a pure addition.

---

## Q2 — Cascade resolver semantics

**Recommendation: teach `resolveModel` (`model.ts:527`) a per-context *ordered fallback list*. Tier keys
get a multi-step cascade (`frontier → advanced → base`, `advanced → base`); every other context keeps its
current flat `context → base` behavior. Alias resolution stays strictly downstream in
`resolveProviderModel` and is untouched.**

### The change

Introduce a small cascade table and replace the single "try context, else base" step with a walk over an
ordered candidate list:

```typescript
// model.ts — additive, module-private
const TIER_FALLBACK: { readonly [k: string]: ReadonlyArray<ModelSpecKey> } = {
  base:     ['base'],
  advanced: ['advanced', 'base'],
  frontier: ['frontier', 'advanced', 'base']
};

export function resolveModel(spec: ModelSpec, context?: string): string {
  if (typeof spec === 'string') {
    return spec;
  }
  // Ordered candidate keys for this context:
  //  - a tier key → its cascade (frontier→advanced→base, advanced→base)
  //  - any other key (tools/image/thinking/embedding) → just [context]
  //  - undefined → [] (falls straight to the base step below — unchanged)
  const order: ReadonlyArray<string> =
    context === undefined ? [] : (TIER_FALLBACK[context] ?? [context]);
  for (const key of order) {
    if (key in spec) {
      return resolveModel(spec[key]);        // recurse into the branch (nested-spec safe)
    }
  }
  // Existing flat fallbacks, preserved verbatim:
  if (MODEL_SPEC_BASE_KEY in spec) {         // modality→base and undefined→base
    return resolveModel(spec[MODEL_SPEC_BASE_KEY]);
  }
  const first = Object.values(spec)[0];      // last-resort first value
  /* c8 ignore next 3 */
  if (first === undefined) { return ''; }
  return resolveModel(first);
}
```

### Why this composes cleanly (the four properties that matter)

- **Tier cascade is the only new behavior.** For `context === 'frontier'` the order is
  `['frontier','advanced','base']`; the first present key wins. For `'advanced'` it is `['advanced','base']`.
  This is exactly the locked semantics (brief §2).
- **Modality keys are unchanged.** For `context === 'image'` the order is `['image']`; the loop finds
  `image` or falls to the *existing* trailing `base` step — byte-for-byte the current behavior
  (`model.ts:533-539`). Same for `tools`/`thinking`/`embedding`.
- **`undefined` context is unchanged.** Order is `[]`; control drops straight to the trailing `base` step —
  identical to today. Every current non-tool/non-thinking completion (`apiClient.ts:714` yields `undefined`)
  resolves `base` exactly as now.
- **Nested-spec & alias recursion is unchanged.** Each hit recurses `resolveModel(spec[key])` with no
  context (picks the branch's own `base`), matching current nested handling. The returned string may be a
  bare id *or an `@` alias* — either way it flows out of `resolveModel` untouched and
  `resolveProviderModel` (`model.ts:654-660`) runs `resolveModelAlias` on it afterward. **Ordering is fixed:
  spec-walk first, alias second.** The cascade lives entirely in the spec-walk half; the alias half never
  changes.

### Edge cases (all resolve correctly)

| Case | Spec | `context` | Result | Why |
|---|---|---|---|---|
| Base-only map, tier requested | `{ base: 'X' }` | `frontier` | `X` | order `[frontier,advanced,base]`; only `base` present → back-compat |
| Advanced set, frontier requested | `{ base:'B', advanced:'A' }` | `frontier` | `A` | cascade stops at `advanced` |
| Tier value is a nested spec | `{ base:'B', frontier:{ base:'F' } }` | `frontier` | `F` | recurse `resolveModel({base:'F'})` → base branch |
| Tier value is an alias | `{ base:'B', frontier:'@openai:pro' }` | `frontier` | `@openai:pro` (→ concrete downstream) | spec-walk returns the alias; `resolveModelAlias` resolves it in `resolveProviderModel` |
| Frontier requested, only advanced+base | `{ base:'B', advanced:'A' }` | `advanced` | `A` | direct hit |
| Modality unchanged | `{ base:'B', image:'I' }` | `image` | `I` | order `[image]` |

### Alternative considered & rejected

*Keep `resolveModel` untouched; implement the cascade in `resolveProviderModel` by calling `resolveModel`
per candidate key.* Rejected: `resolveModel` collapses a missing tier to `base` and returns a bare string,
so the caller **cannot tell** "frontier was present" from "frontier fell back to base" without a separate
key-presence probe — reintroducing exactly the branching the table removes. Putting the ordered walk inside
`resolveModel` (which already has the spec in hand) is the clean seam. The brief also scopes the change to
`model.ts:527`, confirming this placement.

---

## Q3 — Tier × modality interaction (scoping)

**Confirmed v1 decision: combining a tier with a modality (e.g. "the frontier *thinking* model") is OUT OF
SCOPE. Tiers select the text-completion default; modality keys select their modality; the cascade applies
only among the three tier keys. State this explicitly; the forward path is a 2-D context, noted below.**

### Why this is forced, not just chosen

`resolveModel`/`resolveProviderModel` take a **single** `context: ModelSpecKey` (`model.ts:652`). Tiers and
modality keys are peers in one flat enum (Q1), so a caller selects exactly one. More concretely, the
completion/streaming chokepoint already derives a **single** `modelContext` and modality already claims it:

```typescript
const modelContext = hasThinkingConfig ? 'thinking' : hasTools ? 'tools' : undefined;  // apiClient.ts:714
```

There is no room in this expression for a second axis. Making "frontier thinking" work would require
`modelContext` to become a *pair* (tier × modality) and `resolveModel` to do a 2-D lookup — a materially
larger change than the locked scope.

### The v1 wiring (illustrative — the resolver already supports it; the entry-point param is Phase B)

The resolver designed in Q2 already accepts `context='advanced'|'frontier'`. What's missing is a
caller-facing way to *request* a tier. The v1 plumbing gives **modality precedence** and lets the tier
select the plain-completion default:

```typescript
// illustrative Phase-B change at apiClient.ts:714 / streamingClient.ts:131
const modelContext =
  hasThinkingConfig ? 'thinking'
  : hasTools        ? 'tools'
  : (params.tier ?? undefined);   // 'advanced' | 'frontier' | undefined; only bites for plain completions
```

This yields precisely the locked semantics: a bare completion with `tier: 'frontier'` resolves the frontier
cascade; a *thinking* or *tools* call ignores the tier (modality wins) and resolves its modality key with
the flat `→ base` fallback. Because base is now itself a strong reasoning-capable model (Q4/Q5), the
thinking-falls-back-to-base path is safe — it no longer repeats the `gpt-4o`-not-reasoning-capable mistake
that drove the testbed to bypass the default (alias design §0; `docs/FUTURE.md:118`).

### Forward path (if combination is ever needed)

Promote `context` to a structured `{ tier?: TierKey; modality?: ModalityKey }` and give `resolveModel` a
two-stage lookup (modality branch first, tier cascade within it). That is a clean additive evolution — the
tier cascade table (Q2) is reusable as the inner walk — but it is explicitly **not** v1. No current or
planned consumer needs "frontier thinking"; the four chokepoints each map to one axis.

---

## Q4 — Per-provider `aliases` blocks + `defaultModel`

**Decision on role vocabulary: keep the shipped Gemini convention of *model-line semantic* role names
(`flash`, `pro`, …), NOT tier-named roles. Roles are per-provider model identities; tiers are cross-provider
spec-key slots; `defaultModel` wires slot → role. This is exactly the pattern the brief confirms for Gemini
("`pro` … double-duties as the `advanced` tier").**

Rationale for semantic roles over tier-named roles (`@openai:advanced`):
- Mirrors the shipped precedent verbatim (`registry.ts:91-95` are all model-line roles) — one vocabulary.
- **Decouples alias identity from tier slot.** Re-slotting a model (e.g. promoting the mini line to advanced)
  becomes a one-line `defaultModel` edit, not an alias rename that would ripple to every `modelOverride`
  that references the alias.
- Lets one role serve multiple slots (Gemini `pro` = both `thinking` and `advanced`) without duplication.

Anthropic has **no image/embedding endpoints** (`LIBRARY_CAPABILITIES.md`: "xAI and Anthropic declare no
embedding capability"; no `imageGeneration`/`embedding` arrays on its descriptor, `registry.ts:59-72`) → text
tiers only.

### OpenAI (new `aliases` block + tiered `defaultModel`)

Replace `defaultModel` (`registry.ts:175`) and add an `aliases` block:

```typescript
// openai descriptor (registry.ts:168-233)
defaultModel: {
  base:      '@openai:mini',       // gpt-5.4-mini  (was 'gpt-4o' — EOL-behind)
  advanced:  '@openai:flagship',   // gpt-5.5
  frontier:  '@openai:pro',        // gpt-5.5-pro
  image:     '@openai:image',      // gpt-image-1.5 (was 'dall-e-3' — EOL 2026-05-12)
  embedding: '@openai:embedding'   // text-embedding-3-small (unchanged, aliased for uniformity)
},
aliases: {
  '@openai:mini':      'gpt-5.4-mini',            // base tier
  '@openai:flagship':  'gpt-5.5',                 // advanced tier  (gpt-5.5-2026-04-23)
  '@openai:pro':       'gpt-5.5-pro',             // frontier tier  (may be access-gated — canary)
  '@openai:nano':      'gpt-5.4-nano',            // NON-tier alias; modelOverride only
  '@openai:image':     'gpt-image-1.5',           // image (org-verification risk — canary)
  '@openai:embedding': 'text-embedding-3-small'   // NOT deprecated — aliased for uniformity
},
```

`gpt-5.1` is deliberately absent — it was **retired March 2026** (brief §Model-ID reference).

### Anthropic (new `aliases` block + tiered `defaultModel`)

`defaultModel` today is a bare string (`registry.ts:66`); promote to a tiered map with **no `frontier` key**
(cascades to advanced = opus per Q2):

```typescript
// anthropic descriptor (registry.ts:59-72)
defaultModel: {
  base:     '@anthropic:sonnet',   // claude-sonnet-5  (was 'claude-sonnet-4-5-20250929')
  advanced: '@anthropic:opus'      // claude-opus-4-8
  // no frontier → requesting frontier cascades advanced→opus
},
aliases: {
  '@anthropic:sonnet': 'claude-sonnet-5',            // base tier
  '@anthropic:opus':   'claude-opus-4-8',            // advanced tier
  '@anthropic:haiku':  'claude-haiku-4-5-20251001',  // NON-tier alias; modelOverride only
  '@anthropic:fable':  'claude-fable-5'              // NON-tier alias; modelOverride only
},
```

No `thinking`/`image`/`embedding` keys: Anthropic completions are all text; base (sonnet-5) and advanced
(opus-4-8) are both thinking-capable, so a `thinking`-context call flat-falls to base safely.

### Gemini (extend existing block)

Aliases already carry `flash` and `pro` (`registry.ts:91-92`) — **no new alias entries needed**. The
extension is one `defaultModel` key: add `advanced` pointing at the existing `pro` alias (which already
serves `thinking`, `registry.ts:82`). Frontier stays unset → cascades to advanced = pro.

```typescript
// google-gemini descriptor defaultModel (registry.ts:80-85) — after
defaultModel: {
  base:      '@google-gemini:flash',
  advanced:  '@google-gemini:pro',        // NEW — reuses the existing pro alias (registry.ts:92)
  thinking:  '@google-gemini:pro',        // unchanged
  image:     '@google-gemini:flash-image',
  embedding: '@google-gemini:embedding'
  // no frontier → cascades advanced→pro
}
// aliases block (registry.ts:86-96) unchanged
```

*(The brief's phrase "extend Gemini's alias block with tier entries" resolves to this single `defaultModel`
key — Gemini's roles already exist, so no alias-map addition is required. Called out so the implementer
doesn't add a redundant `@google-gemini:advanced` alias.)*

### Resulting cross-provider tier table (all via the alias layer)

| slot | OpenAI | Anthropic | Gemini |
|---|---|---|---|
| `base` | `@openai:mini` → gpt-5.4-mini | `@anthropic:sonnet` → claude-sonnet-5 | `@google-gemini:flash` → gemini-3.5-flash |
| `advanced` | `@openai:flagship` → gpt-5.5 | `@anthropic:opus` → claude-opus-4-8 | `@google-gemini:pro` → gemini-3.1-pro-preview |
| `frontier` | `@openai:pro` → gpt-5.5-pro | *(unset → advanced/opus)* | *(unset → advanced/pro)* |

---

## Q5 — New model-ID capability detection (targeted subset)

Audit of each new default id against the two manual axes. **The accumulate-all-matching-rules behavior
(`apiClient.ts:1446-1458`) is what makes broadening safe and makes the one gap real.**

### idPattern rules (`registry.ts:419-465`)

| New id | Matching rule(s) | Result | Edit? |
|---|---|---|---|
| `gpt-5.4-mini` (base) | `/^gpt-5/` (`registry.ts:425`) | chat, tools, vision, thinking | **none** |
| `gpt-5.5` (advanced) | `/^gpt-5/` | chat, tools, vision, thinking | **none** |
| `gpt-5.5-pro` (frontier) | `/^gpt-5/` | chat, tools, vision, thinking | **none** |
| `gpt-5.4-nano` (alias) | `/^gpt-5/` | chat, tools, vision, thinking | **none** |
| `gpt-image-1.5` (image) | `/^gpt-image/` (`registry.ts:423`) | image-generation | **none** |
| `text-embedding-3-small` | `/^text-embedding/` (`registry.ts:424`) | embedding | **none** |
| `claude-opus-4-8` (advanced) | `/^claude-opus-4/` (`registry.ts:448`) + `/^claude-/` (`registry.ts:450`) | chat, tools, vision, thinking | **none** |
| `claude-sonnet-5` (base) | **only** `/^claude-/` (`registry.ts:450`) — `/^claude-sonnet-4/` (`registry.ts:449`) does NOT match `sonnet-5` | chat, tools, vision **(no thinking)** | **REQUIRED** |

**The one required idPattern edit — `claude-sonnet-5` is mis-detected as non-thinking.** Because detection
accumulates, the fix is a pure addition of the thinking capability to the sonnet-5+ line. Two options:

- **(Recommended) Broaden the existing rule:** `/^claude-sonnet-4/` → `/^claude-sonnet-/` (`registry.ts:449`).
  Since detection accumulates and `sonnet-4` ⊂ `sonnet-`, every current sonnet-4 id still matches; sonnet-5+
  now *also* gains thinking. Net effect is additive (never removes a capability). More durable — covers
  future sonnet lines with no further edit.
- (Alternative) Insert a new rule `/^claude-sonnet-5/ → [chat,tools,vision,thinking]` before the catch-all.
  Strictly additive but needs another edit at sonnet-6.

**For symmetry/durability, optionally broaden `/^claude-opus-4/` → `/^claude-opus-/` (`registry.ts:448`)**
too — `claude-opus-4-8` already matches, so this is not *required* by the locked ids, but it future-proofs
the opus line identically. Flagged as a judgment call; recommend taking it in the same edit since it's the
same one-character-class change and keeps the two Claude reasoning lines parallel.

**Dead-rule removal (the intentional break — see Q6):** `/^dall-e/ → ['image-generation']`
(`registry.ts:422`) becomes dead once nothing resolves to a `dall-e-*` id. Remove it with the dall-e
capability entries.

### Typed `*ModelNames` unions (`model.ts`)

These gate the `models?` applicability filters in the layered options blocks — a compile-time ergonomic, not
a runtime path. Targeted additions so a caller can name the new tier models in a `models?` filter:

| Union | Current | Edit |
|---|---|---|
| `OpenAiThinkingModelNames` (`model.ts:1468-1477`) | includes `'gpt-5.5'` (`model.ts:1476`); **lacks** `gpt-5.5-pro` | **add `'gpt-5.5-pro'`.** *(Judgment call: also add `'gpt-5.4-mini'`/`'gpt-5.4-nano'` — they are the new base/nano defaults and thinking-capable; recommend adding `'gpt-5.4-mini'` since it is the shipped base default a caller may want to name, keeping nano optional.)* |
| `AnthropicThinkingModelNames` (`model.ts:1458-1462`) | `4-5`,`4-6`,`opus-4-6`,`opus-4-7` | **add `'claude-sonnet-5'` and `'claude-opus-4-8'`.** |
| `GptImageModelNames` (`model.ts:1132`) | `'gpt-image-1'` only | **add `'gpt-image-1.5'`** (additive; lets `IGptImageModelOptions.models` name it, `model.ts:1229`). |

`GeminiThinkingModelNames` (`model.ts:1483-1486`) already lists the current Gemini ids — **no edit**
(Gemini's tier reuses existing aliases). `XAiThinkingModelNames` untouched (xAI not in scope).

**Scope discipline:** these are the *targeted* subset the new ids force. This design does **not** attempt the
broader "retire the manual `idPattern`/`*ModelNames` axes" refactor (README `registry.ts:79-81` records it as
standing tech-debt); it does only what the five new ids require to classify correctly.

---

## Q6 — Back-compat analysis

**Bare-string `defaultModel` and base-only maps behave exactly as today; the sole intentional break is the
dead dall-e capability removal, on the active surface.**

### What is provably unchanged

- **Bare-string spec** (e.g. today's Anthropic `'claude-sonnet-4-5-20250929'`, `registry.ts:66`; groq
  `registry.ts:131`; the empty-string self-hosted defaults `registry.ts:52,160,241`): `resolveModel`
  returns the string at the first line (`model.ts:528-530`) regardless of context — the cascade table is
  never consulted. Identical to today.
- **Base-only map, no tier requested:** `context` is a modality or `undefined`; the cascade table only fires
  for tier keys, so resolution falls to the existing `base` step (Q2). Identical.
- **Base-only map, tier requested:** cascade walks `[frontier,advanced,base]`, only `base` present → returns
  base. This is *new input* (no caller passes a tier today) resolving to the safe floor — additive, not a
  behavior change to any existing call.
- **Alias layer:** untouched. Raw ids still pass through `resolveModelAlias` verbatim (`model.ts:588-590`);
  `@`-prefixed strings still resolve or fail loudly. Every current `modelOverride` and self-hosted
  `model:tag` id is unaffected.
- **`ModelSpecKey` widening (Q1):** no exhaustive switch exists; the converter only gains acceptance.

### The one intentional break — dead DALL·E capability removal

DALL·E 2/3 support ended **2026-05-12** (brief §5) and nothing resolves to a `dall-e-*` id after the OpenAI
`image` default advances to `@openai:image → gpt-image-1.5` (Q4). Mirroring the shipped Gemini Imagen
retirement (alias design §4), remove the dead surface. **Removal set:**

- Registry: the `dall-e-3` (`registry.ts:206-215`) and `dall-e-2` (`registry.ts:216-225`) entries in the
  OpenAI `imageGeneration` array, and the dead `/^dall-e/` idPattern (`registry.ts:422`). The `gpt-image-`
  entry (`registry.ts:195-204`) and catch-all (`registry.ts:226-231`) stay — `gpt-image-1.5` is matched by
  the `gpt-image-` prefix, **verified, no new entry needed** (brief §5).
- Typed surface (mirrors the Imagen typed-surface removal): `DallEModelNames` (`model.ts:1129`),
  `IDallEImageGenerationConfig` (`model.ts:1148-1155`), `IDallEModelOptions` (`model.ts:1211-1220`) and its
  member of the image-family union, plus their `index.ts` exports.

**Coupling caveat the implementer must handle (wider blast radius than Imagen had):** the DALL·E *size* and
*quality* primitives feed the aggregate public unions —
`AiImageSize = DallE2Size | DallE3Size | GptImageSize` (`model.ts:1117`) and
`AiImageQuality = DallE3Quality | GptImageQuality` (`model.ts:1126`). Removing `DallE2Size`/`DallE3Size`
(`model.ts:1108-1111`) / `DallE3Quality` (`model.ts:1120`) **narrows those aggregate unions** — a breaking
type change beyond the capability entries. Two dispositions:

- **(Recommended) Full removal, accept the narrowing.** Consistent with `ACTIVE_DEVELOPMENT.md` ("do not
  leave dead code 'just in case'") and the Imagen precedent. The active surface absorbs the break now. The
  implementer **greps for residual `dall-e` / `DallE` references** before deleting (same discipline the
  Imagen removal used) — in particular any validator/`imageOptionsResolver` path keyed on the DALL·E family.
- (Fallback) If a residual consumer of `AiImageSize`/`AiImageQuality` on the DALL·E members surfaces, keep
  the standalone size/quality *type primitives* (harmless string-literal unions) and remove only the
  capability entries + `DallEModelNames`/`IDallEModelOptions` (the routing surface). Surface this to the
  orchestrator if the grep finds such a consumer.

No other export is removed or renamed. All new public surface (`advanced`/`frontier` in the union, the new
alias entries, the `*ModelNames` additions) is additive; **api-extractor must be regenerated** to reflect
the union widening, the tier keys, and the dall-e deletions.

---

## Q7 — Tiered Phase-B implementation plan

Sliced so each slice is independently buildable, testable, and reviewable, with its own gates. B1 is
provider-agnostic and ships **no behavior change to any default**; B2–B4 adopt per provider.

**B1 — tier axis + cascade resolver (generic; no registry/default change).**
- `ModelSpecKey` + `allModelSpecKeys` gain `advanced`/`frontier` (Q1); update the `converters.ts:166`
  error string.
- `resolveModel` gains the `TIER_FALLBACK` cascade (Q2).
- Tests: every Q2 edge-case row; base-only-map + tier → base; modality keys unchanged; nested-spec tier;
  alias-valued tier resolves downstream; `undefined` context unchanged. Converter accepts tier keys;
  rejects unknown keys.
- Gates: build, **lint** (load-bearing per `CODING_STANDARDS.md`), test @ 100% coverage, `fixlint`,
  api-extractor. **Proves the axis is inert until a `defaultModel` uses it.**

**B2 — OpenAI adopt + advance + dall-e retirement.**
- Add the OpenAI `aliases` block; switch `defaultModel` to the tiered map (Q4).
- Remove the dead dall-e capability entries + `/^dall-e/` idPattern + DALL·E typed surface, honoring the
  Q6 grep-before-delete + aggregate-union caveat.
- Capability edits: none required for the gpt-5.x/gpt-image ids (Q5); add `gpt-5.5-pro` (+ `gpt-5.4-mini`)
  to `OpenAiThinkingModelNames`, `gpt-image-1.5` to `GptImageModelNames`.
- Tests: `base/advanced/frontier` resolve to the expected concrete ids; frontier→advanced→base cascade;
  image default resolves `gpt-image-1.5` and routes via the `gpt-image-` capability; back-compat of a raw
  `modelOverride`. Gates as B1.

**B3 — Anthropic adopt.**
- Add the Anthropic `aliases` block; promote `defaultModel` from bare string to the tiered map (Q4).
- Capability edit: broaden `/^claude-sonnet-4/ → /^claude-sonnet-/` (required) and optionally
  `/^claude-opus-4/ → /^claude-opus-/` (Q5); add `claude-sonnet-5` + `claude-opus-4-8` to
  `AnthropicThinkingModelNames`.
- Tests: base=sonnet-5, advanced=opus-4-8; **frontier cascades to opus** (no frontier key); `deriveCapabilities`
  test asserting `claude-sonnet-5` now includes `thinking`. Gates as B1.

**B4 — Gemini extend + docs + canary.**
- Add the single `advanced: '@google-gemini:pro'` `defaultModel` key (Q4); confirm no alias-map change.
- Docs: update the packlet README maintenance section (`registry.ts:79-81`) and the `LIBRARY_CAPABILITIES.md`
  ai-assist entry with the tier axis + cascade; note the tier×modality v1 scoping (Q3).
- Tests: Gemini advanced=pro; frontier cascades to pro.
- Run the per-provider live canary (Q8). Gates as B1 **plus** a green canary.

*(B2/B3/B4 are independent after B1 and may parallelize; B1 is the hard prerequisite for all three.)*

---

## Q8 — Live-testbed canary plan

Mirrors the shipped alias canary discipline (alias design §3): only a live API call proves an alias resolves
to a model that answers. Extend each provider's per-provider testbed scenario to exercise the tier cascade
and **log the alias → concrete-id resolution** so a reviewer sees which id answered.

### Per-provider matrix

For each provider, resolve and fire a minimal completion at each defined tier, asserting a 200 + non-empty
body, and log the resolved concrete id:

| Provider | `base` → | `advanced` → | `frontier` → | Notes |
|---|---|---|---|---|
| OpenAI | gpt-5.4-mini | gpt-5.5 | gpt-5.5-pro | + image scenario resolves `@openai:image → gpt-image-1.5` |
| Anthropic | claude-sonnet-5 | claude-opus-4-8 | *(cascades → opus-4-8)* | assert frontier request logs the **advanced** id (cascade proof) |
| Gemini | gemini-3.5-flash | gemini-3.1-pro-preview | *(cascades → pro)* | already-live base/thinking; advanced is the new assertion |

Each scenario emits, e.g., `logger.info('resolved @openai:pro -> gpt-5.5-pro')` so the run self-documents the
alias hop (matching the shipped `@google-gemini:flash -> …` log line).

### Flagged risk IDs (canary must confirm, not assume)

- **`gpt-image-1.5` — OpenAI org-verification.** May require a verified org on the API key; a 403/verification
  error here is an *access* failure, not a resolver bug. The canary must distinguish: log the resolved id,
  then report the HTTP status separately. If org-gated on the test key, mark the image tier
  **canary-blocked** (resolver correct, live access pending) rather than failing the resolver work.
- **`gpt-5.5-pro` — frontier access-gating.** `-pro` tiers are frequently access-gated. Same treatment: a
  resolver-correct + access-denied outcome is a *blocked* canary line, surfaced to the orchestrator, not a
  code failure. The advanced (`gpt-5.5`) and base tiers must answer for the OpenAI adoption to be considered
  live-verified.
- **Anthropic `claude-sonnet-5` / `claude-opus-4-8`.** New line/snapshot ids; a 404 means the id string is
  wrong (advance the alias value) — this is exactly the maintenance loop the alias layer is built to make a
  one-line edit. Confirm both answer; confirm the cascade (frontier request → opus id in the log).
- **Cascade proof (all providers).** At least one provider (Anthropic or Gemini, which leave `frontier`
  unset) must show a `frontier` *request* logging the *advanced* concrete id — the live evidence that the
  multi-step cascade fires end-to-end, not just in unit tests.

A green (or green-modulo-documented-access-gate) canary is the standing regression detector: when a provider
retires a line, the scenario goes red, the alias value gets a one-line edit, the scenario goes green.

---

## Escalation note

No locked decision proved unworkable. The cascade composes cleanly with nested specs and the alias step
(Q2). Two items are surfaced for orchestrator awareness rather than as blockers:

1. **DALL·E typed-surface removal has a wider blast radius than the Imagen precedent** because
   `DallE*Size`/`DallE3Quality` feed the aggregate `AiImageSize`/`AiImageQuality` public unions
   (`model.ts:1117,1126`). Recommended disposition (full removal, accept the narrowing) is in Q6, with a
   grep-gated fallback if a residual consumer surfaces.
2. **`gpt-image-1.5` and `gpt-5.5-pro` may be access-gated** on the canary key (Q8). These are live-access
   risks, not design risks; the canary plan treats a resolver-correct + access-denied outcome as a
   documented *blocked* line, not a failure.
