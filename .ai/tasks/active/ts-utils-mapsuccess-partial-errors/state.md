# State: `ts-utils-mapsuccess-partial-errors`

Worker-owned working surface. Brief is the contract.

## Progress

- [x] Setup: branch at e15b1d440, `rush install` clean.
- [x] Sibling sweep of `mapResults.ts` / `mapResultsAsync.ts` (see `result.md`).
- [x] Aggregator-caller sweep (`libraries/ tools/ samples/`).
- [ ] Tests written, shown red against unfixed code.
- [ ] Fix applied, tests green.
- [ ] Docs (TSDoc, base README, CAPABILITIES).
- [ ] Change file.
- [ ] Gates.
- [ ] Close-out.

## Notes

- The existing `mapSuccessAsync` test "appends errors to a supplied aggregator only when everything
  fails" pinned the bug and is replaced, not kept.

## Open questions

None.
