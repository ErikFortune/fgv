# Finding — `@fgv/ts-bcp47`'s browser entry transitively imports node `path` and `fs`

**Found by:** `esm-emit-design` (incidental — surfaced while measuring bundle sizes)
**Severity:** real packaging defect, pre-existing, not caused by anything in this stream
**Package:** `@fgv/ts-bcp47` — **not** in this stream's recommendation scope

## What

Bundling `@fgv/ts-bcp47@5.1.0-47`'s **browser** entry for a browser target fails to resolve node
builtins:

```
$ esbuild entry.js --bundle --format=esm --platform=browser
✘ [ERROR] Could not resolve "path"
    node_modules/@fgv/ts-bcp47/dist/packlets/iana/languageRegistriesFileLoader.js:31:17
      31 │ import path from 'path';
✘ [ERROR] Could not resolve "fs"
    node_modules/@fgv/ts-bcp47/dist/packlets/iana/languageRegistriesFileLoader.js:32:15
```

`index.browser` transitively reaches `packlets/iana/languageRegistriesFileLoader`, whose
`loadLanguageRegistries` / `loadLanguageRegistriesFromZip` use `path.join` and `fs.readFileSync`.

## Scope

Present in **both** browser builds of the published artifact:

- `dist/packlets/iana/languageRegistriesFileLoader.js` (ESM) — `import path from 'path'`
- `lib/packlets/iana/languageRegistriesFileLoader.js` (CJS) — same, as `require`

So it is not an artifact of the ESM emit. `ts-bcp47` is one of only four packages that already
routes browser bundlers at `dist`, which means this is reachable by a browser consumer today.

## Why it has not been noticed

`apps/sudoku` is the repo's only webpack browser build. Either it does not import `ts-bcp47`'s
browser entry, or it carries a `resolve.fallback` for `path`/`fs`. Webpack 5 does not polyfill node
builtins by default, so a consumer without that config gets a build error. Not verified which —
outside this stream's scope.

## Suggested disposition

A filesystem loader does not belong on a browser entry's reachable graph. The likely fix is the
pattern the repo already uses elsewhere: keep `loadLanguageRegistries*` on the node entry
(`index.ts`) and exclude it from `index.browser.ts`, the way `@fgv/ts-extras` splits
`index.node.ts` / `index.browser.ts` for its hash packlet.

## Connection to `esm-emit-design`

This is exactly the failure class that recommendation **R3** (route browser bundlers at the ESM
emit) would propagate to twenty more packages if applied without a gate. It is the concrete
evidence behind **R5** (add a bundler-resolution gate, and land it *before* R3) and behind **OQ-4**
(how many of the twenty unwired packages can actually be bundled for a browser?).

Recorded here rather than in the design doc's recommendation, per the brief's findings-inbox
convention.
