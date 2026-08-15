# Result — `vector-rebuild-report-by-kind`

**Shipped:** every count in `IVectorRebuildReport` is now resolved by `Kind`, the exclusion count
originates in the layer that decides it, and a failed rebuild carries its partial report — one
change rather than the staged pair the consumer left open.

**Packages:** `@fgv/ts-agent-memory` (breaking), `@fgv/ts-agent-memory-sqlite-vec` (tracking),
`@fgv/testbed` (test double).

## What landed

**1. Per-kind counts.** `indexed` and `declined` became `ReadonlyMap<Kind, number>`; `excluded?`
joined them; `skipped` is unchanged. The rule is on the type's docstring and closes with the clause
the consumer asked for — *"A new count added to this report is resolved by kind unless there is a
stated reason it cannot be"* — which inverts the default so the burden falls on the exception. The
doc also records why the tempting exception (that `indexed` is recoverable from the index) is false:
`IVectorQueryHit` carries no `kind`, `query` answers "what is near this", `size` is a scalar.
`skipped` states its own reason for staying per-record.

**2. The seam change `excluded` required.** `IMemoryRecordSource.list()` returns a new
`IMemoryRecordListing` (`records` + optional `excluded`). `undefined` means *this source does not
track exclusions*; an empty map means *it does and excluded nothing*, and the library never converts
the first into the second. `FileTreeMemoryStore.asRecordSource()` always reports.

**3. Coverage decoupled from the error mode.** `IVectorIndex.rebuild` returns
`DetailedResult<IVectorRebuildReport, IVectorRebuildReport>`. Under `'fail'` the failure's `.detail`
is what the attempt had established. The `'fail'` contract is otherwise untouched — reset, abort,
fail — and the docstring names the trap plainly: the report describes the attempt, not the surviving
index, because the rollback has already run. A `list` failure (and, on SQLite, a `_clear` failure)
carries no detail, because nothing was attempted and the existing index is untouched.

## Deviations from the brief

**One structural addition the brief did not call for.** `asRecordSource()`'s filter-and-tally moved
out of `fileTreeMemoryStore.ts` into a new package-internal `store/vectorRecordSource.ts`. The
proximate cause is mechanical: the store file was at 1995 lines against a 2000-line `max-lines` cap,
and a warning there is a CI failure (`CODING_STANDARDS.md` § "A local warning is a CI failure").
Writing the tally inline crossed it. The extraction is minimal — one exported function taking the
two store capabilities it needs structurally, so it does not import the store that imports it — and
it leaves the file at 1991. Flagged because it is a file that has crossed this line before
(`TECH_DEBT.md`), and the next addition to it will hit the same wall; this bought ~9 lines, not a
solution.

**`indexed` is no longer read back off the index.** Both implementations tally per successful `add`
in the loop instead: the in-memory one used `this._vectors.size` and the SQLite one a `COUNT(*)`.
Necessary (neither the map nor the table knows kinds) and better on both counts — it makes `indexed`
a per-record tally consistent with its siblings, so the sum-of-buckets invariant holds exactly, and
on the SQLite side it removed the one fallible step in assembling the report.

Nothing else diverged. Everything the brief listed as out of scope stayed out: the `'fail'`
semantics, `IVectorIndex.query`, the fragment index's own report, and a records-seen count
(superseded — summing the maps gives it).

## The reply owed, answered

The brief left one question open with the consumer: staged (`excluded` + `declined` now, `indexed`
later) or single. **Single.** Staging meant two breaking releases against the same three fields,
where the second would break every reader the first had just made them fix. They said they were not
blocked either way.

The coordination flag the brief requires is
`.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-15-rebuild-report-shipped.md` — it names
the two breaks, the rollback-report trap, and the migration.

## Gates

- `rushx build` / `rushx lint` / `rushx test` green with 100% coverage in `ts-agent-memory` and
  `ts-agent-memory-sqlite-vec`
- Repo-wide `rush rebuild` green, no warnings. It caught exactly the casualty class the brief
  predicted: a fake `IVectorIndex` in `samples/testbed` that neither package's own suite can see.
- Change files for both libraries; `rush change --verify --target-branch origin/release` clean
- Tests prove: the totals still sum to what a caller would compute; `'fail'` returns a report **and**
  still resets and fails; a source that does not report exclusion yields `excluded === undefined`,
  distinct from an empty map; and the motivating case — two rebuilds with an identical `indexed`
  total that the per-kind breakdown tells apart
- `LIBRARY_CAPABILITIES.md` updated in the same PR
- `code-reviewer` run on the final diff before first push — findings below

## `code-reviewer` findings and dispositions

**P1 — change files typed `"none"` while the comment said BREAKING. Fixed, but not as prescribed.**
The contradiction was real and the reviewer was right that `"none"` is the type most likely to be
dropped from generated changelog output — precisely the silence the brief's coordination clause
exists to prevent. It prescribed `"major"`, which is wrong here: the `@fgv` set is a
`lockStepVersion` policy with `nextBump: minor`, and the direct precedent is
`agent-memory-rank-reconcile`, whose own comment reads *"BREAKING on the active surface: `IMemoryStore`
gains a required member"* and which is typed `"minor"`. Both change files are now `"minor"`.

**P2 — `indexed` lost its self-correcting property. Accepted; documented rather than reverted.** It
was previously read off ground truth after the loop, so a source listing the same target twice could
not make it disagree with `size`; it is now a per-record tally and can. The tally is forced (neither
a `Map` nor a `vec0` table knows kinds), and a total that silently disagreed with its own per-kind
breakdown would be the worse failure. The trade is now stated on the field's docstring rather than
left silent.

**P2 — Map assertions over-specified iteration order. Fixed.** The `pairs()` helper was converting
maps to arrays and comparing with an order-sensitive `toEqual`, pinning insertion order that the
type does not promise — and it was duplicated across two packages. Every call site now compares the
`Map` directly (`toEqual(new Map([...]))`, which Jest compares order-independently) and both copies
of the helper are gone. Verified the assertions still fail on a wrong value rather than passing
vacuously.

**P3 — the interface doc overclaimed that a `list` failure is the *only* no-detail failure. Fixed.**
`SqliteVecVectorIndex` has a second: a failure to clear its table. The doc now covers the general
case — nothing was attempted, whatever the implementation's pre-loop step is.
