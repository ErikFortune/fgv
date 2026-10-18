# memory-search-scope: memory tool result items carry their scope

**Shipped**: 2026-10-18 into `integration/asks`. The PR number (#TBD) goes in `meta.yaml` when the
PR is opened. Package: `@fgv/ts-agent-memory`.

## Summary

Followups D3 and D7, user decisions of 2026-10-18. `createMemoryTools` result items carried a `handle`,
which by default is the bare `envelope.id`, and no scope. Two same-id records in different scopes
(turn-3 in two conversations) were indistinguishable to the model. Worse, a `memory_write` link
target with an omitted `scope` defaults to the writer's scope, so an id copied from another scope
silently pointed the edge at the wrong record.

Every item from `memory_search`, `memory_context` and `memory_read` now carries its address,
`id` + `scope`. The `memory_write` result carries `scope` beside its `id`. `handle` is the display
key only. The descriptions tell the model to copy `id` and `scope` from a result, which is correct
under a `handleFor` mnemonic too. The tool layer owns `id` and `scope`: the `projectItem` hook
returns the new `IMemoryToolItemProjection` and cannot drop or forge them. A record whose scope
cannot be resolved fails the call, and so does a store whose resolver throws.

## Files changed

- `libraries/ts-agent-memory/src/packlets/tools/memoryTools.ts`: types, projection, descriptions.
- `libraries/ts-agent-memory/src/test/unit/tools/memoryTools.test.ts`: new § "result items carry
  their scope", plus retyped test projectors.
- `libraries/ts-agent-memory/etc/ts-agent-memory.api.md`, `CAPABILITIES.md`, and a change file
  (`minor`, `BREAKING (implementers only):`).
- `.ai/tasks/active/personality-asks-2026-10/followups.md`: D3 and D7 marked shipped.

## Decisions made during execution

- `id` and `scope` are applied by the tool layer, after any host projection.
- The scope is resolved with a `captureResult`-wrapped `scopedAddressOf(record, store)`, and an
  unresolvable one fails loudly.
- The first build told the model to copy the `handle` as `id`. The deep review flagged that as a P2
  under `handleFor`, and the user's D7 decision replaced it with a tool-owned `id`.
- The write result gained `scope`; delete did not.
- The omitted-scope default is kept, as briefed.

## Followups

None open. D7 (links under a `handleFor` mnemonic), raised by this stream, shipped in it.

## Evidence

`result.md` covers the tests, the consumer sweep and the gate counts.
