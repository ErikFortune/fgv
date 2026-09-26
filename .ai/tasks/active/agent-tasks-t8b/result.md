# Result — `agent-tasks-t8b` (PR 2 of slice T8)

_In progress. Sections are filled as each phase lands._

---

## Phase 0 — `storage/repository.ts` refactored before any A3 work

**Before:** 1993 lines, 7 of headroom against the 2000-line `max-lines` cap.
**After:** 1808 lines (192 of headroom); new `storage/committedFiles.ts`, 286 lines (figures as committed, after the pre-commit prettier pass).
`etc/ts-agent-tasks.api.md` byte-identical (`git diff --stat -- libraries/ts-agent-tasks/etc` empty
after `heft build --clean`). Landed as its own commit, green: `heft build --clean` zero warnings,
`eslint src` clean, `heft test --clean` 70 suites / 1,707 passed / 0 failed, 100 % on every metric,
zero `c8 ignore`.

**The seam: the committed-files layer.** `CommittedFiles` owns the one manifest this instance last
wrote or read and its fingerprint, the classified atomic write (`'unchanged'` → safe; anything else
fences and reports indeterminate), the manifest out-of-band check before any manifest rewrite, the
post-write relist, the byte-for-byte re-establishment on replay, the bounded record read, and the
fingerprint-verified record read through the cache and materialization gate. One invariant ties
them: *nothing is read as, or written over, a file this instance did not commit.* Before, that
invariant was nine private methods spread across the class's last 280 lines.

**Why this seam and not the one that fit.** Three candidates were weighed:

| candidate | lines | what it would need from the class | verdict |
|---|---|---|---|
| **committed-files layer** | ~190 | four handles (store, converters, cache, gate) and three callbacks (projections, usable, fence) | **taken** — a layer the class calls *down* into; nothing in it calls back up into repository logic |
| registration protocol (§8.3 pending → record → live) | ~365 | ~20 members: tasks, pending, ledger, manifest, validate/parent/source checks, build record, ledger entry, delivery plan, index apply, delivery commit, every write | declined — the protocol is a real unit, but it is threaded through the class's shared state; cutting there moves the code and leaves the coupling, which is the "seam that fit" failure |
| commit/replace path | ~400 | the same ~20 members plus retention and execution-claim spending | declined for the same reason, and it is the class's core |

The registration and commit paths are the class's *purpose*; the committed-files layer is *what
they stand on*. Extracting what they stand on gives a one-directional dependency, which is what the
repo's other storage collaborators (`RecordStore`, `SourceRecords`, `SubscriptionRecords`) already
look like. The host interface (`ICommittedFilesHost`) is small enough to read at a glance, which is
the practical test of whether a seam was designed.

**What did not move:** health/fencing state (`_usable`, `_fence`) stays in the repository — fencing
is a repository state transition, and the layer reports it through a callback rather than owning it.
The perf harness's reach into `lib/packlets/storage/{layout,internals}` is unaffected.

**Sweep table updated** in `docs/TECH_DEBT.md`'s P1 `max-lines` entry (re-swept 2026-09-26).
