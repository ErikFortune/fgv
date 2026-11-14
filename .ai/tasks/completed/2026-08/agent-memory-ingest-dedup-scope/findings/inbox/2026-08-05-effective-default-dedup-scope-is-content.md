# Finding — the effective default `dedupScope` is `'content'`, not `DEFAULT_DEDUP_SCOPE`

**Stream:** `agent-memory-ingest-dedup-scope`
**Severity:** medium — refines the brief's stated blast radius; changes who is affected by OQ-3
**Status:** incorporated into the fix, the design note, the README, and the change file

## What the brief said

> Blast radius is wider than the reporter's case: `DEFAULT_DEDUP_SCOPE` is `'entity'`
> (`types/writePolicy.ts:34`) and both `MemoryCapCullPolicy` (`:363`) and the versioned policy
> (`:519`) declare `'entity'`. Only `KnowledgeLwwPolicy` (`:187`) legitimately declares `'content'`.
> **Every experience and versioned kind currently gets `'content'` behavior on the ingest path.**

## What the source actually shows

All four cited line references are correct. But the inference that `DEFAULT_DEDUP_SCOPE` is the
operative default for an unpoliced kind does not hold.

`FileTreeMemoryStore._policyFor` (`store/fileTreeMemoryStore.ts:1584`) is:

```ts
return this._writePolicies.get(kind) ?? this._defaultPolicy;
```

and `_defaultPolicy` is constructed in `create()` (`:475`) as **`KnowledgeLwwPolicy.create()`** —
which declares `dedupScope: 'content'` **explicitly** (`types/writePolicy.ts:187`).

So the resolution chain is:

    registered policy -> store default policy (KnowledgeLwwPolicy) -> policy.dedupScope -> DEFAULT_DEDUP_SCOPE

`DEFAULT_DEDUP_SCOPE` (`'entity'`) is only reached when a policy object exists but declares no
`dedupScope`. **None of the three shipped policies leaves it undeclared**, so in practice
`DEFAULT_DEDUP_SCOPE` is reachable only via a consumer's custom `IWritePolicy`.

A kind with **no registered write policy** therefore resolves to `'content'`, not `'entity'`.

## Why it matters

It narrows OQ-3's "changes behavior for existing hosts" to a precise population:

- **Affected:** kinds with a registered `MemoryCapCullPolicy` or `TemporalVersionedPolicy`, or a
  custom policy declaring `'entity'` / declaring nothing. These stop collapsing distinct entities
  with identical bodies on the ingest path.
- **Unaffected:** kinds with no registered policy at all (they were `'content'` on both paths
  before and remain so), and kinds with `KnowledgeLwwPolicy`.

The brief's "every experience and versioned kind" is right for hosts that register the experience
policies — which is the documented way to get experience semantics — but a host that registered no
policy for a kind was never getting `'entity'` on the direct-put path either, so nothing changes
for it. The two paths were already in agreement there.

## Disposition

Handled, not deferred:

- `IMemoryStore.dedupScopeFor` resolves the whole chain, so the subtlety lives in exactly one place.
- The design note (§1), the README's `dedupScope` section, the `LIBRARY_CAPABILITIES` entry, and the
  change file all state the `KnowledgeLwwPolicy` fallback explicitly.
- `dedupScope.test.ts` pins it:
  `"reports 'content' for a kind with NO registered policy (the store's default policy is KnowledgeLwwPolicy)"`.
