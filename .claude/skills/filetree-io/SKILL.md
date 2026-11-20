---
name: filetree-io
description: Use when writing or reviewing any code that does file I/O — importers, exporters, directory walks, file reads/writes — in projects using the FGV toolset. The convention is to use the FileTree abstraction from @fgv/ts-json-base instead of node fs APIs directly, so the same code works against node fs, in-memory, zip files, browser localStorage, and the browser File System Access API. Load this skill BEFORE writing fs.readFile, fs.writeFile, fs.readdir, fs.mkdir, path.join, glob/fast-glob, or any importer/exporter signature; load it BEFORE writing browser File-System-Access code; load it during code review when code has reached for node fs in business logic. Covers the read/write/walk operations, the adapter-selection idiom, the canonical createFileTreeRoot helper, and the anti-patterns that distinguish business logic from boot-edge code.
---

# FileTree I/O

> Source: `<repo>/.claude/skills/filetree-io/SKILL.md` in the source
> corpus. Toolset binding: `@fgv/ts-json-base` (with adapter homes
> in `@fgv/ts-extras` and `@fgv/ts-web-extras`).

Projects using the FGV toolset use the `FileTree` abstraction from
`@fgv/ts-json-base` for file I/O — never node `fs` directly in
business logic. The benefit is portability: the same
importer/exporter works against node fs, in-memory trees, zip files,
browser localStorage, and the browser File System Access API. Pick
the adapter at the boot edge; everything downstream takes a
`FileTreeItem` and is platform-agnostic.

## Mental model

`FileTree` is a uniform read/write/walk tree of `IFileTreeFileItem`
and `IFileTreeDirectoryItem` nodes (union: `FileTreeItem`) wrapped
around a pluggable `IFileTreeAccessors` adapter. **All operations
return `Result<T>` — there is no throwing API.**

| Operation | Method |
|-----------|--------|
| Read children | `dir.getChildren()` |
| Read raw text | `file.getRawContents()` (returns `string`) |
| Read parsed JSON | `file.getContents()` |
| Write raw text | `file.setRawContents(text)` (mutable only) |
| Write JSON | `file.setContents(value)` (mutable only) |
| Create file | `dir.createChildFile(name, content)` (mutable only) |
| Create dir | `dir.createChildDirectory(name)` (mutable only) |
| Delete | `item.delete()` (mutable only) |
| Walk | recurse on `getChildren()`, dispatch on `child.type === 'directory' \| 'file'` |

**Mutability gate**: before any write, call the type guards.

```typescript
if (!FileTree.isMutableFileItem(file)) return fail(`${file.absolutePath}: not mutable`);
if (!FileTree.isMutableDirectoryItem(dir)) return fail(`${dir.absolutePath}: not mutable`);
```

## Adapters

| Adapter | Source | When |
|---------|--------|------|
| `FileTree.FsFileTreeAccessors` | `@fgv/ts-json-base` | Node filesystem |
| In-memory accessors | `@fgv/ts-json-base` | Tests, RAM-only |
| `ZipFileTree.ZipFileTreeAccessors` | `@fgv/ts-extras` | Read/write zip blobs |
| `FileApiTreeAccessors` | `@fgv/ts-web-extras` | Browser localStorage, File System Access (`DirectoryHandle`), HTTP-backed cloud |

**Loaders never branch on adapter type.** They take a `FileTreeItem`
and call the same API regardless of who's behind it.

## The "single importer, any source" pattern

Importer signatures take `FileTree.IFileTreeDirectoryItem` or
`FileTree.FileTreeItem` — never paths, file handles, or buffers. The
adapter is selected once at boot and injected downward.

```typescript
public loadFromFileTree(
  fileTree: FileTree.FileTreeItem,                  // accepts ANY adapter
  params: ILoadCollectionParams = {}
): Result<ICollectionLoadResult> {
  return filter.filterDirectory(fileTree, dirParams).onSuccess((items) => {
    const results = items.map((item) =>
      item.item
        .getRawContents()                           // adapter-agnostic read
        .onSuccess((raw) => parseContents(raw))     // JSON or YAML
        .onSuccess((json) => sourceFileConverter.convert(json))
        .onSuccess((sourceFile) =>
          collectionConverter.convert({
            id: item.name,
            items: sourceFile.items,
            metadata: sourceFile.metadata
          }).onSuccess((collection) =>
            succeed({ ...collection, sourceItem: item.item })   // back-pointer (see below)
          )
        )
    );
    return mapResults(results).onSuccess((collections) => succeed({ collections }));
  });
}
```

**Source-item back-pointer pattern**: stamp each loaded record with
the `FileTreeItem` it came from. A later writer can call
`record.sourceItem.setRawContents(...)` or `.delete()` without
knowing which adapter produced it. This is how persistence layers
round-trip edits without re-resolving paths.

## A representative exporter

Same shape — takes a directory item, doesn't care which adapter
backs it. The two helpers below (`_ensureDirectory`, `_writeFile`)
are reusable verbatim across consumers.

```typescript
async function publishCollection(params: IPublishParams): Promise<Result<IPublishOutcome>> {
  const { publisherDir, subLibraryId, collectionId, content, filename } = params;

  const subLibPath = getSubLibraryPath(subLibraryId);
  const targetDirResult = await _ensureDirectory(publisherDir, subLibPath);
  if (targetDirResult.isFailure()) return fail(`${subLibraryId}/${collectionId}: ${targetDirResult.message}`);
  const targetDir = targetDirResult.value;

  const writeResult = _writeFile(targetDir, filename, content);
  if (writeResult.isFailure()) return fail(`${subLibraryId}/${collectionId}: write: ${writeResult.message}`);

  return succeed({ filePath: `${targetDir.absolutePath}/${filename}` });
}

async function _ensureDirectory(
  root: FileTree.IFileTreeDirectoryItem,
  relativePath: string
): Promise<Result<FileTree.IFileTreeDirectoryItem>> {
  let current = root;
  for (const segment of relativePath.split('/').filter((s) => s.length > 0)) {
    const childrenResult = current.getChildren();
    if (childrenResult.isFailure()) return fail(childrenResult.message);
    const existing = childrenResult.value.find((c) => c.name === segment && c.type === 'directory');
    if (existing) {
      current = existing as FileTree.IFileTreeDirectoryItem;
      continue;
    }
    if (!FileTree.isMutableDirectoryItem(current)) return fail(`${current.absolutePath}: not mutable`);
    const createResult = current.createChildDirectory(segment);
    if (createResult.isFailure()) return fail(createResult.message);
    current = createResult.value;
  }
  return succeed(current);
}

function _writeFile(
  dir: FileTree.IFileTreeDirectoryItem,
  filename: string,
  content: string
): Result<string> {
  return dir.getChildren().onSuccess((children) => {
    const existing = children.find((c) => c.name === filename && c.type === 'file');
    if (existing) {
      if (!FileTree.isMutableFileItem(existing)) return fail(`${dir.absolutePath}/${filename}: not mutable`);
      return existing.setRawContents(content).onSuccess(() => succeed(content));
    }
    if (!FileTree.isMutableDirectoryItem(dir)) return fail(`${dir.absolutePath}: not mutable`);
    return dir.createChildFile(filename, content).onSuccess(() => succeed(content));
  });
}
```

## Anti-patterns (self-check before merging)

If your code does any of the below in business logic, you have not
yet drawn the adapter seam. Push the `fs` / `path` / `Buffer` work
outward until the loader takes a `FileTreeItem`.

- **No `fs.readFile` / `fs.writeFile`** (sync or async). Reads →
  `item.getRawContents()` / `item.getContents()`. Writes →
  `item.setRawContents()` / `item.createChildFile()`.
- **No `path.join` / `path.resolve`** in importers/exporters. Path
  composition is `'/'`-joins on FileTree-relative paths. Absolute
  filesystem paths exist only inside adapter construction.
- **No `glob` / `fast-glob` / `readdir` recursion.** Directory
  traversal is `getChildren()` + recursion + `child.type ===
  'directory'` dispatch.
- **No `Buffer` / `ArrayBuffer` shuffling around the read path.**
  `getRawContents()` returns `string`. Buffers live only at zip and
  HTTP boundaries.
- **No `mkdirSync` / `mkdir({ recursive: true })`** in business
  logic. Directory creation is `_ensureDirectory(root, relativePath)`
  walking the tree.
- **No write through a non-mutable item.** Every write is gated on
  the type guards.
- **No string paths flowing into loaders.** Loader signatures take
  `FileTree.IFileTreeDirectoryItem` or `FileTree.FileTreeItem`,
  never `string`. If a loader needs to be told which subdirectory
  to start from, it takes a `directoryNavigator: (root) =>
  Result<dir>` callback — not a path string.

## When to drop down to node fs anyway

Two legitimate cases, both at the **boot edge**, never in feature
code:

1. **Constructing the `FsFileTreeAccessors` itself.** You need
   `path.resolve`, `fs.existsSync`, `fs.statSync`, possibly
   `fs.mkdirSync` to validate or create the root before wrapping it.
2. **Reading a file outside any FileTree.** E.g. a keystore at a
   user-provided absolute path that isn't inside an opened tree. If
   the file *is* inside an opened tree, use `getChildren()` /
   `getItem()` — don't bypass.

Everything else — loading, saving, walking, transforming,
publishing — stays inside FileTree.

## Adapter selection idiom

Selection is **not** a runtime detection helper. The boot script
picks one based on environment and injects the resulting
`FileTreeItem` downward. Loaders never branch on adapter type.

### Node fs — canonical helper

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { FileTree } from '@fgv/ts-json-base';
import { fail, Result } from '@fgv/ts-utils';

export function createFileTreeRoot(
  dirPath: string,
  options?: { mutable?: boolean }
): Result<FileTree.IFileTreeDirectoryItem> {
  const resolved = path.resolve(dirPath);
  if (!fs.existsSync(resolved)) return fail(`${dirPath}: not found`);
  if (!fs.statSync(resolved).isDirectory()) return fail(`${dirPath}: not a directory`);
  const accessors = new FileTree.FsFileTreeAccessors({
    prefix: resolved,
    mutable: options?.mutable === true
  });
  return FileTree.DirectoryItem.create('.', accessors);
}
```

### Zip — read / write

```typescript
import { ZipFileTree } from '@fgv/ts-extras';

// read
const accessorsResult = await ZipFileTree.ZipFileTreeAccessors.fromBufferAsync(zipData);

// write
const files: Array<{ path: string; contents: string }> = [...];
return ZipFileTree.createZipFromTextFiles(files);                  // → Result<Uint8Array>
```

### Browser localStorage / File System Access

```typescript
import { FileApiTreeAccessors } from '@fgv/ts-web-extras';

// localStorage
const treeResult = FileApiTreeAccessors.createFromLocalStorage({
  pathToKeyMap, storage: window.localStorage, mutable: true, autoSync: true
});

// File System Access
const treeResult = await FileApiTreeAccessors.createPersistent(dirHandle, { autoSync: true });
```

## Boot-script injection pattern

Platform initializers own adapter selection. They produce a result
where every tree-typed field is
`FileTree.IFileTreeDirectoryItem`. From that point downward, no
module knows or cares which adapter is in play.

When building a new consumer of FileTree:

1. **One entry function per environment** (`createNodeRoot`,
   `createBrowserRoot`, `createInMemoryRoot`) that hands back
   `FileTreeItem`s.
2. **Feature code takes those items as parameters.** No fs imports,
   no environment branching.
3. **Tests inject in-memory trees.** Same feature code; different
   adapter.

If you can't write a single feature function that works against all
four adapter types, the seam isn't drawn far enough out — keep
refactoring.
