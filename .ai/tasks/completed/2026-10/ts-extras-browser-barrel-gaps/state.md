# State — `ts-extras-browser-barrel-gaps`

Worker-owned working surface.

## Decisions and disagreements with the brief

- **Belief 2 is refuted by execution** (see `result.md`). `CryptoUtils.Constants` already resolves in the
  browser entry: `crypto-utils/model.ts` exports `Constants` and the browser barrel does
  `export * from './model'`. No `Constants` change was made, and the individual constant exports in the
  browser barrel were left alone.
- **The worktree was not at the stated base.** It was created at `c20ae3a8`, not `b409ba3c`, so the brief
  was absent. I ran `git reset --hard b409ba3c` on the (clean, own-branch) worktree before starting.
- **Guard chosen: (a) namespace-member parity, plus a small (b)-shaped suite.** Candidate (b) as briefed
  (map `@fgv/ts-extras` to the browser entry for the whole `ts-web-extras` suite) is feasible but cannot
  be the permanent config: 8 tests compare `BrowserCryptoProvider` against `NodeCryptoProvider`, which
  the browser entry does not export. Run once as an experiment, then reverted.
- **Candidate (c) rejected** (static scan), **(d) rejected** (heavier than the class warrants).
- Browser-entry resolution under jest is not governed by the `exports` map: with no mapping, jest
  resolved `@fgv/ts-extras` to the Node entry (the pre-fix suite passed with the miss in place).

## Sweep

Re-run with a TypeScript AST walk, value positions only, over non-test `ts-web-extras/src`, resolved
against the built browser entry. Only `CryptoUtils.fromBase64Strict` (2 sites) is missing.

## Open

- The `personality-intake` inbox file for #648 is under `completed/` and was not edited; the orchestrator
  owns dispositioning it.
