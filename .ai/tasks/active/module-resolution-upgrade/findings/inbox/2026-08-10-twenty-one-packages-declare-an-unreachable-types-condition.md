# 21 of 25 published packages declare a `types` condition that can never be selected

**Severity:** the same *shape* as the webauthn defect — a condition no resolver can reach. Lower
consequence, because the fallback happens to work. Filed, not fixed, per the brief's scope rule.

## The pattern

```json
"exports": {
  ".": {
    "node":    { "import": "./lib/index.js",         "require": "./lib/index.js" },
    "default": { "import": "./lib/index.browser.js", "require": "./lib/index.browser.js" },
    "types":   "./dist/ts-json-base.d.ts"
  }
}
```

Conditions are matched in **declaration order**, and `default` matches unconditionally. So `default`
is always taken before the resolver ever reaches `types`. The `types` entry — which points at the
API-Extractor rollup — is dead in every consumer, under every resolution mode.

## Scope

Audited across all 25 published packages by walking each root `exports` object's key order:

| verdict | count | packages |
|---|---:|---|
| `types` after `default` — unreachable | 20 | `ts-agent-memory`, `ts-agent-memory-sqlite-vec`, `ts-app-shell`, `ts-extras`, `ts-extras-argon2`, `ts-extras-mcp`, `ts-extras-ollama`, `ts-extras-transformers`, `ts-extras-webauthn`, `ts-http-storage`, `ts-json`, `ts-json-base`, `ts-prompt-assist`, `ts-res`, `ts-res-ui-components`, `ts-sudoku-lib`, `ts-sudoku-ui`, `ts-web-extras`, `ts-web-extras-transformers`, `ts-web-extras-webauthn` |
| `types` after `import`/`require` — also unreachable | 1 | `ts-web-extras-argon2` |
| **per-branch `types`, first in each block — the shape this finding recommends** | 1 | `ts-bcp47` |
| `types` first — correct | 3 | `ts-utils`, `ts-utils-jest`, `ts-random` |

(The count in the heading is 20 + 1 = 21 unreachable. `ts-web-extras-argon2` is not in the
20-name list above, so it is not double-counted.)

## Why nothing has broken

TypeScript falls back to locating a `.d.ts` adjacent to the resolved `.js`. `lib/index.js` has
`lib/index.d.ts` beside it, so types resolve — just not via the declared rollup. Under node10, which
is what the repo and most consumers use today, `exports` is not read at all and the top-level
`types` field drives resolution regardless.

## Why it is still worth fixing

1. **The declared contract is not the delivered one.** Consumers read `dist/<pkg>.d.ts` (the curated
   API-Extractor rollup) in the manifest and get `lib/index.d.ts` (the raw per-file emit).
2. **It is the webauthn shape.** A condition that cannot be selected is invisible to every check that
   asks "does the resolved entry work" — which is every check we have. The existing gates verify each
   named file *exists*; none verifies it is *reachable*.
3. **An exports-aware consumer silently gets browser typings.** A vite/webpack project importing
   `@fgv/ts-json-base` resolves `default` → `lib/index.browser.d.ts`. That is arguably correct for a
   browser target and wrong for a Node target using `bundler` resolution — and nothing announces
   which one happened.

## Suggested fix — and the trap in the obvious version

**Do not simply move `types` to the front.** For a dual-entry package that makes things *worse*.

There is exactly **one API-Extractor rollup per package**, and it describes the **Node** entry
(`dist/ts-json-base.d.ts`, `dist/ts-extras.d.ts`, ...). Meanwhile every dual-entry package emits a
genuinely different browser declaration (`lib/index.browser.d.ts`). Today, an exports-aware consumer
resolves `default` -> `lib/index.browser.js` and picks up `lib/index.browser.d.ts` by adjacency —
which is **correct for that branch**. Hoisting a single `types` key above the branches would hand
browser consumers the Node surface, advertising members like `convertJsonFileSync` that do not exist
in the browser build. That is a regression, not a fix.

Verified: `ls libraries/*/dist/*.d.ts` yields one rollup per package, and no package emits a
browser-specific rollup for a `types` key to point at.

The correct shape needs **per-branch `types`, first within each block**, which means the build must
first *produce* a browser rollup:

```json
"node":    { "types": "./dist/<pkg>.d.ts",         "import": "./lib/index.js",         "require": "./lib/index.js" },
"default": { "types": "./dist/<pkg>.browser.d.ts", "import": "./lib/index.browser.js", "require": "./lib/index.browser.js" }
```

So this is **not** a 21-line `exports` edit. It is:

1. A **build change** — a second API-Extractor invocation per dual-entry package to roll up the
   browser entry point. This is the real cost and it is not yet sized.
2. The `exports` reordering, once there is something correct to point at.
3. A **gate extension** asserting *reachability* — walk each `exports` object in key order and fail
   when a condition sits behind one that matches unconditionally. This is the durable half, and it is
   independent of 1 and 2.

`@fgv/ts-bcp47` is the closest to correct (per-branch `types`, first in each block) but points all
three branches at the same Node rollup, so it has the payload problem without the ordering problem.

## How much does this actually cost consumers today?

Less than the heading implies, and worth stating plainly:

- **node10 consumers** — the overwhelming majority, and what this repo itself is — never read
  `exports`. They resolve the top-level `"types": "dist/<pkg>.d.ts"` field and get the rollup.
  **Unaffected.**
- **exports-aware consumers** (node16/bundler) resolve through the per-file `lib/**/*.d.ts` tree
  instead. The symbols are the same; the difference is that they read the uncurated per-file surface
  rather than the curated single-file rollup. **Types still resolve and still type-check.**

So this is a *contract-vs-delivery* defect and a **gate blind spot**, not a live breakage. Its value
is that it is the same shape as the webauthn defect — a condition no resolver can reach — and our
three gates all check whether a named file **exists**, never whether the condition naming it can be
**selected**. Item 3 above is the part worth doing first, and it is cheap.
