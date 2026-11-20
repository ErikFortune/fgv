# Finding — npm will not prune the directory containing `main`, so `.npmignore` entries for it are silently ineffective

**Filed by:** `publish-tarball-gate`
**Severity:** low as a defect, **high as a correction to a shared mental model**
**Status:** measured and reproduced; no action taken

## What was found

While building the second neutralization demonstration (simulate the 5.1.0-27 build-less pack by
excluding build output via `.npmignore`), the simulation did not do what it said. Adding both
`lib/` and `dist/` to `@fgv/ts-utils`'s `.npmignore` excluded **`dist/` entirely** and **`lib/` not
at all** — 272 of 277 packed files were still under `lib/`.

Isolated on a minimal fixture, and confirmed against real `npm pack --dry-run --json`, not just
`npm-packlist`:

```
package.json: { "name": "packtest", "version": "1.0.0", "main": "lib/index.js" }
files on disk: lib/index.js, lib/other.js, dist/index.js

.npmignore = "lib/\ndist/"   ->  packs lib/index.js, lib/other.js, package.json
.npmignore = "lib\ndist"     ->  identical
```

`dist/` is pruned. `lib/` is not — and note it keeps **`lib/other.js`** too, so this is not the
familiar "npm always includes the `main` file" rule. The whole directory containing `main` becomes
unprunable.

## Why it matters

1. **An `.npmignore` line can be silently inert.** Anyone reading `lib/` in an `.npmignore` will
   conclude `lib/` does not ship. For the directory holding `main`, that reading is wrong, and
   nothing reports it. This is the same failure shape as the defects this gate family exists for:
   a stated intention that the tooling quietly does not honor.
2. **It changes what the 5.1.0-27 shape actually requires.** Because npm protects the `main`
   directory, an ignore rule alone *cannot* produce the "no build output at all" tarball. That
   shape requires the build output to be **genuinely absent from disk** at pack time — i.e. a
   publish that ran without a successful build. That is a narrower and more specific failure than
   "someone misconfigured `.npmignore`", and it points the remedy at the publish pipeline's build
   step rather than at packaging config.
3. **It weakens the denylist approach generally**, and is an argument for the `files` allowlist
   recommended in finding #1.

## Consequence for the gate (already applied)

`verify-tarball-exports.mjs` originally reported "NO BUILD OUTPUT IN THE TARBALL" when zero packed
files sat under `lib/` or `dist/`. That test was defeated by this behavior. It now **reports the
count** (`N files would be packed, M of them under lib/ or dist/`) on every failure and only adds
the 5.1.0-27 interpretation when `M <= 1`, so the script states a measurement and does not assert a
threshold it cannot justify. See the comment on `buildFileCount`.

## Not acted on

No package's shipped contents are wrong *because* of this today. It is recorded because it
invalidates a reasonable assumption about how our `.npmignore` files behave, and because the next
person to try to exclude build output will hit it.
