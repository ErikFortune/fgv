# Workstreams — fgv

The canonical doc for in-flight and completed parallel workstreams.
Each entry is a kickoff brief — designed so a fresh agent (or fresh
human) can pick it up cold from this doc plus the linked reading
list, without re-creating any of the design discussion that produced
it.

---

## Repo shape (load-bearing context)

This repo is a set of related but distinct utility libraries under
`libraries/` (plus CLI tools under `tools/`), not a single coherent
product. Work is mostly **reactive, consumer-driven, feature-shaped**:
external consumers batch up feature requests as they do major work;
we service those batches and publish an alpha; consumers integrate;
once at least one consumer has applied a feature end-to-end, we
treat that surface as validated. A feature commonly touches 1–3
packages, so the unit of work is the **feature**, not the package.

**Lockstep version policy.** When we publish, we publish everything.
Independent roadmaps per library, single shared version. Sizing the
blast radius of any stream needs to account for this — a change in
one package ships in the same alpha as every other package's changes.

**Stability-via-consumption.** We presume instability until at least
one consumer has applied a feature end-to-end. `release` and the
alphas published from `prerelease` are post-feature-PR but
pre-validation. Production promotion is gated on observed consumer
use, not just CI green. Case in point: a -25 → -26 type-tightening
that would have been a production regression if -25 had shipped to
main.

## Branch flow

```
agent feature branches ─PR─▶ release ──mirror──▶ prerelease ──npm-publish─▶ alpha
                                │
                                └── promote (test/docs gate, not code review) ──▶ main
```

- **`release`** is the buffer line. Feature PRs merge here. Iterative
  review cycles, followups, and slips are absorbed here.
- **`prerelease`** mirrors `release` immediately. The only deltas vs.
  `release` are `package.json` / version-policy files and Rush
  changelogs. Alphas publish from `prerelease` via the
  `npm-publish` GitHub workflow.
- **`main`** is the canonical line. Promotion `release` → `main` is
  a release event — it accumulates a long delta and is gated on
  **test/docs/sibling-sweep, not code review** (each constituent PR
  was reviewed on its way into `release`; the unified delta is too
  large for meaningful re-review).

A branch-model evolution to a more conventional "main is tip,
hotfix branches off main" topology is on the roadmap; see the
relevant entry in this file when it's drafted.

## Status conventions

- 🟢 ready to start (all hard dependencies met)
- 🟡 ready but trailing on a soft dependency, or trigger TBD
- 🔵 in flight (active design or implementation)
- 🔴 blocked (hard dependency unmet)
- ✅ shipped (merged to `release`)

## Stream entry shape

Every stream entry declares, at minimum:

- **Mission** — 1–2 sentences.
- **Package surface** — explicit list of packages this stream
  expects to modify (e.g. `ts-extras/ai-assist`, `ts-app-shell/ai-assist`).
  This is both the reading-aid and the collision-avoidance metadata
  for parallel streams.
- **Out-of-scope** — paths this stream will NOT touch, when
  collision avoidance with another stream depends on it.
- **Acceptance criteria** — exit gates.
- **Artifact pointer** — `.ai/tasks/active/<stream-id>/`.

Full kickoff-prompt shape: `.ai/conventions/workflow/kickoff-prompt-shape.md`.

## Branch base

New streams branch from current `release` HEAD. There is no shared
"wave base" — streams are mostly independent, and the few real
file-boundary conflicts are caught by the package-surface and
out-of-scope declarations in the stream entry. `.ai/BASELINE.md`
pins the last `release` → `main` promotion (i.e. the last
published lockstep version), used as a recovery referent and for
sizing blast radius, not as a stream-start gate.

## Stream versions

Used when a stream's deliverable splits into independently-shippable
phases. Each version has its own brief, status, dependencies, PR,
and task-artifact directory. Reserve for streams where the phases
are genuinely separable shipping units.

## Shared types between parallel streams

When two parallel streams share a type, pick exactly one pattern:

1. **Coordination commit**: land the shared type as a small commit
   before either stream branches.
2. **Narrower consumer interface**: consumer defines a smaller,
   distinctly-named interface exposing only the methods it needs.
3. **Lock ownership in kickoff prompts**: exactly one stream owns
   each shared symbol; the other is told explicitly NOT to define it.

Never have two parallel streams publishing the same symbol.

## Artifact protocol

Every workstream maintains live artifacts at
`.ai/tasks/active/<stream-id>/{brief.md, state.md, result.md}`
throughout the run. **Migrate to `.ai/tasks/completed/<YYYY-MM>/<stream-id>/`
and write a polished `README.md` as part of the PR — before merge,
not as a follow-up.** See `.ai/conventions/workflow/artifact-protocol.md`.

## Out-of-scope packages

The sudoku packages (`ts-sudoku-lib`, `ts-sudoku-ui`) are slated to
move to their own monorepo and are out of scope for the workflow
substrate. Don't queue streams against them here.

---

## Active workstreams

### `ts-prompt-assist` 🟢

**Status:** 🟢 phase A (research + design) ready to start
**Cluster:** `ts-prompt-assist-features` (integration branch `claude/ts-prompt-assist-features` off `release`)
**Workflow shape:** design-triage-implement-refine (single-stream new-library; consumer-port pressure-test absorbed via follow-up PRs on the same integration branch)
**Phase A artifacts:** `.ai/tasks/active/ts-prompt-assist/{brief.md, design-brief.md, state.md}` → produces `design.md`
**Package surface (new):** `@fgv/ts-prompt-assist` (new library; placement `libraries/ts-prompt-assist/`)
**Library dep graph:** depends on `@fgv/ts-utils`, `@fgv/ts-res`, `@fgv/ts-extras` (`MustacheTemplate`), `@fgv/ts-json-base` (FileTree). Sits above `ts-res` in the dep graph — folding into `ts-extras` would create a cycle, hence the standalone-package decision.
**Out-of-scope (this stream):** SQL/Mongo store adapters; editor UI; samples app; LLM-call orchestration; anti-jailbreak text content; schema-version migration; sudoku packages.

**Mission.** Ship `@fgv/ts-prompt-assist` v0.1: ts-res-driven prompt resolution with Mustache substitution as a reusable capability. Consumers bring their own scope model, actor types, prompt content; the library provides the resolution machinery, type system, descriptor schema, storage abstraction, and LLM-prompt safeguards. Mental model: every consumer surface that calls an LLM with a prompt does **lookup** (qualifier-conditioned variant selection) then **compose** (Mustache substitution); the library standardizes both halves.

**Binding conceptual model** (per the consumer-supplied design brief at `.ai/tasks/active/ts-prompt-assist/design-brief.md`):
1. Lookup-then-compose
2. Scope-chain walking with bindings (most-specific wins; `enforced` lock; caller subs override merged bindings except enforced)
3. Open qualifier metadata (`required` / `expected` / `disallowed`, never closed enums per descriptor)
4. Resource bindings as first-class (recursive resolve with cycle detection + depth cap; enables shared sub-prompts)
5. Output validation library-side (strip fences → parse JSON → Converter → registered validators)
6. Storage-agnostic via `IPromptStore`; FileTree adapter canonical for v0.1; in-memory for tests

The data-structure specifics in the design brief are **proposed** — phase A locks the shape and resolves the three open questions (scope encoding flexibility, resource-binding substitution merge semantics, `watch()` semantics).

**Origin.** Consumer-driven feature request. Pattern emerged from observation that two in-codebase prompt libraries had reinvented the same machinery with subtly different policies; tenant-level visual/brand-style override has no canonical home; variation prompts hit-or-miss across surfaces. Generalizing the resolution machinery gives operators one mental model.

**First consumer / pressure-test plan.** `personaility` will port an existing in-codebase prompt resolution implementation to consume this library. Pressure-test surfaces API gaps; 1–2 follow-up PRs on the integration branch absorb refinements before the integration→release promotion. Possibly also a test app (modeled on `ai-assist-image-generator`) — decision deferred; could also be built **into** the image generator. Surface as a subsequent stream once v0.1 lands.

**Sequencing.** Independent of `ai-assist-thinking-events`; the two streams can run in parallel. No dependencies on in-flight work as of stream commission.

**Alpha target.** `5.1.0-29` or later; stream may accumulate to `6.0` depending on API-stability evidence after pressure-test. Stable cut is gated on consumer-port settling, not calendar.

**Future streams (queued; not commissioned):**
- `ts-prompt-assist-samples` — sample/test app demonstrating end-to-end usage (might be standalone OR merged into `ai-assist-image-generator`)
- `ts-prompt-assist-editor-ui` — generic editor UX for prompt editing (decide whether to make consumer-shape-agnostic vs require consumer-side implementation; UX is complex enough that sharing would be valuable, but the consumer-specific surfaces may make full generalization impractical). See `docs/FUTURE.md`.

### `ai-assist-thinking-events` 🟡

**Status:** 🟡 ready; sequencing after `ai-assist-thinking-config` phase B lands (now satisfied; ai-assist cluster shipped via #336)
**Branch base:** `release` HEAD with `.ai/tasks/completed/2026-05/ai-assist-thinking-config/` and `ai-assist-image-generation/` available as reference
**Package surface:** `@fgv/ts-extras/ai-assist` (streaming adapters, model.ts, apiClient.ts), `@fgv/ts-app-shell/ai-assist`, `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Out-of-scope:** the core thinking-config architecture (already shipped via `ai-assist-thinking-config`); sudoku packages

**Mission.** Surface thinking/reasoning content to callers in streaming and non-streaming responses. The `ai-assist-thinking-config` stream silently discards thinking content; this stream adds the explicit surface. Likely scope:
- New `IAiStreamEvent` variant for thinking deltas (or alternative shape)
- Non-streaming response shape: `thinking?: string` field (or similar) on `IAiCompletionResponse`
- Opt-in plumbing (`IGeminiThinkingOptions.config.includeThoughts` placed by thinking-config stream — wire it up here for all providers)
- Per-provider surfacing logic (Anthropic `thinking_delta` events; Gemini `thought: true` parts; OpenAI encrypted reasoning items if exposed)
- Token accounting (`thinkingTokens?: number` on response)

Design-triage-implement shape is likely; new public API has real consequences.

**Origin.** Carved out of `ai-assist-thinking-config` phase A v2 (D9). Required because v1's "future extension point" hand-wave didn't meet the bar of "concrete trackable followup."

**Phase A artifacts:** TBD when stream is commissioned; will live at `.ai/tasks/active/ai-assist-thinking-events/`.

---

## Completed workstreams

### `crypto-batch-2-hpke` ✅

**Status:** ✅ shipped — merged in [#348](https://github.com/ErikFortune/fgv/pull/348) into `claude/crypto-batch-2-features` integration branch; phase A design in [#343](https://github.com/ErikFortune/fgv/pull/343); phase B brief in [#346](https://github.com/ErikFortune/fgv/pull/346); branch `claude/crypto-batch-2-hpke-impl-pR3QU`
**Package surface:** `@fgv/ts-extras/crypto-utils`, `@fgv/ts-web-extras/crypto-utils`, `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.**
- `HpkeProvider` class (private constructor + static `create(subtle)` factory) implementing HPKE base mode (RFC 9180) with cipher suite DHKEM(X25519, HKDF-SHA256) + HKDF-SHA256 + AES-256-GCM
- Public surface: `sealBase`, `openBase`, `hkdf`, `encodeEnvelope`, `decodeEnvelope`. Internal Encap/Decap/KeySchedule stay private.
- Single implementation in `ts-extras` re-exported from `ts-web-extras` for browser callers; `CryptoUtils.HpkeProvider` namespace path works for both `moduleResolution: node` and `bundler` consumers
- B.0 RFC verification caught a design-vs-RFC discrepancy: design.md §1 used label `"dh"` in ExtractAndExpand; RFC 9180 §4.1 specifies `"eae_prk"`. Agent stopped, surfaced, corrected (confirmed via OpenSSL happykey + multiple independent implementations)
- Cross-runtime anchor vectors: Node-sealed ciphertext opens correctly on jsdom Web Crypto. 24 Node tests + 18 browser tests, 100% coverage.

**Artifacts:** `.ai/tasks/completed/2026-05/crypto-batch-2-hpke/`

### `crypto-batch-2-argon2id` ✅

**Status:** ✅ shipped — merged in [#349](https://github.com/ErikFortune/fgv/pull/349) into `claude/crypto-batch-2-features` integration branch; phase A design in [#344](https://github.com/ErikFortune/fgv/pull/344); phase B brief in [#346](https://github.com/ErikFortune/fgv/pull/346); branch `claude/crypto-batch-2-argon2id-impl-bOXwM`
**Package surface:** NEW packages `@fgv/ts-extras-argon2` (Node, wraps `argon2`) and `@fgv/ts-web-extras-argon2` (browser, wraps `hash-wasm`); model additions in `@fgv/ts-extras/crypto-utils`; `KeyStore` integration; `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.**
- `IArgon2idProvider`, `IArgon2idParams`, `ARGON2ID_OWASP_MIN`, `ARGON2ID_PASSPHRASE` in `@fgv/ts-extras/crypto-utils/model.ts`
- `IKeyDerivationParams` converted to discriminated union (`'pbkdf2'` | `'argon2id'`)
- `NodeArgon2Provider` in `@fgv/ts-extras-argon2` backed by `argon2` (kelektiv v0.44.0)
- `BrowserArgon2Provider` in `@fgv/ts-web-extras-argon2` backed by `hash-wasm` v4.12.0 — pure WASM, runs identically in Node and browsers
- `KeyStore.addSecretFromPasswordArgon2id` and `verifySecretFromPasswordArgon2id` (explicit `IArgon2idProvider` injection — KeyStore does not hold one by default)
- Cross-runtime byte-identical output verified: RFC 9106 §B.3 vector produces `03aab965...6d0c2e` on both providers; plus 7-case parameter sweep. 100% coverage across all three packages.

**Artifacts:** `.ai/tasks/completed/2026-05/crypto-batch-2-argon2id/`

### `crypto-batch-2-webauthn` ✅

**Status:** ✅ shipped — merged in [#347](https://github.com/ErikFortune/fgv/pull/347) into `claude/crypto-batch-2-features` integration branch; phase A design in [#342](https://github.com/ErikFortune/fgv/pull/342); phase B brief in [#346](https://github.com/ErikFortune/fgv/pull/346); branch `claude/crypto-batch-2-webauthn-impl-6XN80`
**Package surface:** NEW packages `@fgv/ts-extras-webauthn` (wraps `@simplewebauthn/server`) and `@fgv/ts-web-extras-webauthn` (wraps `@simplewebauthn/browser`); `common/config/rush/common-versions.json`; `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.** Result-integration boundary — six primitive functions, nothing else:
- Server: `generateRegistrationOptions`, `verifyRegistrationResponse`, `generateAuthenticationOptions`, `verifyAuthenticationResponse`
- Browser: `startRegistration`, `startAuthentication`
- Each a one-line `captureAsyncResult(() => upstream(options))` over `@simplewebauthn/*` v13
- No challenge generators, no PRF helpers, no autofill validators, no credential builders, no ceremony orchestration (four temptations explicitly considered and rejected per OQ-4)
- Type re-exports limited to direct-signature types; `jest.mock` upstream entirely (no real WebAuthn ceremony in tests). 100% coverage in both packages.

**Followup**: `integrations/` vs `libraries/` directory convention (parked to FUTURE.md); see also TECH_DEBT P3 entry on `"sideEffects": false` field consistency for new pure-library packages.

**Artifacts:** `.ai/tasks/completed/2026-05/crypto-batch-2-webauthn/`

### `crypto-batch-2-misc` ✅

**Status:** ✅ shipped — merged in [#345](https://github.com/ErikFortune/fgv/pull/345) into `claude/crypto-batch-2-features` integration branch; branch `claude/add-crypto-provider-methods-hHMYd`
**Package surface:** `@fgv/ts-extras/crypto-utils`, `@fgv/ts-web-extras/crypto-utils`, `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.** Five new methods on `ICryptoProvider` (and both concrete implementations):
- `sign(privateKey, data)` / `verify(publicKey, signature, data)` — Ed25519 and ECDSA-P256, algorithm inferred from key
- `timingSafeEqual(a, b)` — constant-time byte comparison (Node `crypto.timingSafeEqual`; browser XOR-walk accumulator)
- `hmacSha256(key, data)` / `verifyHmacSha256(key, signature, data)` — HMAC-SHA256 MAC with constant-time verification via `timingSafeEqual`

`sign`/`verify`/`timingSafeEqual` were specified in the stream brief; `hmacSha256`/`verifyHmacSha256` added during implementation per orchestrator review request (cross-repo consumer surfaced the need).

**Artifacts:** `.ai/tasks/completed/2026-05/crypto-batch-2-misc/`

### `ai-assist-thinking-config` ✅

**Status:** ✅ shipped — merged in [#334](https://github.com/ErikFortune/fgv/pull/334) into `claude/ai-assist-features` integration branch; phase A v2 design in [#332](https://github.com/ErikFortune/fgv/pull/332); commission prep in [#330](https://github.com/ErikFortune/fgv/pull/330) + [#333](https://github.com/ErikFortune/fgv/pull/333); phase B branch `claude/ai-assist-thinking-phase-b-aIY1Y`
**Package surface:** `@fgv/ts-extras/ai-assist`, `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.**
- Layered thinking-config architecture: `IThinkingConfig` with generic `effort?: 'low' | 'medium' | 'high'` + `providers?: ReadonlyArray<IThinkingProviderConfig>` array of per-provider blocks (Anthropic, OpenAI, Google, xAI, Other escape hatch). Per-provider configs expose full provider knobs first-class (Anthropic `'max'`, OpenAI `'xhigh'`/`'none'`/`'minimal'`, Gemini `thinkingBudget`, xAI `'none'`)
- `thinkingOptionsResolver.ts`: 4-tier merge logic + `checkTemperatureConflict` (temperature + thinking = `Result.fail` on Anthropic / OpenAI non-'none' / xAI conservative; Gemini accepts both)
- Registry signaling: `AiModelCapability` + `ModelSpecKey` gain `'thinking'`; `IAiProviderDescriptor.thinkingMode` (`'optional'`/`'required'`/`'unsupported'`); capability rules per provider
- xAI registry staleness fix: retired `grok-4-1-fast`/`grok-4-1-fast-reasoning` removed; defaults updated to `grok-4.3`
- Anthropic non-streaming validator fix: `extractAnthropicText` used unconditionally (handles thinking blocks, tools, plain text)
- All four chat-completion paths (non-streaming + streaming) updated with thinking wire encoding; proxy passthrough wired
- OpenAI `'none'` edge case correctly handled: setting `effort: 'none'` on gpt-5.x disables reasoning AND accepts temperature

**Followup**: `ai-assist-thinking-events` (queued; thinking-event surfacing to callers; the `includeThoughts?: boolean` field placed but inert in this stream gets wired up there)

**Artifacts:** `.ai/tasks/completed/2026-05/ai-assist-thinking-config/`

### `ai-assist-image-generation` ✅

**Status:** ✅ shipped — PR [#329](https://github.com/ErikFortune/fgv/pull/329) → `claude/ai-assist-features`; branch `claude/implement-image-generation-m7xMi`
**Package surface:** `@fgv/ts-extras/ai-assist`, `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.**
- Layered image generation options architecture: `IAiImageGenerationOptions` with generic top-level fields (`size`, `quality`, `seed`, `count`) + `models?: ReadonlyArray<IModelFamilyConfig>` for family-scoped blocks (`IDallEModelOptions`, `IGptImageModelOptions`, `IGrokImagineModelOptions`, `IImagen4ModelOptions`, `IGeminiFlashImageModelOptions`, `IOtherModelOptions` escape hatch)
- `imageOptionsResolver.ts`: 4-tier merge logic (generic → family-generic → model-specific ≈ Other) + registry-driven validation
- Registry updated: deprecated models dropped (`imagen-3.*`, `grok-2-image-1212`, `grok-imagine-image-pro`); xAI default corrected to `grok-imagine-image-quality`; all models annotated with `acceptedSizes`, `supportsQualityParam`, `acceptedQualities`, `maxCount`, `outputParamStyle`
- `apiClient.ts`: gpt-image-1 `output_format` fix (edits + generations paths); xAI JSON-body edits adapter; Imagen 4 params; Gemini aspect-ratio support; fail-fast for >3 xAI reference images
- Root cause fixes: gpt-image-1 HTTP 400 on `response_format`; dall-e-3 `count > 1`; dall-e-3 quality `'hd'` encoding

**Artifacts:** `.ai/tasks/completed/2026-05/ai-assist-image-generation/`

### `auth-primitives-batch1` ✅

**Status:** ✅ shipped — merged in [#322](https://github.com/ErikFortune/fgv/pull/322) (`bb913392`); published in `5.1.0-26` alpha
**Package surface:** `@fgv/ts-extras` (crypto-utils), `@fgv/ts-web-extras` (crypto-utils), `@fgv/ts-utils` (base/normalize), `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Cross-repo consumer:** [`ErikFortune/personaility`](https://github.com/ErikFortune/personaility) — `claude/auth-primitives-foundation-h34cG` (unblocked on `5.1.0-26` publish)

**What shipped.** Four primitives:
1. X25519 keypair (`'x25519'` added to `KeyPairAlgorithm`; both providers picked it up table-driven)
2. RFC 8785 `canonicalize()` on the base `Normalizer` (moved from `HashingNormalizer` per code review)
3. Multibase/SPKI helpers in `@fgv/ts-extras/crypto-utils` (`exportPublicKeyAsMultibaseSpki`, `importPublicKeyFromMultibaseSpki`, `multibaseBase64UrlEncode`/`Decode`)
4. `LIBRARY_CAPABILITIES.md` cryptography + canonicalization sections

**Artifacts:** `.ai/tasks/completed/2026-05/auth-primitives-batch1/` ([README](../.ai/tasks/completed/2026-05/auth-primitives-batch1/README.md))
