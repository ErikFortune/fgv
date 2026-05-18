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

*(none currently outstanding — the `ts-prompt-assist` validator-chain caller-controlled `T` cluster was fully retired by the surface-tidy round, which split `resolveAndValidateOutput<T>` into `resolveJsonOutput<K>` + `resolveFreeTextOutput` and replaced the remaining caller-asserted-`T` boundary with a runtime-evidenced kind check.)*

## P2 — Fix before next major feature in affected area

- **[P2] `ts-prompt-assist` (and adjacent `ts-res` qualifier surface) needs an API documentation pass once the v0.1 surface settles.**
  PR #380 review surfaced that the recently-extended `ts-prompt-assist` surface — `PromptLibrary` + `IPromptLibraryCreateParams` + `IPromptResolveRequest` + the related fixture / resource-binding / resolve-output types — carries minimal TSDoc on individual methods, parameters, and return shapes. The v0.1 surface has been moving fast (Phase B sub-phases + post-merge cleanups + surface-tidy + round-1 ergonomics absorption), so documenting heavily during churn was the right call; with v0.1 effectively settled now, the next concern is consumer-facing TSDoc quality on the public surface.

  A related pattern Erik flagged in the same PR #380 review: **inline anonymous types + union types should be extracted to named `type` / `interface` declarations** so they have a single place to attach TSDoc. The library currently has a few patterns like `qualifiers: IReadOnlyQualifierCollector | ReadonlyArray<TAxes | (IQualifierDecl & { readonly name: TAxes })>` that would benefit from a named extracted type.

  **Trigger**: post-round-2 pressure-test, once the consumer port (agent chat application) confirms the surface is stable. Don't run this during cluster-close — let the round-2 absorption settle first so the docs don't have to be rewritten after.

  **Scope sketch**: commission a documentation-pass agent against `@fgv/ts-prompt-assist`'s public surface (and any new `@fgv/ts-res` qualifier surface from PR B). For each exported type / class / method:
  - Audit TSDoc presence + quality (does it answer "why" not just "what"; do `@public` symbols have useful `@remarks`).
  - Extract inline anonymous types + unions to named declarations where extraction creates a meaningful single-attach-point for documentation.
  - Cross-link related types via `{@link}` directives.
  - Run api-extractor; verify all `// @public` types have non-`(undocumented)` flags.

  Compare quality bar to `@fgv/ts-utils`'s base packlet, which is the reference for documentation depth.

  **Not a P3**: the surface is public alpha-stage and being consumed; opaque type signatures degrade the consumer-port experience materially. P2 trigger ("post-round-2 stable") puts it on a natural cadence.

  **Not a P1**: no functional gap; the surface works; this is documentation polish on shipped code.

  **Reference**: PR #380 (round-1 ergonomics PR C) — Erik's review surfaced both the doc gap and the inline-types pattern. Cluster spans `libraries/ts-prompt-assist` + the `ts-res` qualifier collector surface PR B extended.

- **[P2] `@fgv/ts-web-extras` lint content cleanup (config landed; 126 source violations remain).**
  Local sweep (chore/comprehensive-lint-fix) added the missing `eslint.config.js` to three sibling packages (`ts-http-storage`, `ts-random`, `tools/repo-template`) which all pass clean. Adding the same config to `ts-web-extras` surfaces **126 problems (6 errors + 120 warnings)** that were hidden while the config was missing. The config addition for `ts-web-extras` is therefore being held back until the source violations are resolved; the package continues to bypass the lint gate in the meantime.

  Rule-violation breakdown:
  | Rule | Count | Character |
  |---|---|---|
  | `@typescript-eslint/naming-convention` | 52 | DOM-mirror interfaces in `file-api-types/` (`FileSystemHandle`, `FileSystemFileHandle`, `FileSystemDirectoryHandle`, etc.) + test `Mock*` types missing `I` prefix |
  | `@typescript-eslint/no-explicit-any` | 24 | Real `any` types in fileApiTreeAccessors / fileSystemAccessTreeAccessors / mocks — repo-banned |
  | `@typescript-eslint/explicit-member-accessibility` | 17 | Missing `public` / `private` modifiers |
  | `@rushstack/typedef-var` | 8 | Missing type annotations |
  | `@typescript-eslint/no-unused-vars` | 7 | Mechanical cleanup |
  | `@rushstack/no-new-null` | 6 | File API mirrors that use `null` (browser convention) |
  | `no-void` | 4 errors | `return void x` pattern; mechanical fix |
  | `require-yield` | 2 | Likely async-generator issues |
  | `@rushstack/packlets/mechanics` | 2 | Packlet boundary |
  | `import/no-internal-modules` | 1 error | Plugin rule definition missing — config-side fix |
  | `require-atomic-updates` | 1 error | `globalThis.fetch = ...` race condition flag in tests; needs human review |
  | Other | 2 | `prefer-const`, `typedef` |

  **Trigger**: next time `ts-web-extras` is open for substantive changes, or before the next `release → main` promotion (so we don't keep shipping un-linted browser-side code).

  **Scope sketch**: three policy questions to adjudicate before mechanical work:
  1. **DOM-mirror naming.** The 3 DOM-mirror interfaces in `file-api-types/` intentionally match browser API names. Recommend: scoped rule override for that file rather than rename. Per CODING_STANDARDS, surface to orchestrator before disabling.
  2. **`no-explicit-any` (24 violations).** These violate the repo's "absolute and non-negotiable" Priority-1 rule. Genuine fixes required (likely `unknown` + cast in test mocks; real types in production adapters).
  3. **Test-file `Mock*` interface names.** Either rename (mechanical) or apply a test-file-scoped override.

  After adjudication, mechanical fixes for the rest are straightforward (4× `no-void`, 17× missing accessibility, 8× missing typedefs, 7× unused vars, 1× `prefer-const`, etc.). The `require-atomic-updates` and `import/no-internal-modules` errors need individual investigation.

  **Not a P1**: shipped code; no production breakage; downstream consumers integrate it. P2 because the gate is actively bypassed for browser-side changes.

  **Reference**: PR #353 (this stream) added the three sibling configs and confirmed scope; original P2 entry from PR #350 (cluster close) reframed.

- **[P2] Replace try/catch + instanceof-Error boilerplate in `ai-assist/apiClient.ts` with `captureAsyncResult`.**
  Four identical `catch (err: unknown) { const detail = err instanceof Error ? err.message : String(err); return fail(...detail...); }` blocks at lines ~158, 217, 272, 316. Each carries a `/* c8 ignore next 1 - defensive: fetch errors are always Error instances in practice */` directive to suppress the untestable catch branch — a signal that `captureAsyncResult()` is the right replacement. `captureAsyncResult` handles the `Error`-vs-string normalisation internally and makes the `c8 ignore` directives unnecessary.

  **Trigger**: next time `apiClient.ts` is open for substantive changes (e.g. adding a new provider).

  **Scope sketch**: wrap each `try { response = await fetch(...) } catch` block with `captureAsyncResult(() => fetch(...))`, then chain `.withErrorFormat((msg) => \`AI API request failed: ${msg}\`)`. The `c8 ignore` directives on the catch lines can be removed once the blocks are gone.

  **Not a P3**: the `c8 ignore` directives are suppressing real untestability; the boilerplate pattern appears four times and will grow with each new provider endpoint.

  **Reference**: PR #329 review — patterns pre-existed the PR, absolved from that review.

- **[P2] Cross-runtime entry-point export parity is not systematically tested.**
  Libraries with both Node (`src/index.ts`) and browser (`src/index.browser.ts`) entry points can drift in export names without CI catching it. api-extractor runs only on the Node entry point, so a typo or rename in the browser entry slips through. Pattern has bitten the team three times: `@fgv/ts-extras` exported `Crypto` instead of `CryptoUtils` (personaility web app); `@fgv/ts-extras` missed `Yaml` entirely (ts-prompt-assist sample app, fixed in #377); plus the earlier `repo-template` issue. **`@fgv/ts-extras` now has the recommended micro-test** (`src/test/unit/index.browser.test.ts` asserts every top-level name in `index.ts` is also in `index.browser.ts`); other libraries with browser entries still need it.

  Comprehensive per-export coverage on every library is too expensive given the API surface. The right scope is opportunistic per-library micro-tests.

  **Libraries with `*.browser.ts` entries that still need the micro-test:** `ts-bcp47`, `ts-res`, `ts-web-extras`, `ts-app-shell`, `ts-res-ui-components`, `ts-json`, `ts-json-base`, `ts-sudoku-lib`, `ts-sudoku-ui`.

  **Trigger**: anytime one of those libraries' `index.browser.ts` is touched substantively (new exports added, namespace renames, refactors). Also: anytime a cross-runtime export bug is reported, expand the affected library's micro-test rather than just patching the single export.

  **Scope sketch**: copy the pattern from `@fgv/ts-extras/src/test/unit/index.browser.test.ts` — imports both `index.ts` and `index.browser.ts` directly via relative paths, asserts every top-level name exported from Node is also exported from browser. Browser may have additional names (e.g. back-compat aliases) but nothing Node ships may go missing on browser. Per-library cost: ~15 lines.

  **Not a P3**: the pattern has recurred multiple times across the team; the consumer-impact cost (production-visible undefined exports) is real. P2 trigger ("next time the browser entry is touched") puts it on a natural cadence.

  **Reference**: PR #377 (ts-extras Yaml fix + micro-test pattern landed); original L13 lessons-pending entry; earlier ts-extras `Crypto` bug.

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
