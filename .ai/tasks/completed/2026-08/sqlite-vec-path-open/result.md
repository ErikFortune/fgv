# Result — `sqlite-vec-path-open`

**Outcome:** delivered. Additive; `create()` is untouched on both classes.

## What shipped

```ts
SqliteVecVectorIndex.open({ path, tableName? })   -> Result<ISqliteVecVectorIndexHandle>
SqliteVecFragmentIndex.open({ path, tableName? }) -> Result<ISqliteVecFragmentIndexHandle>
// handle: { index, close(): Result<true> }
```

Both classes, per the brief's first correction — the fragment class had the identical
signature and the identical leak, so adding `open` to one would have left a
sub-document-only consumer still value-importing the driver.

The brief's second correction is implemented as specified: the disposer travels on the
returned handle rather than on the class, because a `create()`-made index holds a
connection the **consumer** owns and must stay incapable of closing it. Verified by test
and, independently, by the `code-reviewer` pass against the class, the `.api.md` and the
`IVectorIndex` / `IFragmentVectorIndex` interfaces — there is no `close` on either class
and no accessor to the private handle.

The value import of `better-sqlite3` is isolated to a new `connection.ts` and is **lazy**.
Every other module imports the driver as `import type` only, so merely importing the
package still does not load the native binding — verified against the emitted JS (the
`require` sits inside the async arrow) and at runtime (`better-sqlite3` absent from
`require.cache` after requiring the barrel). A static import would have moved the native
load, and its failure mode, to package-load time for consumers who only call `create()`.

Also documented and **tested rather than asserted**: `close()` is idempotent, two `open`
calls on one path give two independent connections, `':memory:'` is accepted, and the
index is unusable after its handle closes.

## Deviations from the brief

1. **A failure mode the brief did not name.** If `create()` fails *after* `open` has
   created the file, the connection must be closed or every failed `open` leaks a
   descriptor. Handled, and pinned.
2. **`LIBRARY_CAPABILITIES.md` plus the package README.** The brief named only the former;
   the README's "Not in scope" said connection lifecycle was entirely the consumer's,
   which `open()` makes false. Caught by `code-reviewer`, not by the brief.

## Two tests that did not pin what they claimed

Recorded because both passed against the un-fixed code and both were caught only by
reverting the fix and watching them stay green.

**The leak test, first version.** It reopened the path and wrote to it. SQLite permits many
connections to one file, so that succeeds just as happily against a leaked connection.
Replaced with a count of the process's open descriptors for the file, which fails
(`expected 0, received 1`) with the cleanup removed.

**The `bigint` test in the preceding stream**, repeated here because the same trap applies
to this package: enabling `defaultSafeIntegers` *after* constructing the index does
nothing, because the flag only affects statements prepared after the call.

## The review pass, and the finding I had measured wrong

`code-reviewer` reported `connection.ts` at 85.71% statements / 80% functions via
`rushx coverage`, against my own 100% reading from `heft test`. Both readings are real —
they are different scripts with different collection, and CI gates on `heft test` — but the
substance stood either way: neither the driver-load nor the close-failure formatter had a
test, so a diagnostic nobody had read would have shipped. Both are covered now.

It also caught that the cleanup close discarded its `Result` while the TSDoc promised "a
failed `open` leaks nothing" — which cannot both be true. The package already had the
answer in `rebuildHelpers.withRollbackNote`; both `open()` methods now fold a failed close
into the message.

## Gates

`rushx build` / `rushx lint` / `rushx test` green at 100% coverage; repo-wide
`rush rebuild` green; change file present and `rush change --verify` clean.

## Not done

`sqliteVecVectorIndex.ts` lines 246 and 376 (the `remove` / `query` error formatters) are
uncovered under `rushx coverage`. **Pre-existing** — verified untouched by this diff and
already uncovered on `release`. Left alone rather than folded into an unrelated stream.

**`rushx coverage` is not usable as a gate in this package as it stands**: `jest --coverage`
globs `src/**/*.ts` and `dist/**/*.js` alongside the compiled `lib/`, and the raw TypeScript
suites fail to parse under the coverage transform. That is pre-existing and repo-shaped,
not this stream's, but it is why two honest measurements of the same tree disagreed.
