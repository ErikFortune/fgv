# Brief: `memory-search-scope`: tool result items carry their scope

This brief is orchestrator-owned and frozen at kickoff. Put questions in `state.md`.

**Origin:** followup D3 and user decision 2, 2026-10-18 (followups § "Decisions, 2026-10-18", amended at brief time).
**Base:** `integration/asks` at `b90de8b2b` or later. **PR target:** `integration/asks`. This stream is independent of the JSON-schema streams.

## Problem

`createMemoryTools` result items (`IMemoryToolResultItem`, `libraries/ts-agent-memory/src/packlets/tools/memoryTools.ts`) carry a `handle`. Without `handleFor`, that handle is the bare `envelope.id`, and items carry no scope.
- Two records with the same id in different scopes (turn-3 in two conversations) are indistinguishable to the model.
- `memory_write` link targets are `{ id, scope? }`, and an omitted `scope` defaults to the **writer's** scope. So a model that copies a result's id into a link to a record in another scope points the edge at the wrong record, silently.

## Decision

The user approved a scope-qualified handle. **Amended here**: link targets are already structured, so a single qualified *string* would be pasted into `id` and break. Instead:
- Every result item from every memory tool that returns records gets `scope: string`, the record's scope key.
- The default `handle` stays the id, and `handleFor` is unchanged.
- The `memory_write` link-target schema description and the search tool description tell the model to copy **both** `id` and `scope` from a result into a link target.
- The lookup tool with the same `{ id, scope }` shape (around `memoryTools.ts:259`) gets the same treatment.
- Keep the default "omitted scope means the writer's scope" behaviour: it is correct for same-scope links, and the descriptions now give the model the field it needs.
- If you find a reason that defaulting is still unsafe, raise it in `state.md` rather than changing it.
- Any host `projectItem` hook: decide whether `scope` is always added by the tool layer or left to the hook. The safe default is that the tool layer always adds it, so a hook cannot drop it. Document the choice.

## Acceptance

- [ ] Tests:
  - two same-id records in different scopes come back distinguishable;
  - a write that links using a copied `{ id, scope }` targets the other scope's record;
  - the default-scope behaviour still holds when `scope` is omitted;
  - the projection hook cannot remove `scope`, if that is the choice.
- [ ] Sweep: consumers of `IMemoryToolResultItem` across `libraries/`, `samples/` and `tools/`, including test doubles and the testbed `memoryToolsGate` scenario. List them in `result.md`.
- [ ] Docs: `ts-agent-memory` `CAPABILITIES.md`; tool descriptions; mark followup D3 shipped (`#TBD`).
- [ ] Change file: `minor`. Use `BREAKING:` only if the item type change breaks implementers.
- [ ] Gates:
  - package build, lint and test (100%);
  - `fixlint`;
  - repo-wide `rebuild` and `test`, because the item shape widens and tests downstream may pin it;
  - `change --verify --target-branch origin/integration/asks`, `verify-capability-docs`, the feed `--check`;
  - prettier 2.8.
- [ ] Close-out: as usual.

## Mechanics

As before. Push only to `memory-search-scope`. No sub-agents.
