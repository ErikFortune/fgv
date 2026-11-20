# agent-memory-merge-scope: scope-qualified identity in `ScoreUnionMergeStrategy`

**Shipped**: 2026-10-17 into `integration/asks`. The PR number goes in `meta.yaml` when the PR is
opened. Package: `@fgv/ts-agent-memory`, plus a consumer update in `samples/testbed`.

## Summary

[fgv#725](https://github.com/ErikFortune/fgv/issues/725): the hybrid retriever's reference merge
deduplicated and scored records by bare `envelope.id`. The MTM codec mints `turn-<n>` under every
conversation, so distinct turns collapsed into one record and their scores mixed, silently.

The merge now keys on the record's scope-qualified `(scope, id)` address. The scope is resolved
through a required `identityResolver`, normally the store. A record whose identity cannot be
resolved fails the merge. The new `scopedAddressOf` helper is the single construction of "the
address of a loaded record", shared with the ingest orchestrator.

## Files changed

- `libraries/ts-agent-memory/src/packlets/retrieve/hybridRetriever.ts`: the strategy, its
  params, and TSDoc.
- `libraries/ts-agent-memory/src/packlets/types/identityResolver.ts`: `scopedAddressOf`.
- `libraries/ts-agent-memory/src/packlets/ingest/orchestrator.ts`: `_scopeRecords` now goes through
  the helper.
- Tests:
  - new `test/unit/retrieve/scoreUnionMergeStrategy.test.ts`;
  - new helper `test/helpers/storeIdentityResolver.ts`;
  - three existing suites updated.
- `samples/testbed/src/scenarios/memoryToolsGate/index.ts`.
- `etc/ts-agent-memory.api.md`, `CAPABILITIES.md`, and a change file.

## Decisions made during execution

- The helper takes the resolver as a parameter and leaves failures unformatted. Ingest therefore
  keeps its own codec map and exact error text.
- The merge wraps the injected resolver in `captureResult`.
- `scopedAddressOf` is public. It is the only way `retrieve` and `ingest` can share it, and
  consumers face the same question.

## Followups

None opened. `result.md` reports two out-of-scope findings for the orchestrator:
`verifyRoundTrip` tightening, and the agent-visible handle.

## Evidence

`result.md` covers the belief verdicts, the neutralize-and-confirm record, the consumer sweep and the
gate counts.
