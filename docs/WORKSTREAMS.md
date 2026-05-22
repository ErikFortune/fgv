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

### `local-ai-exploration` 🟢

**Status:** 🟢 substrate prep in flight; B-1 ready to commission after merge
**Integration branch:** `local-ai-exploration` (off `release`)
**Workflow shape:** design-triage-implement-refine cluster with outcome gate at B-3
**Substrate:** `.ai/tasks/active/local-ai-exploration/{brief.md, state.md}`
**Package surface (new):**
- `samples/testbed/` — long-lived sample-browser app, web + CLI, web-first
- `@fgv/ts-extras-transformers` + `@fgv/ts-web-extras-transformers` — Result-integration boundary over `@huggingface/transformers` (provisional; may be discarded at B-4b if the experiment shows the facade doesn't earn its keep)

**Mission.** Two intertwined goals: (1) build a long-lived sample browser app at `samples/testbed/` as the canonical home for fgv-capability demonstration scenarios; (2) use that testbed to evaluate whether a Result-shaped facade over `@huggingface/transformers` earns its keep, with an explicit done-or-discard decision gate at B-3 exit.

**Decision-track input (binding):** `.ai/notes/orchestrator/research/local-models-incorporation.md` (merged via #402) recommends Option 2 with timing "next slot, not urgent." This cluster takes the slot and runs the experiment.

**Sub-phase shape:**
- B-1 scaffold (testbed + facade package skeletons)
- B-2 facade primitives (5-8 ops mirroring `@fgv/ts-extras-webauthn` discipline)
- B-3 first scenario (local classifier → `IPromptSafetyPolicy` backend)
- B-3 exit gate (done-or-discard decision per criteria locked in brief)
- B-4a (ship the facade) OR B-4b (pivot scenario to native)
- Cluster close (promotion `local-ai-exploration` → `release`)

**Out-of-scope (this cluster):** porting `samples/ai-image-gen-sample` scenarios into the testbed (P3 tech debt, queued); editor UX (queued); LLM-call orchestration beyond existing ai-assist; sidecar/HTTP local LLM path (separate small chore opportunity).

**Origin.** Erik's question 2026-05-22: "ai-assist is all about communicating with distant LLMs for pretty meaty tasks. But in the real world, smaller models like classifiers and recognizers often run locally. How does that work and is it something we could/should incorporate?" Research note answered the framing; this cluster runs the experiment.

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

### `ts-prompt-assist-features` ✅ (cluster)

**Status:** ✅ shipped — cluster integration branch `claude/ts-prompt-assist-features` ready for promotion to `release`
**Cluster scope:** `@fgv/ts-prompt-assist` v0.1 (new library) + `@fgv/ts-extras/mustache` additive extension + `@fgv/ts-res` typed-conditions support (sub-stream below) + sample-app demonstration in `samples/ai-image-gen-sample`
**Sub-stream:** [`ts-res-typed-conditions`](#ts-res-typed-conditions-) (below)

**What shipped.**
- `PromptLibrary.create` factory; `resolve` (lookup-then-compose), `resolveJsonOutput<K>` (runtime-evidenced kind dispatch), `resolveFreeTextOutput`, `describe` (cross-scope structural-equality check).
- `IPromptStore` storage abstraction (read-only at v0.1); `FileTreePromptStore` canonical adapter; `PromptStoreFixture.build(seed)` canonical in-memory test/demo fixture.
- `PromptRegistry<TResponse>` with three typed sub-registries (`converters` / `slotKinds` / `outputValidations`).
- `IPromptSafetyPolicy` — length cap, suspicious-pattern screen with `lastIndex` reset, slot-source allowlist, `onSuspicious: 'warn' | 'reject'`, consumer-supplied `antiJailbreakPreface` seam.
- `buildSimpleDescriptor` helper for trivial free-text chat case (JSON-output paths still use full `IPromptDescriptor` to preserve `output.kind` dispatch).
- Resource bindings as first-class with RFC 8785 canonical-JSON cycle detection + depth cap.
- `MustacheTemplate.create(template, { escape: 'none' | 'html' | callback })` additive extension on `@fgv/ts-extras`.

**Decomposition history.** Phase A (#357 design lock) + Phase B (#358 brief) opened the cluster. PR #359's single-agent Phase B attempt retired after mid-run context drift produced ~35 reviewer-flagged issues; rescoped into sub-phase commissions (B-0a / B-0b / B-1a / B-1b / B-2 / B-3 / B-4 / B-5) per `brief-phase-b.md`. All sub-phases landed clean under the decomposed discipline. Orchestrator-driven post-merge cleanup PRs (#367, #370) absorbed sub-phase nits per the cluster's ship-then-tidy mechanic. Surface-tidy round (#372) split `resolveAndValidateOutput<T>` into `resolveJsonOutput<K>` + `resolveFreeTextOutput`, replacing the last caller-asserted-`T` boundary with a runtime-evidenced kind check.

**Pressure-test refinement.** Round 1 (#373 held; findings cherry-picked via #374) — 14 findings; ergonomics absorbed via #375 (`withType()`) + #376 (mixed-shape `QualifierCollector` + `IQualifierContext` Partial-widen) + #377 (ts-extras Yaml browser export bug + L13 cross-runtime micro-test) + #380 (F3 + F9 + F12 + F14 ergonomics). Round 2 (#384) — fresh sample-app integration "materially smoother than round-1"; F1/F2/F6 absorbed via the `ts-res-typed-conditions` sub-stream (sample updated to demonstrate the typed flow end-to-end).

**Artifacts:** [`.ai/tasks/completed/2026-05/ts-prompt-assist/`](../.ai/tasks/completed/2026-05/ts-prompt-assist/) (root README plus full design / brief / state / findings / phase-result docs).

**Followup streams (queued in `docs/FUTURE.md`):** `ts-prompt-assist-samples`, `ts-prompt-assist-editor-ui`, typed qualifier VALUES (round-2 F5).

### `ts-res-typed-conditions` ✅

**Status:** ✅ shipped — three sub-phases merged into `claude/ts-prompt-assist-features` (sub-stream of the `ts-prompt-assist-features` cluster above)
**Package surface:** `@fgv/ts-res` (`resource-json/` Decl tree + `conditions/convert/` Converter pipeline) + `@fgv/ts-prompt-assist` (B-3 consumer port)

**What shipped.**
- **B-1 (#391)** — Decl-tree type cascade. 17 types in `resource-json/json.ts` + `conditions/` parameterized on `TQualifierNames extends string = string` with default-string back-compat. Two latent fixes (`getKeyFromLooseDecl` undefined-handling; type-guard `'id' in decl && typeof decl.id === 'string'` runtime soundness) carried forward from closed PR #386.
- **B-2 (#394)** — Sibling `typed*` Converter exports over a shared parameterized core. 16 typed siblings (4 in `Conditions.Convert`, 12 in `ResourceJson.Convert`); existing untyped exports preserved at signature and behavior level. Drift-protection markers (`// keep in sync with X`) inline. `IConditionDecl` / `IConditionSetDecl` parameterized.
- **B-3 (#395)** — `@fgv/ts-prompt-assist` consumer port. 6 container types parameterized; `typedPromptFileConverter<T>(qc)` factory; `qualifierNameConverter?` threaded into `FileTreePromptStore.create` and `PromptStoreFixture.build`. F2 (`buildSimpleDescriptor`) and F6 (README React-wiring) absorbed from closed PR #385; F1's local sibling types obsoleted by the ts-res-layer ownership.

**Sample-app demo (#384).** `samples/ai-image-gen-sample/src/promptLibrary.ts` wires a typed `qualifierNameConverter` for `'tone'`; the round-2 pressure-test integration now demonstrates the cluster's deliverable end-to-end.

**Decision-track.** PR #386 (leaf-only parameterization) closed superseded after a senior-developer stress-test addendum (#389) caught the structural correction: #386 had no plumbing through container types, so the narrow couldn't reach the leaf from any realistic authoring chain. Option D (sibling `typed*` exports over a shared core) chosen as the non-breaking shape that preserves existing call sites. Full design-track at [`ts-res-typed-conditions-design.md`](../.ai/tasks/completed/2026-05/ts-prompt-assist/ts-res-typed-conditions-design.md) + [evaluation.md](../.ai/tasks/completed/2026-05/ts-prompt-assist/ts-res-typed-conditions-evaluation.md).

**Artifacts:** [`.ai/tasks/completed/2026-05/ts-res-typed-conditions/`](../.ai/tasks/completed/2026-05/ts-res-typed-conditions/) (brief, design notes, all three phase-result docs, polished README).

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
