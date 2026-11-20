# Design — ai-assist model-alias layer

Phase A design. No code ships. Every registry claim is cited `file:path:line`.

## 0. Context & forcing function

The ai-assist registry pins **dated, concrete provider model snapshots** in two places:

- `IAiProviderDescriptor.defaultModel` — a `ModelSpec` (`model.ts:748-749`), per-provider, keyed by
  `ModelSpecKey = 'base' | 'tools' | 'image' | 'thinking' | 'embedding'` (`model.ts:461`). Gemini's
  is `{ base: 'gemini-2.5-flash', image: 'gemini-2.5-flash-image', embedding: 'gemini-embedding-001' }`
  (`registry.ts:80-84`).
- `DEFAULT_MODEL_CAPABILITY_CONFIG.perProvider` — `idPattern` rules that derive a model's capability
  set from its id (`registry.ts:427-472`), e.g. `/^gemini-2\.5/ → ['chat','tools','vision','thinking']`
  (`registry.ts:451`).

A single concrete model resolves at **four call-time chokepoints**, all of the identical shape
`resolveModel(modelOverride ?? descriptor.defaultModel, context)`:

- completion — `apiClient.ts:716`
- streaming — `streamingClient.ts:133`
- image generation — `apiClient.ts:1331`
- embedding — `embeddingClient.ts:394`

`resolveModel` (`model.ts:527-549`) walks the `ModelSpec` by context key and returns a **bare string**
that flows straight to the wire (`apiClient.ts:622` Gemini URL `…/models/${config.model}:generateContent`;
`apiClient.ts:743` `config.model`). There is **no indirection** between that string and the provider
API today — when Google retires `gemini-2.5-flash`, every default call 404s until someone hand-edits
`registry.ts`. The proximate pain is already on record: the OpenAI testbed scenario had to abandon the
`gpt-4o` default and explicitly pin `gpt-5.1` because `gpt-4o` is not reasoning-capable
(`docs/FUTURE.md:118`; `.ai/tasks/completed/2026-06/per-provider-testbed-scenarios/result.md:16`).

This design adds **one fgv-owned alias indirection** between the resolved `ModelSpec` string and the
wire, so `defaultModel` and consumers reference a stable alias that maps — in one central, scannable
place — to the current concrete model.

There is **no existing alias mechanism** in the packlet (`grep -ri alias` over the packlet is empty),
so this is greenfield and additive.

---

## 1. Alias scheme (the central fork, resolved)

### The fork

- **(A) Uniform fgv namespace** — fgv coins an alias for every provider role, e.g. `gemini:flash`,
  `gemini:pro`, `gemini:flash-image`. One mental model; one place to maintain; wraps even providers
  that already ship good native aliases.
- **(B) Provider-native where it exists** — lean on each provider's own stability guarantee where one
  exists (Anthropic accepts undated `claude-sonnet-4-6` server-side; `docs/FUTURE.md:118`), fall back to
  an fgv coin only where it doesn't (Gemini has no stable line alias). Honours provider conventions;
  inconsistent surface; consumers must know which providers have native aliases.

### Recommendation — **a hybrid that needs no product call**

**Adopt a uniform fgv-namespaced alias as the consumer-facing surface, and let the alias _target_ be a
provider-native alias wherever one exists.** Consumers always write one shape; the map's right-hand side
is whatever is most stable for that provider.

```
'@anthropic:sonnet'        -> 'claude-sonnet-4-6'              # RHS is Anthropic's native undated alias
'@google-gemini:flash'     -> 'gemini-3.5-flash'              # RHS is a concrete/preview id (no native alias)
```

Both the consumer-facing uniformity of (A) and the delegate-to-the-provider leverage of (B) are kept:
fgv owns one chokepoint and one syntax, but does **not** reinvent snapshot-tracking for providers that
already do it well — for those, fgv's RHS is the provider's own alias and the maintenance burden stays
with the provider. The fork dissolves; no orchestrator escalation is needed.

### Sigil: leading `@`, separator `:` → `@<providerId>:<role>`

The sigil choice is **load-bearing for back-compat** (§2). The rule: a model string is an fgv alias
**iff it begins with `@`**. Everything else is a raw provider model id and passes through untouched.

Why a leading `@` rather than a bare `:` separator (`gemini:flash`):

- **No real model id starts with `@`** on any of the nine providers (`model.ts:559-568`), so the sigil is
  an unambiguous "resolve me" marker with zero collision surface.
- **Ollama / openai-compat use `:` inside raw model ids** — `llama3.2:3b`, `qwen2.5:7b-instruct`. A bare
  `:`-as-sigil scheme would mis-parse `llama3.2:3b` as alias-provider `llama3.2`, role `3b`. The leading
  `@` sidesteps this entirely: `llama3.2:3b` has no `@`, so it is a raw id and passes through. (Even so,
  resolution is registry-gated — see §2 — so an unregistered `@…` is the only thing that can fail.)
- **Typos fail loudly.** `@google-gemini:flsh` is unmistakably alias-intent; resolution fails with a
  clear error rather than silently sending a bogus string to the wire. A bare-string scheme cannot tell
  a typo'd alias from a (possibly valid) raw id.

The provider id is included in the alias (`@google-gemini:flash`, not bare `@flash`) even though the
provider is already known from the descriptor at resolution time. Rationale: it makes `defaultModel`
and consumer config self-documenting and copy-paste-safe across providers, and it lets a future
cross-provider helper validate `alias.provider === descriptor.id`. The redundancy is cosmetic; the map
is still looked up per-descriptor.

`<role>` is a short, fgv-stable token: `flash`, `pro`, `flash-lite`, `flash-image`, `embedding`,
`reasoning`, `sonnet`, `opus`. Roles are an fgv vocabulary, **not** a provider concept — that is the
whole point (they outlive snapshots).

### All four providers under this scheme

| Provider (`id`) | Native alias story | fgv alias posture |
|---|---|---|
| **Anthropic** (`anthropic`) | Ships undated server aliases (e.g. `claude-sonnet-4-6`). The registry today pins the **dated** snapshot `claude-sonnet-4-5-20250929` (`registry.ts:66`), not an undated alias. | fgv aliases **optional**; RHS = the native undated alias (delegate tracking to Anthropic). Lowest priority. |
| **Google Gemini** (`google-gemini`) | **No** stable line alias; replacements are `-preview` ids that churn. | fgv aliases **required** — fgv owns the tracking. **First migrated provider** (§4). |
| **OpenAI** (`openai`) | `gpt-4o` is undated but **not reasoning-capable** — the proximate pain. `chatgpt-4o-latest` exists but is chat-only. | fgv aliases **high-value**: e.g. `@openai:reasoning -> gpt-5.1`. Good early adopter (§5). |
| **xAI** (`xai-grok`) | `grok-4.3` reasonably stable, already the default for base/tools/thinking (`registry.ts:264-268`). | fgv aliases **low urgency**; adopt when a churn event forces it. |

(Self-hosted `ollama` / `openai-compat` and `groq` / `mistral` covered in §5.)

---

## 2. Resolution model + back-compat

### Where the map lives — an additive optional field on the descriptor

Add an optional `aliases` field to `IAiProviderDescriptor`. This composes with the existing
per-descriptor capability-array pattern (`imageGeneration` `model.ts:799`, `embedding` `model.ts:816`)
and travels with **custom** descriptors a consumer constructs, so the alias concern is local to the
provider that owns it. Descriptors are hand-authored consts (`registry.ts:44`), **not**
converter-validated (only `IAiAssistProviderConfig` / `IAiAssistSettings` are converted —
`converters.ts:179-197`), so this is a pure type+data addition with no converter change required.

```typescript
/**
 * Canonical fgv alias → concrete provider model map. Keys are full fgv aliases
 * (`@<providerId>:<role>`); values are the current concrete model id (or a
 * provider-native alias). Additive; absence means "this provider defines no aliases".
 * @public
 */
export interface IModelAliasMap {
  readonly [alias: string]: string;
}

// added to IAiProviderDescriptor (model.ts):
readonly aliases?: IModelAliasMap;
```

A module-level sibling const was considered (one central object keyed by provider id). It is rejected:
it would **not** travel with custom descriptors, splitting the source of truth between the descriptor
and a parallel map. The descriptor field keeps a provider's metadata in one object — consistent with
how `imageGeneration` / `embedding` already live on the descriptor.

### The resolver — `Result`-returning, registry-gated

```typescript
/**
 * Marker for an fgv alias: a model string that should be resolved through
 * the alias layer rather than sent to the wire verbatim.
 * @public
 */
export const MODEL_ALIAS_SIGIL = '@';

/**
 * Resolve a single (possibly-aliased) model string against a descriptor.
 * - No leading sigil → raw id, returned verbatim (back-compat).
 * - Leading sigil + registered → the concrete target.
 * - Leading sigil + unregistered → fail loudly (typo / unknown alias).
 * @public
 */
export function resolveModelAlias(descriptor: IAiProviderDescriptor, model: string): Result<string>;

/**
 * The full provider model-resolution chokepoint: ModelSpecKey walk THEN alias
 * resolution. Replaces the bare `resolveModel(... )` call at the four sites.
 * @public
 */
export function resolveProviderModel(
  descriptor: IAiProviderDescriptor,
  modelOverride: ModelSpec | undefined,
  context?: ModelSpecKey
): Result<string>;
```

Reference semantics (illustrative, not implementation):

```
resolveModelAlias(descriptor, model):
  if not model.startsWith(MODEL_ALIAS_SIGIL): return succeed(model)        // raw id passthrough
  const target = descriptor.aliases?.[model]
  if target === undefined:
    return fail(`provider "${descriptor.id}": unknown model alias "${model}"`)
  return resolveModelAlias(descriptor, target)   // one-hop indirection allowed (alias → native alias)

resolveProviderModel(descriptor, modelOverride, context):
  const resolved = resolveModel(modelOverride ?? descriptor.defaultModel, context)  // existing model.ts:527
  if resolved.length === 0: return fail(`provider "${descriptor.id}": no model resolved; …`)
  return resolveModelAlias(descriptor, resolved)
```

Note the recursion permits **one indirection hop** (`@fgv-alias → provider-native-alias`, the Anthropic
case). A native alias like `claude-sonnet-4-6` has no `@`, so the recursion terminates immediately on
the next call. A guard against an `@`→`@` cycle (depth cap or visited-set) is a trivial implementation
detail flagged here for the implementer.

### When resolution happens — call-time, at the four chokepoints

Resolution is **call-time**, not registry-build-time. The four sites change from:

```typescript
const model = resolveModel(modelOverride ?? descriptor.defaultModel, modelContext); // today
```
to:
```typescript
const modelResult = resolveProviderModel(descriptor, modelOverride, modelContext);
if (modelResult.isFailure()) { return fail(modelResult.message); }
const model = modelResult.value;
```

Call-time is correct because: (a) the registry stays a pure data structure (no build-time
transform that would hide the alias from inspection / serialization); (b) custom descriptors with
custom aliases resolve through the identical code; (c) the **proxy path resolves server-side with the
same function** — `callProxiedCompletion` ships `modelOverride` (which may be an alias) plus
`providerId` to the proxy (`apiClient.ts:1844-1846`), and the server reconstructs the descriptor via
`getProviderDescriptor(providerId)` (`registry.ts:333`) whose built-in `aliases` then resolve. (Caveat:
the proxy reconstructs from `providerId` only, so a consumer's *custom* descriptor aliases do not cross
the proxy boundary — an existing proxy limitation, not introduced here; documented.)

Consolidating the four sites onto the single `resolveProviderModel` helper also **removes the current
duplicated `resolveModel(... ) + length===0` check** (`apiClient.ts:716-721`, `streamingClient.ts:133-137`,
`apiClient.ts:1331-1336`, `embeddingClient.ts:394`) into one place — a net simplification.

### Composition with `ModelSpecKey`

Alias resolution is strictly **downstream** of the `ModelSpecKey` walk. `resolveModel` picks the
branch (`base`/`image`/`thinking`/`embedding`/`tools`) and yields a string that **may be an alias**;
`resolveModelAlias` then maps it to concrete. An alias can live in any branch:
`{ base: '@google-gemini:flash', image: '@google-gemini:flash-image' }`. Order is fixed: spec-key first,
alias second. `ModelSpec`/`resolveModel` are untouched.

### Composition with the `idPattern` capability rules

The `idPattern` rules (`registry.ts:427-472`) run against **concrete, provider-native** model ids:
they classify the strings returned by a provider's list endpoint (`IAiModelInfo.id` `model.ts:1325`),
which are never aliases. So:

- **`listModels` / capability detection is unaffected** — it already sees concrete ids; aliases never
  reach it.
- Wherever a resolved model id feeds a capability lookup (`resolveImageCapability` `registry.ts:367`,
  `resolveEmbeddingCapability` `registry.ts:403`), it must be the **post-alias concrete id**. Because
  alias resolution happens at the chokepoint *before* the model is handed to those lookups (the image
  path resolves at `apiClient.ts:1331` then matches capability downstream), the ordering already holds —
  the design only requires that the chokepoint resolves the alias first, which `resolveProviderModel`
  guarantees.

The alias layer therefore **does not touch** the `idPattern` machinery; the patterns remain a separate
maintenance axis (§3).

### Back-compat rule (hard requirement)

Raw model IDs **MUST** still be accepted unchanged. Guaranteed structurally by the sigil:

- Any string **without** a leading `@` is returned verbatim by `resolveModelAlias` — including every
  current `defaultModel` value, every `modelOverride`, and self-hosted `model:tag` ids.
- The change is **additive**: no current caller passes an `@`-prefixed string, so no existing behaviour
  changes. The only new failure mode is an `@`-prefixed string that isn't a registered alias — which is
  by construction new input (a typo or an unknown alias), correctly surfaced as a loud `Result.fail`
  rather than a silent bad wire call.

---

## 3. Staleness / maintenance story

### A future Google line-bump — the goal: one edit + a testbed run

When Google bumps the flash line (`gemini-3.5-flash` → say `gemini-4-flash`):

1. **Edit one map value** in the Gemini descriptor's `aliases`:
   `'@google-gemini:flash': 'gemini-4-flash'` (`registry.ts`, one line).
2. **Run the Gemini per-provider testbed scenario** against the live API to confirm the new id answers
   (§ testbed below).

Zero consumer changes (consumers reference `@google-gemini:flash`). Zero `defaultModel` changes (it
already references the alias). This is the headline win.

### What still needs manual upkeep (honest accounting — the alias layer does NOT fix these)

The alias layer fixes **selection/default churn**. It does **not** fix:

1. **The `idPattern` capability rules** (`registry.ts:447-453`). When `gemini-3.x` becomes the
   thinking-capable line, the rule `/^gemini-2\.5/ → [...,'thinking']` (`registry.ts:451`) must gain a
   `/^gemini-3/` sibling, or new 3.x models get only the base `/^gemini-/ → ['chat','tools','vision']`
   set (`registry.ts:452`) and are mis-classified as non-thinking. This is capability *detection*, a
   different axis from model *selection*; aliases don't touch it.
2. **The typed `*ModelNames` unions** used by the layered-options `models?` filters —
   `GeminiThinkingModelNames = 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite'`
   (`model.ts:1405`), `Imagen4ModelNames` (`model.ts:1021-1024`), `GeminiFlashImageModelNames`
   (`model.ts:1027`). These enumerate concrete ids for compile-time ergonomics and must track real ids
   on a deprecation. (A follow-on could additively allow aliases in these `models?` arrays; out of scope
   here.)
3. **Adding a new role** (not just bumping an existing one) is a map *addition* plus, usually, a
   `defaultModel`/consumer reference — more than one line, by definition.

Calling these out is itself a deliverable: the layer's value is precisely bounded, and the doc must not
over-claim that one map edit covers capability detection or the typed unions (it does not).

### Testbed verification — does the alias resolve to a *live* model?

Only a live API call can prove an alias maps to a model that actually answers. The per-provider testbed
scenarios already make exactly that call and already pin a model per scenario
(`.../per-provider-testbed-scenarios/result.md:14-16`). The verification step:

- **Switch each scenario's model pin from the concrete id to the fgv alias** (e.g. Gemini scenario pins
  `@google-gemini:flash`). The live run then exercises `resolveProviderModel` →
  `resolveModelAlias` → concrete id → real wire call.
- **A green run proves the alias resolves to a live model.** Add a one-line log/assert of the resolved
  concrete id (e.g. `logger.info('resolved @google-gemini:flash -> ' + model)`) so the run is
  self-documenting and a reviewer can see *which* concrete id answered.

This makes the testbed the standing canary: when Google retires a line, the scenario goes red, the map
gets one edit, the scenario goes green — the maintenance loop is closed and observable.

---

## 4. Gemini migration through the layer (first migrated provider)

### The alias map entries

```typescript
// in the google-gemini descriptor (registry.ts):
aliases: {
  // NOTE: the base flash line is at 3.5 while pro / flash-lite / flash-image are at 3.1 — this is
  // NOT a typo. The targets come verbatim from Google's official deprecation table (brief.md): the
  // flash base line advanced to 3.5 while the other roles are on the 3.1 generation. The per-role
  // version split is exactly why the alias layer exists — consumers never see these numbers.
  '@google-gemini:flash':        'gemini-3.5-flash',               // base  (was gemini-2.5-flash, shutdown 2026-10-16)
  '@google-gemini:pro':          'gemini-3.1-pro-preview',         // thinking (was gemini-2.5-pro, 2026-10-16)
  '@google-gemini:flash-lite':   'gemini-3.1-flash-lite',          // thinking (was gemini-2.5-flash-lite, 2026-10-16)
  '@google-gemini:flash-image':  'gemini-3.1-flash-image-preview', // image (was gemini-2.5-flash-image, 2026-10-02)
  '@google-gemini:embedding':    'gemini-embedding-001'            // NOT deprecated — aliased for uniformity only
}
```

### `defaultModel` after migration

Today (`registry.ts:80-84`):
```typescript
defaultModel: { base: 'gemini-2.5-flash', image: 'gemini-2.5-flash-image', embedding: 'gemini-embedding-001' }
```
After:
```typescript
defaultModel: {
  base:      '@google-gemini:flash',
  thinking:  '@google-gemini:pro',           // DECIDED: Pro is the default thinking-tier model
  image:     '@google-gemini:flash-image',
  embedding: '@google-gemini:embedding'
}
```

There is **no explicit `thinking` key** in Gemini's `defaultModel` today, so a thinking-context call
currently falls back to `base` via `resolveModel` (`model.ts:538`). **Decision (confirmed): add an
explicit `thinking: '@google-gemini:pro'` key.** Pro is the reasoning-tier model; letting thinking fall
back to the flash base line would repeat the `gpt-4o`-not-reasoning-capable mistake that drove the
testbed to bypass the default (`result.md:16`). The `flash-lite` alias is still defined so consumers
who want the cheaper thinking tier can reference it explicitly.

### Imagen retirement → converge on `gemini-3.1-flash-image-preview`

- Default image generation selects via `defaultModel.image`, now `@google-gemini:flash-image` →
  `gemini-3.1-flash-image-preview`. That concrete id is matched by the Gemini **catch-all**
  `gemini-image-out` capability rule (`modelPrefix: ''`, `registry.ts:120-129`), which routes chat-style
  `:generateContent` and accepts reference images — exactly right for the flash-image model. So default
  image gen converges on the surviving model with **no capability-rule change required**.
- The `imagen-4.0-ultra-` / `imagen-` capability rules (`registry.ts:100-119`) become **dead for default
  usage** (nothing resolves to an `imagen-*` id any more). **Decision (confirmed): remove the entire
  deprecated Imagen surface now.** All `imagen-4.0-*` are being shut down (~2026-06/08), and leaving
  routing for retired models is cruft on an active surface (`ACTIVE_DEVELOPMENT.md`: "Do not leave dead
  code 'just in case'"). The package is **prerelease**, so the breaking change is absorbed now rather
  than deferred. The full removal set:
  - the two `imagen-*` entries in the Gemini `imageGeneration` array (`registry.ts:100-119`);
  - `Imagen4ModelNames` (`model.ts:1021-1024`);
  - `IImagen4GenerationConfig` (`model.ts:1080-1095`) and `IImagen4ModelOptions` (`model.ts:1158-1163`),
    plus the `IImagen4ModelOptions` member of the `IModelFamilyConfig` union (`model.ts:1196-1202`);
  - their `index.ts` exports.

  (The `gemini-imagen` value of `AiImageApiFormat` — `model.ts:592-597` — and the `'imagen-…'` cleanup
  in `imageOptionsResolver.ts` should be swept in the same pass; the implementer greps for residual
  `imagen` references before deleting the format value, in case another provider path references it.)

---

## 5. Breadth — generic design, migrate Gemini now, others incremental

**Confirmed.** The recommendation is: ship the generic layer (descriptor `aliases` field + `@` sigil +
`resolveModelAlias` / `resolveProviderModel`), migrate **Gemini now** (§4), and let other providers
adopt **additively** — adding an `aliases` block + switching their `defaultModel` to aliases is a
self-contained, non-breaking change per provider, gated only by that provider's own churn pressure.

Per-provider gotchas:

- **OpenAI** — highest next value. `gpt-4o` default (`registry.ts:183`) is undated but not
  reasoning-capable; the testbed already had to bypass it with an explicit `gpt-5.1`
  (`result.md:16`). A `@openai:reasoning -> gpt-5.1` (or current) alias + a `thinking` key in
  `defaultModel` would fix the proximate pain directly. Note the typed `OpenAiThinkingModelNames`
  (`model.ts:1390-1399`) is the parallel manual axis.
- **Anthropic** — the registry default is the **dated** `claude-sonnet-4-5-20250929` (`registry.ts:66`);
  Anthropic also accepts the undated `claude-sonnet-4-6` server-side (`docs/FUTURE.md:118`). fgv aliases
  optional; RHS delegates to the native undated alias. Lowest priority. **Gotcha:** adopting
  `@anthropic:sonnet → claude-sonnet-4-6` is an **implicit model-version upgrade** (4-5 → 4-6), not just
  a snapshot-tracking swap — pick the alias target deliberately (stay on 4-5 vs. move to 4-6) rather than
  treating it as a no-op.
- **xAI** — `grok-4.3` already stable across base/tools/thinking (`registry.ts:264-268`); adopt on a
  future churn event only.
- **Self-hosted `ollama` / `openai-compat`** — the **`:`-in-model-id gotcha** that drove the `@` sigil
  choice (§1). Aliases are generally N/A (the caller picks the model; `defaultModel: ''`
  `registry.ts:168,249`). The sigil rule guarantees `llama3.2:3b`-style ids pass through untouched. If a
  deployment *wants* aliases, the same `aliases` field works on a custom descriptor.
- **`groq` / `mistral`** — Mistral uses native `-latest` aliases (`mistral-large-latest`
  `registry.ts:153`); Groq pins `llama-3.3-70b-versatile` (`registry.ts:139`). Low urgency; adopt
  additively if churn forces it.

---

## 6. Illustrative interface / type surface (additive; no implementation)

```typescript
// model.ts — additive
export interface IModelAliasMap { readonly [alias: string]: string; }              // @public
export const MODEL_ALIAS_SIGIL = '@';                                              // @public
// IAiProviderDescriptor gains:  readonly aliases?: IModelAliasMap;

// registry.ts (or a new resolveModel sibling) — additive
export function resolveModelAlias(
  descriptor: IAiProviderDescriptor, model: string
): Result<string>;                                                                  // @public

export function resolveProviderModel(
  descriptor: IAiProviderDescriptor,
  modelOverride: ModelSpec | undefined,
  context?: ModelSpecKey
): Result<string>;                                                                  // @public
```

Exports added to `index.ts` (`IModelAliasMap`, `MODEL_ALIAS_SIGIL`, `resolveModelAlias`,
`resolveProviderModel`). No sibling re-exports; no removed/renamed existing exports except the
Imagen-retirement removals in §4 (permitted on the active surface). `ModelSpec`, `resolveModel`,
`ModelSpecKey`, `IAiProviderDescriptor` (existing fields) are unchanged.

---

## 7. Tiered implementation plan

**Tier 1 — alias-layer core (generic, no behaviour change to defaults).**
- Add `IModelAliasMap`, `MODEL_ALIAS_SIGIL`, `IAiProviderDescriptor.aliases?` to `model.ts`.
- Add `resolveModelAlias` + `resolveProviderModel` (with `@`→`@` cycle guard) alongside `resolveModel`.
- Swap the four chokepoints (`apiClient.ts:716`, `streamingClient.ts:133`, `apiClient.ts:1331`,
  `embeddingClient.ts:394`) onto `resolveProviderModel`, collapsing the duplicated `length===0` checks.
- Export the new surface from `index.ts`.
- Tests: raw-id passthrough (no `@`), registered alias → concrete, unregistered `@alias` → fail,
  one-hop indirection (alias → native alias), Ollama `model:tag` passthrough, proxy server-side
  resolution. **No `defaultModel` changes yet** — proves the layer is inert until aliases are added.

**Tier 2 — Gemini migration.**
- Add the Gemini `aliases` block (§4); switch Gemini `defaultModel` to aliases, **including the explicit
  `thinking: '@google-gemini:pro'` key** (decided).
- Remove the retired `imagen-*` capability rules (`registry.ts:100-119`), `Imagen4ModelNames`
  (`model.ts:1021-1024`), `IImagen4ModelOptions` (`model.ts:1158-1163`) and their `index.ts` exports.
- Update `GeminiThinkingModelNames` (`model.ts:1405`) and the `/^gemini-2\.5/` idPattern
  (`registry.ts:451`) for the 3.x line (the manual axis from §3).

**Tier 3 — docs + testbed.**
- Switch the Gemini per-provider testbed scenario pin to `@google-gemini:flash` (+ thinking scenario to
  `@google-gemini:pro`) and add the resolved-id log line (§3).
- Update `LIBRARY_CAPABILITIES.md` ai-assist entry + the packlet README with the alias scheme and the
  "one map edit + testbed run" maintenance loop.
- Run the live-API testbed to confirm the new Gemini ids answer.
- File the residual manual-upkeep axes (idPattern + `*ModelNames`) as a `TECH_DEBT.md` note if not fully
  closed.

(Optional Tier 4, separate stream — OpenAI adoption: `@openai:reasoning -> gpt-5.1`, the next-highest
value per §5.)

---

## 8. Acceptance criteria

- [ ] `rushx build` passes in `@fgv/ts-extras`.
- [ ] `rushx lint` passes (load-bearing — not transitively run by build; `CODING_STANDARDS.md`).
- [ ] `rushx test` passes with **100% coverage**.
- [ ] `rushx fixlint` run before the final commit.
- [ ] No `any`; all fallible operations return `Result<T>`; unknown→typed via Converters where any
      untyped input is introduced (none expected — aliases are authored consts).
- [ ] **api-extractor regenerated** (new public exports: `IModelAliasMap`, `MODEL_ALIAS_SIGIL`,
      `resolveModelAlias`, `resolveProviderModel`; Imagen-removal deletions reflected in the `.api.md`).
- [ ] **Raw-model-ID back-compat preserved** — a test asserts every current `defaultModel` value and an
      arbitrary `modelOverride` (including an Ollama `model:tag`) resolves to itself unchanged.
- [ ] **Cycle guard tested** — `resolveModelAlias` over a cyclic `@→@` map (e.g. `@p:a → @p:b → @p:a`)
      returns a `Result.fail` and does **not** exhaust the stack.
- [ ] **Live-API testbed run confirms the new Gemini ids answer** through the alias layer (Gemini base
      via `@google-gemini:flash`; thinking via `@google-gemini:pro` if adopted).
- [ ] `code-reviewer` run on the final diff; findings resolved or dispositioned.
- [ ] Copilot review loop driven by implementer; stopped on diminishing returns or 10-round cap.

---

## 9. Decisions (resolved — no open questions)

All three product questions are settled:

1. **Default Gemini thinking model — DECIDED: add `thinking: '@google-gemini:pro'` to `defaultModel`**
   (Pro is the reasoning-tier model; flash-as-thinking-default would repeat the `gpt-4o` mistake). See §4.
2. **Deprecated Imagen surface — DECIDED: remove it now.** Full removal set enumerated in §4. The package
   is prerelease, so the breaking change (the `Imagen4*` typed surface + `gemini-imagen` routing) is
   absorbed now. Implementer greps for residual `imagen` references before deleting the
   `AiImageApiFormat` value, in case another path references it.
3. **Map location — DECIDED: the descriptor field** (`IAiProviderDescriptor.aliases?`), not a central
   module const. The field is central per-provider *and* travels with custom descriptors a consumer
   constructs (the const cannot); it composes with the existing `imageGeneration` / `embedding`
   capability-array pattern already on the descriptor. See §2.
