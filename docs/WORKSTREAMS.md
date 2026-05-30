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

### `private-key-storage` ✅

**Status:** ✅ implemented + reviewed (PR #427, gates green) — ready for squash to `release`
**Integration branch:** `private-key-storage` (off `release`) → squash to `release` at close
**Workflow shape:** single implementation PR onto integration branch (both impls together)
**Substrate:** `.ai/tasks/completed/2026-05/private-key-storage/{brief.md, state.md, result.md, README.md}`
**Package surface:** `@fgv/ts-extras/crypto-utils` (encrypted-file impl, Node) + `@fgv/ts-web-extras/crypto-utils` (IndexedDB impl, browser) + `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Out-of-scope:** changes to the `IPrivateKeyStorage` interface, to `KeyStore.addKeyPair` semantics, or to `@fgv/ts-chocolate`. Multi-process/multi-tab concurrency (single-process/single-tab assumption; documented limit). Password-derivation helper for the file impl's encryption key (consumer concern).

**Mission.** Ship the two `IPrivateKeyStorage` implementations the existing JSDoc promises but doesn't deliver: `IdbPrivateKeyStorage` in `@fgv/ts-web-extras/crypto-utils` (IndexedDB, `supportsNonExtractable: true`) and `EncryptedFilePrivateKeyStorage` in `@fgv/ts-extras/crypto-utils` (directory-on-disk, AES-256-GCM-encrypted JWK content, FileTree I/O, `supportsNonExtractable: false`). Both satisfy the interface verbatim — additive, no interface changes. Also fixes the JSDoc that points at non-existent impls (textbook L18). Closes the gap hardback's agent surfaced when `KeyStore.addKeyPair` failed with `'No private key storage configured'`.

**Origin.** Cross-repo gap surfaced 2026-05-28 (hardback agent investigating agent/hub private-key persistence). ts-extras crypto surface is **established** → additive only. Gap-then-fix: every `KeyStore.addKeyPair` consumer currently rolls their own backend or skips the feature; we ship in fgv so consumers benefit + the JSDoc becomes accurate.

### `messages-log-levels` 🟢

**Status:** ✅ implementation complete — PR open onto `messages-log-levels`; ready to squash → `release`
**Integration branch:** `messages-log-levels` (off `release`) → squash to `release` at close
**Workflow shape:** single implementation PR onto integration branch
**Substrate:** `.ai/tasks/completed/2026-05/messages-log-levels/{brief.md, state.md, result.md, README.md}`
**Package surface:** `@fgv/ts-app-shell` `messages` packlet + `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Out-of-scope:** ts-utils log-level types (consumed as-is; no `'success'` added there); the shipped `RetainingLogger`/`MultiLogger`; non-messages ts-app-shell packlets.

**Mission.** Align the `messages` packlet's filter to `@fgv/ts-utils`'s canonical `MessageLogLevel`/`ReporterLogLevel` so the panel can filter at logger granularity — making the `RetainingLogger` → panel bridge lossless. Current `MessageSeverity` filter lacks `detail`/`quiet` (coarser than the logger) and conflates verbosity-filter with display-styling. Fix (fork a): two axes — `IMessage.level: MessageLogLevel` drives filtering (`shouldLog`-based threshold); `severity?: MessageSeverity` (incl. `'success'`) is styling-only, defaulting via a level→severity derivation. Breaking on the messages packlet — cheap, ts-app-shell is active-dev.

**Origin.** Gap in the observability journey (same as `logging-observability`): `RetainingLogger` retains rich levels server-side; this completes the display half. Cross-library semantic alignment (L19 family). Soft-blocker for personaility's client-side observability.

### `logging-observability` 🟢

**Status:** ✅ implementation complete — PR #418 review satisfied; ready to squash → `release`
**Integration branch:** `logging-observability` (off `release`) → squash to `release` at close
**Workflow shape:** single implementation PR onto integration branch
**Substrate:** `.ai/tasks/completed/2026-05/logging-observability/{brief.md, state.md, result.md, README.md}`
**Package surface:** `@fgv/ts-utils` logging packlet (`LoggerBase` additive `_logStructured` hook + `RetainingLogger` + `MultiLogger` + `ILogRecord`) + `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Out-of-scope:** changing the existing `_log` seam / `InMemoryLogger`; `IDetailLogger` fan-out; template-substitution formatting; the consumer's log-query endpoint + display (consumer side; `ts-app-shell` messages packlet covers display).

**Mission.** Add two observability primitives to `@fgv/ts-utils`'s `logging` packlet (consumer request from personaility): `RetainingLogger` (bounded most-recent-N structured-record ring with severity + since-cursor query API) and `MultiLogger` (fan-out one log call to N children, each with its own threshold — feeds both `ConsoleLogger` and a retainer from one pinned `ILogger`). Plus the enabler: an additive `LoggerBase._logStructured` hook (default no-op) that exposes the structured `(level, formatted, message, params)` to retaining subclasses without breaking the existing `_log` seam.

**Origin.** Cross-repo handoff (`.ai/notes/cross-repo-handoffs/logging-observability-2026-05.md`). Extend-the-primitive: general logging infra, not consumer-specific. `@fgv/ts-utils` established surface → additive-only, 100% coverage. Soft-blocker for a downstream observability stream. Q5 (record shape) resolved to structured via the `_logStructured` hook — see brief.

### `prompt-assist-screeners` 🟢

**Status:** 🟢 ready to commission (substrate prep in flight)
**Branch base:** `release`
**Workflow shape:** single-PR breaking-change feature
**Substrate:** `.ai/tasks/active/prompt-assist-screeners/{brief.md, state.md}`
**Package surface:** `@fgv/ts-prompt-assist` (safety packlet) + `.ai/instructions/LIBRARY_CAPABILITIES.md` + in-repo consumers of the dropped fields
**Out-of-scope:** the local-classifier screener itself (B-3 of `local-ai-exploration`); LLM-based screening; screener caching; parallel execution; whole-prompt/post-render screening hook.

**Mission.** Replace `@fgv/ts-prompt-assist`'s regex-only / sync / closed-kind safety pipeline with a pluggable `IScreener` model. Consumers wire arbitrary screening logic (async ML classifiers, network calls, custom rule engines) into prompt resolution. Breaking change; no compat shims. The existing regex screener becomes a built-in `createPatternScreener` factory; `IPromptSafetyPolicy.screeners` replaces `suspiciousPatterns`/`screenedSources`/`onSuspicious`; `applySafeguards` becomes async; findings carry per-finding disposition + optional structured metadata; finding kinds open via `string & {}`.

**Origin / dependency.** Upstream gap-fix for `local-ai-exploration` B-3 (local classifier → `IPromptSafetyPolicy` backend), which can't be built against today's surface. Per the gap-then-fix tenet, fix the primitive here first → ship to `release` → `local-ai-exploration` absorbs (merge `release` → integration) before B-3. Runs parallel to `local-ai-exploration` B-2 (independent surfaces). Independent of the local-ai experiment's outcome — benefits any consumer wanting custom screeners.

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

### `ts-app-shell-styling-hardening` ✅

**Status:** ✅ implementation merged to integration branch (PR #429); cluster-close PR open
**Integration branch:** `ts-app-shell-styling-hardening` (off `release`) → squash to `release` at close
**Workflow shape:** single implementation PR onto integration branch
**Substrate:** `.ai/tasks/completed/2026-05/ts-app-shell-styling-hardening/{brief.md, state.md, README.md}`
**Package surface:** `@fgv/ts-app-shell` `messages` packlet (icon SVGs + `MessagesProvider` + `IMessageAction` discriminated union + `ToastItem`) + README setup section + `.ai/instructions/LIBRARY_CAPABILITIES.md`

**Mission.** Hardened `@fgv/ts-app-shell` against the most common consumer misconfiguration — forgetting to add `'./node_modules/@fgv/ts-app-shell/lib/**/*.{js,jsx}'` to the Tailwind `content` array. Three layers: (1) defensive inline geometry on catastrophic-failure icon SVGs and absolutely-positioned overlays in the `messages` packlet (including inline `position: relative` on the search wrapper — caught in review); (2) self-diagnosing probe in `MessagesProvider` using a sentinel arbitrary-value Tailwind utility (`h-[7.3215px]`, uniquely-named so it can only be generated by Tailwind scanning ts-app-shell's built JS — also caught in review, replacing the original `h-3.5` probe that could be masked by consumer-side usage); (3) targeted README nudges (top-of-doc Required-setup callout, stable `## Setup` anchor, troubleshooting section). `IMessageAction` refactored to a discriminated union (`IMessageHrefAction | IMessageCallbackAction`) so "exactly one of `href` or `onAction`" is enforced at the type level.

**Origin.** Cross-repo debug 2026-05-29: personaility on `@fgv/ts-app-shell@5.1.0-32` reported "no filter button visible" — DOM proved Tailwind geometry classes present without CSS, root cause was missing `content` path entry. README was correct but easy to miss; failure mode silent and catastrophic enough to warrant in-package defenses.

### `local-summarization` ✅

**Status:** ✅ shipped to `release` (integration branch `local-summarization` squash-merged).
**Branch base:** `release` (integration branch `local-summarization`)
**Package surface:** `@fgv/ts-extras-transformers` + `@fgv/ts-web-extras-transformers` (added `summarize`) + `samples/testbed` (CLI scenario) + `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.** `summarize(summarizer, text, options?) → Promise<Result<SummarizationOutput>>` in both facades (surface parity; thin `captureAsyncResult` boundary over the `summarization` pipeline) + a CLI-only `local-summarization` testbed scenario (`Xenova/distilbart-cnn-6-6`; surfaces via the shell's `no-web` path). Third facade task type (`classify` → `embed` → `summarize`). Consumer-driven: local is the cheap/fast path; cloud (ai-assist) stays for quality on long/complex docs.

**Outcome.** `loadPipeline` task-typing needed no extension; no unsafe cast. Facades 28 tests each @ 100%; testbed 143 @ 100%; full `rush build` + `build:web` green; `minor` change files; api reports regenerated.

**Artifacts:** [`.ai/tasks/completed/2026-05/local-summarization/`](../.ai/tasks/completed/2026-05/local-summarization/) (brief, state, result, README).

### `local-ai-exploration` ✅ (cluster)

**Status:** ✅ shipped — all sub-phases (B-1…B-5) merged into integration branch `local-ai-exploration`; promotion PR `local-ai-exploration` → `release` open (see PRs in the artifacts). (First promotion #410 was closed as premature — reopened for B-5, then re-promoted.)
**Integration branch:** `local-ai-exploration` (off `release`)
**Package surface (new):**
- `samples/testbed/` — long-lived sample-browser app (web + CLI), themed (light/dark), with two working scenarios: `local-classifier-safety`, `local-embedding-search`.
- `@fgv/ts-extras-transformers` + `@fgv/ts-web-extras-transformers` — Result-integration boundary over `@huggingface/transformers` (`loadPipeline`, `classify`, `classifyAll`, `embed`; `generate` deferred).
- `@fgv/ts-app-shell` — gained a default light/dark theme (54-token CSS-var system + Tailwind preset) as a gap-fix; the testbed was its first visual consumer.

**Outcome.** The B-3 done-or-discard gate decided **SHIP**: the facade read cleaner than raw `pipeline()`, survived a real composition (classifier → `ts-prompt-assist` screener), and B-4a confirmed it survives a second model type (embedder). B-5 wired the shell/CLI to actually run scenarios and, via gap-then-fix, gave ts-app-shell a shippable theme. The dual-target consumption pattern (facade-agnostic core; browser facade on web / Node facade via `webpackIgnore` on CLI) proved repeatable. `LIBRARY_CAPABILITIES.md` entries added.

**Sub-phases (all merged to `local-ai-exploration`):** research #402 · substrate #403 · B-1 #404 · B-2 #405 · B-3 #408 · B-4a #409 · B-5 (shell+CLI + ts-app-shell theme + styling) #411.

**Follow-ups (deferred / tracked):** `generate` primitive + a local text-generation scenario; port `samples/ai-image-gen-sample` scenarios into the testbed (P3 tech debt); optional Heroicons theme-toggle icon; palette retuning (CSS-var overridable); a "remaining gaps → which yield real value" review thread.

**Artifacts:** [`.ai/tasks/completed/2026-05/local-ai-exploration/`](../.ai/tasks/completed/2026-05/local-ai-exploration/) (brief, all phase briefs/results, state).

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
