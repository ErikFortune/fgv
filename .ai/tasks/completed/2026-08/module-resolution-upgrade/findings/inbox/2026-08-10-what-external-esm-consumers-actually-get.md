# What external ESM consumers actually get — tested against packed tarballs

**Severity:** informational, and it settles the emit decision's central unknown. **Everything below is
measured against a real `npm install` of real `npm pack` tarballs in a `"type": "module"` package
outside this repo** — not reasoned from the manifests.

## Setup

`npm pack` on `@fgv/ts-utils`, installed into a scratch package with `"type": "module"`, consumed
with Node 22 and TypeScript 5.9.3. Node resolves the package to:

```
node_modules/@fgv/ts-utils/lib/index.js      <- the CommonJS build
```

## Results

| scenario | result |
|---|---|
| `import * as U from '@fgv/ts-utils'` | ✅ **79 named exports**, plus `default` |
| `import U from '@fgv/ts-utils'` | ✅ `default` is `module.exports` |
| `import { succeed, fail, captureResult, mapResults, Converters }` | ✅ all resolve |
| `import { Result }` — a **type** — from **JavaScript** | ❌ `SyntaxError: Named export 'Result' not found` |
| TypeScript `module: node16` + `moduleResolution: node16`, type-check | ✅ **clean** |
| ...emit ESM and run end-to-end | ✅ `half(10)` → `{success:true,_value:5}` |
| TypeScript with `verbatimModuleSyntax: true` | ❌ **compile time**: `TS1484: 'Result' is a type and must be imported using a type-only import` |

**External ESM consumers work today.** Node's `cjs-module-lexer` recovers the named exports from our
CJS emit, so the ergonomics are the same as a native ESM package for every runtime value.

## The one sharp edge, and why it is not a defect

`Result` is `export type Result<T> = Success<T> | Failure<T>` — a type with no runtime binding. It
therefore is not among the CJS named exports, and a **JavaScript** ESM consumer importing it by name
gets a hard `SyntaxError`.

This is close to unreachable in practice:

- A JavaScript consumer has no reason to import a type.
- A TypeScript consumer's default settings **erase** the import — verified: the emitted line is
  `import { succeed, fail, Converters } from '@fgv/ts-utils';` with `Result` gone, and it runs.
- Under `verbatimModuleSyntax: true` TypeScript **catches it at compile time** with `TS1484` and tells
  the consumer to write `import type`. A good error, not a broken package.

This is ordinary CJS-package behavior, not something specific to our emit.

## Tree-shaking — the one real benefit of activating ESM, measured

Browser bundlers take `lib/index.browser.js` (CJS) for 24 of 25 packages. `@fgv/ts-bcp47` is the only
package shipping a reachable ESM browser entry, so it is the only place the two can be compared
directly. esbuild, `--minify`, consuming only `Bcp47.tag`:

| entry | bundle |
|---|---:|
| `lib/index.browser.js` (CJS) | **818,716 bytes** |
| `dist/index.browser.js` (ESM) | **775,818 bytes** |

**~5%.** Real, but modest — and this is a *low-end* data point for a specific reason: `ts-bcp47`'s
bulk is generated IANA registry **data**, which no amount of tree-shaking removes. A code-heavy
package would likely show more. **Do not generalize 5% to the repo without measuring another
package.**

## A second, unexpected point in ESM's favour

While setting the measurement up I wrote `import { tag } from '.../index.browser.js'` — wrong, `tag`
lives at `Bcp47.tag`. The two entries behaved very differently:

- **ESM** failed the build: `No matching export in "dist/index.browser.js" for import "tag"`.
- **CJS** succeeded, silently bound `undefined`, and produced an 818 KB bundle.

ESM exports are statically checkable and CJS named exports are not. That is a real, if small,
correctness argument that has nothing to do with bundle size.

## What this means for the emit decision

The central unknown was "what breaks for consumers if we change the emit". Measured answer:
**nothing, in either direction.**

- **Stop shipping `dist`** — no consumer reaches it except `ts-bcp47`'s browser branch. Consumers see
  no change. They give up ~5% of one package's bundle and the static-export checking above.
- **Fix and activate it** — consumers gain tree-shaking and statically-checked named exports. They
  lose nothing, because everything they do today keeps working: `lib` stays where the `require` and
  `node` conditions point.

So the decision is **not** a compatibility question and should not be sized as one. It is a
cost-of-maintenance vs. quality-of-artifact question, and the honest costs are: ~3,520 fully-specified
specifiers plus `{"type":"module"}` plus per-branch `types` on one side, versus deleting a tree
nobody uses on the other.

## Non-finding, checked and cleared

`npm pack` output carries `"@fgv/ts-utils": "workspace:*"` in `peerDependencies`, which fails a raw
`npm install` of the tarball. **This is not a publishing defect** — Rush rewrites it at publish time.
Verified against the registry:

```
$ npm view @fgv/ts-json-base@5.1.0-47 peerDependencies
{ "@fgv/ts-utils": "5.1.0-47" }
```

Worth recording so the next person who packs a tarball locally and hits `EUNSUPPORTEDPROTOCOL` does
not file it.
