# Stream brief — `agent-memory-provenance-contract-doc`

**Branch:** `agent-memory-provenance-contract-doc` off `origin/release`
**Shape:** documentation-only (no behavior change)

## Context

PersonAIlity (a consumer) asked a narrow yes/no about `@fgv/ts-agent-memory`: is the
RFC-7386 merge-patch behavior over a record's `provenance` the **intended, stable
contract** — or an incidental consequence of the current write policy's merge config?
And is clearing a provenance **sub-key** via a `null` patch **sanctioned**?

The orchestrator determined the answer is **yes on both halves** by reading the code and
executing it. This stream's job is NOT to re-derive the answer or change behavior — it is
to **document the guarantee where a consumer will find it**, so the next consumer doesn't
have to ask.

## Evidence supplied by the orchestrator (to be independently verified)

`KnowledgeLwwPolicy.mutableFields` is `['body','tags','links','provenance','embeddingRef']`,
declared under a TSDoc block headed "Merge-surface pin (resolves design-lock §5.3's
body-vs-envelope muddle)" — a deliberately pinned contract, not a side effect.
`applyUpdate` projects those fields into a record-level JSON view, applies an RFC-7386
merge patch (`JsonEditor` with `MERGE_PATCH_OPTIONS`, `nullAsDelete: true`) over a clone,
then `_rebuild` reassembles. `_rebuild` treats `body`/`tags`/`links`/`provenance` as
**required** and fails loudly if a patch deleted one.

| Patch | Expected |
|---|---|
| `{provenance: {note: null}}` | `note` removed; `source` / `confidence` preserved |
| `{provenance: {confidence: 0.5}}` | per-key merge; `note` preserved |
| `{provenance: null}` | fails: `... may not delete required field(s): provenance` |
| `{tags: ['x']}` | provenance untouched |

`MemoryCapCullPolicy` takes a caller-supplied `mutableFields`, so the guarantee's exact
surface is policy-dependent — the doc must be precise and must not overclaim for a policy
whose `mutableFields` the consumer chose.

## Scope

1. `libraries/ts-agent-memory/README.md` — add a record-update merge-contract section.
2. TSDoc in `writePolicy.ts` — state the contract at the API surface (build on the
   existing "Merge-surface pin" remark, don't replace it).
3. Optional test pinning the four evidence rows so the doc cannot silently drift.

**Hard constraint: NO behavior change.** If the documented guarantee does not hold in some
case, STOP and report it prominently.

## Files in scope

- `libraries/ts-agent-memory/README.md`
- `libraries/ts-agent-memory/src/packlets/types/writePolicy.ts` — TSDoc/comments only
- `libraries/ts-agent-memory/src/test/**` — additive tests only
- `libraries/ts-agent-memory/etc/*.api.md` (regenerated)
- `common/changes/@fgv/ts-agent-memory/*.json`
- `.ai/tasks/active/agent-memory-provenance-contract-doc/**`

## Files explicitly out of scope

- `libraries/ts-extras/**` (two concurrent streams own it)
- `samples/testbed/**`
- `docs/WORKSTREAMS.md` (orchestrator-owned)
- Any behavioral code path in the store or policies

## Acceptance criteria

- [ ] `rushx build` / `rushx lint` / `rushx test` pass with 100% coverage
- [ ] `rushx fixlint` run before the final commit
- [ ] Added test pins all four behaviors in the evidence table
- [ ] No behavior change — diff contains no change to merge/rebuild logic
- [ ] `code-reviewer` run on the final diff; findings resolved or dispositioned
- [ ] Rush change file added
- [ ] PR opened targeting `release` (do NOT merge)
