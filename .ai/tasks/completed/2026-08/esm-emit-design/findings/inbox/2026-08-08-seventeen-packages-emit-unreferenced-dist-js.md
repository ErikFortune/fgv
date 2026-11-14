# Finding — 17 dual-rig packages publish a `dist` JS emit that nothing references

**Found by:** `esm-emit-design`
**Severity:** waste, not breakage — but it is the mechanism behind the stream's headline finding
**Scope:** every `@fgv/heft-dual-rig` package except `ts-utils`, `ts-bcp47`, `ts-random`,
`ts-utils-jest`

## What

21 packages use `@fgv/heft-dual-rig`, so 21 packages emit an `esnext` build into `dist`. Exactly
**four** `package.json` files anywhere in the repo reference a `dist/*.js` artifact:

```
libraries/ts-bcp47/package.json       module + exports.browser.import + exports.node.import
libraries/ts-utils/package.json       module + exports.import
libraries/ts-random/package.json      module + exports.import
libraries/ts-utils-jest/package.json  module + exports.import
```

The other 17 build, package, and publish a full parallel ESM tree that no `exports` key, no `module`
field, and no consumer path resolves to. It is dead output.

Note `dist` itself is not dead — API Extractor's `.d.ts` rollup lands there too
(`<projectFolder>/dist/<unscopedPackageName>.d.ts`). Only the JS emit within it is unreferenced.

## Why this matters more than it looks

It is not merely wasted build time and package size. Those 17 packages route browser bundlers at
`default.import → ./lib/…`, which is **CommonJS** — so browser consumers get an untree-shakeable
build while a tree-shakeable one sits unreferenced in the same tarball. Measured on the published
5.1.0-47:

| `@fgv/ts-json-base`, `import { JsonSchema }` | bundled, minified |
|---|---|
| what bundlers get today (`lib`, CJS) | 130,004 B |
| what is already published in `dist` (ESM) | 37,367 B |

**92.6 KB, 3.5×, already built and shipped, simply not pointed at.**

## Suggested disposition

Two levers, both in the design doc:

- **R3** — route browser bundlers at the ESM emit via a `browser` condition, per package, behind the
  R5 bundler gate. This converts the waste into the win.
- **R4** — for whatever remains unrouted after R3, move the package to
  `@rushstack/heft-node-rig` (already used by `ts-http-storage` and the CLIs) so it stops emitting
  `dist` JS at all.

R4 alone would be the "stop building what nothing loads" cleanup. R3 first is strictly better,
because it establishes which packages *should* be loading it before deciding which should stop
building it. Doing R4 without R3 would forfeit the measured value above.
