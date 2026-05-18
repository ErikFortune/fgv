# Lessons pending — orchestrator-session inbox

Cross-cutting lessons surfaced during orchestrator sessions, parked here until either codified (into a convention / skill / agent-prompt update — graduating to `release` via a `chore/` PR) or aged out. Per `.ai/conventions/workflow/doc-graduation.md`, this file lives on `claude/orchestrator-session` and is swept to release at natural moments (cluster close; orchestrator handoff; codification batch).

---

## Status

Sessions feeding this inbox: orchestrator sessions through 2026-05-17 (ai-assist cluster + doc-graduation + lint-gate codification + crypto-batch-2 + ts-prompt-assist clusters).

Active clusters at most recent sweep point:
- ✅ ai-assist cluster — shipped to release in #336
- ✅ crypto-batch-2 cluster — shipped to release; lessons captured (L14–L17)
- 🟢 ts-prompt-assist cluster — Phase B + B-5 docs merged into integration; surface-tidy round in flight; cluster close pending consumer-port pressure-test (lessons L18–L21 below)
- 🟡 `ai-assist-thinking-events` — sequencing after thinking-config phase B landed (now satisfied); ready to commission

---

## Pending lessons

### L1. Serialize phase A when streams address structurally similar problems

**Observed:** ai-assist-image-generation phase A and ai-assist-thinking-config phase A v1 ran in parallel. Image-gen settled on a layered-options architecture at signoff. Thinking-config's v1 design proposed a unified-type architecture (Approach C) that explicitly rejected silent translation in design but baked it in via a wire-mapping table. The two streams address structurally the same problem (multi-provider surface with per-provider knobs); parallel phase A meant thinking-config v1 couldn't benefit from image-gen's pattern crystallization. Required a v2 revision pass costing one extra phase-A round-trip.

**Rule:** "Outputs are disjoint at the research level" is not sufficient grounds for parallel phase A. The *pattern-extraction* outputs feed each other. For analogous clusters: serialize phase A so the second design can build on the first's resolution.

**Codification candidate:** Add to `.claude/agents/orchestrator.md` § Workflow shapes under a new "When to parallelize phase A" subsection — or extend the existing branch-buffer-and-promotion convention. Decision deferred to next codification batch.

---

### L2. Cloud-agent harness auto-suffixes branch names

**Observed:** Cloud-agent runs append random suffixes to branch names regardless of what the brief specifies. Observed instances: `claude/ai-image-generation-research-gtE2l`, `claude/ai-assist-thinking-config-xy1J8`, `claude/implement-ai-assist-v2-jGM2V`, `claude/ai-assist-thinking-phase-b-aIY1Y`, `claude/implement-image-generation-m7xMi`.

**Rule:** Briefs should not specify exact work-branch names; they should describe the desired stem and acknowledge the harness will suffix. State.md should record the actual branch name as the agent's first checkpoint write.

**Codification candidate:** Brief template language: "Work branch: `<stem>` (or harness-auto-suffix; document the actual name in state.md)". Already in current briefs informally; codify as a kickoff-prompt-shape convention item.

---

### L3. Cloud-agent harness auto-opens draft PRs that need explicit closure

**Observed:** Cloud-agent sessions auto-open draft PRs for their work branches. When the orchestrator's prep/commission PR consolidates that content (as `chore/<stream>-prep` mechanic does), the agent's draft PR is superseded but stays open until manually closed. Observed instances: #325 (ai-assist-thinking-config v1 design), #326 (ai-assist-image-generation phase A design).

**Rule:** As part of post-merge bookkeeping when an orchestrator prep PR supersedes an agent draft PR: close the agent's draft with a "superseded by #N" comment.

**Codification candidate:** Add to `.claude/agents/orchestrator.md` § Post-merge bookkeeping: "Close any superseded cloud-agent draft PRs with a one-line supersession comment naming the merging PR."

---

### L4. Don't trust docs over observed behavior on "is this currently broken" claims

**Observed:** Image-gen phase A v1 design flagged Gemini Flash Image `responseModalities` as a critical missing parameter, citing Google docs as authoritative. User empirically verified Gemini Flash works fine without it; the docs are stale. The design's "urgent fix" turned out to be chasing a ghost.

**Rule:** Design phases shouldn't rely on docs alone for "is this currently broken" claims. Need live verification (a test call) before flagging a path as broken. Briefs should explicitly require live verification for any claim of pre-existing brokenness.

**Codification candidate:** Add to phase-A brief template under a new "Live verification before flagging brokenness" section. Single sentence in the brief; high-impact discipline.

---

### L5. Migrated state.md is not a polished README.md

**Observed:** Per the artifact-protocol convention, completed-stream artifacts get migrated to `.ai/tasks/completed/<YYYY-MM>/<id>/` AND a polished `README.md` is written as the future-reader entry point. Multiple agents have treated "state.md migrated to completed/" as fulfilling the README requirement and skipped the separate polished file. Observed: auth-primitives-batch1 (caught retroactively via separate cleanup PR), ai-assist-image-generation phase B (caught in cluster-close prep via orchestrator), ai-assist-thinking-config phase B (caught after orchestrator review comment).

**Rule:** Brief acceptance criteria must explicitly say "write a separate polished README.md — migrated state.md alone does not fulfill this."

**Codification status:** Codified in `.ai/instructions/CODING_STANDARDS.md` § Pre-PR Validation Checklist (#337) and in the crypto-batch-2-misc brief (#338). Pattern is now part of the kickoff-prompt-shape; should also surface in `.ai/conventions/workflow/artifact-protocol.md` directly. Deferred to next sweep.

---

### L6. Don't document capability that isn't yet implemented

**Observed:** Thinking-config phase B agent wrote a section in `LIBRARY_CAPABILITIES.md` describing `IAiStreamThinking` events as caller-visible — but D9 explicitly deferred thinking-event surfacing to a followup stream (`ai-assist-thinking-events`). `IAiStreamThinking` doesn't exist; callers reading the doc would expect events they wouldn't receive. Caught at orchestrator review; fixed before merge.

**Rule:** When the brief says "X is out of scope, deferred to followup stream Y," the docs update should explicitly disclaim the deferred capability rather than describe what will be there.

**Codification candidate:** Add a "Don't document deferred capability as implemented" item to the standard brief template or `CODING_STANDARDS.md`. Low-frequency miss but high-confusion when it happens.

---

### L7. `rushx lint` is a separate gate from `rushx build`

**Observed:** Multiple recent streams (#329, #334, ai-assist cluster #336) had lint failures escape into PR-open or post-merge state because acceptance criteria only required `rushx build` and `rushx test`. `rushx build` does NOT transitively run lint in this monorepo's Heft config. Cost compounded: lint failure on the integration branch blocked the cluster→release promotion.

**Codification status:** Codified in `.ai/instructions/CODING_STANDARDS.md` § Pre-PR Validation Checklist (#337). Orchestrator agent prompt updated with new "Reviewing an agent PR before merge / bundling" common operation that calls `get_check_runs` before any workflow advancement.

---

### L8. Orchestrator must gate workflow advancement on CI green

**Observed:** Cluster-close prep PR #335 and integration→release PR #336 were both opened without checking CI status on the constituent agent PRs. The lint failure that should have been caught at PR #334 review surfaced only when #336 hit CI, blocking the cluster merge.

**Codification status:** Codified in `.claude/agents/orchestrator.md` § "Reviewing an agent PR before merge / bundling" (#337). The orchestrator's pre-advancement check is now an explicit common operation, not implicit best practice.

---

### L9. Cross-repo handoff via push model — convention candidate

**Observed:** The personaility-side orchestrator delivered the batch-2 brief via chat-paste because cross-repo MCP scope didn't permit direct read. Archived at `.ai/notes/cross-repo-handoffs/fgv-batch-2-handoff-2026-05.md` on the crypto-batch-2 integration branch.

**Rule:** Cross-repo handoffs use a push model — the source-side orchestrator opens a PR on the destination repo dropping the brief at `.ai/notes/cross-repo-handoffs/<topic>.md`. Each side reads from its own working tree. No cross-repo read scope needed.

**Codification candidate:** Worth a small convention doc if cross-repo handoffs recur. Currently one observed instance (personaility batch 2); convention codification deferred until a second or third instance proves the pattern.

---

### L10. "Result-integration boundary over external library" — convention candidate

**Observed:** Emerged during Q3 debate for WebAuthn (crypto-batch-2). When fgv wants to expose functionality from a well-maintained upstream library (`@simplewebauthn/*`), the right shape is a thin Result-integration boundary — convert thrown exceptions to `Result<T>`, no opinion baked in beyond that. Same architectural shape as `@fgv/ts-utils-jest`'s relationship to Jest. Avoids breadth/opinion/maintenance burden of comprehensive wrapping.

**Codification candidate:** Worth a convention doc once one or two more "integration package" cases exist for comparison. Plus the parking-lot question about top-level `integrations/` directory vs piling into `libraries/`. Deferred to post-WebAuthn-stream triage.

---

### L11. Decision-tracks in chat are not durable

**Observed:** Most of the architectural deliberation this session (Q1-Q9 on crypto-batch-2; the layered-pattern derivation for image-gen; the thinking-config v1→v2 transition rationale; the doc-graduation adoption discussion) lived only in chat. Once the session ends, a future orchestrator picking up cold can't reconstruct rationale from PR descriptions and state.md files alone.

**Codification status:** Codified via the doc-graduation convention (#331) — orchestrator-session branch + `.ai/notes/orchestrator/` is now the durable home for decision-tracks. This lessons-pending.md itself is the first entry of that surface.

---

### L12. Integration-branch pattern validates for multi-stream clusters

**Observed:** ai-assist cluster used `claude/ai-assist-features` as the integration branch absorbing all stream substrate and implementation before promotion to release. Two streams + several orchestrator prep PRs + tech-debt cherry-pick + cluster-close prep all landed on integration cleanly. Final integration→release was one cohesive merge with full audit trail.

**Codification status:** Codified in `.ai/conventions/workflow/doc-graduation.md` (#331) as the cluster integration-branch convention. crypto-batch-2 cluster (in flight) is using the same pattern; future clusters inherit by default.

---

### L13. Cross-runtime entry-point export divergence — recurring class of bug

**Observed:** Post-cluster (2026-05-11), two bug fixes came in:
1. `@fgv/ts-extras` exporting `Crypto` instead of `CryptoUtils` from `index.browser.ts`, surfacing as `CryptoUtils.Keystore undefined` in the personaility web app integration. Consumer caught it; user fixed inline with a one-off test for that specific import.
2. `repo-template` skipping transitive dependencies on link. Discovered while testing #1's fix. Single-occurrence tooling bug; git-only.

The first is the load-bearing observation: cross-runtime entry-point export drift has bitten the team multiple times. Pattern is structural — api-extractor runs only on the Node entry point, so the browser entry diverges silently. Per-symbol comprehensive coverage isn't viable given the API surface.

The bug also drove the next alpha publish forward: rather than waiting for the originally-planned cadence, the fix-and-publish path produced `5.0.1-27` to unblock the personaility consumer.

**Rule:** Opportunistic per-library micro-tests assert top-level export names match between Node and browser entries. Trigger: anytime a library's `index.browser.ts` is touched substantively, or anytime a cross-runtime export bug is reported, the affected library's micro-test gets added/expanded.

**Codification status:** Codified in `docs/TECH_DEBT.md` as a P2 entry (#341 open). Trigger condition baked into the entry. No commitment to backfill across all libraries — added when a library's browser entry is touched.

**Lesson-meta (process):** Two bug-report-driven codifications this session — lint gate (#337) and now this. Consumer-first detection plus inline fixes by the user is the ship-then-fix operating model. The orchestrator surface is for *patterns surfaced by bugs*, not for individual bug fixes themselves. Git is sufficient for the fixes; TECH_DEBT entries appear only when a pattern recurs or structural prevention is worth scoping. The pattern of "user fixes bug → orchestrator captures the systemic lesson if it's worth elevating" is now established.

---

### L14. B.0 live-verification gates earn their keep when phase A research was incomplete

**Observed:** During crypto-batch-2-hpke phase B, the implementing agent hit a real RFC-vs-design discrepancy on the first non-trivial implementation step: design.md §1 used the LabeledExtract label `"dh"` in the ExtractAndExpand step, but RFC 9180 §4.1 actually specifies `"eae_prk"`. The agent stopped, surfaced the discrepancy, and after orchestrator adjudication corrected to the RFC value (confirmed via OpenSSL happykey and multiple independent implementations). The brief had encoded a non-optional **B.0** ("phase B step zero — live RFC verification") because the phase A agent's research session was rfc-editor.org-blocked (HTTP 403), so the algorithm pseudocode in `design.md §1` was drawn from training-corpus memory rather than the authoritative spec.

**Rule:** When phase A research is known-incomplete — rate-limited fetches, network-blocked spec sources, training-corpus-only protocol details, deprecated upstream library versions — encode a **non-optional verification step at the top of the phase B brief** with a clear stop-and-surface rule. Cost: one round-trip if a discrepancy surfaces. Alternative: silent algorithmic divergence shipped in code, much more expensive to unwind post-publish.

**Codification candidate:** Add to `.claude/agents/orchestrator.md` § "When phase A research is known-incomplete" subsection (or extend the brief-shape convention at `.ai/conventions/workflow/`). The phase-B-brief template for streams with a recognized phase A gap should default to including a B.0 verification step. Examples worth citing: HPKE (RFC fetch blocked → label discrepancy caught); Argon2id (hash-wasm activity check at B.0, no issues surfaced but the discipline was correct).

**Reference:** crypto-batch-2-hpke phase B brief (`.ai/tasks/completed/2026-05/crypto-batch-2-hpke/brief-phase-b.md` §B.0); state.md decisions log records the resolution; #348 PR body cites the correction.

---

### L15. Silent lint-gate bypass compounds. Anti-patterns metastasize when nobody pushes back.

**Observed:** During crypto-batch-2 cluster close, surfaced that `@fgv/ts-web-extras` had no `eslint.config.js` and `rushx lint` was exiting code 2 silently for that package. Subsequent sweep found four packages in this state (`ts-web-extras`, `ts-http-storage`, `ts-random`, `repo-template`). Once configs were added back, the violations accumulated under the silent gate became visible:

- **126 lint violations** in `ts-web-extras` source (6 errors + 120 warnings) after restoring its config
- **20 instances** of a specific anti-pattern: mock partial-Result-shape cast to `any`. Tests had been returning `{ isSuccess: () => true, value: x, orDefault: () => x }` (a hand-rolled subset of the `Result<T>` interface) cast to `any` because the partial didn't conform. The Result pattern's whole point is reified in the `succeed()` / `fail()` helpers, but contributors converged on the partial-mock-cast shortcut because nothing was pushing back.
- **23 hand-rolled `globalThis.X = mock` save-and-restore patterns** across the monorepo (16 in `ts-extras/ai-assist`, rest scattered). Once one test got away with the manual pattern, copy-paste did the rest. The original lint gate would have flagged the first instance via `require-atomic-updates`.
- Other classes accumulated similarly: 24× `no-explicit-any`, 17× missing `explicit-member-accessibility`, etc.

**Rule:** A silent lint-gate bypass is exponentially expensive. The cost compounds not from any individual rule violation but from the **anti-pattern propagation** that follows when the immune system stops responding. Twelve months of un-gated browser-side code accumulated three distinct anti-patterns (`as any` Result mocks, manual `globalThis.X` save/restore, missing type annotations), each with 10–25 instances.

**Codification candidate:**

1. **CI guard.** Add a CI step that fails fast when any package's `rushx lint` exits non-zero with "couldn't find eslint.config" specifically. Current behavior: the rush-orchestrator marks the package as FAILURE but the cluster integration branches kept advancing because the message looked like infrastructure noise rather than a gate signal. A package without an eslint config should be a hard failure with a clear remediation message ("create `eslint.config.js` matching sibling packages"), not silent skip.

2. **Per-PR sweep gate.** When a PR touches files in a package whose `rushx lint` is currently broken, require either fixing the lint config first OR explicitly acknowledging the broken gate in the PR description. The cost of fixing once is small; the cost of contributing un-linted code through a broken gate compounds.

3. **Scaffolding-checklist hole.** The TECH_DEBT P3 entry on `"sideEffects": false` already captures one dimension. Same shape of fix needed for `eslint.config.js`: any new `libraries/*` or `tools/*` package without one should fail the new-package scaffolding template check.

**Reference:** crypto-batch-2-misc README "Pre-existing issues" first surfaced the ts-web-extras gap; PR #353 restored configs for three sibling packages; PR #354 reduced ts-web-extras violations from 126 → 0 across two passes (orchestrator's automated work + Erik's manual cleanup of the anti-patterns). Tech-debt entries added in the cluster-close prep PR #350.

---

### L16. Hand-rolled-spy contagion is a tell that needs its own sweep.

**Observed:** Investigation of one `require-atomic-updates` error on `globalThis.fetch = mock; ... globalThis.fetch = original;` (line 1224 of `httpTreeAccessors.test.ts`) revealed the pattern was replicated 22 more times across the monorepo:

- 16 in `libraries/ts-extras/src/test/unit/ai-assist/` (`apiClient.test.ts` accounts for the largest concentration)
- 4 in `libraries/ts-extras/src/test/unit/ai-assist/` other test files
- 3 in `libraries/ts-web-extras/src/test/unit/`

All hand-rolling what `jest.spyOn(globalThis, 'fetch').mockImplementation(...)` + `.mockRestore()` provides natively. Issues with the manual pattern: (a) verbose, (b) fragile under exceptions if cleanup isn't in `finally`, (c) doesn't auto-cleanup between tests, (d) trips `require-atomic-updates`. (HPKE-style finding: in Node 18+, `globalThis.fetch` isn't an own-property, so `jest.spyOn` and `jest.replaceProperty` both fail; the right pattern is either `Object.defineProperty`-with-descriptor for the descriptor-aware case, or for branches like `fetchImpl ?? globalThis.fetch` just `/* c8 ignore */` the fallback and skip the global pollution.)

**Rule:** When you find an anti-pattern in one place, **always sweep** the full repo before deciding the local fix. If grep returns 3 instances of the same shape, you're not fixing one bug — you're proposing a convention; if 20, you're paying down a debt with compound interest.

**Codification candidate:**

1. **TECH_DEBT P3 entry** to clean up the 23 hand-rolled save/restore instances. Migration: replace `const originalX = globalThis.X; globalThis.X = mock; ... globalThis.X = originalX;` with `jest.spyOn(globalThis, 'X').mockImplementation(mock)` + `.mockRestore()` where the property is own / Jest can spy. For globals where it can't (e.g. Node's `globalThis.fetch`), `Object.defineProperty`-with-descriptor for the save/restore (calls evade `require-atomic-updates`).

2. **Test-skills doc update.** The `/result-tests` skill should explicitly call out the "use jest.spyOn / jest.replaceProperty for globals; do not hand-roll save/restore" guidance. Same shape as the `/result-pattern` guidance ban on `Result<void>` — a documented anti-pattern with a recommended replacement.

3. **Sweep-discipline reminder for orchestrator.** Add to the orchestrator agent's pre-fix checklist: "Before proposing a fix for a code-shape concern, grep the repo for occurrences. If >3, file as TECH_DEBT or chore-batch rather than fixing in this PR." The instinct is to fix-in-place; the discipline is to scope-first.

**Reference:** crypto-batch-2 lint follow-up sweep (PR #354); `require-atomic-updates` error investigation surfaced the pattern.

---

### L17. Pre-existing build issues in `localStorageTreeAccessors.test.ts` (separate tech debt)

**Observed:** During the ts-web-extras lint cleanup sweep, ran `rushx build` and saw the package fail with TS2353 / TS2339 errors at lines 926, 945, 971, 980, 983, 998, 1005 of `localStorageTreeAccessors.test.ts`: `'mutable'` not in `ILocalStorageTreeParams`, `'inferContentType'` not in `ILocalStorageTreeParams`, missing `toSucceed` / `toSucceedWith` matchers on what infers as `any`. Verified by stashing my changes and re-running on `release` baseline — same errors exist on HEAD. These predate the lint cleanup.

**Pattern:** A package whose tests don't compile but whose production code does — same disconnect class as the silent lint-bypass (L15) but for `tsc`. Probably the `LocalStorageTreeAccessors` API changed (renamed `mutable` field, removed `inferContentType` param) and the tests weren't updated. The package builds production code with `--composite` semantics so the test compile is in a separate pass that nobody checked.

**Codification candidate:** Either (a) fix the tests so the package's `rushx build` is green end-to-end, or (b) audit what `rushx build` actually runs vs what `rushx test` runs — if the test compile is happening at test time instead of build time, the per-stream pre-PR validation should be running `rushx test` rather than (or in addition to) `rushx build`. The CODING_STANDARDS Pre-PR Validation Checklist currently lists "rushx build / rushx lint / rushx test" but doesn't enforce that all three actually run a meaningful pass on each package. Worth confirming the test compile is part of `rushx test` and that agents are running it.

**Reference:** crypto-batch-2 lint follow-up sweep (PR #354 body's "Pre-existing build issue" section); verified on `release` HEAD `b3f87159f` and `15c94adad`.

---

### L18. Docs accurately describe shipped behavior, not design intent

**Observed:** During ts-prompt-assist B-5 (docs + handoff package PR #371), Copilot review caught two clusters of overclaims that the agent didn't catch and that the smoke-test discipline didn't surface:

1. **`trace.safeguardFindings` claimed to carry reject findings** in three places (README, LIBRARY_CAPABILITIES, `trace.ts` TSDoc). The impl actually returns `Result.fail` BEFORE producing an `IResolvedPrompt` on length-cap-violation or `onSuspicious: 'reject'` paths — reject details live in the failure message, not the trace. The design's §9 envisioned trace-bound findings universally, but the B-4 round-2 review-response commit had already removed the dead `findings.push` on reject paths because those findings were unreachable. The docs documented the design's aspiration, not what shipped.
2. **`resolveAndValidateOutput<T>` claimed end-to-end type safety** in README + LIBRARY_CAPABILITIES decision-shortcut. The caller-asserted `T` is NOT runtime-verified against the descriptor's declared converter kind (this is the surviving P2 TECH_DEBT entry the B-4 cleanup deferred). A consumer can ask `<IClassifierResponse>` for a `cited`-producing descriptor and get a typed lie. The doc claim was the design's wish, not the impl's reality.

Pattern: doc-writing agents tend to document the design's intent rather than reading the code to verify what actually ships. Copilot reads code (or at least reads carefully enough to catch the mismatch); the doc-writing agent didn't.

**Rule:** Doc sub-phases need an explicit "verify against shipped behavior, not design intent" guardrail. The smoke-test discipline (B-5's `readmeSmoke.test.ts`) covers code samples that run, but doesn't catch documentation claims about what the trace contains or what type guarantees hold. Need a separate doc-audit step: take each claim about a property / return shape / type guarantee and walk back to the impl to verify.

**Codification candidate:**

1. **Doc sub-phase brief addendum.** Explicit: "Every claim in the docs about a property's contents, a method's return type, or a type-safety guarantee must be walked back to the impl before opening the PR. Where the design and the impl diverge, document the impl — and either retire the design difference or file a tech-debt entry." Add to phase-doc brief template.
2. **Open TECH_DEBT entries are the canary.** If the docs claim something the TECH_DEBT entries call out as unresolved, the docs are wrong by definition. Suggest a routine cross-check: list open TECH_DEBT entries against the library; ensure no doc claim contradicts an open entry's "this is broken" position.

**Reference:** PR #371 Copilot review threads `r3255107593` / `r3255107608` / `r3255107640` (trace overclaim); `r3255107617` / `r3255107624` (type-safety overclaim).

---

### L19. Same-name-opposite-semantic between sibling libraries is a high-cost trap

**Observed:** During ts-prompt-assist B-1b, the partial-candidate composition walk used `isPartial` imported from ts-res by name but inverted the semantic — design.md §10.2 had `isPartial: true` marking the BASE (full) layer in ts-prompt-assist, while ts-res's `resolveComposedResourceValue` model uses `isPartial: true` to mark the OVERRIDE that layers ONTO a base. Erik caught it during PR #364 walkthrough; the design was re-aligned with ts-res's natural semantic in a same-PR amendment (§5.3 YAML example + §10.2 algorithm rewritten). Hand-rolled "preference filter" code that had been needed to compensate for the inversion was deleted.

The original failure mode: design picked a name from a sibling library and assigned it the OPPOSITE meaning. Each library's docs were internally consistent; cross-library, the same symbol meant opposite things. Authors moving between the two would compound confusion.

**Rule:** When importing or reusing a name from a sibling `@fgv/*` library, the semantic must match. If the new library needs the OPPOSITE meaning (or a meaningfully-different shape), rename — don't re-mean. "Re-meaning" is a maintainability landmine that surfaces later as composition-model drift across the family.

**Codification candidate:**

1. **Convention doc** in `.ai/conventions/`: "Cross-library semantic alignment for shared discriminator names" — when adopting a name (`isPartial`, `kind`, `disposition`, etc.) from another library in the `@fgv/*` family, the semantic must match the source library. Cite the `isPartial` story as the worked example.
2. **Design-phase brief addendum.** When the brief introduces a discriminator or boolean drawn from a sibling library, the brief author confirms the semantic match explicitly in the design doc (one-sentence cross-reference to the source library's definition). Catches the trap at design time, not impl time.

**Reference:** `.ai/tasks/active/ts-prompt-assist/state.md` row "B-1b — design §10.2 amended; `isPartial` semantic re-aligned to ts-res" (2026-05-16); PR #364 walkthrough.

---

### L20. Post-merge cleanup PR is the established ship-then-tidy mechanic for cluster-internal nits

**Observed:** Across the ts-prompt-assist cluster, three sub-phase merges were followed by focused orchestrator-driven cleanup PRs that landed on the integration branch within hours:

- **#367** (B-2 cleanup): dead `IBindingMergeResult.mergedBindings` field removed; `Hash.Crc32Normalizer → base Normalizer` at canonical-JSON-only sites; design §7/§10/§15.5 amendments.
- **#370** (B-4 cleanup, part 1): `ConverterRegistry.get<T>` no-kind overload removed; entry storage restructured as distributed discriminated union; pipeline reworked to `getKind → get(id, kind)` for cast-free internal dispatch.
- **Surface-tidy round** (in flight at lessons-update time): `resolveAndValidateOutput<T>` split into `resolveJsonOutput<K>` + `resolveFreeTextOutput`; design §8 / §9 / §17.2.6 amendments; the surviving P2 TECH_DEBT entry retired.

Each cleanup was small (one PR each, <12 files, <500 net additions), orchestrator-authored, and landed without ceremony. Erik's framing: *"Let's just fix things instead of carrying them forward. The bookkeeping overwhelms the cost of making the fix if we carry them forward."*

Pattern is the natural complement to **sub-phase decomposition**: small sub-phases ship; the orchestrator's post-merge triage surfaces a small handful of nits / API-shape issues / inconsistencies; an orchestrator-driven cleanup PR absorbs them while the sub-phase's substantive review is fresh. Defers nothing to a future "tech debt sweep" that would lose context.

**Rule:** When triaging a merged sub-phase's PR reveals small follow-ups (dead surface, type-system smells, doc/code drift, design-vs-impl gaps), the orchestrator opens a focused cleanup PR ON THE INTEGRATION BRANCH rather than queuing tech-debt entries. Threshold: items that would otherwise become TECH_DEBT entries (P3 or below) but cost <30 minutes to fix-in-place during the same review session. Tech-debt entries are reserved for items that cost more to fix than to defer.

**Codification candidate:**

1. **Orchestrator agent prompt addition** under § "Cluster triage shape": "Post-merge cleanup PR for sub-phase nits is the default mechanic. Open a `chore/<cluster>-<sub-phase>-cleanup` PR immediately after the sub-phase merges, scoped to items that cost more in bookkeeping than in fixes."
2. **Convention doc** in `.ai/conventions/workflow/` if the pattern stabilizes across multiple clusters. Currently three instances in one cluster; codify after a second cluster adopts the same pattern.

**Reference:** PRs #367, #370, [surface-tidy PR pending]. Erik's framing 2026-05-17.

---

### L21. Task-agent commissions need explicit stop-and-surface protocol for mid-flight questions

**Observed:** When commissioning the ts-prompt-assist surface-tidy round via a Task subagent (rather than a separate Claude Code session), the question came up: how do questions surface? Task subagents run autonomously to a single final message — they cannot ask the orchestrator mid-flight via `AskUserQuestion`. The PR #359 retire was directly traceable to a single-agent run where the agent didn't surface scope-expansion questions and instead silently improvised; the 10 Guardrails (especially #4 no-silent-stubs) were the response.

For the surface-tidy round commission, the brief was amended with an explicit "When to stop and ask" section pointing the agent at predictable sticking points (e.g. lying-Converter test redesign; design amendment language gaps) AND an explicit "final-message protocol" instructing the agent to return early with a clear "I'm stuck on X" summary rather than guessing.

**Rule:** Task subagent commissions need a "stop and surface" protocol in the brief: enumerate the predictable sticking points; instruct the agent to return early with a structured final message if any fires; explicitly cap the final-message length so the orchestrator's context budget is preserved on receipt.

**Codification candidate:**

1. **Brief template addition** under "When to stop and ask": list the protocol explicitly. "You cannot ask the orchestrator mid-flight; this is a one-shot Task invocation. If you encounter [enumerated triggers], stop work, return early with a clear final-message summary describing the question and your recommended path."
2. **Orchestrator agent prompt addition** under § "Commissioning via Task subagent vs separate session": short decision tree. Task subagent for well-scoped work with predictable sticking points (where the orchestrator can decide the question without escalating to user); separate session for work with high uncertainty / many user-visible decisions during the run.

**Reference:** ts-prompt-assist surface-tidy round commission (in flight at lessons-update time); brief at `.ai/tasks/active/ts-prompt-assist/` references the protocol explicitly.

---

## Sweep history

*(no sweeps yet — this file is being initialized at 2026-05-11)*

When this file or accumulated peer notes get swept to release: append entry here with date, sweep PR link, and which items graduated to durable form (convention / skill / agent-prompt) vs aged out.
