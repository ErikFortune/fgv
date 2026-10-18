# memory-search-scope: memory tool result items carry their scope

**Shipped**: 2026-10-18 into `integration/asks`. The PR number (#TBD) goes in `meta.yaml` when the
PR is opened. Package: `@fgv/ts-agent-memory`.

## Summary

Followup D3, user decision 2 of 2026-10-18. `createMemoryTools` result items carried a `handle`,
which by default is the bare `envelope.id`, and no scope. Two same-id records in different scopes
(turn-3 in two conversations) were indistinguishable to the model. Worse, a `memory_write` link
target with an omitted `scope` defaults to the writer's scope, so an id copied from another scope
silently pointed the edge at the wrong record.

Every item from `memory_search`, `memory_context` and `memory_read` now carries `scope`, and so does
the `memory_write` result. The descriptions tell the model to copy both the `handle` (as `id`) and
the `scope`. The tool layer owns `scope`: the `projectItem` hook returns the new
`IMemoryToolItemProjection` and cannot drop or forge it. A record whose scope cannot be resolved
fails the call.

## Files changed

- `libraries/ts-agent-memory/src/packlets/tools/memoryTools.ts`: types, projection, descriptions.
- `libraries/ts-agent-memory/src/test/unit/tools/memoryTools.test.ts`: new § "result items carry
  their scope", plus retyped test projectors.
- `libraries/ts-agent-memory/etc/ts-agent-memory.api.md`, `CAPABILITIES.md`, and a change file
  (`minor`, `BREAKING (implementers only):`).
- `.ai/tasks/active/personality-asks-2026-10/followups.md`: D3 marked shipped.

## Decisions made during execution

- `scope` is applied by the tool layer, after any host projection.
- It is resolved with `scopedAddressOf(record, store)`, and an unresolvable one fails loudly.
- The write result gained `scope`; delete did not.
- The omitted-scope default is kept, as briefed.

## Followups

None opened. `result.md` reports one for the orchestrator: with a `handleFor` mnemonic, a model
cannot author a correct link or seed from a result, because the handle is not an id.

## Evidence

`result.md` covers the tests, the consumer sweep and the gate counts.
