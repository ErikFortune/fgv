# `ts-prompt-assist-features` cluster — Completed

**Cluster:** `ts-prompt-assist-features`
**Completed:** 2026-05-19
**Integration branch:** `claude/ts-prompt-assist-features` (off `release`)
**Promoted to release:** see cluster→release promotion PR (cited at top of `state.md`)

## Summary

This cluster delivered `@fgv/ts-prompt-assist` v0.1 — a ts-res-driven prompt resolution library with Mustache substitution, scope-chain walking, resource bindings, output validation, and LLM-prompt safeguards — plus the upstream `@fgv/ts-res` capability changes that the v0.1 needs to be coherent (the `ts-res-typed-conditions` sub-stream, captured separately at [`../ts-res-typed-conditions/`](../ts-res-typed-conditions/README.md)), plus an end-to-end demonstration in `samples/ai-image-gen-sample`.

Mental model: every consumer surface that calls an LLM with a prompt does **lookup** (qualifier-conditioned variant selection via ts-res) then **compose** (Mustache substitution); this library standardizes both halves so consumers stop reinventing the resolution machinery.

## What shipped

### `@fgv/ts-prompt-assist` v0.1 (new library)

- `PromptLibrary.create({ store, qualifiers, registry?, safetyPolicy?, cacheListener?, logger? })` — factory.
- `PromptLibrary.resolve(req)` — chain-walks scopes, runs ts-res candidate selection, merges scope-level bindings honoring `enforced` locks, recursively resolves resource bindings with RFC 8785 cycle-detection + depth cap, renders via Mustache with `escape: 'none'`. Returns body + full `IPromptResolveTrace`.
- `PromptLibrary.resolveJsonOutput<K>(req, rawOutput, expectedKind)` — JSON pipeline: strips fences via `AiAssist.fencedStringifiedJson` → `JSON.parse` → typed `Converter<T>` dispatched by `(id, kind)` → `outputValidations[]` chain narrowed by `value.kind`. Entry-point runtime-verifies descriptor's `output.kind === 'json'` AND that the converter is registered to produce `expectedKind`; runtime-evidenced narrow rather than caller-asserted.
- `PromptLibrary.resolveFreeTextOutput(req, rawOutput)` — runtime-verifies `output.kind === 'free-text'` and returns the raw output verbatim as `Result<string>`.
- `PromptLibrary.describe(req)` — descriptor lookup across scopes with cross-scope structural-equality check.
- Storage abstraction `IPromptStore` (read-only at v0.1) with `FileTreePromptStore` (canonical) and `PromptStoreFixture.build(seed)` (canonical in-memory test/demo fixture; no standalone `InMemoryPromptStore`).
- `PromptRegistry<TResponse>` with three typed sub-registries (`converters` / `slotKinds` / `outputValidations`), parameterized on the consumer's response union.
- `IPromptSafetyPolicy` — length cap, suspicious-pattern screen (regex with `lastIndex` reset between slots), `screenedSources` allowlist, `onSuspicious: 'warn' | 'reject'`, and `antiJailbreakPreface` (consumer-supplied; library ships no default content).
- `buildSimpleDescriptor({ id, title, surface?, description? })` — trivial free-text chat case helper (free-text only; JSON output goes through the full `IPromptDescriptor` path to preserve `output.kind` dispatch).

### `@fgv/ts-extras/mustache` (additive extension)

- `MustacheTemplate.create(template, { escape: 'none' | 'html' | callback })` — escape strategy as optional second argument. Default `'html'` preserves existing back-compat. Uses a per-instance `Mustache.Writer` — no global mutation of `Mustache.escape`. `ts-prompt-assist` consumes `'none'` for verbatim LLM-prompt rendering.

### `@fgv/ts-res` typed-conditions support

See [`../ts-res-typed-conditions/README.md`](../ts-res-typed-conditions/README.md) — sub-stream that taught ts-res to honor qualifier-name semantics at both type and runtime levels via Decl-tree cascade + sibling `typed*` Converter exports. Closed round-2 finding F1 at the right architectural layer.

### Sample-app demonstration

`samples/ai-image-gen-sample` integrates `@fgv/ts-prompt-assist` end-to-end: wires `PromptLibrary.create` via `PromptStoreFixture` against a typed `qualifierNameConverter`, demonstrates a `Tone` qualifier-conditional candidate, and replaces the hardcoded "You are a helpful assistant" system prompt with a resolved one.

## Sub-stream

| Sub-stream | Status | Artifacts |
|---|---|---|
| [`ts-res-typed-conditions`](../ts-res-typed-conditions/README.md) | ✅ Complete | Decl-tree cascade (B-1) + Converter parameterization (B-2) + ts-prompt-assist consumer port (B-3) |

## Key PRs

### Phase A — research and design
- #357 — Phase A design lock; `design.md` authored.
- #358 — Phase B brief authoring.

### Phase B — implementation (sub-phase decomposition after #359 was retired)
- #359 — First single-agent Phase B attempt. **Retired** without merge after mid-run context drift produced ~35 reviewer-flagged issues. Triggered the cluster-wide sub-phase decomposition discipline.
- B-0a / B-0b / B-1a / B-1b / B-2 / B-3 / B-4 / B-5 — sub-phase PRs implementing the full library. Each landed cleanly under the decomposed discipline; orchestrator-led cleanup PRs (#367, #370) absorbed post-merge nits per the cluster's ship-then-tidy mechanic.
- Surface-tidy round (#372) — split `resolveAndValidateOutput<T>` into `resolveJsonOutput<K>` + `resolveFreeTextOutput`. Replaced the last caller-asserted-`T` boundary with a runtime-evidenced kind check. Both surviving P2 TECH_DEBT entries retired.

### Refine — consumer-port pressure-tests
- Round 1 (#373 held; #374 cherry-picked the findings doc) — 14 findings, 0 P1 / 5 P2 / 9 P3.
- Round 2 (#384) — fresh sample-app integration against the post-round-1 ergonomic surface. Reported "materially smoother than round-1."

### Ergonomics absorbs from round-1
- #375 `Failure<T>.withType<U>()` (ts-utils).
- #376 mixed-shape `Qualifiers.QualifierCollector.create` + `IQualifierContext` Partial-widen (ts-res).
- #377 ts-extras Yaml browser export bug + L13 cross-runtime export micro-test.
- #380 ts-prompt-assist ergonomics absorb (F3 / F9 / F12 / F14).

### Repo-infra adjacent to the cluster
- #381 Code-reviewer agent promoted to top-level discovery scope.
- #383 release → integration merge to absorb the discovery fix.

### Round-2 absorbs + typed-conditions sub-stream + cluster close
- #385 (closed superseded by #395) — round-2 F1+F2+F6 absorb attempt; F1's local sibling types obsoleted by the ts-res-layer ownership in `ts-res-typed-conditions`.
- #386 (closed superseded) — leaf-only Decl parameterization; superseded by the full cascade in #391.
- #387 / #388 / #389 — decision-track docs for `ts-res-typed-conditions` (option-space brief / first evaluation / addendum with the "leaf-only" structural correction).
- #390 substrate-prep for `ts-res-typed-conditions`.
- #391 B-1 Decl-tree cascade.
- #392 B-2 sub-brief + state.md.
- #393 B-2 design notes (Candidate D — sibling `typed*` exports).
- #394 B-2 Converter parameterization (16 typed siblings + cast-pressure regression tests).
- #395 B-3 ts-prompt-assist consumer port + F2 + F6 absorb.
- #384 — round-2 sample-app integration (originally held; landed after B-3 with sample updated to demo the typed flow end-to-end).

## Key design decisions (load-bearing for future maintenance)

1. **Lookup-then-compose** — every prompt resolve is qualifier-conditioned candidate selection (ts-res) followed by Mustache substitution. Both halves standardized in one library.
2. **Scope-chain walking with bindings** — most-specific wins; `enforced` lock prevents downstream override; caller-supplied subs override merged bindings except enforced.
3. **Open qualifier metadata** (`required` / `expected` / `disallowed` per descriptor) — never closed enums per descriptor.
4. **Resource bindings as first-class** — recursive resolve with RFC 8785 canonical-JSON cycle detection + depth cap (`resourceBindingDepthLimit`, default 5).
5. **Output validation library-side** — strip fences → `JSON.parse` → typed Converter → registered validators. The output-kind discriminator on the descriptor (`'json'` vs `'free-text'`) is runtime-verified at the entry-point; consumer cannot ask for the wrong shape.
6. **Storage-agnostic via `IPromptStore`** — FileTree adapter canonical; in-memory tree for tests via `PromptStoreFixture.build(seed)`.
7. **Mustache verbatim render with `escape: 'none'`** — load-bearing for LLM-prompt fidelity. Achieved via additive extension to `@fgv/ts-extras/MustacheTemplate` rather than working around the original `html`-escape default.
8. **Qualifier-name semantics owned at ts-res** — typed `qualifierNameConverter?` opt-in for consumers; convert-time runtime teeth + type-level narrows that flow end-to-end through the Converter pipeline. See sub-stream.
9. **Anti-jailbreak preface is consumer-supplied** — library provides the seam (`antiJailbreakPreface` in `IPromptSafetyPolicy`); does NOT ship default content.

## Out-of-scope (deferred to followup streams)

- Write API on `IPromptStore` (`put` / `putBindings` / `delete`).
- Change-notification (`watch`).
- LLM-call orchestration.
- Editor UX — queued as `ts-prompt-assist-editor-ui` in `docs/FUTURE.md`.
- Sample/test app standalone shape — queued as `ts-prompt-assist-samples` in `docs/FUTURE.md`.
- Default anti-jailbreak content.
- Free-text output validators.
- Typed qualifier VALUES (only NAMES are typed at v0.1; values stay loose).
- `_bindings.yaml` / `_qualifiers.yaml` qualifier-name converter threading — narrow scope held in B-3; semantic rationale documented in `phase-b3-result.md`.

## Cluster operational lessons (captured in `state.md` history; surfaced for future clusters)

- **Sub-phase decomposition is the answer to mid-run context drift.** PR #359 retired itself by accumulating ~35 issues in a single long agent run; the rescope into B-0a → B-5 fixed-by-restart was the operating model that landed Phase B cleanly.
- **Ship-then-tidy mechanic.** Post-merge cleanup PRs (#367, #370, surface-tidy #372) absorbed sub-phase nits within hours of each merge — defers nothing to a future "tech debt sweep" that would lose context.
- **fgv-conventions pre-load in agent commissions** (L22 in `lessons-pending.md`) — round-2 pressure-test agent's retract-on-discovery rate dropped sharply once the brief included an explicit conventions section.
- **Fresh-agent continuity payoff.** The agent that shipped B-2 also shipped B-3 and #384 — three consecutive clean PRs from one session, carrying the stream's conventions (drift-protection markers, result.md discipline, scope-decision rationale) without re-onboarding.
- **Copilot as a load-bearing review layer.** Round-1 of #391 caught a half-cascade on `IResourceTreeRootDecl.resources/children` that the implementing agent had missed — same failure mode as the original PR #386 that birthed the sub-stream. Worth allocating real review-cycle time to Copilot's pass rather than treating it as rubber-stamp.

## Pointers for future readers

- `brief.md` / `design-brief.md` / `design.md` — the binding design contract (Phase A locked the conceptual model; design.md is the implementation source-of-truth).
- `brief-phase-b.md` / `brief-phase-b-1b.md` — the sub-phase decomposition + the 10 explicit guardrails added after #359.
- `pressure-test-findings-round-1.md` / `round-2.md` — consumer-port findings; F1 (closed via sub-stream) / F2 (closed via #395) / F5 (queued for v0.2 typed VALUES) / F8 (deferred) / others.
- `ts-res-typed-conditions-design.md` / `ts-res-typed-conditions-evaluation.md` — the design exploration that birthed the sub-stream. Worth reading for the "leaf-only correction" + the cast-pressure framing.
- `phase-384-result.md` — sample-app demonstration outcome.
- `state.md` — full chronological record of cluster decisions, sub-phase commissions, review rounds, and absorbs.
