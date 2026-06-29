# State — ai-assist model-alias layer

## Tier 1

**Branch:** `claude/ai-assist-model-aliases-tier1-oxn6kk` (off `ai-assist-model-aliases`; PR target `ai-assist-model-aliases`).

Tier 1 ships the generic alias-layer core with **no behaviour change to any default** — no
built-in descriptor defines an `aliases` map, so the layer is provably inert (a back-compat
sweep test asserts every current `defaultModel` value resolves to itself).

### What landed

- **`model.ts` (additive):**
  - `IModelAliasMap` (`{ readonly [alias: string]: string }`)
  - `MODEL_ALIAS_SIGIL = '@'`
  - `readonly aliases?: IModelAliasMap` on `IAiProviderDescriptor`
  - `resolveModelAlias(descriptor, model): Result<string>` — no leading `@` → verbatim
    passthrough; `@`+registered → target; `@`+unregistered → loud fail (names provider + alias);
    one indirection hop (fgv alias → provider-native alias); `@`→`@` **cycle guard via visited-set**
    (fails loudly, no stack exhaustion).
  - `resolveProviderModel(descriptor, modelOverride, context?): Result<string>` — the existing
    `resolveModel` `ModelSpecKey` walk THEN `resolveModelAlias`, collapsing the duplicated
    `length === 0` empty-model check into one place.
- **`index.ts`:** exported `IModelAliasMap`, `MODEL_ALIAS_SIGIL`, `resolveModelAlias`,
  `resolveProviderModel`. No sibling re-exports.
- **api-extractor:** `etc/ts-extras.api.md` regenerated with the four new public exports + the
  `aliases?` field (the new `ae-unresolved-link` warnings on the TSDoc `{@link}`s match the 219
  pre-existing warnings of the same class already in the file — e.g. `resolveModel` itself carries
  one; this is the established, build-tolerated namespace-link limitation, not a regression).

### Chokepoints swapped onto `resolveProviderModel`

Grepped every `resolveModel(` call site; swapped all five model-resolution chokepoints (the design
§0 lists four; the fifth — `executeClientToolTurn`'s builder — is the one the design's list omits):

1. `apiClient.ts` — completion (`callProviderCompletion`, was ~716)
2. `apiClient.ts` — image generation (`callProviderImageGeneration`, was ~1331)
3. `streamingClient.ts` — streaming completion (was ~133)
4. `embeddingClient.ts` — embedding (was ~394)
5. `streamingAdapters/clientToolContinuationBuilder.ts` — `executeClientToolTurn` hot client-tool
   path (was ~549, `model ?? resolveModel(descriptor.defaultModel)`) — **the 5th site the design's
   list omits.**

No further `resolveModel(` chokepoints exist beyond these five (the only other `resolveModel`
references are the function's own definition + internal recursion in `model.ts`). Every site took
`resolveProviderModel` cleanly; none required forcing.

### Deviation from design §7 (disclosed)

- The design's reference `resolveProviderModel` uses a single generic empty-model message
  (`provider "…": no model resolved; …`). The image and embedding chokepoints previously emitted
  **role-specific** messages ("no image model resolved" / "no embedding model resolved", each with a
  `(a plain string, or an object with an "image"/"embedding" entry)` hint). Collapsing the four
  duplicated checks onto one helper — which §2 explicitly mandates as "a net simplification" —
  unifies those to the generic message. Two existing test assertions were updated to match
  (`embeddingClient.test.ts`, `apiClient.endpoint.test.ts`: `/no image|embedding model resolved/` →
  `/no model resolved/`). This is the only behaviour-adjacent change; it is on the **failure** path
  only (empty/unset model), never on a successful default resolution, so the "no behaviour change to
  any default" invariant holds. The signature stays exactly as designed (no role/message param
  added).

### Tests (`src/test/unit/ai-assist/modelAlias.test.ts`, new — 30 cases)

Raw-id passthrough (no `@`) · registered alias → concrete · unregistered `@alias` → loud fail ·
no-aliases-map → loud fail · one-hop indirection (alias → native alias) · two-hop alias→alias→concrete ·
direct `@→@` self-cycle → loud fail · multi-step `@→@` cycle → loud fail · Ollama `model:tag` & xAI
`model:tag`-style passthrough (the `:`-collision case) · `resolveProviderModel` ModelSpecKey walk +
base fallback + modelOverride precedence + alias-in-branch + alias-as-override + empty-model fail +
alias-failure propagation · proxy server-side resolution (descriptor reconstructed by id via
`getProviderDescriptor` + alias override) · **inertness sweep** over every built-in descriptor
(every current `defaultModel` resolves to itself) · arbitrary raw `modelOverride` passthrough · assert
no built-in descriptor defines an `aliases` map in Tier 1.

### Gates

- `rushx build` — pass (api-extractor regenerated).
- `rushx lint` — pass.
- `rushx test` — pass, **100% coverage** (all modified source files at 100%).
- `rushx fixlint` — run pre-commit, clean.

### code-reviewer findings

`code-reviewer` run on the final diff. **No P1s** (no `any`, no Result-pattern violations, no unsafe
casts, no throw across boundaries; all chokepoint swaps confirmed to preserve resolution semantics —
including the `clientToolContinuationBuilder` no-context base-key fallback).

- **P2 — doc/impl alignment on hop depth (resolved).** The JSDoc said "one further indirection hop
  allowed" while the visited-set impl follows an arbitrary-length `@`-chain (and a test exercises a
  two-hop chain). Per the design's reference impl (recurse-until-non-`@` + cycle guard; "one hop" is
  the canonical case, not a cap), the docs were walked back to describe what ships: a chain of `@`
  aliases followed until a non-`@` id, visited-set-guarded against cycles. The two-hop behaviour is
  intentional and retained.
- **P2 — `ae-unresolved-link` from namespace-qualified `{@link}` (resolved).** Dropped the
  `AiAssist.`-qualified `{@link}` forms to local names. This eliminated the "not supported yet by the
  resolver" warning class; the remaining 9 new warnings are the "package does not have an export X"
  class — identical to the 219 pre-existing warnings already in `ts-extras.api.md` (e.g. `resolveModel`
  → `MODEL_SPEC_BASE_KEY`), intrinsic to this packlet's `AiAssist` declare-namespace re-export and
  build-tolerated. Fully eliminating them would require restructuring the namespace export (out of
  Tier-1 scope).
- **P3 — `MODEL_ALIAS_SIGIL` widened to `string` (resolved).** Re-typed as the literal `'@'` (the
  design wrote no annotation; the literal type is the idiomatic form and exposes `'@'` to consumers).
- **P3 — test name "one indirection hop" exercised two hops (resolved).** Renamed to "single
  indirection hop" (the genuine one-hop case) and added/renamed a "multi-hop chain" test.
- **P3 — image/embedding error assertions became coarser (accepted).** The unified "no model
  resolved" message is the design's intended consolidation; the test assertions follow it. Documented
  as the sole failure-path message change under "Deviation from design §7" above.

---

## Tier 2 — Gemini migration

Branch `claude/tier-2-gemini-aliases-yg5ku8` off the Tier-1 merge; PR target `ai-assist-model-aliases`.

### Alias map added (`google-gemini` descriptor, `registry.ts`)

```typescript
aliases: {
  '@google-gemini:flash':       'gemini-3.5-flash',               // base  (was gemini-2.5-flash, 2026-10-16)
  '@google-gemini:pro':         'gemini-3.1-pro-preview',         // thinking (was gemini-2.5-pro)
  '@google-gemini:flash-lite':  'gemini-3.1-flash-lite',          // thinking tier; modelOverride-only, NOT the 'thinking' default
  '@google-gemini:flash-image': 'gemini-3.1-flash-image-preview', // image (was gemini-2.5-flash-image)
  '@google-gemini:embedding':   'gemini-embedding-001'            // NOT deprecated — aliased for uniformity only
}
```

The per-role version split (flash base at 3.5, the rest at 3.1) is from Google's deprecation table,
verbatim per design §4.

### `defaultModel` after-state

```typescript
defaultModel: {
  base:      '@google-gemini:flash',
  thinking:  '@google-gemini:pro',          // explicit key added (decided §4/§9) — no flash fallback for thinking
  image:     '@google-gemini:flash-image',
  embedding: '@google-gemini:embedding'
}
```

Resolution verified: base→`gemini-3.5-flash`, thinking→`gemini-3.1-pro-preview`,
image→`gemini-3.1-flash-image-preview`, embedding→`gemini-embedding-001` (modelAlias.test.ts +
registry.test.ts).

### Imagen removal set actually deleted (full cascade)

The design §4 bulleted set, plus the runtime cascade that removing the `AiImageApiFormat` value forces
(under-specified by §4 but required to keep the build clean — see deviation note):

- **registry.ts** — both `imagen-4.0-ultra-` and `imagen-` capability entries in the Gemini
  `imageGeneration` array (only the `gemini-image-out` catch-all survives).
- **model.ts** — `Imagen4ModelNames`, `IImagen4GenerationConfig`, `IImagen4ModelOptions`, the
  `IImagen4ModelOptions` member of the `IModelFamilyConfig` union, and the `'gemini-imagen'` member of
  `AiImageApiFormat`. Stale Imagen mentions in surrounding TSDoc swept.
- **index.ts** — the three exports (`Imagen4ModelNames`, `IImagen4GenerationConfig`,
  `IImagen4ModelOptions`).
- **imageOptionsResolver.ts** — the `IImagen4ModelOptions` import, the `isImagen4ModelOptions` guard,
  the `case 'gemini-imagen'` arm of `providerLineageForFormat` (kept `gemini-image-out → google`), the
  `applyBlock` imagen-4 branch, and the seven imagen-only fields on `IResolvedImageOptions`
  (`imagenAspectRatio` / `imageSize` / `addWatermark` / `enhancePrompt` / `imagenOutputMimeType` /
  `imagenOutputCompressionQuality` / `personGeneration`).
- **apiClient.ts** — the `callImagenGeneration` function, the `IImagenPrediction` / `IImagenResponse`
  interfaces + their validators, and the `case 'gemini-imagen'` dispatch arm (the exhaustive
  `never`-checked default remains correct). Dispatcher TSDoc swept.
- **etc/ts-extras.api.md** — regenerated; diff is exactly the above removals + the two type edits below,
  nothing else.

### Residual-`imagen` grep result (reported per §4 / "if stuck")

After the deletions, `grep -rni imagen` over the packlet **production** source returns exactly one hit:

```
registry.ts: { idPattern: /^imagen/, capabilities: ['image-generation'] }
```

This is the **capability-detection** idPattern rule used by `listModels` to classify concrete model
ids a Gemini account surfaces — it is the *detection* axis, not *selection/routing*. It is **not** in
the design §4 removal set, references no removed type, and nothing routes through it. **Deliberately
kept** (listModels.test.ts still classifies a live `imagen-3.0-generate-001` as image-generation).
**No `gemini-imagen` routing path remains; no Vertex or other path needs the format value** — so the
`AiImageApiFormat` value deletion was safe (the "if stuck" stop condition did not trigger).

### Manual-axis bumps (design §3)

- `GeminiThinkingModelNames` → `'gemini-3.1-pro-preview' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite'`.
- `GeminiFlashImageModelNames` → `'gemini-3.1-flash-image-preview'` (was `'gemini-2.5-flash-image'`) —
  the third manual axis from §3; bumped for consistency with the image-default migration after the
  code-reviewer flagged it (P2 below).
- idPattern: added `/^gemini-3/ → ['chat','tools','vision','thinking']` ahead of the kept
  `/^gemini-2\.5/` rule, so 3.x ids are classified thinking-capable instead of falling to the base
  `/^gemini-/` set.

### Tests

Updated/replaced everything that referenced the removed surface:
- modelAlias.test.ts — reframed the Tier-1 "inert for all descriptors" sweep (now: resolved default is
  always a concrete non-`@` id or a clean failure; non-aliased descriptors stay inert) and the
  "no descriptor defines aliases" assertion (now: only `google-gemini` defines one). Added a Tier-2
  block: defaultModel→concrete 3.x for all four keys, each alias→target, unknown alias fails loudly.
- registry.test.ts — Gemini imageGeneration now length-1 (catch-all); default image/embedding assert
  the alias from `resolveModel` and the concrete id from `resolveProviderModel`; the `resolveImageCapability`
  specific-prefix case re-pointed to openai (Gemini no longer has a specific prefix).
- listModels.test.ts — added positive (gemini-3.5-flash→thinking) and negative (gemini-2.0-flash→no
  thinking, regex-boundary guard) classification tests.
- imageOptionsResolver.test.ts / apiClient.imageGeneration.test.ts / apiClient.refImages.test.ts —
  removed the imagen-4 / gemini-imagen format describe blocks and the `imagenBody` helper; re-pointed
  the gemini image-out fixtures to `gemini-3.1-flash-image-preview`; deleted the `:predict` imagen
  routing tests.
- thinkingOptionsResolver.test.ts — gemini model id 2.5→3.1.

### Gates

- `rushx build` — pass (api-extractor regenerated; diff confined to the intended removals + the two
  `*ModelNames` edits).
- `rushx lint` — pass. `rushx fixlint` — run pre-commit, clean.
- `rushx test` — pass, **100% coverage** on all modified source files.
- No external monorepo consumers of the removed Imagen exports (grep over libraries/tools/samples).

### code-reviewer findings (layer 1, run on the final diff)

**No P1s.** No `any`, no Result-pattern violations, no unsafe casts; removal cascade confirmed clean
(no dangling `gemini-imagen` / `Imagen4` / `callImagenGeneration` references); exhaustive-switch
`never` check intact.

- **P2 — `GeminiFlashImageModelNames` still named the retired 2.5 id (RESOLVED).** Bumped to
  `'gemini-3.1-flash-image-preview'` and updated the typed `models` filter arrays + resolver fixtures
  to match. This is the third §3 manual axis; replacing (not appending) is consistent with the
  `GeminiThinkingModelNames` bump and with ACTIVE_DEVELOPMENT's no-compat-burden rule for the active
  ai-assist surface.
- **P2 — two stale `gemini-imagen` references in `.ai/instructions/LIBRARY_CAPABILITIES.md` (lines
  ~142, ~344) (DISPOSITIONED → Tier 3).** Real and caused by this removal, but `LIBRARY_CAPABILITIES.md`
  updates are **explicitly Scope-OUT for Tier 2 / Scope-IN for Tier 3** (per the stream brief and design
  §7 Tier 3). Not touched here to respect the scope boundary; **flagged for Tier 3 to sweep the
  `gemini-imagen` value out of the ai-assist entry and the image-format decision shortcut** alongside the
  alias-scheme doc work.
- **P3 — `@google-gemini:flash-lite` aliased but not a `defaultModel` key (RESOLVED).** Intentional
  (Pro is the thinking default; flash-lite is the cheaper explicit-override tier). Clarified the inline
  comment to say so.
- **P3 — no negative idPattern boundary test (RESOLVED).** Added a `gemini-2.0-flash → no thinking`
  assertion guarding the `/^gemini-3/` vs `/^gemini-2\.5/` boundary against over-firing.

### Deviation from design §4

§4 enumerated the type-surface removal set and said the `gemini-imagen` `AiImageApiFormat` value +
`imageOptionsResolver.ts` imagen branch "should be swept in the same pass," but did **not** enumerate
the `apiClient.ts` runtime cascade (`callImagenGeneration`, Imagen validators, dispatch arm).
Removing the union member forces those deletions to keep the build clean, and the residual-`imagen`
grep confirmed nothing else routes to the format — so the full runtime path was removed in the same
pass. No design intent changed; the §4 list was simply under-specified on the apiClient side.
