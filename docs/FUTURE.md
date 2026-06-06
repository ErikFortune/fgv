# Future / Parking Lot

Items here are not committed to any stream or sprint. They are recorded so they are not forgotten, but their priority and timing are uncertain.

---

## Browser-bundle canary for tree-shaking / node-barrel correctness

**Priority:** Uncertain / parking lot — not committed  
**Added:** 2026-06-06 (chore/deps-security-sweep-drop-browser-test)

### Background

`apps/ts-utils-browser-test` was a Vite-based app that imported `@fgv/ts-utils` in a browser-bundle context, providing a lightweight smoke test that the library contained no accidental `node:`-only barrel deps (e.g. `node:crypto`, `node:fs`). It was deleted as part of the June 2026 dependency-security sweep for three reasons:

1. Its test half (`test/app.test.ts`) never ran in CI — the test runner was configured but the CI pipeline never invoked it.
2. It generated recurring Dependabot noise (Vite, its peer deps, and transitive tooling) disproportionate to its actual coverage value.
3. It pointed at `@fgv/ts-utils`, which is a pure-computation library with no node-only barrel leaks of its own; the risk it was guarding against was low.

### What was lost

A CI browser-bundle (Vite) smoke test of `@fgv/ts-utils`. This is the narrowest possible target: `ts-utils` has no `node:*` imports and no platform-split entry points.

### Recommendation if revived

**Target `@fgv/ts-extras` and `@fgv/ts-web-extras` instead.** These are the libraries where a browser-bundle canary provides real value:

- `@fgv/ts-extras` contains `NodeCryptoProvider` (which imports `node:crypto`), file-system helpers (which import `node:fs`), and other Node-only code. A misplaced barrel export would cause a browser bundle to explode at runtime.
- `@fgv/ts-web-extras` is the browser complement and its correctness depends on `@fgv/ts-extras` not bleeding Node-only code into the shared surface.

A future canary should:
- Build a minimal Vite (or webpack) bundle importing `@fgv/ts-extras` and `@fgv/ts-web-extras` browser-safe entry points.
- Assert the bundle succeeds without `node:*` polyfill errors.
- Actually run in CI (do not add it if the pipeline step cannot be wired up).
- Live in a `tools/` or `apps/` package that is excluded from the publishable version policy so it does not generate change-file noise.
