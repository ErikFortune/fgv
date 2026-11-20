# @fgv/heft-dual-rig

A [Heft](https://heft.rushstack.io/) rig package that builds a TypeScript library twice: CommonJS
into `lib/` and ES modules into `dist/`. It extends
[`@rushstack/heft-node-rig`](https://www.npmjs.com/package/@rushstack/heft-node-rig) and adds a Jest
results processor that makes an unmet coverage threshold fail `heft test`. Most libraries in the fgv
monorepo build with it.

## Installation

```sh
npm install --save-dev @fgv/heft-dual-rig @rushstack/heft @rushstack/heft-node-rig
```

## Usage

Point the package at the rig with `config/rig.json`:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/rig-package/rig.schema.json",
  "rigPackageName": "@fgv/heft-dual-rig"
}
```

Heft then picks up the rig's `heft.json`, `typescript.json` and `rush-project.json`. Extend the
node rig's TypeScript base in `tsconfig.json`, as with `heft-node-rig`:

```json
{
  "extends": "./node_modules/@rushstack/heft-node-rig/profiles/default/tsconfig-base.json"
}
```

and have `config/jest.config.json` extend this rig's Jest config rather than the node rig's, so the
coverage gate is enforced:

```json
{
  "extends": "@fgv/heft-dual-rig/profiles/default/config/jest.config.json",
  "coverageThreshold": {
    "global": { "branches": 100, "functions": 100, "lines": 100, "statements": 100 }
  }
}
```

Point `package.json` at both outputs, for example:

```json
{
  "main": "lib/index.js",
  "exports": {
    ".": {
      "types": "./dist/my-package.d.ts",
      "import": "./lib/index.js",
      "require": "./lib/index.js"
    }
  }
}
```

## What the `default` profile contains

| file | what it does |
|---|---|
| `heft.json` | extends `@rushstack/heft-node-rig`'s `heft.json` unchanged |
| `typescript.json` | also emits `esnext` modules to `dist/` (`.js`, not `.mjs`), and copies `.json` static assets |
| `jest.config.json` | extends the node rig's Jest config and adds `coverageResultsProcessor.js` |
| `coverageResultsProcessor.js` | `@rushstack/heft-jest-plugin` exits 0 when only a coverage threshold is missed; this reports that run as a failed suite so the task fails |
| `rush-project.json` | declares `dist`, `lib` and `temp` as build outputs for Rush's build cache |
| `typedoc.base.json` | a TypeDoc base config for `typedoc-plugin-markdown` output |
| `typedoc.compact-base.json` | a TypeDoc base config for [`@fgv/typedoc-compact-theme`](../../plugins/typedoc-compact-theme) |

The TypeDoc configs are opt-in; extend one from your own `typedoc.json`:

```json
{
  "extends": ["@fgv/heft-dual-rig/profiles/default/config/typedoc.compact-base.json"],
  "entryPoints": ["../src/index.ts"],
  "out": "../docs"
}
```

Both TypeDoc configs map `@fgv/*` package symbols to their docs on GitHub.

## License

MIT — see [LICENSE](./LICENSE).
