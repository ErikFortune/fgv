# `@fgv/ts-utils` imports `jest-snapshot/build`, a subpath the package does not export

**Severity:** real violation, currently latent. The one genuine defect the compiler sweep found.

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

Left unfixed here because the stream's in-scope paths cover `libraries/*/src/**` only under
deliverable 4, which was not attempted.
