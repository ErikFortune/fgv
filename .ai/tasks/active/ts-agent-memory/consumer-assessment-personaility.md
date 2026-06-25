<!--
Provenance: PersonAIlity-side adoption assessment, the rationale behind
consumer-requirements-personaility.md. Delivered to the fgv team 2026-06-25;
captured verbatim into the agent-memory-exploration substrate by FGV
Orchestrator IV.
-->

# `@fgv/ts-agent-memory` — adoption assessment (rationale behind the requirements spec)

> 2026-06-25. Companion to `ts-agent-memory-requirements.md`. Source: fgv PR #495 (design-only;
> 5 markdown files, zero TS; draft + parked pending fgv platform prioritization) read via GitHub API +
> PR description; PersonAIlity architecture read directly. This is the analysis that produced the spec.

## What PR #495 proposes
`@fgv/ts-agent-memory` — a structured memory/knowledge substrate. Invariant core: typed identity
envelope; typed per-kind body (knowledge + experience); attributed edges (confidence/provenance/
validity); FileTree-backed markdown-frontmatter vault; transaction-time metadata; content-hash dedup.
Optional layers (degrade loudly): vector index, bi-temporal, observation/audit, qualifier recall.
L3 ingest contract: host owns classify/extract/relate; fgv owns typed-validation boundary, dedup, edge
writes with cycle safety, provenance stamping, contradicts→temporal-invalidate. Phase-A open questions
remain — OQ-11 (entity-id vs version) flagged "the consequential one."

## Mapping to our model (fgv would sit UNDER our seams)
- Envelope identity ↔ our `MemoryKind` discriminator + composite `(SessionId/ConversationId/turnIndex)`
  addressing (no unified envelope today — fgv adds the wrapper).
- Per-kind body ↔ we already have it: `ISummarizedTurnMemory`, `ISummarizedConversationMemory`,
  `IMemory` union, `IKnowledgeDoc`.
- Attributed edges ↔ our `IMtmRef` (LTM→MTM), which is navigational only — fgv's edge is richer.
- FileTree vault ↔ knowledge stream-3 already converged on it; memory currently SQLite/in-memory.
- Content-hash dedup ↔ we don't have it (genuine addition).
- Per-kind write policy ↔ our `mutableMemoryFields` + `IAdmissionPolicy`, generalized.
- `IWorkingMemory.compose` / `IMemoryContributor` / `IMemoryProcessor` / curators / `ISentiment` /
  `IEpistemic` / mnemonic-recall / actor-presence scoping ↔ **ours; fgv sits beneath, doesn't replace.**

## Fit / overlap / gaps
- **Clean fit**: knowledge storage (stream-3 already this shape); content-hash dedup; attributed-edge
  upgrade of `IMtmRef`; per-kind write policy.
- **Better factoring than ours**: a *unified* substrate across knowledge + experience → the cross-kind
  provenance graph CURATE's "Other memories" anticipates (knowledge doc ↔ the conversation that
  produced it); FileTree memory is human-readable/git-trackable/snapshot-friendly.
- **Stays ours (gaps fgv doesn't cover, by design)**: three-tier pipeline, sentiment/epistemic as
  first-class, working-memory composition, curator framework, actor/presence divergence.
- **Conventions**: must be Result/Converter/FileTree/no-`any` — fgv primitives already are; must be
  explicit in the contract.

## Boundary recommendation
fgv owns: envelope, per-kind body registration, attributed edges, FileTree vault, content-hash dedup,
optional vector index, write-policy framework. PersonAIlity owns: curators, three-tier processing,
working-memory composition, sentiment/epistemic, mnemonic/recall, actor scoping, prompt library,
measurement. (Codified as § 6 non-goals in the requirements spec.)

## Migration & risks
- Working-memory P1/P1.5 (interface-only) and the side-chats/familiar arc: **unaffected** by adoption.
- LTM tranche + backfill harness: not wasted — their shapes become fgv per-kind bodies; backfill is the
  migration tool (write into the vault).
- Risks: (1) **OQ-11 must resolve** before memory adoption (does `(conversationId, turnIndex)` fit the
  envelope?); (2) **fgv is parked, no ETA** — no plan may depend on it shipping on our schedule;
  (3) storage-format one-way-door (SQLite→vault) for memory, mitigated by the backfill harness.

## Adopt decision / LoE / priority
- **Adopt partially.** Knowledge = next/highest fit (behind `IKnowledgeSearchProvider`; bespoke-but-
  compatible if fgv can't commit a timeline). Memory = later (after LTM + backfill + OQ-11), as a
  migration pass not an in-flight disruption. Side-chats arc proceeds now.
- **LoE**: knowledge S–M · LTM migration M · MTM M–L · familiar/side-chats negligible · hub wiring M
  (persistence coordinator = single integration point). In-flight memory work becomes the payload spec,
  not throwaway.
- **Priority**: knowledge next; memory later; side-chats arc unaffected. Don't let the fgv question
  delay the current arc.

## Decision taken (2026-06-25)
Project lead: **commission the substrate** (memory + knowledge). Requirements written to
`ts-agent-memory-requirements.md` for hand-off to fgv. Our *adoption* still phases knowledge-first per
the above; the commission covers the full substrate (the PR #495 design is unified anyway).
