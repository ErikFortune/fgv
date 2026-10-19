# agent-tasks-cluster-close — finalizing the eighteen agent-tasks slices

**Shipped**: 2026-10-01 via [PR #712](https://github.com/ErikFortune/fgv/pull/712) into
`integration/agent-tasks-v1`.

## Summary

Every agent-tasks slice deferred `/finalize-task` to the cluster close; this is that close. The
eighteen slice directories moved to `.ai/tasks/completed/2026-10/`, each with a `meta.yaml` and a
polished `README.md` whose claims independent reviewers checked against that slice's `result.md`.
Their ledger entries moved to `docs/workstreams/2026-10.md` with a list of the claims in them that
turned out wrong. The capability feed carries three lines — the library, the model tools, checked
prompt composition — not eighteen, and the feed script now supports that. The implementation plan's
§ 8 gained the release evidence, with a citation per claim and an explicit list of what is not
established.

## Files changed

- `.ai/tasks/completed/2026-10/agent-tasks-*/` — eighteen migrated slices (+ `meta.yaml`, `README.md`)
- `docs/workstreams/2026-10.md`, `docs/WORKSTREAMS.md` — ledger archive and index
- `docs/design/agent-tasks/implementation-plan.md` — status header, § M1 outcome, § 8 evidence
- `docs/TECH_DEBT.md`, `docs/design/agent-tasks/development-design.md` — repointed references,
  resolved/re-triggered entries, one new P3
- `common/scripts/generate-capability-feed.mjs` — explicit `headline: ''` opt-out
- `.claude/skills/finalize-task/SKILL.md` — the one-line-per-capability rule
- `.ai/instructions/LIBRARY_CAPABILITIES.md`, `libraries/ts-agent-tasks/CAPABILITIES.md` —
  regenerated feed; `.ai/instructions/CODING_STANDARDS.md` — one clause corrected
- `common/changes/@fgv/ts-agent-tasks/` — a `type: none` change file

## Decisions made during execution

- **Three feed lines** (t1, i1a, i2), argued in `result.md` § *The feed decision*.
- **Archive verbatim, correct by errata.** Entries written in flight stay as written; the archive
  lists what they got wrong.
- **One consolidated TECH_DEBT P3** for the deferrals found recorded only in result files, rather
  than a dozen small entries.
- **No `src/` edit even for a stale path in a test comment** — routed instead.

## Followups

See `result.md` § *Still owed before promotion* and the new P3 in `docs/TECH_DEBT.md`.

## Lessons codified during the run

- The feed rule, in `generate-capability-feed.mjs`'s header and `/finalize-task`.

## References

- Brief: `brief.md` · Live state: `state.md` · Exit artifact: `result.md`
- PR: [#712](https://github.com/ErikFortune/fgv/pull/712)
