# State: `filetree-prefix-confinement`

Worker-owned. The brief is frozen; this file records what the brief left open, what I decided, and why.

## Status

Implemented, tested (red-first, then green at 100%), documented. Escape and revert matrices are in
`result.md`.

## Decisions on what the brief left open

### D1 — where the options live: `IFsFileTreeInitParams extends IFileTreeInitParams` (brief item 5)

`absolutePathPolicy` and `realPath` are on a new `IFsFileTreeInitParams` in `fsTree.ts`, accepted by
the `FsFileTreeAccessors` constructor, the new `FsFileTreeAccessors.create`, and the params overload
of `FileTree.forFilesystem`. The shared `IFileTreeInitParams` is untouched. Nothing made this
unworkable: `forFilesystem` only ever builds `FsFileTreeAccessors`, and widening a parameter to a
subtype-compatible interface breaks no caller. The types stay out of the browser barrel
(`index.browser.ts` already excludes `fsTree` and `fileTreeHelpers`).

### D2 — how creation fails without a prefix: constructor throws, `create` returns the `Result` (brief item 4)

`FsFileTreeAccessors` is created through a **public** constructor today, and this is an established
surface, so making it private is not on the table. Following the repo's factory pattern, the
constructor throws for an invalid combination and a new `static create(params?)` wraps it with
`captureResult`. `forFilesystem` now calls `create`, so it returns the `Failure` (it already wrapped
the constructor in `captureResult`, so its observable behaviour for valid input is unchanged). The
constructor can only throw for the new options; a caller passing only today's options cannot reach
any of the new throws.

Creation fails for: `'confined'` or `'verified'` with no prefix (`undefined` **or** `''` — the
existing code already treated an empty prefix as none); `realPath: true` under `'unconfined'` (see
D4); and an unknown policy string (validated with `Converters.enumeratedValue` over the exported
`allFsAbsolutePathPolicies`, since a policy may come from configuration).

### D3 — `confined` and a relative `..` escape: resolve against the prefix as though it were `/` (brief item 2)

The brief offers refusal as one option. I chose **chroot-style resolution** instead: a relative input
that climbs out is resolved as though the prefix were the filesystem root, where `..` cannot climb
higher, so `../x` and `a/../../x` both become `<prefix>/x`, and `../q/x` becomes `<prefix>/q/x`.

Why not refuse:

- `resolveAbsolutePath` returns a `string` and cannot fail, and `DirectoryItem.create` /
  `FileItem.create` store its output as `absolutePath` and hand that absolute path back on every later
  call. A refusal at the accessor would therefore be bypassed by any item: `DirectoryItem.create('../x')`
  would record some path, and the next operation through that item would get an *absolute* path,
  which `confined` maps beneath the prefix anyway. Refusing the direct call while mapping the item
  path is two answers to one question.
- Under chroot resolution the one function that defines the mapping is used identically at item
  creation and at use, and it is idempotent (`resolve(resolve(p)) === resolve(p)`, pinned by a test).
- "Prepend the prefix to the resolved path" is what the brief calls nonsensical for a relative escape
  (`../q/x` under `/a/p` would become `/a/p/a/q/x`); chroot resolution is the meaningful version of
  "lands under the prefix", and matches how the absolute case already reads (`/x` → `<prefix>/x`).
- Confinement holds either way — nothing outside the prefix is reachable under `confined`. A caller
  who wants a relative escape to *fail* has `verified`, which refuses it.

A later absolute segment (`resolveAbsolutePath('a', '/etc')`) is mapped the same way as an absolute
first segment.

### D4 — `realPath: true` under `'unconfined'` is refused at creation

The brief says `realPath` defaults on under `verified`, off otherwise, and can be enabled under
`confined`; it does not say what `unconfined + realPath` means. Any meaning is surprising (a real-path
check that refuses a link out, while the path string itself may name anywhere), so it falls under
item 4's "must not be silently ignored": creation fails with `realPath requires absolutePathPolicy
'confined' or 'verified'`. `verified + realPath: false` is allowed (path-string check only).

### D5 — what the real-path check inspects

`_confineToRoot` (atomic) checks the real path of the **containing directory**. For plain reads and
writes that is not enough: `writeFileSync` / `readFileSync` follow a *final* symbolic link, so a
symlinked **file** inside the prefix pointing outside would pass a directory-only check (shown red in
revert row R6). So the plain check (`_confineRealPath`) inspects the real path of the target itself
when it exists, otherwise of its nearest existing ancestor (where a write would create it), stopping
at the prefix. An entry that exists but has no real path — a **dangling symbolic link** — is refused,
because a write through it creates its target, which cannot be checked first.

Consequence, documented: under `realPath`, deleting a symbolic link whose target is outside is also
refused (the check sees the target), even though `unlink` would only remove the link. Conservative,
and the listing already hides links.

The brief said "reuse `_confineToRoot`". I reused its **rule** (`_isWithin` against the real prefix)
but not the function, for the reason above; `_confineToRoot` and the atomic methods are unchanged in
behaviour. One internal change there was needed to keep them unchanged: `_confineToRoot` and
`_qualifyDirectory` called the public `resolveRealPath`, which is now policy-checked, so a refused
real path would have read as "does not exist" and let the atomic write through a link out of the tree
(revert row R14 shows exactly this going red). They now call a raw `_realPathOf` helper.

### D6 — which operations are confined

Every one that touches the filesystem: `getItem` (stat), `getFileContents`, `getFileBytes` (and so
`getFileTextStrict`), `getChildren`, `resolveRealPath`, `fileIsMutable` (refusal detail
`'path-excluded'`), and through `fileIsMutable` `saveFileContents`, `saveFileBytes`, `deleteFile`,
`deleteDirectory`; `createDirectory` (which does not call `fileIsMutable`) directly. Pure path helpers
(`getExtension`, `getBaseName`, `joinPaths`) and `getFileContentType` touch nothing and are not
checked. The atomic methods keep their own `_confineToRoot`; under `confined` they receive the mapped
path from `resolveAbsolutePath` like every other operation, and `writeFileAtomically` also passes
through the now-confined `fileIsMutable`.

### D7 — the prefix confinement judges against is fixed at construction

When a policy other than `'unconfined'` is in force, the prefix is resolved once at construction
(`_root`) and used both to resolve relative paths and to judge containment, so a sandbox does not move
if the process changes directory. Under `'unconfined'` resolution is exactly as before (relative to
`prefix` at call time). `_confineToRoot` keeps its per-call `path.resolve(this.prefix)`.

## Known residuals (documented, not fixed)

- **Check-then-act window** on plain operations: they check, then act on the logical path, so a link
  created or retargeted in between is not seen. The atomic methods commit through the checked real
  directory and do not share it. Closing it for plain operations would mean acting on the real path,
  which changes what `deleteFile` of a link deletes; out of scope for an additive option.
- **Windows separators** are tested only as what they are on POSIX — ordinary filename characters, so
  `..\\outside\\x` names one entry inside the prefix. The matrix row switches its expectation to
  "escape" on win32 (where `path` is `path.win32`), but this stream ran only on Linux.
- The generated `libraries/ts-json-base/docs/` (typedoc output, last regenerated 2026-08) still shows
  the old `prefix` text, as it does for every surface added since; the TSDoc source is corrected.

## Gate notes

- The worktree's own pnpm store could not be installed: the disk had ~130 MB free (other worktrees
  hold ~2.7 GB each). `rush install` was run with `RUSH_PNPM_STORE_PATH` pointing at a sibling
  worktree's store, so `node_modules` are hardlinks into it. The lockfile and install are otherwise
  ordinary.
