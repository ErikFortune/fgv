# Result: `agent-memory-scope-invariant`

**Shipped:** `FileTreeMemoryStore` now refuses to load any record that was not read from `codec(kind).encode(entityId).scope`, for every identity codec — so `scopedAddressOf` is the address a store-returned record was read from, unconditionally, and a custom codec no longer has to check scope itself.

Branch `agent-memory-scope-invariant`, cut from `integration/asks` at `0ef9bfe5`. Package:
`@fgv/ts-agent-memory` only. No PR was opened, as the brief requires.

## What shipped

- **`verifyLoadedIdentity`** (`store/storeIdentity.ts`) adds a fourth check after the existing three:
  `codec.encode(envelope.entityId).scope === scope`.
  - On mismatch the message names the file, the scope it was read from, and the scope the codec
    derives: `memory file '<path>': read from scope '<scope>', but its codec derives scope '<derived>' for entityId '<id>'`.
  - An `encode` failure carries the same `memory file '<path>':` prefix.
  - The function is now a single chain. The entityId cross-check moved inside it, and its final
    message text is unchanged.
- **Docs.**
  - `FileTreeMemoryStore` class TSDoc states the scope invariant as a guarantee.
  - `IIdentityCodec.verifyRoundTrip` TSDoc says only the idStem is contracted, and that the store
    enforces scope separately, so a codec need not.
  - `scopedAddressOf` TSDoc drops the "under a codec whose round-trip checks scope" qualifier.
  - The `_verifyLoaded` private doc lists the new check.
  - `CAPABILITIES.md` adds the invariant to the Core paragraph, and the `scopedAddressOf` sentence
    under Retrieval points at it.
- **`IIdentityCodec` is unchanged**, and so is `etc/ts-agent-memory.api.md`.
- **New suite** `test/unit/store/scopeInvariant.test.ts`, with 8 tests. It uses two scope-blind
  codecs: a flat one, and a versioned one that wraps the shipped temporal layout but recovers the
  entity id from the stem.
  - Two tests show well-placed records still load, flat and versioned, through both `get` and
    `getById`.
  - `'fail'` mode rejects a flat foreign-scope file, and a version file sitting under another
    entity's subtree.
  - `'skip'` mode quarantines both foreign files into `skippedRecords` and keeps both well-placed
    ones.
  - An unencodable entity id is reported with the file context.
  - `getById` refuses a foreign-scope file, flat and versioned, and so does `resolveRecord`. The
    file is still on disk after a skip-mode open, so these are real direct reads.
- **Change file** `common/changes/@fgv/ts-agent-memory/agent-memory-scope-invariant_2026-10-17-12-00.json`,
  typed `minor` with a `BREAKING:` prefix.

## Belief verdicts

Line numbers are at `0ef9bfe5`, before this change.

1. **Confirmed.** `verifyLoadedIdentity` (`storeIdentity.ts:103-125`) checked `envelope.id ===
   file.baseName` (`:109`), then `verifyRoundTrip` and `decode` (`:115`), then `decoded ===
   envelope.entityId` (`:118`). It never called `encode`.
2. **Confirmed, with one addition.**
   - `get`'s flat path (`fileTreeMemoryStore.ts:514`), `getById` (`:530`), `resolveRecord` (`:624`),
     `_materialize` (`:649`, behind `list`, so `scanEveryRecord` too) and `_resolveRequired` (`:677`,
     behind `listScoped` and the versioned `get`) all reach `_readRecord` (`:1772`). That calls
     `_verifyLoaded` (`:1792`).
   - The open-time walk reaches it via `_loadRecordFile` (`:1886`).
   - Not in the brief: reconcile's `_rewriteEnvelope` (`:1693`) also goes through `_verifyLoaded`,
     so reconcile now refuses a foreign-scope file too.
   - `'fail'` mode fails the open through `mapResults` (`:1864`). `'skip'` mode quarantines through
     `_loadRecordFile`'s `onFailure` (`:1896-1900`). Both are tested.
3. **Confirmed.** `TemporalIdentityCodec.encode` returns `<base>/entities/<entityId>`
   (`identityCodec.ts:151`). The store writes every version file into `addr.scope` and selects
   versions by `entry.scope === scope` (`fileTreeMemoryStore.ts:1188`). The versioned tests load
   from that subtree and reject a sibling subtree.
4. **Confirmed.** `verifyRoundTrip`'s TSDoc (`identityCodec.ts:46-50`) stated only the idStem
   equality. `scopedAddressOf`'s TSDoc (`identityResolver.ts:62-64`) carried the qualifier. Both
   are updated.
5. **Confirmed that all five exist. None of them loads from a foreign scope**, so none failed the
   new check and none was changed. With the check in place and no fixture edits, the whole existing
   suite passed, and the only uncovered line was the new mismatch branch. Per fixture:
   - **`turnCodec`** (`fileTreeMemoryStore.test.ts:567`). It only ever reads back through `put`/`get`
     at its own scope. Left as is. One correction to #731's report: its `decode` takes only
     `scope.split('/')[1]`. A file at `other/c1/turn-0.md` declaring `c1:0` would therefore have
     passed the entityId cross-check and loaded. The new check now catches it. No test placed one
     there.
   - **`versionedCodec`** (`fileTreeMemoryStore.test.ts:621`). Every test fails at the temporal
     interface probe before any read. It never loads anything. Left as is.
   - **`PathIdentityCodec`** (`lenientOpen.test.ts:43`). `decode` returns `<scope>/<stem>` and
     `encode` splits on the last `/`, so `encode(decode(scope, stem)).scope === scope` for every
     file it can load. It is coherent. Left as is.
   - **`PrefixedCodec`** (`kindCollision.test.ts:65`). This one is scope-blind, but every record it
     handles is written by the store to `shared`, its own `encode` scope. Left as is. The new suite
     uses an equivalent scope-blind codec deliberately.
   - **`versionedCodec`** (`memoryTools.test.ts:596`). It is used only to show that `memory_write`
     refuses a versioned kind. It never loads anything. Left as is.

No stop-and-report condition fired. All four shipped codecs already refuse a foreign scope:
Knowledge and LTM through `decode`, MTM and Temporal through `verifyRoundTrip`. The check also
needed no change to `IIdentityCodec`.

## Neutralize and confirm

I changed the comparison to `true || encoded.scope === scope` and ran the package suite.
`scopeInvariant.test.ts` went to **3 passed, 5 failed**:

- the five foreign-scope tests went red: `'fail'` flat, `'fail'` versioned, `'skip'` quarantine,
  `getById` flat, and `getById` versioned;
- the two well-placed tests and the unencodable-id test stayed green, as they should.

Every other suite stayed green. I restored the file from a byte copy, and `git diff` confirmed it
matched the committed version.

## The `scopeEncoding` report

I probed this with a temporary test that was not committed. A store was given `scopeEncoding: s =>
'enc-' + s`. I wrote a knowledge record, which landed at `/enc-knowledge/doc.md`, and then reopened
the same root.

| codec | before this change | after |
|---|---|---|
| `KnowledgeIdentityCodec` | open fails: `knowledge codec: scope 'enc-knowledge' does not match expected scope 'knowledge'` | same |
| scope-blind codec | **opens silently**, indexing the record under scope `enc-knowledge` | open fails: `read from scope 'enc-knowledge', but its codec derives scope 'knowledge' for entityId 'doc'` |

So the new check does make the non-identity-encoding case fail loudly for every codec. Before, a
scope-blind codec indexed the record under the encoded path. Every later read then re-encoded that
path, to `enc-enc-knowledge`, and missed. `list` would have dropped the record silently, and
`listScoped` would have failed.

**Is it the right outcome?** It is better than what it replaces, because loud is better than
silently mis-indexed. It is not the right *end state*. The store writes through `scopeEncoding` but
walks raw directory segments, and nothing can invert an encoding. So any non-identity
`scopeEncoding` produces a vault the store cannot reopen. The check turns that latent bug into an
immediate one on the first reopen.

The real fix needs an inverse. That could be a `scopeDecoding` param, or a bijective-encoding
contract. Alternatively, the param could be documented, or narrowed, as validation-only, which is
what the default actually is. I did not fix it here, because it is out of scope. It deserves a
`TECH_DEBT.md` or `FUTURE.md` entry.

## Gate counts

All logs are under the worktree's `.gate-logs/`, which is not committed. Each count is `grep -cE 'not
met|FAILURE|Operations failed|error TS'` / `grep -ci warning`.

| gate | errors | warnings |
|---|---|---|
| `rushx build` (ts-agent-memory) | 0 | 0 |
| `rushx lint` (ts-agent-memory) | 0 | 0 |
| `rushx test` (ts-agent-memory, 100% all metrics) | 0 | 0 |
| `install-run-rush.js rebuild` (repo-wide) | 0 | 1 (Rush's Git-tracked symlink notice only; `SUCCESS: 38 operations`) |
| `install-run-rush.js test` (repo-wide) | 0 | 1 (same symlink notice only; `SUCCESS: 37 operations`) |
| `change --verify --target-branch origin/integration/asks` | pass | — |

`rushx fixlint` was run, and changed nothing. Prettier 2.8.8 reformatted only the new test file.

## What the brief got wrong

- **Belief 5 expected fixture work, and there was none.** #731's "five would fail" referred to a
  *conformance check of a tightened `verifyRoundTrip` contract*. The store-level check fails a
  fixture only if that fixture actually loads from a foreign scope, and none does. The brief half
  anticipated this ("some may never load from such a scope"). In the event, none did.
- **#731's report understated `turnCodec`.** It said a misplaced file "still gets caught by the
  entityId cross-check". That is true for a wrong second segment, but not for a wrong first one. See
  belief 5.
- **Belief 2 missed reconcile's `_rewriteEnvelope`.** It is a sixth direct read through
  `_verifyLoaded`. It is covered by the same check, with no extra work.
