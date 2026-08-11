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

## Suggested fix — manifest-only, and smaller than first written

**Correction to an earlier version of this finding**, which said the fix needed per-branch `types`
and therefore a browser `.d.ts` rollup the build does not emit. **It does not.**

The trap is real: there is exactly one API-Extractor rollup per package and it describes the **Node**
entry, so hoisting a single `types` key above the branches would hand browser consumers the Node
surface. But the conclusion drawn from it was wrong. **The browser branch does not need a `types` key
at all** — it already resolves `lib/index.browser.d.ts` by adjacency to the `.js` it selects, which is
correct. Verified: an exports-aware pass over `ts-extras` resolves `@fgv/ts-json-base` to
`index.browser` and correctly reports the Node-only members as absent.

So the fix is to put `types` first **inside the `node` block only**:

```json
"node":    { "types": "./dist/<pkg>.d.ts", "import": "./lib/index.js", "require": "./lib/index.js" },
"default": {                               "import": "./lib/index.browser.js", "require": "./lib/index.browser.js" }
```

**No build change. No browser rollup. A manifest edit across 21 packages**, plus the durable half:

- **A gate asserting reachability** — walk each `exports` object in key order and fail when a
  condition sits behind one that matches unconditionally. Independent of the manifest edit, and the
  part actually worth having, since it is the check none of the three existing gates makes.

`@fgv/ts-bcp47` is the closest to correct today (per-branch `types`, first in each block) but points
all three branches at the same Node rollup — the payload problem without the ordering problem.

## What the Node rollup is actually for

Worth stating, since "is this only for docs?" is the natural question: **no.** `dist/<pkg>.d.ts` is
the value of the top-level `"types"` field, which is what **node10 consumers read** — and node10 is
what most consumers and this repo itself use. API Extractor also emits the `etc/*.api.md` report and
the doc model from the same analysis. So the rollup is the published type surface for the majority of
consumers, not a docs artifact.

A *browser* rollup, by contrast, is used for nothing and does not need to exist.

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
