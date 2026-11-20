# `bundler` mode does not work for Node consumers — and answers OQ-2 in the negative

**Severity:** answers an open question. Rules out the workaround for the blocked D3.

OQ-2 asked: "does `bundler` cost anything for Node consumers? Confirm it does not weaken checking
for the Node path before adopting it repo-wide."

**It does not weaken checking for the Node path. It checks a different path entirely.**

## Measurement

Since `bundler` cannot be set on a `module: commonjs` project (see the sibling finding), it was
measured as a **type-check-only overlay** — a generated `tsconfig.resolution-check.json` per project
extending the real one with `module: esnext`, `moduleResolution: bundler`, `noEmit: true`. Run
across all 29 rig-inheriting projects:

| configuration | errors |
|---|---:|
| `bundler` | **73** |
| `bundler` + `customConditions: ["node"]` | **3** |

## Why

`moduleResolution: bundler` does not set the `node` export condition. Every dual-entry `@fgv` package
declares `{ "node": {...}, "default": {...} }`, so the `node` key is skipped and `default` — the
browser build — is taken. The Node-only surface then legitimately does not exist:

```
error TS2339: Property 'convertJsonFileSync' does not exist on type
  'typeof import(".../ts-json-base/lib/packlets/json-file/index.browser")'
error TS2551: Property 'blockPrivateNetworks' does not exist on type
  'typeof import(".../ts-extras/lib/packlets/safer-fetch/index.browser")'
error TS7016: Could not find a declaration file for module 'clipboardy'.
  '.../clipboardy/browser.js' implicitly has an 'any' type.
```

70 of the 73 are this one cause (46 × TS2339, 20 × TS7006 cascading implicit-any from the failed
lookups, 2 × TS2551, 1 × TS2724, 1 × TS7016). The packages are correct. The checker was asking what
a **browser** bundler sees while type-checking **Node** code.

## Why `customConditions: ["node"]` is not simply the fix

It makes the numbers look good — 73 → 3 — but it does so by pinning the resolver to the `node`
branch, which means the pass **never evaluates the `default` condition at all**. `default` is exactly
what `@fgv/ts-web-extras-webauthn` got wrong: a condition naming a `lib/index.browser.js` that has
no source and is never emitted.

So neither single pass is a gate:

| pass | sees `node` condition | sees `default` condition | verdict |
|---|---|---|---|
| `bundler` | ❌ | ✅ | 70 false positives |
| `bundler` + `customConditions: ["node"]` | ✅ | ❌ | blind to the webauthn class |

A gate would need **both** passes, and even then it only checks conditions the repo's own source
happens to import. `verify-esm-entrypoints.mjs` and `verify-tarball-exports.mjs` already assert
**every** condition at **every** subpath, unconditionally. A compiler pass is strictly weaker for
this class.

## What the compiler pass did find that the scripts cannot

Exactly one thing, and it is real — see the `jest-snapshot/build` finding. That is the honest yield:
one latent violation for 73 errors of noise, on a class the existing gates cover better.

**Recommendation:** do not build a `bundler`-mode CI gate. It is not a substitute for the blocked
D3, and it duplicates the script gates while being weaker than them.
