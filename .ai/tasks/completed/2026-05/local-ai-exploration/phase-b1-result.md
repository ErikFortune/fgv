# Phase B-1 result: scaffold testbed + provisional facade packages

**Branch:** `claude/cool-bardeen-BdBSx` (cloud-agent harness branch; PR targets
`local-ai-exploration`).
**Status:** ✅ all acceptance gates green.

---

## What landed

Three new packages registered in `rush.json` and seeded with empty-but-compilable code:

| Package | Role | Surface at B-1 |
|---|---|---|
| `samples/testbed` (`@fgv/testbed`) | Long-lived sample browser app + CLI | shell contract, secretResolver stub, empty scenario registry, web shell composing ts-app-shell, CLI printing empty-registry banner, chocolate-lab data pipeline |
| `libraries/ts-extras-transformers` | Node Result-integration boundary over `@huggingface/transformers` | `PROVISIONAL_SCAFFOLD` sentinel only — primitives land in B-2 |
| `libraries/ts-web-extras-transformers` | Browser counterpart | same sentinel-only shape |

Rush change files (`type: none`) added under `common/changes/@fgv/` for all three packages.
Both transformers packages have generated `etc/<pkg>.api.md` reports.

---

## Decisions (stop-and-surface adjudicated)

The brief explicitly flagged three stop-and-surface triggers; all three needed orchestrator
adjudication before scaffolding could proceed. **Pre-scaffold AskUserQuestion** answers (locked
in this PR):

1. **Testbed rig: Heft dual-rig + webpack hybrid** (option a in the kickoff question).
   `samples/ai-image-gen-sample` (named reference) uses webpack-only with no tests — incompatible
   with the brief's 100%-coverage mandate. Adopted `@fgv/heft-dual-rig` (the rig
   `libraries/ts-app-shell` uses for its React tests) so heft handles TS compilation + lint + test
   + api-extractor, and a sibling `webpack.config.js` builds the browser bundle off the same
   sources. Diverges from the named reference but satisfies both the rig conventions of every
   other testable fgv package and the coverage gate.

2. **c8-ignore scope: entry points only.** `web/index.tsx` and the `if (require.main === module)`
   tail of `cli.ts` are ignored (orchestration glue with rationale comments). The data pipeline's
   generated artifact `src/generated/dataFileTree.ts` is also coverage-ignored (auto-generated).
   Everything else — `App.tsx`, `shell/index.ts`, `secretResolver.ts`, `scenarios/index.ts`, the
   testable `runTestbedCli` function — is at 100% across all four metrics.

3. **src layout: brief's nested form.** `src/web/` + `src/cli.ts` + `src/shell/` +
   `src/scenarios/` (with `src/generated/` for build-data output). Cleaner separation between
   web and CLI shells than the flat `src/main.tsx` form `ai-image-gen-sample` uses.

---

## Scaffolding surprises (worth recording before B-2)

### Heft test runs against `lib/`, not `src/`

The `@rushstack/heft-jest-plugin/includes/jest-shared.config.json` hardcodes
`"roots": ["<rootDir>/lib"]` and `"collectCoverageFrom": ["lib/**/*.{cjs,js}"]`. My initial
`coveragePathIgnorePatterns` pointed at `<rootDir>/src/web/index.tsx` and silently failed to
match anything — the entry-point file showed up at 77% coverage and broke the threshold. Fixed
by pointing at `<rootDir>/lib/web/index.js` instead. **B-2 / B-3 note:** any coverage-ignore
pattern in a heft project must reference compiled `lib/` paths, not source `src/` paths.

### `CryptoUtils.KeyStore` is both a sub-namespace and a class

The namespace path is `CryptoUtils.KeyStore.KeyStore` (sub-namespace `.KeyStore` containing
the class `.KeyStore` and its types). Using `CryptoUtils.KeyStore` as a type fails with
"refers to a value." Followed the pattern from `tools/ks/src/keystore.ts`. **B-3 note:** any
scenario reaching for `KeyStore` should use the doubly-qualified path or import the class
directly.

### React testing-library matchers without `@types/testing-library__jest-dom`

`@testing-library/jest-dom` extends matchers at runtime via `jest.setup.js` but the types
package isn't on the workspace and pulling it in just for the scaffold seemed unwarranted at
B-1. Tests use `.not.toBeNull()` against `getByTestId` / `getByText` returns instead of
`.toBeInTheDocument()`. Functionally equivalent; if B-3 scenarios prefer the jest-dom
matchers we can add the types package and switch.

### Lint rules `no-void` + `@typescript-eslint/naming-convention` + `@rushstack/typedef-var`

The combination forced specific code shapes:
- `noopSetMode(): undefined { return undefined; }` as a module-scope function (not
  `setMode: () => undefined` inline, which triggers `no-void` when combined with the typed
  callback signature).
- Underscore-prefixed parameters trip naming-convention; just made the noop take no params
  (a zero-arg function is assignable to `(mode: Mode) => void`).
- `const container` in `web/index.tsx` needs an explicit type annotation.

### Webpack bundle warnings

The bundle is 1.46 MiB. Inherited from the React + ts-app-shell composition; not actionable
at B-1. If B-3 scenarios introduce large model loaders we'll revisit with code-splitting.

---

## Acceptance gates

| Gate | Result |
|---|---|
| `rush install` clean | ✅ (rush update + install both clean after rush.json updates) |
| Full-repo `rush build` | ✅ (28 projects in ~2 minutes) |
| `rushx lint` clean (testbed, ts-extras-transformers, ts-web-extras-transformers) | ✅ |
| `rushx fixlint` run before final commit | ✅ |
| `rushx test` with 100% coverage in all three new packages | ✅ |
| api-extractor `etc/<pkg>.api.md` regenerated for both transformers packages | ✅ |
| Rush change files in `common/changes/@fgv/` for all three packages | ✅ |
| `phase-b1-result.md` written | ✅ (this file) |
| No `any` types; no manual casts; no `Result<void>` | ✅ |
| Webpack `build:web` succeeds | ✅ (1.46 MiB bundle with size warnings — not actionable at B-1) |
| `rushx build:data` runs cleanly on empty `data/` directory | ✅ (re-emits the same empty artifact) |
| Built CLI prints empty-registry banner | ✅ (`node bin/testbed.js` → `testbed CLI — no scenarios registered yet (B-1 scaffold)`) |
| Web shell renders empty-state cleanly in tests | ✅ (`@testing-library/react` confirms empty-state branches plus populated branches via test-injected scenarios) |

**Pre-existing failure (NOT caused by B-1):** `libraries/ts-json-base`'s
`FsFileTreeAccessors fileIsMutable returns permission-denied for read-only file` test fails
in the container's root-user environment (chmod -w doesn't restrict root). Confirmed
reproducible on a clean stash of the integration branch HEAD. Not part of this PR's surface;
flagging here for orchestrator visibility.

---

## Questions for B-2 (carried forward — OQ-1 / OQ-2 in `state.md`)

1. **OQ-1 facade signature shape.** The B-2 brief will need to lock the exact primitive
   surface (`loadPipeline`, `classify`, `embed`, possibly `generate`). The webauthn discipline
   suggests one-line `captureAsyncResult` wrappers per upstream method, but
   `@huggingface/transformers` exposes a small number of factory functions (`pipeline()`,
   `AutoTokenizer`, `AutoModel`, ...) that return objects with methods — so the
   one-wrapper-per-call shape may be 5–8 wrappers each returning a thin handle plus a couple
   of method-shaped wrappers. The B-3 scenario (local classifier as IPromptSafetyPolicy backend)
   should drive the exact set.

2. **OQ-2 opaque handle vs upstream `Pipeline` reference.** Recommendation from B-1 vantage:
   start with the thinnest possible boundary — return the upstream `Pipeline` directly. If
   the B-3 scenario reads cleaner with an opaque handle (e.g. to forbid escape hatches in
   sample code), we tighten before B-4a.

3. **Browser vs Node behavior differences.** `@huggingface/transformers` runs in both with
   different backends (ONNX runtime web vs node). Either the Node + browser packages share
   identical TS surfaces (and the runtime difference is invisible to consumers — preferred), or
   they diverge in a way the B-2 brief documents.

4. **KeyStore-on-web wiring.** The brief locks `FileApiTreeAccessors.createFromLocalStorage(...)`
   as the chocolate-lab-pattern web KeyStore host. `secretResolver.ts` is a stub at B-1; the
   first scenario that needs secrets (probably not B-3 itself if the local classifier needs no
   external API key, but B-4a if a second scenario type compares against a cloud LLM) will pull
   this implementation in. Worth deciding in the B-3 sub-brief whether resolveSecret
   implementation lands in B-3 or is deferred again.
