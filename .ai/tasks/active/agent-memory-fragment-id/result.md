# Result — `agent-memory-fragment-id`

Branch `agent-memory-fragment-id` (from `origin/release`). Both packages green on
`rushx build` / `rushx lint` / `rushx test` at **100% coverage**.

## What shipped

### `@fgv/ts-agent-memory`

| Change | File |
|---|---|
| `IEmbeddedFragment.fragmentId?: string` (opaque bytestring; never parsed, never filtered on, not in the query path) | `packlets/vector/vectorIndex.ts` |
| `IEmbeddedFragment.locator?` — now optional | `packlets/vector/vectorIndex.ts` |
| `IVectorQueryHit.fragmentId?: string` — carried back verbatim | `packlets/vector/vectorIndex.ts` |
| `embeddedFragmentConverter` + `fragmentLocatorConverter` — the at-least-one invariant enforced in the **converter, not the type** | `packlets/vector/fragmentConverters.ts` (new) |
| `InMemoryFragmentCosineIndex` carries `fragmentId` through add → query; re-checks the at-least-one invariant at the index seam | `packlets/vector/inMemoryFragmentCosineIndex.ts` |
| Doc rewrites (below) | `packlets/vector/vectorIndex.ts`, `packlets/retrieve/fragmentSemanticRetriever.ts` |

### `@fgv/ts-agent-memory-sqlite-vec`

| Change | Detail |
|---|---|
| Third auxiliary column `+fragment_id text` | Written on upsert, selected on query, returned on the hit. Never filtered, never parsed. |
| Absent locator → **NULL offset pair** | The pair is bound all-or-nothing, so the read side can treat a half-`NULL` pair as corruption rather than a legal shape. |
| Schema-migration detection at `create` | Reuses the existing stored-`CREATE VIRTUAL TABLE`-SQL parse (already used to recover the dimension) to compare the auxiliary-column **set**, failing with expected-vs-found columns + the drop-and-re-index remedy. |
| Safe-integer handling preserved | Write-side `Number.isSafeInteger` check now runs only when a locator is present (an absent locator has nothing to validate and must not hit `BigInt(undefined)`); read-side `_toOffset` coercion unchanged. |
| Two new corrupt-persisted-data guards | Half-`NULL` offset pair, and a row carrying neither identity — both fail the query loudly instead of fabricating a span (`Number(null)` is `0`) or returning an anonymous hit. |

### Policy documentation

The **drop-and-re-index rule** is written down in two places a consumer will actually
meet it: `.ai/instructions/LIBRARY_CAPABILITIES.md` (the
`@fgv/ts-agent-memory-sqlite-vec` entry) and the package README (a dedicated
`## Upgrading` section). Both state plainly: a `vec0` schema change requires
consumers to drop the table and re-index; there are no in-place migrations; vectors
are re-derivable from records, so it costs embedding time, never data.

## The `locator` discriminator note (exact final wording)

On `IVectorQueryHit`:

> **No single field discriminates a fragment hit from a record-granular hit.** A
> record hit carries neither `locator` nor `fragmentId`; a fragment hit carries at
> least one of the two, but not necessarily any particular one — a fragment with a
> body span but no consumer-minted id, and a fragment with an id but no honest span,
> are both legal. Testing one field for presence therefore cannot tell you which kind
> of hit you hold.
>
> That "at least one" requirement is enforced on the upsert side by
> `embeddedFragmentConverter` — a different boundary from this type — and is
> deliberately NOT offered here as a discriminator either. A caller keyed off it
> would be coupled to an invariant this type does not own, and would fail silently if
> the invariant were ever relaxed.
>
> **The robust rule is that fragment-ness is determined by which index produced the
> hit**: `IFragmentVectorIndex.query` returns fragment hits and `IVectorIndex.query`
> returns record hits. The caller chose the index it queried, so it already knows
> which kind it is holding.
>
> Note in particular that an absent `locator` now carries **two** distinct meanings —
> a record-granular hit, or a fragment with no honest body span — which is precisely
> why presence-branching is unsafe.

The `IFragmentLocator` docstring now states the span is **advisory** — the region of
the body a fragment was *derived from*, NOT a slice guaranteed to reproduce the
fragment's text — and names the rewriting-segmenter case explicitly. The false claim
on `IFragmentVectorIndex` (that `IVectorQueryHit`'s "`locator` is always populated
here") is gone.

## Decisions recorded — decided, not overlooked

- **No `exact` / `verbatim` flag on `IFragmentLocator`.** The consumer **considered
  and declined** it: once fragments are durable state they stop re-deriving them from
  the body, so span-to-text reproduction is not an operation they perform. Recorded
  here so a future consumer reopens it as a **new ask** rather than as an oversight.
- **No conditional-required union** (`{ locator; fragmentId? } | { locator?; fragmentId }`).
  Declined: it costs at every construction site and buys nothing at the read site,
  where each field reads as `… | undefined` either way. The invariant lives in the
  converter (and is re-checked at both index seams).
- **No new fragment-vs-record discriminant field** on `IVectorQueryHit` — not needed;
  the caller queries the index it chose.
- **Fragment-id stability across re-embeds is the consumer's responsibility.** The
  library's guarantee is "we never parse it", NOT "we keep it stable" — documented as
  such on `IEmbeddedFragment.fragmentId`, because whole-record-replace means an
  updated record re-emits its whole fragment set.

## Behaviour changes beyond pure addition (disclosed)

`SqliteVecFragmentIndex.create` now **rejects** a pre-existing table of the configured
name whose auxiliary columns do not match (including a plain non-`vec0` table, and a
table with matching auxiliary columns but no `vec0` embedding column). Previously it
succeeded with an unrecovered dimension and failed later at insert time. Two existing
tests asserting the old late-failure shape were rewritten to assert the new
create-time rejection — the detection moved earlier and the message became actionable;
nothing that previously worked now fails.

Everything else is a pure addition: a hit for a fragment stored without a
`fragmentId` omits the key entirely (never present-and-`undefined`), so existing
structural comparisons are unaffected. Covered by dedicated tests in **both**
packages (`Object.keys(hit).sort()` + `toStrictEqual`).

## Tests added

- `fragmentConverters.test.ts` (new) — the at-least-one invariant across all four
  identity shapes, plus field validation.
- `inMemoryFragmentCosineIndex.test.ts` — `fragmentId` carry-through (opaque value
  round-trips verbatim), id-only fragments, both-identity fragments, mixed shapes in
  one record, byte-identical hit shape when `fragmentId` is absent, neither-identity
  rejection.
- `sqliteVecFragmentIndex.test.ts` — all of the above against SQLite, plus:
  `fragment_id` + NULL-locator persistence across a real close+reopen; the
  safe-integer check skipped for a locator-less fragment and still enforced when a
  locator is supplied; **auxiliary-column schema detection** (actionable message
  naming expected-vs-found; states drop-and-re-index + no data loss; asserts the
  opaque `no such column` error is NOT what surfaces; order-insensitive acceptance;
  same-arity-different-name rejection; no-embedding-column rejection); and the two new
  corrupt-persisted-data guards.

## Not touched (per brief)

`packlets/store/fileTreeMemoryStore.ts`, the `index` packlet, `docs/WORKSTREAMS.md`,
`docs/STATUS.md`. No store change was needed: `FragmentEmbedder` is consumer-supplied
and returns `IEmbeddedFragment[]`, so `fragmentId` flows through the existing
fragment-embed-on-write hook untouched.

`libraries/ts-agent-memory/etc/ts-agent-memory.api.md` was regenerated and will
conflict with the concurrent `agent-memory-index-injection-seam` stream — expected,
resolved at integration.

## Review-loop note

**The `code-reviewer` sub-agent could not be run: this environment exposes no
agent-spawn tool.** In its place I ran a manual pass against
`CODE_REVIEW_CHECKLIST.md` on the pre-coverage-closure diff, before running
`rushx coverage`. It produced three changes:

1. Replaced three `{@link AUXILIARY_COLUMNS}` references (a module-private const) with
   plain code spans — they were baking `ae-unresolved-link` warnings verbatim into the
   checked-in `etc/*.api.md`, the exact liability the checklist's TSDoc section names.
2. Asked "should this branch exist?" of the `match === null ? undefined : …` dimension
   fallback and concluded it should not: with the auxiliary-column check in place, a
   table that passes it but has no `float[<n>]` column is not a usable fragment index,
   and returning a dimensionless index there produced a half-state whose first add
   would `CREATE VIRTUAL TABLE IF NOT EXISTS` into a no-op. Replaced the silent
   fallback with a loud failure — which removed a would-be coverage gap rather than
   papering over it with a directive.
3. Documented why the shared `/g` `AUXILIARY_COLUMN_RE` is safe under `matchAll`
   (`matchAll` iterates a clone; it does not advance the shared instance's
   `lastIndex`) — the `lastIndex` footgun the repo has been bitten by before.

No `c8 ignore` directives were added. No `any`. All fallible operations return
`Result<T>`; the two in-`captureResult` throws are corrupt-persisted-data guards
following the file's established convention (`_parseKey`, `_toOffset`).
