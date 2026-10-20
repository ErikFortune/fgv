# State: `ts-utils-mapsuccess-partial-errors`

Worker-owned working surface. Brief is the contract.

## Progress

- [x] Setup: branch at e15b1d440, `rush install` clean.
- [x] Sibling sweep of `mapResults.ts` / `mapResultsAsync.ts` (see `result.md`).
- [x] Aggregator-caller sweep (`libraries/ tools/ samples/`).
- [x] Tests written, shown red against unfixed code.
- [x] Fix applied, tests green.
- [x] Docs (TSDoc, base README, CAPABILITIES).
- [x] Change file.
- [x] Gates.
- [x] Close-out.

## Notes

- The existing `mapSuccessAsync` test "appends errors to a supplied aggregator only when everything
  fails" pinned the bug and is replaced, not kept.

## Open questions

None. Gates green on 7662592b3; see result.md.
