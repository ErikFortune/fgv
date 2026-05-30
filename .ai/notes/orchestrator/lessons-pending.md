# Lessons pending — orchestrator-session inbox

Cross-cutting lessons surfaced during orchestrator sessions, parked here until either codified (into a convention / skill / agent-prompt update — graduating to `release` via a `chore/` PR) or aged out. Per `.ai/conventions/workflow/doc-graduation.md`, this file lives on `claude/orchestrator-session` and is swept to release at natural moments (cluster close; orchestrator handoff; codification batch).

---

## Status

Sessions feeding this inbox: orchestrator sessions through 2026-05-30 (ai-assist cluster + doc-graduation + lint-gate codification + crypto-batch-2 + ts-prompt-assist clusters + the 2026-05 alpha cycle of single-stream features ending in -33).

Active clusters at most recent sweep point:
- ✅ ai-assist cluster — shipped to release in #336
- ✅ crypto-batch-2 cluster — shipped to release; lessons captured (L14–L17)
- 🟢 ts-prompt-assist cluster — Phase B + B-5 docs merged into integration; surface-tidy round in flight; cluster close pending consumer-port pressure-test (lessons L18–L21 below)
- 🟡 `ai-assist-thinking-events` — sequencing after thinking-config phase B landed (now satisfied); ready to commission

Last sweep: 2026-05-30 — Review-loop discipline triad (L31, L32, L33) codified. See sweep history at end of file.

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

### L22. Briefs need an fgv-conventions pre-load to prevent agent retract-on-discovery

**Observed:** The ts-prompt-assist round-1 pressure-test agent surfaced three findings that they retracted on review (F5 "three-layer peel", F10 "qualifiers required", F11 "Logging not re-exported"). Each retraction traced to "didn't know fgv conventions" rather than actual library gaps. F11 was explicit: *"the fgv convention is the opposite of what I suggested — packages do not re-export from sibling packages."* Round-2's brief carried an explicit fgv-conventions pre-load section listing the top recurring conventions (no sibling re-exports, `Converters.oneOf` over `typeof` discrimination, `.thenOnSuccess`/`.thenOnFailure` for async-chain ergonomics, branded-id pattern, etc.); round-2 had only two retractions, both self-caught on review with no orchestrator prodding.

**Rule:** Pressure-test briefs (and any cold-start agent commission on an active-development surface) should include a fgv-conventions pre-load that names the conventions a typical cold-start agent doesn't intuit. The pre-load should be specific enough that the agent's "is this friction or my unfamiliarity?" filter has concrete pattern matches.

**Codification status:** Confirmed working from the round-2 experimental design (L18's "docs accurately describe shipped behavior" was the other lesson the cluster surfaced). Worth codifying into the brief-template via a "fgv-conventions pre-load" section recipe. Currently lives only as a section in the ts-prompt-assist round-2 commission prompt; not yet generalized to the orchestrator agent prompt or a convention doc.

**Reference:** ts-prompt-assist cluster, round-1 vs round-2 pressure-test commissions; `.ai/tasks/active/ts-prompt-assist/pressure-test-findings-round-2.md` retractions (F4 + F7) self-caught without prompting.

---

### L23. Concurrent Task subagents need `isolation: "worktree"` or they collide

**Observed:** During the ts-prompt-assist cluster, PRs A (ts-utils withType) and B (ts-res qualifier ergonomics) were launched as concurrent Task subagents using `subagent_type: "general-purpose"` without `isolation`. PR A's agent reported mid-flight worktree collision with PR B's agent — they were ping-ponging the working-tree branch via `git checkout`, and PR A's agent recovered its own work via auto-stash but discarded what it believed was stale ts-res content (which was actually PR B's in-flight work). PR B's branch state survived only because PR B was still running and rebuilt the work after PR A pushed. Lucky outcome; explicitly noted.

Subsequent Task subagent commissions (PR C, the absorb agent, etc.) used `isolation: "worktree"` and had no further collisions.

**Rule:** Concurrent Task subagent commissions MUST use `isolation: "worktree"` to prevent working-tree collisions. Single-agent commissions can omit isolation safely, but for any orchestration pattern that launches multiple agents in parallel, isolation is load-bearing.

**Codification candidate:** Orchestrator-agent prompt addition under § "Commissioning Task subagents": default to `isolation: "worktree"` for safety; only omit when single-commission and the orchestrator is not doing other work concurrently. Also worth a `/workstream-brief` skill note if it ever returns brief recipes that include Task-subagent launch lines.

**Reference:** ts-prompt-assist cluster PRs A (#375) + B (#376) launch interleaving (orchestrator session 2026-05-17).

---

### L24. Subagent agent-discovery scope and subagent tool inventory are independent gates

**Observed:** Across multiple ts-prompt-assist cluster commissions, Task subagents reported `code-reviewer` unavailable despite the agent being defined in the repo's `.claude/agents/` tree. Root cause investigation showed the agent lived under `.claude/agents/workflow-only/`, which was outside subagent agent-discovery scope. Fix landed as #381 (promote code-reviewer to top-level).

After #381 + #383 (merge release into integration to absorb the discovery fix on the cluster's working branch), a follow-on subagent commission STILL reported code-reviewer unavailable. Different root cause: the general-purpose subagent's tool inventory doesn't include the `Agent` tool, so it cannot spawn other subagents (code-reviewer included), regardless of where code-reviewer lives in the discovery tree.

The two gates are independent:
1. **Discovery** — does the spawning agent know `code-reviewer` exists? Fixed by file location.
2. **Tool inventory** — does the spawning agent have the `Agent` tool to actually invoke another subagent? Determined by the spawning agent's own definition / harness.

#381 fixed gate (1) but gate (2) remains for any subagent commissioned via the `Agent` tool with `subagent_type: "general-purpose"`. Practical implication: Guardrail #6 ("code-reviewer mandatory before opening a PR") cannot be enforced from inside a `general-purpose` Task subagent; the inline-CODE_REVIEW_CHECKLIST.md self-review pattern is the documented fallback for that path.

**Rule:** Briefs commissioning work via `general-purpose` Task subagents should explicitly call out the inline-checklist self-review fallback for Guardrail #6 rather than mandating code-reviewer invocation. Brief language should be "invoke code-reviewer if available; otherwise apply inline CODE_REVIEW_CHECKLIST.md self-review and flag the substitution."

**Codification candidate:** Orchestrator-agent prompt addition under § "Commissioning Task subagents": clarify that Guardrail #6 substitution is expected for `general-purpose` commissions. Possibly request a different subagent_type (e.g. task-master) for work where real code-reviewer invocation is load-bearing — though task-master adds orchestration overhead that's wasteful for focused single-PR commissions.

**Reference:** Multiple ts-prompt-assist cluster Task subagent reports of "code-reviewer agent not available in this environment" (cluster commissions through 2026-05-18); #381 fix only addressed discovery, not invocation.

---

### L25. "Typed but no runtime teeth" is a real critique pattern worth catching at review time

**Observed:** PR #386 (parameterize ts-res's `ConditionSetDecl` family on `TQualifierNames`) added compile-time type-narrowing on the axis-name keys but did not thread the narrowing through ts-res's validation pipeline. Erik's review caught two related critiques:

1. **Incomplete seam.** Parameterization stopped at `ConditionSetDecl` because ts-prompt-assist's specific scenario didn't need it to cascade further. To a fresh ts-res reader, that boundary is arbitrary.
2. **No runtime teeth.** A typed-narrow seed gets typo-rejection at the TS layer when authored in code, but a JSON load via the Converter pipeline accepts the loose shape. The compile-time guarantee evaporates the moment data enters the library through any untyped path.

Both critiques landed because Erik specifically asked "where do we enforce this?" The PR's design discussion had focused on TS expressivity (how to write the generic correctly) without surfacing the meta-question of what the generic actually enforces.

**Rule:** When proposing a type-level addition that narrows a previously-wide shape, the brief / PR description should explicitly answer: *what enforces this at the boundaries it crosses?* If the answer is "TypeScript at the call site," call that out plainly — don't let "typed shape" imply "validated shape." A type-system-only narrow is a real consumer-facing improvement at the in-code authoring boundary, but it's not a primitive-level guarantee, and a reviewer can be forgiven for not catching the distinction unless the framing is explicit.

**Codification candidate:** A line in the design-phase brief template (or in the canonical type-safe-validation skill) under "introducing a generic parameter": *"State explicitly what the narrowing actually validates. Compile-time-only narrows can be honest and useful; uncritical 'now it's typed' framing risks the type-without-teeth critique."* The PR template's "what changes" section should explicitly delineate compile-time guarantees from runtime guarantees when both could plausibly be inferred from the change shape.

**Reference:** PR #386 review (Erik 2026-05-18); design-options brief at `.ai/tasks/active/ts-prompt-assist/ts-res-typed-conditions-design.md`; companion to L18 (docs accurately describe shipped behavior).

---

### L26. Squash-vs-merge-commit policy should weight cluster substrate ratio

**Observed:** The orchestrator role doc recommends merge-commit for cluster→release promotion ("preserves audit trail"). For `ts-prompt-assist-features`, the cluster→release promotion (#397) was squashed by Erik because the constituent-commit log was ~54% intermediate substrate (7 of 13 commits: option-space brief, evaluations, sub-briefs, substrate-prep, cluster-close-prep — none of which contained code). A merge-commit would have left a `git log libraries/ts-prompt-assist/` reader scrolling past brief/state/design-doc commits to find feature shape.

The orchestrator-doc convention was probably calibrated for clusters where constituent commits skew substantive-code-heavy. Design-triage-cycle clusters with multi-round decision-tracks break that assumption.

**Rule:** Promotion-PR merge-strategy choice should weight the substantive-code-vs-substrate ratio of constituent commits, not default uniformly to merge-commit. Loose rule of thumb: if substrate commits are >40% of the cluster, squash beats merge-commit on `git log` legibility. The audit trail is preserved in three other places (constituent PRs on GitHub; `state.md` history rows; the cluster `README.md` substrate) — `git log` doesn't need to be a third copy with noisier signal.

**Codification candidate:** Add to `.claude/agents/orchestrator.md` § "`release` → `main` promotion" (the merge-commit guidance) and § "Post-merge bookkeeping" — name the substrate-ratio weighting explicitly. Possibly a per-cluster decision in the cluster-close prep section.

**Reference:** PR #397 (`ts-prompt-assist-features` cluster→release promotion); 13 constituent commits, 7 pure substrate. Erik's framing 2026-05-19: "we have a ton of noise from intermediate artifacts."

---

### L27. Decision-track doc graduation needs a tighter "named downstream consumer" criterion

**Observed:** During `ts-res-typed-conditions` design discussion, three decision-track docs (PRs #387 option-space brief, #388 first evaluation, #389 stress-test addendum) graduated to integration as substrate input "in case the implementing agent wanted to read the design rationale." None of the three was load-bearing for any phase brief — the implementing agents read brief.md + state.md + the design-notes (#393 lock), not the deliberation that produced the lock. The three docs contributed three of the seven substrate-commits driving the L26 squash-vs-merge-commit noise.

Per `.ai/conventions/workflow/doc-graduation.md`: "Only docs with a named downstream consumer requiring a stable URL graduate to release (or to a cluster integration branch)." The orchestrator-side read of "named downstream consumer" was too soft: "implementing agent might want context" graduates the doc. The stricter read should be: implementing agent *needs* the doc to do the work (decision lock; not deliberation history).

**Rule:** Decision-track deliberation docs (option-space briefs, evaluations, addenda — the "we considered A vs B vs C" artifacts) stay on `claude/orchestrator-session` by default. Only the **decision-lock** (the artifact that names the chosen path and binds the implementing agent) graduates as substrate. Implementing agent's brief on integration can include a one-line `decision rationale: see <orchestrator-session pointer>` pointer — non-gating, available if the agent wants context, doesn't add to integration's commit log.

Two viable mitigations when the decision-track is short enough:
- **Inline-quote** the key decision (option chosen + 1-2 sentence rationale) directly in the implementing PR's body. PR descriptions are GitHub-preserved forever; no file needed.
- **Quote in state.md** the decision row. State.md graduates anyway; a sentence of rationale there is cheap.

**Codification candidate:** Tighten `.ai/conventions/workflow/doc-graduation.md` § "Per-stream prep branch mechanic" to specify decision-tracks-stay-on-session-by-default. Update the orchestrator agent prompt § "Design triage cycle" to call out the deliberation-vs-lock distinction at phase B (the brief drafting moment).

**Reference:** PRs #387, #388, #389 in `ts-prompt-assist-features` cluster. Erik's framing 2026-05-19: "we've been trying to tweak our processes to move documents to implementing branches and then squash them in, to reduce noise. It helps some but it isn't always straightforward to do." Sibling/companion to L26.

---

### L28. Fresh-agent continuity pays off across cluster sub-phases when conventions need to carry

**Observed:** After `ts-prompt-assist` Phase B's mid-session retire (PR #359 / L21), the recovery model defaulted to "one agent per sub-phase, fresh-start" to bound context drift. For `ts-res-typed-conditions`, that default got challenged: a single fresh agent (in Erik's Claude Code session) shipped B-2 (#394), B-3 (#395), and the #384 sample-app rebase+update — three consecutive clean PRs without re-onboarding. Each subsequent PR carried the conventions established earlier in the same session (drift-protection `// keep in sync with X` markers, result.md discipline, scope-decision rationale embedded in PR bodies, fgv-conventions reflex).

When a separate "fix-up" run was needed (B-1 review-feedback absorption), it was a new agent that had to be re-briefed on the existing parameterization decisions. The fresh agent missed an artifact-creation discipline (no result.md for the round); the orchestrator papered over by editing files directly, which then surfaced as a trust-loss with the orchestrator's own implementation hat. The continuity gap had a real cost.

**Rule:** Within a single cluster's substantive implementation arc (multiple sub-phases, same domain surface), **reuse the same agent** when it has shipped clean PRs and the next sub-phase consumes the surface it just shipped. Re-onboarding costs more than the marginal context window. The previous "spawn fresh per phase" default was the right response to L21's mid-session-drift failure mode — it does NOT generalize to "always spawn fresh."

When to switch agents:
- Mid-session context drift becomes visible (signs: review-round count climbing, fix-interaction shape, agent re-discovering things established earlier).
- The work shape shifts substantially (e.g. from library code to docs-only, or from one library to another). Same agent may carry irrelevant context.
- After a clean retirement of work (agent's last commission was a complete shipped PR, no in-flight context to preserve).

When to reuse:
- Same domain surface, same conventions, sub-phase composes on the prior phase's surface. The agent's just-shipped output IS its best context for the next phase.
- The agent has demonstrated quality in the cluster's review cycles already.

**Codification candidate:** Add to `.claude/agents/orchestrator.md` § "Commissioning Task subagents" a short decision tree on reuse-vs-fresh. Reference L21 (when fresh-start is the right call) and this lesson (when reuse is). Both are valid; the choice is contextual.

**Reference:** `ts-res-typed-conditions` sub-stream — same agent shipped #393, #394, #395, #384 cleanly. Companion to L21 (the originating mid-run-drift observation).

---

### L29. Cascade-completeness framing for type-cascade briefs needs to be inclusive, not enumerative

**Observed:** B-1's brief listed 9 container interfaces to parameterize on `TQualifierNames`. The implementing agent threaded the parameter through all 9, but Copilot review on PR #391 caught a half-cascade on `IResourceTreeRootDecl.resources/children` — `IResourceTreeRootDecl` itself was parameterized, but its `IResourceTreeChildNodeDecl` child reference still defaulted to `string`. Same failure mode as the original PR #386 that birthed the sub-stream: type parameter declared at one node but not threaded into the field it gates.

The brief's framing was "the listed 9 interfaces" — enumerative. A more inclusive framing would have been "the 9 listed interfaces AND any type-level reference that, if not threaded, lets the narrow evaporate mid-pipeline." The cascade boundary isn't "these N nodes" — it's "everything that composes."

**Rule:** Type-cascade briefs should frame the in-scope surface as "the listed container types AND any type-level references that must thread the parameter for the narrow to flow end-to-end. Verify by tracing what a consumer's entry-point call types out to; if the narrow evaporates mid-pipeline, fix the link that lost it." The brief lists examples; the implementing agent traces actual flow.

**Codification candidate:** Brief-template addition for any type-cascade work. Also worth a `/type-safe-validation` skill note: "When introducing a type parameter across multiple interfaces, the implementing pass MUST trace the parameter from a consumer entry point to every leaf in the data structure; a parameter that evaporates mid-trace is an incomplete cascade."

**Reference:** PR #391 Round 1 Copilot finding (`IResourceTreeRootDecl.resources/children`). Same shape of bug PR #386 had at a different node — recurrence is the codification trigger.

---

### L30. Latent-bug bundling needs explicit PR-description disclosure from the first commit

**Observed:** B-1's PR (#391) framed itself as "type-only work; no runtime behavior change." During review feedback absorption, two latent runtime fixes got bundled into the cascade work: (a) `ConditionSet.getKeyFromLooseDecl` Partial-aware undefined-skip; (b) type-guard `'id' in decl && typeof decl.id === 'string'` runtime soundness. Round 2 Copilot caught the type-guard runtime change and flagged it as a meta-finding: "you said type-only, but this is a runtime behavior change — either disclose explicitly or revert." Required updating the PR description to a "What changed — type-level" / "What changed — runtime (bundled latent-bug fixes)" split.

The cost: an extra review round whose entire finding-set was about description framing, not code. Avoidable.

**Rule:** When bundling latent-bug fixes into a feature PR (per the L20 ship-then-tidy mechanic), the PR description should disclose the runtime fixes explicitly in a dedicated section from the first commit — not added after a reviewer asks. "Type-only work" framing is honest only when the diff genuinely contains no runtime changes; if anything runtime-affecting gets bundled, the framing must shift.

**Codification candidate:** Add to `.ai/instructions/CODE_REVIEW_CHECKLIST.md` Priority 2 (Major / Should Fix): "PR description accurately frames the change scope (type-only vs runtime-affecting; additive vs breaking). Bundled latent-bug fixes are disclosed in a dedicated section."

**Reference:** PR #391 Round 2 Copilot findings (`isLooseResourceCandidateDecl` / `isLooseResourceDecl` typo'd-id soundness; meta-finding on runtime-change framing).

---

## Sweep history

### 2026-05-30 — Review-loop discipline triad (L31, L32, L33) codified

**PR:** `chore/codify-review-loop-discipline` (cluster-close batch).

**Graduated:**
- **L31. Copilot is a load-bearing review layer for cluster→release promotion PRs** → already codified in `.claude/agents/orchestrator.md` § "Reviewing an agent PR before merge / bundling" step 3. Sweep acknowledgement only; no new content needed. (Reference at codification: PR #391 rounds 1-3 + PR #397's two findings.)
- **L32. `code-reviewer` agent run on the final diff should be a pre-PR gate, not a post-Copilot followup** → codified in `.ai/instructions/CODING_STANDARDS.md` § "Review-loop discipline" Layer 1, with a corresponding PR-description checklist item in § "Pre-PR Validation Checklist". Mirrored in `.ai/conventions/workflow/kickoff-prompt-shape.md` § "What both shapes share" so every brief inherits it. (Reference at codification: `private-key-storage` PR #427's six Copilot rounds.)
- **L33. Implementing agents should drive the Copilot review loop themselves — request on first complete commit, re-request each round as long as Copilot adds value, cap at 10** → codified in `.ai/instructions/CODING_STANDARDS.md` § "Review-loop discipline" Layer 2, with a corresponding PR-description checklist item. Mirrored in `.ai/conventions/workflow/kickoff-prompt-shape.md`. (Reference at codification: Erik's guidance 2026-05-30.)

Together the three form the durable form of the review-loop stack: Layer 1 (internal pre-push) + Layer 2 (external loop with cap) + Layer 3 (orchestrator gating on promotion). Future implementing-agent briefs inherit Layers 1 and 2 from the kickoff-prompt-shape; future orchestrator sessions inherit Layer 3 from the agent prompt.

---

When this file or accumulated peer notes get swept to release: append entry here with date, sweep PR link, and which items graduated to durable form (convention / skill / agent-prompt) vs aged out.
