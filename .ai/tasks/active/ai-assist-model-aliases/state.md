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
