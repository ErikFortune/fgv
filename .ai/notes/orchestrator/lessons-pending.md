# Lessons pending — orchestrator-session inbox

Cross-cutting lessons surfaced during orchestrator sessions, parked here until either codified (into a convention / skill / agent-prompt update — graduating to `release` via a `chore/` PR) or aged out. Per `.ai/conventions/workflow/doc-graduation.md`, this file lives on `claude/orchestrator-session` and is swept to release at natural moments (cluster close; orchestrator handoff; codification batch).

---

## Status

Sessions feeding this inbox: orchestrator sessions through 2026-05-11 (ai-assist cluster + doc-graduation + lint-gate codification + crypto-batch-2 substrate prep).

Active clusters at most recent sweep point:
- ✅ ai-assist cluster — shipped to release in #336 (5.1.0-26 mirror to prerelease pending alpha publish)
- 🟢 crypto-batch-2 cluster — substrate prepped (#328 + #338); four phase-A briefs ready; no agents launched yet
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

## Sweep history

*(no sweeps yet — this file is being initialized at 2026-05-11)*

When this file or accumulated peer notes get swept to release: append entry here with date, sweep PR link, and which items graduated to durable form (convention / skill / agent-prompt) vs aged out.
