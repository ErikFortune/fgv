# Brief — structured-memory-for-agents (design spike)

**Status:** exploration / design-space note only. NO code ships. Anticipatory — no
concrete consumer ask yet; one expected from downstream consumer "personaility".

## Mission
Design a **structured-memory-for-agents** capability for fgv. Produce a grounded
design-space note that maps the layered model, draws the compose-vs-build line
against fgv's published primitives, resolves the key design tensions with
rationale, proposes a minimal first slice, and enumerates the open questions the
eventual consumer ask will answer.

Conceptual inspiration: **Obsidian / claude-obsidian** (markdown vault + wikilinks
+ backlinks), **NOT** a graph database.

## Architecture — three STACKED layers (not three parallel memory types)
1. **L1 — Graph substrate.** Obsidian-like graph as foundation for memory AND
   knowledge. Files + links + backlinks, materialized over storage.
2. **L2 — Agent tool layer.** Agents read/write/curate the substrate themselves
   (claude-obsidian pattern: memory as LLM tools).
3. **L3 — Host automatic-ingest layer.** Host-configured pipeline ingesting raw
   "things", using classifiers (with occasional escalation to heavier LLM
   firepower) to turn them into memories.

**L1 is the only layer that must be right first.** L2/L3 ship later/independently.
L3 is the novel/risky surface — map it, but it must NOT gate the substrate.

## Load-bearing exit criterion
Primary focus = L1, BUT design *enough of L2 and the semantic/vector-retrieval
path* to **pressure-test the substrate**. The note MUST contain a dedicated
**"Substrate pressure-test"** section walking ≥1 realistic L2 tool-use scenario
end-to-end and ≥1 semantic-recall scenario end-to-end against the proposed
substrate shape, reporting where the substrate held or had to bend.

## Design tensions to resolve (orchestrator leanings = INPUT, not gospel)
1. **How "graph" really?** Lean: markdown+frontmatter on FileTree, `links[]` in
   envelope, backlinks via index; defer real graph-DB. Fork: do multi-hop needs
   force a heavier index?
2. **Vector-index gap** (the one genuine new-infra decision). fgv ships
   `callProviderEmbedding` + in-process `embed`, but NO vector store / cosine /
   top-k. Lean: `IMemoryRetriever` interface NOW; recency+tag+link+structured
   retrievers first; vector recall a flagged fast-follow.
3. **Shape-control boundary.** Mostly settled by `ts-prompt-assist` precedent.
4. **Relationship to `ts-prompt-assist`.** Shared extracted core, or sibling? Lean:
   do NOT pre-extract — name the seam, decide after memory's real shape is known.
5. **Could the substrate subsume episodic memory later?** Use as forcing function
   for substrate generality (NOT a target — personaility already has episodic).

## Deliverables (this directory)
- `brief.md` — this contract.
- `state.md` — running checkpoint.
- `exploration.md` — THE note (8 sections).
