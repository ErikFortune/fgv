# The three webpack apps are never type-checked, and two of them do not compile

**Severity:** discovered while reconciling the `moduleResolution` overrides (D2). The reconciliation
landed; this is what it exposed.

## What they are

`tools/ts-res-browser`, `tools/ts-res-ui-playground`, and `apps/sudoku` are the repo's three
freestanding tsconfigs — the ones the brief flagged as disagreeing about `moduleResolution` (two
`node`, one `bundler`, none saying why). All three are webpack apps with `"noEmit": true`, so the
tsconfig is only ever a type-check config.

All three compile TypeScript with **`babel-loader`**, which strips types and performs **no type
checking**. Their `build` script is bare `webpack --mode production` — Heft's TypeScript plugin never
runs. So nothing in `rush build` or `rush test` ever type-checks these projects.

## What that hides

Running `tsc --noEmit` directly:

| project | errors |
|---|---:|
| `tools/ts-res-browser` | 0 |
| `tools/ts-res-ui-playground` | **22** |
| `apps/sudoku` | **13** |

These are pre-existing and unrelated to the `moduleResolution` change — verified by running
`ts-res-ui-playground` under both `node` and `bundler`: **22 errors either way.** They are ordinary
API drift and hygiene:

- `IConfigInitFactory` no longer exported by `@fgv/ts-res`'s `qualifier-types` namespace
- `ViewStateTools.Message` renamed to `IMessage`; `GridTools.GridViewInitParams` → `IGridViewInitParams`
- `IUserLogReporter` has no `warning` property (sudoku)
- `ConsoleLogger` not assignable to `ILogReporterCreateParams` (sudoku)
- unused locals, and `@testing-library/react` / `user-event` missing from `apps/sudoku`'s deps

## Why it matters here

The stream's premise is that the compiler should be made to catch packaging and resolution mistakes.
In these three projects the compiler is not running at all, so **whatever `moduleResolution` they
declare is decorative**. D2's reconciliation (all three now `bundler`, with the reason recorded) is
correct and worth keeping — `bundler` is what webpack actually does — but it buys nothing until
something type-checks them.

## Suggested follow-up (own stream)

1. Add a type-check step to each project's `build` (either `tsc --noEmit` as a pre-step, or
   `fork-ts-checker-webpack-plugin`).
2. Fix the 35 errors that step will surface.

Order matters: adding the step first turns `rush build` red, so the fixes and the gate should land
together.
