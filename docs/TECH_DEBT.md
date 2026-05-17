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

*(none currently outstanding — the `ts-prompt-assist` validator-chain caller-controlled `T` cluster was reduced to P2 by the B-4 cast-removal cleanup; only the free-text-branch typed lie remains, downgraded.)*

## P2 — Fix before next major feature in affected area

- **[P2 — was P1; reduced by B-4 cast-removal cleanup] `resolveAndValidateOutput<T>` free-text branch returns a typed lie.**
  `libraries/ts-prompt-assist/src/packlets/resolve/promptLibrary.ts` returns `succeed(rawOutput as unknown as T)` on the free-text branch. With the default `TResponse = { kind: string }`, callers literally cannot supply `T = string` — they receive a `Result<{ kind: string }>` whose runtime is a string; any consumer dereferencing `.kind` on the returned value hits `undefined`. Design §8 specifies the cast and §17.2.6 says consumers shouldn't parameterize for free-text, but the type signature is still lying. (Flagged by Copilot on PR #369.)

  **Why P2 now**: items (1) and (2) of the original P1 cluster — `ConverterRegistry.get<T>` no-kind overload and the pipeline-feeds-uncheck-`T`-to-`fencedStringifiedJson` hole — were resolved by the B-4 cast-removal cleanup PR. `IPromptConverterRegistry.get` is now `get<K extends TResponse['kind']>(id, kind: K): Result<Converter<Extract<TResponse, {kind: K}>>>` (kind required; no caller-asserted T; distributed-discriminated-union storage so the lookup is cast-free internally), and `runOutputValidationPipeline` uses `getKind(id).onSuccess(kind => get(id, kind))` to dispatch with runtime-verified kind. The JSON path's belt + suspenders both fire end-to-end; only the free-text path's typed lie remains.

  **Trigger**: before the consumer port (agent chat application) exercises free-text output where the caller specifies a non-`string` `T`. In practice consumers usually want `Result<string>` from a free-text descriptor — so an API split is the right move.

  **Scope sketch**: split the public surface. `resolveAndValidateOutput` is two operations — free-text returns `Result<string>` (no `TResponse` involvement), JSON returns `Result<Extract<TResponse, {kind: K}>>` keyed by the descriptor's declared converter kind. Either introduce overloads, or split into `resolveAndValidateJsonOutput<K>` + `resolveAndValidateFreeTextOutput`. Binding-design amendment to §8 + §17.2.6 either way.

  **Reference**: PR #369 review (Copilot); B-4 cast-removal cleanup (resolves items 1+2) retained the §8 free-text cast verbatim — it's the one surviving caller-asserted-`T` boundary in the library.

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
  Libraries with both Node (`src/index.ts`) and browser (`src/index.browser.ts`) entry points can drift in export names without CI catching it. api-extractor runs only on the Node entry point, so a typo or rename in the browser entry slips through. Pattern has bitten the team several times; most recent instance: `@fgv/ts-extras` exported `Crypto` instead of `CryptoUtils` from `index.browser.ts`, surfacing as `CryptoUtils.Keystore undefined` in the personaility web app. Fixed with a one-off test for that specific import; no general practice.

  Comprehensive per-export coverage on every library is too expensive given the API surface. The right scope is opportunistic per-library micro-tests.

  **Trigger**: anytime a library's `index.browser.ts` is touched substantively (new exports added, namespace renames, refactors). Also: anytime a cross-runtime export bug is reported, expand the affected library's micro-test rather than just patching the single export.

  **Scope sketch**: a tiny test file per library — `src/test/unit/browserEntry.test.ts` (or similar) — that imports from `index.browser.ts` and asserts the top-level exported names match a minimal expected list (the major namespaces, not every symbol). Renaming a Node export then breaks the browser test if the browser entry wasn't updated in lockstep. Per-library cost: ~15 lines. No commitment to backfill across all libraries; just add when the library's browser entry is touched.

  **Not a P3**: the pattern has recurred multiple times across the team; the consumer-impact cost (production-visible undefined exports) is real. P2 trigger ("next time the browser entry is touched") puts it on a natural cadence.

  **Reference**: bug reported via personaility web app integration; one-off test added in the fix PR (see `@fgv/ts-extras` browser entry).

## P3 — Opportunistic cleanup

- **[P3] `ts-prompt-assist` rejected-resolve safeguard findings can't ride the trace.**
  Design §9 #1/#2 specifies that `max-length` and `suspicious-pattern` findings "are recorded in `trace.safeguardFindings`" even when the resolve rejects. The implementation cannot: a `Result.fail` doesn't return an `IResolvedPrompt`, so there is no trace to attach to. The finding's content is surfaced in the fail message instead, and the local push that would have built up the finding is omitted (PR #369 Copilot review flagged the dead push). The contract is therefore "warn-disposition findings ride the trace; reject-disposition findings ride the fail message."

  **Trigger**: when v0.2 introduces `DetailedFailure`-shaped resolve returns OR when a consumer needs structured access to rejected findings (the agent-chat consumer port might surface this).

  **Scope sketch**: either (a) switch `resolve` to return `DetailedResult<IResolvedPrompt, IRejectedResolveDetail>` where `IRejectedResolveDetail` carries `partialTrace` including findings — additive, doesn't break existing `Result<IResolvedPrompt>` consumers via `.asResult`; or (b) accept the current "fail-message only" contract and amend design §9 to match. Either way is a design-level decision; don't change unilaterally.

  **Not a P4**: the design wording is currently contradicted by the implementation, which is a genuine spec mismatch — not just polish.

  **Reference**: PR #369 Copilot review threads at `safeguardEngine.ts:93` and `safeguardEngine.ts:203`.



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
