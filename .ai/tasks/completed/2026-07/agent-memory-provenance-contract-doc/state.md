# State — `agent-memory-provenance-contract-doc`

## Verification (done before writing any docs)

Built `@fgv/ts-agent-memory` on this branch and executed the four evidence rows against
`lib/index.js` directly, plus store-level round trips. **The guarantee held in every case.**

### Policy layer — `KnowledgeLwwPolicy.applyUpdate`

Existing record provenance: `{ source: 'agent', confidence: 0.9, note: 'keep me' }`.

| Patch | Observed |
|---|---|
| `{provenance: {note: null}}` | `{source:'agent', confidence:0.9}` — `note` cleared, siblings preserved |
| `{provenance: {confidence: 0.5}}` | `{source:'agent', confidence:0.5, note:'keep me'}` — per-key merge |
| `{provenance: null}` | FAILS: `knowledge LWW: merge patch may not delete required field(s): provenance` |
| `{tags: ['x']}` | provenance untouched |

Matches the orchestrator's table exactly. Also confirmed the existing record is **not
mutated in place** (the clone-then-merge is real).

### Cross-policy parity (not in the original evidence table)

`TemporalVersionedPolicy` and `MemoryCapCullPolicy` (with `provenance` declared mutable)
produce **identical** results on all four rows; only the error-message prefix differs
(`temporal versioned:` / `memory cap-cull:`). All three share `MERGE_PATCH_OPTIONS`.

### Policy-dependence (the precision point the brief called out)

`MemoryCapCullPolicy.create({ mutableFields: ['body','tags'] })` — i.e. `provenance` NOT
declared mutable — **ignores every provenance patch key silently**, including the
whole-block `{provenance: null}`. It does not fail; the scoping loop drops the key before
the merge, and `_rebuild` only guards required fields that are *declared mutable*.

This is the load-bearing caveat for the README: the "sub-key `null` clears" and "whole-block
`null` is rejected loudly" guarantees apply **only when `provenance` is on the policy's
declared mutable surface**. It is pinned for `KnowledgeLwwPolicy` and
`TemporalVersionedPolicy` (both hard-code the five-field surface); for
`MemoryCapCullPolicy` it is the caller's `mutableFields` that decides.

### Store layer — `FileTreeMemoryStore.put`

End-to-end round trip through an in-memory FileTree with `KnowledgeIdentityCodec`:

- put #1 provenance `{source:'agent', confidence:0.9, note:'keep me'}` → stored verbatim
- put #2 provenance `{source:'agent', note:null}` → stored `{source:'agent', confidence:0.9}`
- `get()` after → `{source:'agent', confidence:0.9}` (survives serialize/reload)

Two things this pins that the policy-level table alone does not:

1. The store builds the patch from the **incoming record's mutable-field values**
   (`_projectMutablePatch`), so a key **absent** from the incoming provenance is
   **preserved**, not deleted (`confidence: 0.9` survived a put that omitted it). Only an
   explicit `null` deletes.
2. The cleared sub-key round-trips through YAML-frontmatter persistence.

### Where the whole-block `null` is rejected, per layer

- **Policy layer:** `applyUpdate({provenance: null})` fails loudly (message above).
- **Store layer:** unreachable — `IMemoryEnvelope.provenance` is typed non-nullable, and
  `envelopeConverter.convert({..., provenance: null})` fails
  (`Field provenance: Cannot convert field "source" from non-object null`).

Both are loud rejections at different layers; neither silently accepts. Documented as such.

## Decisions

- **Doc placement.** README gets a `## Record updates — the merge contract` section
  (consumer front door); `writePolicy.ts` gets a `@remarks` on `IWritePolicy.applyUpdate`
  plus a sentence appended to `KnowledgeLwwPolicy`'s existing "Merge-surface pin" remark.
  The existing remark is built on, not replaced, per the brief.
- **Test placement.** Added to the existing `src/test/unit/types/writePolicy.test.ts` under
  a dedicated `describe` naming the contract, rather than a new file — it sits next to the
  existing merge tests it generalizes.
- **Stale README status banner.** The banner claimed "no store, index, retrieval, observe,
  or vector code yet", which is provably false (I drove the store end-to-end above). Left
  alone would have made the new section incoherent, so the one false clause was corrected.
  The rest of the README's surface inventory (the "B0 surface" listing) is still stale and
  is deliberately NOT rewritten here — out of scope, flagged in `result.md` as a chore.

## Surprises

- None that contradict the evidence table. The only material addition is the
  `MemoryCapCullPolicy`-with-narrow-`mutableFields` case, which does not contradict
  anything — the brief anticipated exactly this policy-dependence and asked for precision
  about it.
