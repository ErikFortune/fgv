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

## Suggested fix (out of scope here)

Move `types` to the first key in each condition block, and prefer per-branch `types` so the Node and
browser branches can name different declaration files:

```json
"node":    { "types": "./dist/<pkg>.d.ts",         "import": "./lib/index.js",         "require": "./lib/index.js" },
"default": { "types": "./dist/<pkg>.browser.d.ts", "import": "./lib/index.browser.js", "require": "./lib/index.browser.js" }
```

This is a 21-package `exports` change and belongs in its own stream, alongside a gate extension that
asserts **reachability** rather than only existence — the check the current three gates do not make.
