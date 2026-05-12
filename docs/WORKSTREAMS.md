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

### `crypto-batch-2-hpke` 🟢

**Status:** 🟢 phase A (research + design) ready to start
**Cluster:** crypto-batch-2 (integration branch `claude/crypto-batch-2-features`)
**Phase B sequencing:** decided post-design-signoff
**Branch base:** `claude/crypto-batch-2-features` (integration branch off `release`)
**Package surface:** `@fgv/ts-extras/crypto-utils`, `@fgv/ts-web-extras/crypto-utils`, `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Out-of-scope:** `wrapBytes`/`unwrapBytes` (ECIES; separate primitive), Argon2id, WebAuthn, sudoku packages

**Mission.** Implement HPKE base mode (RFC 9180) with X25519/HKDF-SHA256/AES-256-GCM in `@fgv/ts-extras` and `@fgv/ts-web-extras` crypto-utils packlets. Required for a cross-repo consumer's Phase 2 (per-session material delivery, master-key wrap at unlock, recovery-proof envelopes). Phase A produces a design doc; phase B implements per design + signoff modifications. Includes HKDF as exposed primitive (placement decided in design).

**Origin.** Cross-repo consumer batch-2 handoff (archived at `.ai/notes/cross-repo-handoffs/fgv-batch-2-handoff-2026-05.md`).

**Phase A artifacts:** `.ai/tasks/active/crypto-batch-2-hpke/{brief.md, state.md}` → produces `design.md`.

### `crypto-batch-2-argon2id` 🟢

**Status:** 🟢 phase A (research + design) ready to start
**Cluster:** crypto-batch-2 (integration branch `claude/crypto-batch-2-features`)
**Phase B sequencing:** decided post-design-signoff
**Branch base:** `claude/crypto-batch-2-features` (integration branch off `release`)
**Package surface:** NEW packages `@fgv/ts-extras-argon2` and `@fgv/ts-web-extras-argon2`; modifications to `@fgv/ts-extras/crypto-utils` `ICryptoProvider` interface for composition shape; possibly `KeyStore` integration; `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Out-of-scope:** PBKDF2 (already shipped via `KeyStore.addSecretFromPassword`), HPKE, WebAuthn, other KDFs, sudoku packages

**Mission.** Implement Argon2id (RFC 9106) as fgv-owned but in separate packages to keep WASM bundling out of consumers who don't need it. Required for a cross-repo consumer's Phase 2 (recovery rows, hybrid auth passphrases). Cross-runtime output equivalence is the load-bearing correctness property.

**Origin.** Cross-repo consumer batch-2 handoff (archived at `.ai/notes/cross-repo-handoffs/fgv-batch-2-handoff-2026-05.md`). Maintainer-policy decision Q2 resolved (a)+separate-packages on 2026-05-11.

**Phase A artifacts:** `.ai/tasks/active/crypto-batch-2-argon2id/{brief.md, state.md}` → produces `design.md`.

### `crypto-batch-2-webauthn` 🟢

**Status:** 🟢 phase A (research + design) ready to start
**Cluster:** crypto-batch-2 (integration branch `claude/crypto-batch-2-features`)
**Phase B sequencing:** decided post-design-signoff
**Branch base:** `claude/crypto-batch-2-features` (integration branch off `release`)
**Package surface:** NEW packages `@fgv/ts-extras-webauthn` and `@fgv/ts-web-extras-webauthn`; `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Out-of-scope:** Attestation policy, challenge state management, extension helpers, algorithm allowlist, ceremony orchestration, anything that's not one of six primitive operations (strictly enforced per D3 in brief)

**Mission.** Implement a Result-integration boundary over `@simplewebauthn/server` and `@simplewebauthn/browser`. Six primitive operations total (4 server + 2 browser). No opinion baked in; consumers build their own opinionated wrappers on top. Pattern mirrors `@fgv/ts-utils-jest`'s relationship to Jest.

**Origin.** Cross-repo consumer batch-2 handoff. Maintainer-policy decision Q3 resolved (c)+separate-packages on 2026-05-11.

**Lessons-codification candidate:** The "Result-integration boundary over a well-maintained upstream library" pattern is worth codifying as a fgv convention after this stream lands. Plus the question of whether such packages belong in `libraries/` or a top-level `integrations/` directory. Both parked for triage; not blocking.

**Phase A artifacts:** `.ai/tasks/active/crypto-batch-2-webauthn/{brief.md, state.md}` → produces `design.md`.

### `crypto-batch-2-misc` 🟢

**Status:** 🟢 implementation-only (no design phase); ready to start
**Cluster:** crypto-batch-2 (integration branch `claude/crypto-batch-2-features`)
**Branch base:** `claude/crypto-batch-2-features` (integration branch off `release`)
**Package surface:** `@fgv/ts-extras/crypto-utils`, `@fgv/ts-web-extras/crypto-utils`, `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Out-of-scope:** HPKE, Argon2id, WebAuthn (parallel streams), KeyStore changes, sudoku packages

**Mission.** Add `sign`, `verify`, and `timingSafeEqual` to `ICryptoProvider`. Sign/verify wrap `crypto.subtle.sign`/`crypto.subtle.verify`; timingSafeEqual uses Node's native on Node and a constant-time XOR walk on browser. Small, well-specified, no design phase needed.

**Origin.** Cross-repo consumer batch-2 handoff items 5 and 6. Q7 resolved on 2026-05-11 to add the wrappers (concentration of cross-runtime adaptation in `ICryptoProvider` is the load-bearing argument).

**Artifacts:** `.ai/tasks/active/crypto-batch-2-misc/{brief.md, state.md}` → produces implementation PR.

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

### Integration branch convention (active for the crypto-batch-2 cluster)

The four crypto-batch-2 streams share an integration branch `claude/crypto-batch-2-features` based off `release`. Each phase PRs into the integration branch, not `release`. The integration branch merges to `release` at the end of the cluster after all stream artifacts have migrated to `completed/`. Same pattern as the ai-assist cluster.

---

## Completed workstreams

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
