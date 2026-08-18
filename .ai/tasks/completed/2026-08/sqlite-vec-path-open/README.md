# `sqlite-vec-path-open`

**Shipped to `release` 2026-08-16.** Additive — `create()` is untouched on both index classes.

From a PersonAIlity ask of 2026-08-14, marked low priority with a working workaround and an
explicit *"a won't-do is a fine answer"*. It was picked up when the consumer turned out to have
a fix waiting on it.

```ts
SqliteVecVectorIndex.open({ path })   -> Result<{ index, close() }>
SqliteVecFragmentIndex.open({ path }) -> Result<{ index, close() }>
```

**Both classes**, because the fragment class had the identical signature and the identical
leak. **The disposer travels on the handle, not the class**, because a `create()`-made index
holds a connection the consumer owns and must stay incapable of closing it — a `close()`
meaningful on some instances and forbidden on others would be a lie in the type.

The driver's only value import is isolated to `connection.ts` and is lazy, so merely importing
the package still does not load the native binding.

## The two things worth carrying forward

**A test that pins nothing looks exactly like a test that passes.** The first leak test
reopened the path and wrote to it — which succeeds just as happily against a leaked
connection, because SQLite permits many connections to one file. It was caught only by
reverting the fix and watching it stay green. The shipped version counts the process's open
descriptors and fails `expected 0, received 1` without the cleanup.

**Two honest coverage measurements of the same tree disagreed.** `heft test` reported 100%;
`rushx coverage` reported 85.71% on `connection.ts`. Both are real — different scripts,
different collection, and CI gates on the former — but the substance was the same either way:
two error formatters had no test. See `result.md` § "Not done" for why `rushx coverage` is not
currently usable as a gate in this package.

## Artifacts

`brief.md` and `result.md` are archived read-only alongside this file; `meta.yaml` carries the
machine-readable record.
