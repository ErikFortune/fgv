# Brief: `agent-memory-scope-invariant` (the store enforces scope == codec scope on load)

**Orchestrator-owned and frozen at kickoff.** Put questions and disagreements in `state.md`; leave this file unchanged.

**Origin:** follow-up D2 in `.ai/tasks/active/personality-asks-2026-10/followups.md`, which was found by `agent-memory-merge-scope` (#731). Read that stream's `.ai/tasks/completed/2026-10/agent-memory-merge-scope/result.md` § "Out-of-scope report 1".

**Workflow shape:** `stream` (small). Work on branch `agent-memory-scope-invariant`, cut from `integration/asks` at `0ef9bfe5`. That base already carries #731. The PR goes onto `integration/asks`.

## Mission

#731 keys the hybrid merge on `scopedAddressOf(record, resolver)`, which is the scope the codec derives from `(kind, entityId)`. That key is the record's *actual* address only if every loaded record satisfies **`scope == codec(kind).encode(entityId).scope`**.

Today that holds only because the four shipped codecs happen to check scope. The `IIdentityCodec.verifyRoundTrip` contract asks only for idStem equality, so a custom codec whose `decode` ignores scope lets the store load a record from a foreign scope.

Make the invariant a property of **the store**, enforced at load, for every codec.

## What the orchestrator believes (verify every line)

Read on `integration/asks` at `0ef9bfe5`.

1. `verifyLoadedIdentity` (`libraries/ts-agent-memory/src/packlets/store/storeIdentity.ts:~102-130`) checks three things:
   - `envelope.id === file.baseName`;
   - `codec.verifyRoundTrip(scope, stem)` and then `codec.decode(scope, stem)`;
   - `decoded === envelope.entityId`.

   **It never compares `scope` against `codec.encode(envelope.entityId).scope`.**
2. Every read path goes through it: `_readRecord`, `getById`, `resolveRecord`, `_materialize`, `listScoped` and `scanEveryRecord`. The initial index walk `_collectEntries` / `_loadRecordFile` reaches it through `_verifyLoaded`. In `'fail'` mode a failed check fails the open. In `'skip'` mode it quarantines the file into `skippedRecords`.
3. For a versioned (temporal) kind, `encode(entityId).scope` is the entity's directory, and every version file lives in it. So the same comparison is correct for flat and versioned kinds alike.
4. The `IIdentityCodec.verifyRoundTrip` TSDoc (`types/identityCodec.ts:~46-50`) states only the idStem contract. `scopedAddressOf`'s TSDoc (`types/identityResolver.ts`) qualifies its guarantee with "under a codec whose round-trip checks scope". Both become simpler once the store enforces the invariant.
5. Five in-repo **test** codecs would fail the new check if they are wired so that a record loads from a scope their `encode` would not produce. They are listed in the #731 report:
   - `turnCodec` and `versionedCodec` in `store/fileTreeMemoryStore.test.ts`;
   - `PathIdentityCodec` in `store/lenientOpen.test.ts`;
   - `PrefixedCodec` in `store/kindCollision.test.ts`;
   - `versionedCodec` in `tools/memoryTools.test.ts`.

   Some may never load from such a scope. Check each one.

## Decisions already made

1. **Enforce it in `verifyLoadedIdentity`.** After the existing checks, also check that `codec.encode(envelope.entityId).scope === scope`.
   - On mismatch, fail with a message that names the file, the scope it was read from, and the scope the codec derives.
   - Encode failures are reported the same way, with the same file context.
   - Use a chain, not stacked `isFailure` checks.
2. **Doc changes:**
   - The store states the invariant as a guarantee: "every record the store returns was read from `codec(kind).encode(entityId).scope`".
   - `verifyRoundTrip`'s TSDoc says the store also enforces scope equality on load, so a codec need not.
   - `scopedAddressOf`'s TSDoc drops its "under a codec whose round-trip checks scope" qualifier, because the guarantee is now unconditional for records the store returned.
   - Update `ts-agent-memory`'s `CAPABILITIES.md` to match.
3. **Do not change the `IIdentityCodec` interface.** The store check makes a tighter contract unnecessary.
4. **Fix the test fixtures honestly.** A fixture that relied on loading from a scope its codec does not produce should either be given a coherent codec, or become a regression test that now *expects* the load to fail. Never weaken the check to keep a fixture green.
5. **Regression tests:**
   - With a scope-blind custom codec (like `PrefixedCodec`), a file placed at a foreign scope is **rejected** in `'fail'` mode and **quarantined** in `'skip'` mode. Test both the open-time walk and a direct `getById` read.
   - A well-placed file still loads, for both a flat kind and a versioned kind.
   - **Neutralize and confirm:** remove the new comparison, see the foreign-scope tests go red, then restore it. Record this in `result.md`.

## Acceptance criteria

- [ ] Each belief has a verdict, with file:line evidence.
- [ ] The decisions above are implemented and tested, including neutralize-and-confirm.
- [ ] There is a `common/changes/@fgv/ts-agent-memory/*.json` change file. Type it `minor` with a `BREAKING:` prefix: a custom codec that relied on loading foreign-scope files now fails to load them.
- [ ] `rushx build`, `rushx lint` and `rushx test` (100% coverage) pass with zero warnings in `ts-agent-memory`. `install-run-rush.js rebuild` and `install-run-rush.js test` pass repo-wide, because `ts-agent-memory-sqlite-vec` and `samples/testbed` consume the store.
- [ ] `rushx fixlint` has been run, and `change --verify --target-branch origin/integration/asks` passes. Use prettier 2.8 only, and do not reflow Markdown tables.
- [ ] Close-out:
  - migrate the task to `.ai/tasks/completed/2026-10/agent-memory-scope-invariant/` with `meta.yaml` and `README.md`;
  - add the `docs/workstreams/2026-10.md` entry with `#TBD`;
  - regenerate the capability feed and run `verify-capability-docs`.

## Out of scope (report in `result.md`, do not fix)

- **`_collectEntries` takes the scope from raw directory segments, while writes go through `scopeEncoding(scope)`.** A non-identity `scopeEncoding` would index records under the encoded path. Report whether the new check makes that case fail loudly. It should, since the encoded path is not the codec's scope. Also report whether that is the right outcome.
- **The bare-id default tool handle (D3).** That needs a decision from the user.

## Mechanics

- Work in your own git worktree on branch `agent-memory-scope-invariant`, which already carries this brief. Push there and **do not open a PR**.
- `rush` and `rushx` are not on PATH. Use `node common/scripts/install-run-rush.js <cmd>` from the repo root, and `node ../../common/scripts/install-run-rushx.js <cmd>` inside a package. Run `install` first.
- Commit before each long gate. Run gates in the foreground and wait for them. Write gate logs to a per-worktree path.
- **Do not spawn sub-agents.**
- When finished, push and confirm with `git log origin/agent-memory-scope-invariant -1`.
- **Stop and report** if:
  - a shipped codec or a shipped read path loads a record from a scope its codec would not produce, because that would mean the invariant was already false in shipped code;
  - the check cannot be added without changing `IIdentityCodec`.

## Exit artifacts

- `state.md`.
- `result.md`, covering:
  - what shipped;
  - each belief's verdict;
  - the neutralize-and-confirm result;
  - each fixture and what was done to it;
  - the `scopeEncoding` report;
  - gate counts;
  - anything the brief got wrong.
