# Heft blocks a shared tsconfig layer, so repo-wide compiler policy must be stated per project

**Severity:** explains why D1's diff is 31 near-identical hunks rather than one file. Answers OQ-3.

OQ-3 asked whether the `moduleResolution` setting belongs upstream, in our rig, or per project. The
answer is forced, not chosen: **per project is the only shape Heft supports.**

## What was attempted, and how each failed

Both attempts were made against a real `rushx build`, not reasoned about.

**1. `extends` array** (TypeScript 5.0+; the repo is on 5.9.3). Projects would list the Rushstack base
and an fgv overlay, later entries winning:

```json
"extends": [
  "./node_modules/@rushstack/heft-node-rig/profiles/default/tsconfig-base.json",
  "./node_modules/@fgv/heft-dual-rig/profiles/default/tsconfig-resolution.json"
]
```

`tsc --showConfig` accepts this and resolves it correctly. **Heft does not** — it reads `extends`
itself and requires a string:

```
--[ FAILURE: @fgv/ts-utils ]---
The "path" argument must be of type string. Received an instance of Array
```

**2. A rig-provided base that extends the Rushstack one.** Projects extend only
`@fgv/heft-dual-rig/profiles/default/tsconfig-base.json`, which in turn extends upstream. This fails
for a structural reason worth recording:

`@fgv/heft-dual-rig` is a **workspace** package, so `<proj>/node_modules/@fgv/heft-dual-rig` is a
symlink to `rigs/heft-dual-rig`. A relative `extends` inside that file is resolved by the filesystem
**after** following the symlink, so `../../../../@rushstack/...` lands at `rigs/@rushstack/...`, not
at `<proj>/node_modules/@rushstack/...`:

```
In file ".../ts-random/node_modules/@fgv/heft-dual-rig/profiles/default/tsconfig-base.json",
file referenced in "extends" property ("../../../../@rushstack/...") cannot be resolved.
```

Pointing it at the rig's own `node_modules` (`../../node_modules/@rushstack/...`) does resolve — but
then upstream's `"outDir": "../../../../../lib"` resolves relative to *that* physical location and
emits into `rigs/heft-dual-rig/lib`. **Every relative path in a workspace-symlinked rig's tsconfig
resolves into the rig's own tree**, which is why `@rushstack/heft-node-rig` can use this pattern
(it is a store package, installed under the consumer) and an fgv workspace rig cannot.

## Consequence

`moduleResolution` is now stated inline in all 31 rig-inheriting projects, with a three-line comment
pointing at the design doc for the reasoning. The reasoning lives in one place; the value does not.

Practical cost: any future change to it is a scripted 31-file edit rather than a one-line edit. That
is tolerable, and arguably better for a policy you want visible — `grep -r moduleResolution
*/*/tsconfig.json` now prints the whole repo's posture.

## Unexplored option

TypeScript 5.5's `${configDir}` template variable is designed for exactly this case: a shared config
whose relative paths resolve against the *consuming* project rather than the file's own location. It
would fix failure mode 2. It was not tried, because failure mode 1 (Heft rejecting the array) already
forced the inline shape, and `${configDir}` would still require Heft to resolve a single-string
`extends` into the rig and then honour the variable — an untested assumption. Worth a probe if the
31-site duplication ever becomes a real cost.
