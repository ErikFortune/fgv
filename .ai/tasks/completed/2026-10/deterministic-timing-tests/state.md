# State: `deterministic-timing-tests`

Worker-owned. Status: **complete**, pushed to `deterministic-timing-tests`. No PR was opened, per the kickoff.

## Base

- `215ee1046`, verified at checkout.
- `origin/integration/asks` (`84fc3cef4`) was already an ancestor, so no merge was needed.

## Gate record

Logs are in the worker's scratchpad `dtt/` directory.

| gate | result |
|---|---|
| `rushx build` / `lint` / `test` in `ts-extras` | build and lint exit 0; test: 3203 passed, 0 failed, coverage met (`not met` 0), warnings 0 |
| the same three in `ts-extras-mcp` | build and lint exit 0; test: 279 passed, 0 failed, coverage met, warnings 0 |
| the same two suites during a parallel rebuild, run twice | both runs green at load average 23–27 on 4 cores; see `result.md` |
| `rush change --verify --target-branch origin/integration/asks` | passes; both change files are found |
| prettier 2.8.8, `common/autoinstallers/rush-prettier` | `--check` clean after one `--write` on `oauth.test.ts` |
| repo-wide `rebuild` (`install-run-rush.js rebuild`) | exit 0, 38/38 projects completed; 0 errors; the only warning is the symlink notice; no NUL padding |
| repo-wide `test` | 36 completed, 1 failed: `@fgv/ts-res-cli` integration "test consistent output by building same input twice" hit Jest 5 s timeout (spawns the CLI twice; outside this diff, load average ~20 on 4 cores). Re-run alone: 67 passed, 0 failed, coverage met. Otherwise the only warning is the symlink notice; no NUL padding. Known load-sensitive, reported, not fixed |
| `api.md` | unchanged; the diff touches no `src/packlets` file |

## Open questions for the orchestrator

1. **`terminate.test.ts`** keeps its wall-clock bounds. It is the follow-up listed in `result.md`.
2. **The out-of-package sweep findings** (`ts-res`, `ts-sudoku-lib`) are reported, not fixed, as the brief directs.
3. **`ts-res-cli` `cli-configuration.test.ts`** (spawns the CLI twice inside the default 5 s Jest timeout) failed once under load in the repo-wide test gate and passed alone. It is a new load-sensitive candidate, outside the sweep (`tools/`, not `libraries/`).
