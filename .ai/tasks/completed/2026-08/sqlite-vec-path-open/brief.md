# Stream brief — `sqlite-vec-path-open`

**Status: QUEUED 🟢 — ready to start.** Filed 2026-08-15 from a PersonAIlity ask
(`ts-agent-memory-sqlite-vec` open ask, 2026-08-14, written against `5.1.0-49`).

**Shape:** additive convenience. Nothing existing changes or goes away.

## Origin, and its standing

A consumer ask marked **low priority** by the consumer, with a working, structurally-sound
workaround already shipped, and an explicit *"a **won't do** is a fine answer and we will not
re-send it."* Treat that framing as real: this is worth doing because it is small and the
diagnosis is correct, not because anyone is blocked.

**Every load-bearing claim in the ask was re-verified against our source before filing** (the
standing rule for consumer asks — both sides have shipped a wrong sweep this year). All four
hold:

1. `database: BetterSqlite3.Database` is required, with no path alternative — true, and true on
   **both** create-param interfaces (`model.ts:12`, `model.ts:37`).
2. There is no `close()` / `dispose()` — true. Our own docstrings state the posture outright:
   *"The consumer opens it and owns its lifecycle — this index never closes it."*
3. The instance form is the seam for sharing one connection between the record and fragment
   indexes — true, and `ISqliteVecFragmentIndexCreateParams.tableName`'s docstring explicitly
   directs a consumer to a distinct table name for exactly that.
4. The value-import of `better-sqlite3` falls on the consumer — true, **and sharper than the ask
   states it.** Our three source files import it as `import type` only. So the value import is
   not shared discomfort we happen to inflict; it exists *solely* because our factory signature
   forces it. The ask's characterization — the one place the wrapper leaks its own dependency
   into consumer source — is exactly right.

## Mission

Add a path-based factory alongside the existing instance-based one, so the single-index case can
be written without the consumer value-importing `better-sqlite3` or re-establishing `Result`
discipline around a constructor that throws.

## Two corrections to the ask's scope

### 1. Both classes, not one

The ask names only `SqliteVecVectorIndex.open`. **`SqliteVecFragmentIndex.create` has the same
signature shape and the same leak.** A consumer doing sub-document retrieval only — fragment
index, no record index — still value-imports `better-sqlite3`, so adding `open` to one class
leaves the leak half-closed.

It would also break a symmetry the two classes maintain deliberately: their create-params
docstrings mirror each other almost line for line, and `SqliteVecFragmentIndex` is documented as
the fragment-granular *sibling* of `SqliteVecVectorIndex`. Divergent factory surfaces between
siblings is the kind of asymmetry a consumer reads as an oversight and works around.

**Do both, or neither.**

### 2. `close` cannot simply be a method on the class

The ask reaches the right instinct — *"If `open()` owns what it opened, it can also close it"* —
but a `close()` on the class is wrong for the instances `create()` produces: they hold a handle
the consumer owns, and closing it would be the boundary reaching past its own stated contract.
A method that is meaningful on some instances and forbidden on others is a lie in the type.

**Preferred shape** — the disposer travels with the thing that created the connection, and
`create()` is untouched:

```ts
SqliteVecVectorIndex.open(params: ISqliteVecVectorIndexOpenParams)
  : Promise<Result<ISqliteVecVectorIndexHandle>>;

interface ISqliteVecVectorIndexHandle {
  readonly index: SqliteVecVectorIndex;
  close(): Result<true>;   // closes the connection THIS call opened
}
```

Alternatives considered, and why they are worse: an ownership flag plus a conditional `close()`
puts a runtime-only distinction into a compile-time surface; a no-op `close()` on
consumer-owned handles silently does nothing at the one moment a caller wants certainty. If the
implementer finds a third shape that keeps ownership legible, take it — the constraint is that
**`create()`-made instances must remain incapable of closing a handle they do not own**, not
that the answer be this exact type.

## Also in scope

- **Document that two `open()` calls on one path give two connections, not a shared one.** This
  is legal in sqlite and has a different locking story than the shared-handle case. The ask
  already scopes itself to the single-index case, so this is a doc obligation rather than a
  design problem — but it must be stated, or someone will reach for `open()` twice and be
  surprised.
- **`LIBRARY_CAPABILITIES.md`**: the `@fgv/ts-agent-memory-sqlite-vec` entry currently says
  "BYO; the index never opens/closes it". That becomes conditional and must be rewritten to
  describe both factories and which one owns the connection.

## Explicitly NOT in scope

- **Removing or deprecating the `database` parameter.** The consumer asked us to keep it and
  they are right: it is the shared-connection seam.
- **Anything about the peer dependency.** A native sqlite runtime is inherent; the consumer
  explicitly is not asking us to hide it, and we should not.
- **A `FileTree`-shaped API.** sqlite needs a real filesystem path. The consumer names this as
  their tension to manage at their boot edge, and they manage it.
- **Connection pooling, multi-process coordination, or any lifecycle beyond open/close.**

## Gates

- [ ] `rushx build` / `rushx lint` / `rushx test` green in `@fgv/ts-agent-memory-sqlite-vec`
- [ ] 100% coverage maintained
- [ ] Change file present — `rush change --verify --target-branch origin/release`
- [ ] Both classes carry the new factory, or neither does
- [ ] A test proves a `create()`-made index cannot close the consumer's handle
- [ ] A test proves an `open()`-made handle closes the connection it opened
- [ ] `LIBRARY_CAPABILITIES.md` entry rewritten in the same PR
- [ ] `code-reviewer` on the final diff before first push

## Reply owed to the consumer

Two things they should hear before we build, because one affects their boot edge: that we are
doing **both** classes, and the **`close`** shape. They wrote the ask assuming a bare
`open({ path, tableName? })` returning the index directly; a handle-with-disposer is a different
call site.
