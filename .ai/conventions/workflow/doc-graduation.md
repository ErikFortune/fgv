# Convention — `convention.workflow.doc-graduation`

> Adapted from the personaility-side orchestrator's doc-graduation discipline (2026-05).
> Cross-repo consistency intentional: both orchestrators follow the same model so
> the user only has one mental model to reason about across the two repos.

A discipline for which orchestrator-authored docs graduate to `release` and which stay on a working branch. The goal is to reduce `release` history noise (every cluster shouldn't bring along every Q&A note the orchestrator produced) while keeping load-bearing artifacts findable on `release` for future readers.

---

## Vocabulary

| fgv | personaility | Role |
|---|---|---|
| `release` | `working` | The shared canonical line. Buffer for clusters before promotion to `main`. |
| `claude/orchestrator-session` | session branch | Long-lived working branch where orchestrator-authored docs accumulate before graduating (if they graduate at all). |
| `claude/<stream>-substrate-prep` | `chore/stream-<id>-prep` | Per-stream prep branch that cherry-picks the docs the implementing agent needs. |
| `claude/<cluster>-features` | (none — finer grain) | Cluster integration branch absorbing multiple streams' substrate before cluster-level promotion. |
| `chore/<scope>` | same | Bookkeeping branches (cleanup batches, sweeps, amendments). |
| `.ai/notes/cross-repo-handoffs/` | `.ai/notes/fgv-share/` | Cross-repo handoff content (inbound for fgv, outbound for personaility — same content, different home repos). |

---

## Default: docs stay where they're authored

The orchestrator writes lots of docs in the course of a session: decision-tracks, pre-spec scoping notes, Q&A logs, lessons-codification candidates, intermediate research. **Most of these don't need to live on `release`.** They serve the current session and the next orchestrator who picks up cold; they don't need a stable URL for any downstream consumer.

The defaults:

- **Cross-cutting decision-tracks, Q&A logs, lessons-codification candidates** → live on `claude/orchestrator-session` under `.ai/notes/orchestrator/`. Sweep to `release` periodically (see below).
- **Per-stream substrate** (`brief.md`, `state.md`) → live on the cluster integration branch (`claude/<cluster>-features`) via a substrate-prep PR. This IS graduation — the implementing agent reads from there.
- **Cross-repo handoff content the other side authored** → live at `.ai/notes/cross-repo-handoffs/<topic>.md` on the integration branch where the relevant cluster lives. Graduates with the cluster.

---

## When a doc SHOULD graduate to `release`

Three triggers:

1. **A named downstream consumer needs a stable URL.** The implementing agent kicking off a stream is the canonical example — they read `brief.md` from the integration branch. Cross-repo orchestrators (when the other repo can reach this one) also count. Future-orchestrator-reading-the-substrate is a weaker case; usually they read from `release` (and may not be able to reach a working branch).
2. **Long-term canonical architectural reference.** Load-bearing design docs future readers will need (e.g. `LIBRARY_CAPABILITIES.md`, the workflow conventions themselves). These are part of the project's public-ish surface.
3. **Cluster close.** When a cluster's integration branch merges to `release`, all the cluster's substrate graduates with it. This is the bulk-graduation event.

---

## When a doc should NOT graduate

- **Orchestrator-to-orchestrator handoff notes between sessions.** Live on `claude/orchestrator-session`; the next orchestrator reads them from there at session start.
- **Pre-spec scoping drafts.** Live on session branch until they harden into a spec the implementing agent will consume (at which point the spec graduates; the deliberation that produced it does not).
- **Decision-track notes** (Q&A with the user that resolved into committed positions). The resolution graduates with the spec; the deliberation stays on session branch.
- **Research scratch / option-space surveys.** Live on a research agent's branch or on the session branch until a downstream consumer surfaces.
- **Internal handoff notes** orchestrator-to-implementing-agent-via-the-user. Live on session branch; the user pulls the content into the implementing agent's kickoff prompt.
- **Per-orchestrator-session lessons-pending notes.** Stay on session branch until they're codified (graduating to convention/skill/agent prompt) or aged out.

---

## Per-stream prep branch mechanic

This is the main graduation path for stream kickoff docs.

1. **Identify the docs the implementing agent actually needs.** Spec, stream plan, kickoff brief, any referenced design artifacts. Be precise — only what the stream consumes. Other orchestrator-side artifacts stay where they are.
2. **Create `claude/<stream>-substrate-prep` off the cluster integration branch.** (Or `claude/<stream>-substrate-prep` off `release` if there's no cluster.)
3. **Cherry-pick or copy the specific files / commits** for the chosen docs from the orchestrator session branch (or write them fresh on the prep branch).
4. **Open a PR** `claude/<stream>-substrate-prep` → integration branch (or `release`). Docs-only. Merge.
5. **The implementing agent forks their work branch** off the integration branch (now with the seeded substrate).
6. **Once the prep PR merges, freeze the session-branch copies** if any existed. Treat the working copy as canonical. Amendments go through a follow-up PR, not edits to the session-branch copy.

This pattern is already in place under the existing integration-branch model. The convention codifies it explicitly.

---

## Background-doc sweep pattern

Docs that accumulate on `claude/orchestrator-session` with no specific consumer but represent a coherent durable record get periodic batched sweeps to `release`.

Mechanic:

1. Identify the set of session-branch docs that deserve graduation (lessons-codification candidates that have been codified into stable form; decision-tracks for shipped clusters; cross-stream rationale that future orchestrators will need).
2. Create `chore/orchestrator-sweep-<date>` off `release`.
3. Cherry-pick / copy the chosen docs onto the chore branch.
4. Open PR `chore/orchestrator-sweep-<date>` → `release`. Squash-merge (the goal is one logical commit on release, not the per-doc commit history).
5. Document on the session branch which docs swept and when (so future orchestrators can find what's already on release).

**Sweep frequency:** at natural moments. Cluster closes; quarter ends; orchestrator hands off; convention-codification batch completes. Not on a schedule.

---

## Edit-during-fork risk and mitigation

Once an implementing agent has forked their work branch off an integration branch (post-prep-merge), edits to the docs they're consuming on either the orchestrator-session branch or the integration branch don't reach them automatically.

**Mitigation:**

- After the substrate-prep PR merges, treat the session-branch copy (if any) as historical. The integration-branch copy is canonical.
- If a mid-stream amendment is needed:
  - Open a small follow-up PR `chore/<stream>-amend` (or `claude/<stream>-amend-substrate`) off the integration branch.
  - Amend the doc; merge.
  - Tell the agent to pull / merge integration into their branch.
- Silent drift between session-branch copy and integration-branch copy is the main hazard. Discipline: after prep PR merges, edits live on integration-based branches, not session.

---

## Cross-repo-handoffs category

When a cross-repo orchestrator (e.g. the personaility orchestrator) needs to read content that fgv produces but personaility's tooling can't reach this repo, the staging location is `.ai/notes/cross-repo-handoffs/<topic>.md` and the user copies content out via whatever cross-repo mechanism is available (chat paste, manual copy, etc.).

The mirror case (fgv consuming what personaility produces) lands the inbound handoff at the same path on fgv's side, sanitized to remove consumer-specific naming where appropriate.

Either direction: the doc is committed and durable; cross-repo orchestrators reference it via the user as the transport.

---

## Where docs live — quick reference

| Doc type | Lives on |
|---|---|
| Per-stream `brief.md`, `state.md` | Cluster integration branch (graduated via substrate-prep PR) |
| `design.md` produced by phase-A agent | Cluster integration branch (graduated when phase-A PR merges) |
| `WORKSTREAMS.md` entries | Cluster integration branch (or `release` for non-cluster streams) |
| Cross-repo handoff received | Cluster integration branch under `.ai/notes/cross-repo-handoffs/` |
| Orchestrator session-state, decision-tracks | `claude/orchestrator-session` under `.ai/notes/orchestrator/` |
| Lessons-codification candidates (pre-codification) | `claude/orchestrator-session` |
| Convention docs (codified) | `release` (via `chore/` PR) |
| Skill definitions (codified) | `release` (via `chore/` PR) |
| Orchestrator agent prompt (`.claude/agents/orchestrator.md`) | `release` |
| Completed-stream archive (`.ai/tasks/completed/`) | `release` (graduated with the cluster's integration-branch merge) |

---

## Anti-patterns

- **Graduating every orchestrator doc.** `release` history balloons; future readers can't tell which docs were load-bearing vs scratch.
- **Editing session-branch copies after their integration-branch graduation.** Silent drift; edits don't reach the consumer.
- **Sweeping research scratch to release.** Use the sweep pattern only for durable artifacts that future orchestrators will benefit from. Scratch stays on session branch until aged out.
- **Skipping the cross-repo-handoffs/ archive.** Inbound handoffs that aren't archived become unrecoverable when the originating cluster closes.

---

## Relationship to other conventions

- **`branch-buffer-and-promotion.md`** — the buffer-and-canonical-line model; this convention is about WHAT lives on the buffer, not the mechanics of promoting it.
- **`artifact-protocol.md`** — task-artifact lifecycle (`.ai/tasks/active/` → `completed/`); this convention overlaps for stream substrate but covers broader doc categories too.
- **`kickoff-prompt-shape.md`** — what a stream kickoff prompt contains; this convention is about where it lives before / after handoff.
- **`lessons-codification-triage.md`** — what to do with lessons; this convention is about where lessons-pending notes live before they're triaged.
