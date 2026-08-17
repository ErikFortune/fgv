# `@fgv/ts-utils` imports `jest-snapshot/build`, a subpath the package does not export

**Severity:** real violation, currently latent. The one genuine defect the compiler sweep found.
**Status: FIXED in this stream** (`0d1700513`) - see § Fix.

## The imports

```ts
// libraries/ts-utils/src/test/helpers/jest/matchers/toFailTestAndMatchSnapshot/index.ts:6
// libraries/ts-utils/src/test/helpers/jest/matchers/toSucceedAndMatchInlineSnapshot/index.ts:4
import { Context } from 'jest-snapshot/build';
```

`jest-snapshot`'s manifest exposes exactly two subpaths:

```json
"exports": { ".": { "types": "./build/index.d.ts", "default": "./build/index.js" },
             "./package.json": "./package.json" }
```

`./build` is not among them. Confirmed at runtime, not inferred:

```
$ node -e "require('jest-snapshot/build')"
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './build' is not defined by
  "exports" in .../node_modules/jest-snapshot/package.json
```

## Why it has never fired

`Context` is used only as a type. TypeScript erases the import, so neither emit contains it:

```
lib/.../index.js:6:   const jest_snapshot_1 = require("jest-snapshot");   <- the sibling value import
dist/.../index.js:4:  import { toMatchSnapshot } from 'jest-snapshot';    <- same
```

No `require("jest-snapshot/build")` is emitted in either tree. The specifier exists only in source
and in the `.d.ts`.

## Why it is still a defect

- The compiler permits it **only** because node10 does not read `exports`. Any move off node10 makes
  it a hard error — it is one of the three errors surviving the repo-wide sweep.
- A `.d.ts` consumer resolving with exports-aware resolution will fail on it.
- Adding one value import from that specifier — a one-word edit — turns a green build into a runtime
  crash, with nothing in CI positioned to catch it.

## Fix

`Context` is exported from the package root. `import { Context } from 'jest-snapshot';` should
suffice; verify against the installed version's `build/index.d.ts` re-exports before changing it.
Two files, both under `src/test/helpers/`.

**Fixed** rather than deferred, on the owner's call - it is two lines, and the exports-aware
type-check over `ts-utils` now reports zero errors where it previously reported the two TS2307s.

**Then fixed again, properly.** The first pass merged `Context` into the existing *value* import
(`import { Context, toMatchSnapshot }`). Copilot flagged that `Context` is used only as a type, and
it is right in a way this stream had already measured from the other side: a **type imported by name
becomes a runtime named import in the ESM emit**, which Node rejects with `SyntaxError: Named export
not found` - exactly the failure documented in the `what-external-esm-consumers-actually-get`
finding. The final form is `import type { Context } from 'jest-snapshot';` on its own line. Verified:
`Context` no longer appears in the emitted ESM import.

## Scope note — the published matcher package does not carry this

`@fgv/ts-utils-jest` ships its own independent copies of these matchers (three files) and imports
`Context` from the **package root**, so it never carried the `jest-snapshot/build` subpath defect.

**But it did carry the type-vs-value half**, and Copilot could not see it because those files are not
in this PR's diff. All three were given `import type` in the same change. Fixing only the two flagged
files would have left the latent issue in the package that actually *ships* the matchers, and would
have made this finding's original claim - that ts-utils-jest "has the correct form" - only half
true.
