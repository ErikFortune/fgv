# post-510-package-cleanup — result

**Shipped:** the eight published packages that had no `README.md` now have one, `@fgv/typedoc-compact-theme` ships a `LICENSE`, and `@fgv/ts-random` has a package description.

## 1. READMEs

| package | path | usage example |
|---|---|---|
| `@fgv/ts-extras-argon2` | `libraries/ts-extras-argon2/README.md` | `NodeArgon2Provider.create()` → `argon2id(password, salt, CryptoUtils.ARGON2ID_PASSPHRASE)` |
| `@fgv/ts-web-extras-argon2` | `libraries/ts-web-extras-argon2/README.md` | same with `BrowserArgon2Provider`; states the single-threaded `parallelism` and the `associatedData` refusal |
| `@fgv/ts-http-storage` | `libraries/ts-http-storage/README.md` | `createStorageRoutes({ providers: new FsStorageProviderFactory({ rootPath }) })` mounted on a Hono app; route table from `routes.ts` |
| `@fgv/ts-random` | `libraries/ts-random/README.md` | `Generator.PseudoRandomGenerator.create({ seed })`, draws, `pickSequential` over `GeneratorData.Words`, `createChild` |
| `@fgv/ts-extras-webauthn` | `libraries/ts-extras-webauthn/README.md` | `generateRegistrationOptions` / `verifyRegistrationResponse` |
| `@fgv/ts-web-extras-webauthn` | `libraries/ts-web-extras-webauthn/README.md` | `startRegistration({ optionsJSON })` / `startAuthentication` |
| `@fgv/heft-dual-rig` | `rigs/heft-dual-rig/README.md` | `config/rig.json`, the `tsconfig.json` base, `config/jest.config.json` extending the rig's config, `typedoc.json` extending `typedoc.compact-base.json` — as the repo's libraries do; table of the `default` profile's seven files |
| `@fgv/typedoc-compact-theme` | `plugins/typedoc-compact-theme/README.md` | TypeDoc `plugin` + `out`; documents that it deletes `out`, writes Markdown, and exits before TypeDoc's renderer; the `includeInheritedMemberPages` option |

Every package exports only `"."`, so every import in the examples is the package root. The
TypeScript examples were checked two ways against the built packages (resolved through
`node_modules` symlinks in a scratch directory, `tsc --strict --module node16`): they typecheck
(exit 0), and the ts-random, Node argon2 and browser argon2 snippets run — the browser provider
refuses `associatedData` with the message the README describes, and the Node provider returns 32
bytes for `ARGON2ID_PASSPHRASE`.

Claims checked against source rather than taken from CAPABILITIES.md: the route list and the
`/health` response shape (`routes.ts`); the namespace character set and per-namespace
subdirectory (`fsProvider.ts`); the theme's `rmSync` of `out`, `process.exit(0)` and output
directory names (`src/index.ts`); which packages use the rig (24 of 26 libraries — not
`ts-http-storage` or `ts-res-ui-components` — and none of the tools; the README says "most").

## 2. LICENSE

`plugins/typedoc-compact-theme/LICENSE` is a byte-for-byte copy of `rigs/heft-dual-rig/LICENSE`
(MIT, "Copyright (c) 2026 Erik Fortune", identical to `libraries/ts-random/LICENSE`).

## 3. Descriptions

Every project in `rush.json` was checked. Only `@fgv/ts-random` had an empty description; it is now
"Seeded, reproducible pseudo-random generation and word/character corpora for TypeScript (not
cryptographically secure)", which matches its README's first paragraph and CAPABILITIES.md.

Left alone: `@fgv/ts-utils` and `@fgv/ts-extras` both read "Assorted Typescript Utilities". That is
generic and duplicated, but it is a real description on two long-published packages rather than a
placeholder, so it is out of this stream's scope.

## 4. Pack verification

`pnpm pack` (the Rush-installed pnpm) from each package folder into the scratchpad, then
`tar -tzf`:

| tarball | README.md | LICENSE | CAPABILITIES.md |
|---|---|---|---|
| `fgv-ts-extras-argon2-5.1.0.tgz` | yes | yes | yes |
| `fgv-ts-web-extras-argon2-5.1.0.tgz` | yes | yes | yes |
| `fgv-ts-http-storage-5.1.0.tgz` | yes | yes | yes |
| `fgv-ts-random-5.1.0.tgz` | yes | yes | yes |
| `fgv-ts-extras-webauthn-5.1.0.tgz` | yes | yes | yes |
| `fgv-ts-web-extras-webauthn-5.1.0.tgz` | yes | yes | yes |
| `fgv-heft-dual-rig-5.1.0.tgz` | yes | yes | — (none in repo) |
| `fgv-typedoc-compact-theme-5.1.0.tgz` | yes | yes | — (none in repo) |

The packed `ts-random` `package.json` carries the new description. No `.tgz` was written into the
repo tree.

## 5. Change files

Eight `patch` change files, `common/changes/@fgv/<pkg>/post-510-package-cleanup_2026-11-20-00-00.json`:
"Added a README." for six, "Added a README and LICENSE." for `typedoc-compact-theme`, and "Added a
README and a package description." for `ts-random`.

## 6. Gates

See the stream README and the hand-off report for the recorded results of `rush change --verify
--target-branch origin/main`, `rush install`, `rush rebuild`, `generate-capability-feed.mjs
--check`, `verify-capability-docs.mjs` and `prettier@2.8.8 --check`.

## Follow-ups

- `@fgv/heft-dual-rig` and `@fgv/typedoc-compact-theme` list `CAPABILITIES.md` in `files` but have
  none; the entry is harmless (npm skips a missing file) and was left alone.
- `@fgv/ts-utils` / `@fgv/ts-extras` share the description "Assorted Typescript Utilities".
