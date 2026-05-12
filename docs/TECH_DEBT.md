# Tech Debt — fgv

Already-shipped imperfections. Priority-ranked; addressed
opportunistically when the right surface area is touched.

---

## Priority key

- **P1** — blocking / structural; address before resuming major feature work.
- **P2** — fix before the next major feature in the affected area.
- **P3** — opportunistic cleanup.
- **P4** — doc / minor consistency.

## Entry format

```markdown
- **[Pn] Title.**
  Description with file pointers.

  **Trigger**: when this should be addressed.

  **Scope sketch**: one-paragraph fix shape.

  **Not a P(n+1)**: why this priority and not lower.

  **Reference**: PR / commit / session context that surfaced it.
```

---

## P1 — Blocking

*(None.)*

## P2 — Fix before next major feature in affected area

- **[P2] `@fgv/ts-web-extras` is missing `eslint.config.js`; `rushx lint` fails for the whole package.**
  ESLint 10.x requires `eslint.config.(js|mjs|cjs)`; `libraries/ts-web-extras/` has neither it nor a legacy `.eslintrc*`. Running `rushx lint` exits 2 with `ESLint couldn't find an eslint.config...`. Every other monorepo package has the file. This means the per-stream pre-PR lint gate has been bypassed for any stream touching `ts-web-extras` (e.g. `crypto-batch-2-misc`, `crypto-batch-2-hpke`, `auth-primitives-batch1`). Per stream READMEs the failure was acknowledged as "pre-existing infrastructure gap" rather than fixed in-stream.

  **Trigger**: before the next stream that touches `ts-web-extras`; ideally before the next `release → main` promotion so we don't ship more code through an un-linted gate.

  **Scope sketch**: copy `eslint.config.js` from a sibling package (`ts-extras` is the closest analog — same browser-flavored content, same dev-deps). Verify `rushx lint` passes on the existing `ts-web-extras` source. Fix any newly-surfaced violations (these would have been there for some time; likely small). Optional: add a guard test or CI step that fails when any package's `rushx lint` exits non-zero, so the next time this happens it surfaces immediately.

  **Not a P1**: existing code shipped and downstream consumers integrate it; no production breakage today. P2 because it's an active gate-bypass — any new code landing in `ts-web-extras` is un-linted, which is exactly the failure mode the lint-gate codification (PR #337) was meant to prevent.

  **Reference**: surfaced in `crypto-batch-2-misc` stream README ("Pre-existing issues"); confirmed during `crypto-batch-2` cluster-close (PR #350).

- **[P2] Replace try/catch + instanceof-Error boilerplate in `ai-assist/apiClient.ts` with `captureAsyncResult`.**
  Four identical `catch (err: unknown) { const detail = err instanceof Error ? err.message : String(err); return fail(...detail...); }` blocks at lines ~158, 217, 272, 316. Each carries a `/* c8 ignore next 1 - defensive: fetch errors are always Error instances in practice */` directive to suppress the untestable catch branch — a signal that `captureAsyncResult()` is the right replacement. `captureAsyncResult` handles the `Error`-vs-string normalisation internally and makes the `c8 ignore` directives unnecessary.

  **Trigger**: next time `apiClient.ts` is open for substantive changes (e.g. adding a new provider).

  **Scope sketch**: wrap each `try { response = await fetch(...) } catch` block with `captureAsyncResult(() => fetch(...))`, then chain `.withErrorFormat((msg) => \`AI API request failed: ${msg}\`)`. The `c8 ignore` directives on the catch lines can be removed once the blocks are gone.

  **Not a P3**: the `c8 ignore` directives are suppressing real untestability; the boilerplate pattern appears four times and will grow with each new provider endpoint.

  **Reference**: PR #329 review — patterns pre-existed the PR, absolved from that review.

- **[P2] Cross-runtime entry-point export parity is not systematically tested.**
  Libraries with both Node (`src/index.ts`) and browser (`src/index.browser.ts`) entry points can drift in export names without CI catching it. api-extractor runs only on the Node entry point, so a typo or rename in the browser entry slips through. Pattern has bitten the team several times; most recent instance: `@fgv/ts-extras` exported `Crypto` instead of `CryptoUtils` from `index.browser.ts`, surfacing as `CryptoUtils.Keystore undefined` in the personaility web app. Fixed with a one-off test for that specific import; no general practice.

  Comprehensive per-export coverage on every library is too expensive given the API surface. The right scope is opportunistic per-library micro-tests.

  **Trigger**: anytime a library's `index.browser.ts` is touched substantively (new exports added, namespace renames, refactors). Also: anytime a cross-runtime export bug is reported, expand the affected library's micro-test rather than just patching the single export.

  **Scope sketch**: a tiny test file per library — `src/test/unit/browserEntry.test.ts` (or similar) — that imports from `index.browser.ts` and asserts the top-level exported names match a minimal expected list (the major namespaces, not every symbol). Renaming a Node export then breaks the browser test if the browser entry wasn't updated in lockstep. Per-library cost: ~15 lines. No commitment to backfill across all libraries; just add when the library's browser entry is touched.

  **Not a P3**: the pattern has recurred multiple times across the team; the consumer-impact cost (production-visible undefined exports) is real. P2 trigger ("next time the browser entry is touched") puts it on a natural cadence.

  **Reference**: bug reported via personaility web app integration; one-off test added in the fix PR (see `@fgv/ts-extras` browser entry).

## P3 — Opportunistic cleanup

- **[P3] New pure-library packages must declare `"sideEffects": false` in `package.json`.**
  Every `libraries/` package whose `src/index.ts` exports only functions and types (no module-level side effects) carries `"sideEffects": false` so bundlers can tree-shake it. This was caught in PR review on `crypto-batch-2-webauthn`: `@fgv/ts-extras-webauthn` was missing the field; `@fgv/ts-web-extras-webauthn` had it. Fixed in-stream, but the gap reveals a scaffolding-checklist hole — the standard "new package" template doesn't enforce it.

  **Trigger**: next stream that creates a new pure-library package, or next time someone refactors the scaffolding template / `rush.json` registration guide.

  **Scope sketch**: (a) audit existing `libraries/*/package.json` to confirm everyone has the field correctly set (one quick grep), and (b) add a line to the per-package scaffolding doc / convention note that flags `"sideEffects": false` as required alongside `"main"` and `"types"`. Optionally add a tiny test or pre-PR check that fails when a `libraries/` package is missing the field and has no module-level side effects.

  **Not a P2**: failure mode is "consumer bundle size slightly larger than necessary," not a functional regression.

  **Reference**: PR #347 review (crypto-batch-2-webauthn); lesson captured in `.ai/tasks/completed/2026-05/crypto-batch-2-webauthn/README.md` § L1.

- **[P3] `resolveImageCapability` in `ai-assist/registry.ts` returns `| undefined` instead of `Result<IAiImageModelCapability>`.**
  `registry.ts:328–339`. The function returns `undefined` when no capability matches `modelId`, silently swallowing the "unknown model" case. Callers must null-check rather than chain. Returning `Result<IAiImageModelCapability>` with a contextual error message would let callers propagate the failure cleanly.

  **Trigger**: next substantive change to the provider registry or capability resolution path.

  **Scope sketch**: change return type to `Result<IAiImageModelCapability>`; return `fail(\`model '${modelId}' not found in provider '${descriptor.name}' image capabilities\`)` when the reduce produces `undefined`; update call sites (primarily in `apiClient.ts`) to chain off the result.

  **Not a P2**: the function is currently only called in contexts that already handle `undefined` defensively; behaviour is correct, just non-idiomatic.

  **Reference**: PR #329 review — pattern pre-existed the PR, absolved from that review.

## P4 — Doc / minor consistency

*(None.)*
