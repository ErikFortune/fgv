# Orchestrator session notes

This directory exists on the long-lived branch `claude/orchestrator-session` (branched off `release`), not on `release` itself. On `release`, this README serves as the structural marker — future orchestrators reading from a `release` checkout know where to find the live working notes.

## What lives here (on the session branch)

Cross-cutting orchestrator-authored content that doesn't have a named downstream consumer requiring a stable URL on `release`:

- **Decision-tracks** — Q&A logs and deliberation that resolved into committed positions. The resolution graduates with the relevant spec or convention; the deliberation that produced it stays here.
- **Pre-spec scoping drafts** — early framing notes for streams not yet substrate-prepped.
- **Lessons-codification candidates** — items observed during stream runs that are candidates for becoming conventions, skills, or agent-prompt updates. Live here until triaged; triage either codifies them (graduating to `release` via a `chore/` PR) or ages them out.
- **Cross-stream rationale** — design choices that span multiple streams and don't fit cleanly in any one stream's `state.md`.
- **Orchestrator handoff notes** between sessions — context for the next orchestrator session to read at start.

## What does NOT live here

- Per-stream substrate (lives on cluster integration branch via substrate-prep PR)
- Cross-repo handoffs (live at `.ai/notes/cross-repo-handoffs/` on the relevant cluster integration branch)
- Codified conventions (live at `.ai/conventions/workflow/` on `release`)
- Codified skills (live at `.claude/skills/` on `release`)

## Lifecycle

Notes live on the session branch until one of:

1. **Codified** — promoted into a stable form (convention doc, skill, agent-prompt update); graduates to `release` via a `chore/` PR; the session-branch copy can be marked obsolete or removed.
2. **Aged out** — no longer relevant; eventually pruned.
3. **Swept** — durable historical record (e.g. cluster-close decision-track) batched-graduated to `release` via `chore/orchestrator-sweep-<date>` PR. Squash-merged so the per-doc commit history doesn't pollute `release`.

See `.ai/conventions/workflow/doc-graduation.md` for the full discipline.

## Finding the session branch

```bash
git fetch origin claude/orchestrator-session
git checkout claude/orchestrator-session
ls .ai/notes/orchestrator/
```

If the branch doesn't exist on the remote, no notes have been written yet (or the previous orchestrator session never created/pushed it). Future orchestrators may create the branch on first use.

## Naming conventions

Files in this directory:

- `lessons-pending.md` — single rolling document of lessons-codification candidates
- `decision-tracks/<topic>.md` — per-topic Q&A and deliberation
- `pre-spec/<feature>.md` — early framing for streams not yet substrate-prepped
- `cross-stream/<topic>.md` — design rationale spanning multiple streams
- `handoffs/<YYYY-MM>-to-<role>.md` — orchestrator-session handoff notes

Not prescriptive — adapt as needed. Subdirectories or flat structure both fine.
