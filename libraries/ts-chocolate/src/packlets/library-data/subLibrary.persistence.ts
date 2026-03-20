// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { fail, Result, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

import { CollectionId } from '../common';
import { navigateToDirectory } from './navigation';
import type { SubLibraryDirectoryNavigator, SubLibraryFileTreeSource } from './subLibrary';

export function deleteSourceFile(
  collectionId: CollectionId,
  sourceItems: Map<CollectionId, FileTree.FileTreeItem>
): Result<void> {
  const sourceItem = sourceItems.get(collectionId);
  if (!sourceItem) {
    return succeed(undefined);
  }

  const deleteResult = FileTree.isMutableFileItem(sourceItem)
    ? sourceItem
        .delete()
        .withErrorFormat((msg) => `Failed to delete backing file for collection "${collectionId}": ${msg}`)
        .onSuccess(() => succeed(undefined))
    : succeed(undefined);

  return deleteResult.onSuccess(() => {
    sourceItems.delete(collectionId);
    return succeed(undefined);
  });
}

export function createDataDirectoryPath(
  sourceRoot: FileTree.IMutableFileTreeDirectoryItem,
  directoryNavigator: SubLibraryDirectoryNavigator
): Result<FileTree.IMutableFileTreeDirectoryItem> {
  for (let attempts = 0; attempts < 5; attempts++) {
    const navResult = directoryNavigator(sourceRoot);
    if (navResult.isSuccess()) {
      const dir = navResult.value;
      if (!FileTree.isMutableDirectoryItem(dir)) {
        return fail(`${dir.absolutePath}: directory is not mutable`);
      }
      return succeed(dir);
    }

    const match = /^(.+): Directory not found at '([^']+)'/.exec(navResult.message);
    if (match?.[2] === undefined) {
      return fail(`Cannot create data directory: ${navResult.message}`);
    }

    const fullPath = match[1];
    const missingSegment = match[2];
    const pathParts = fullPath.split('/');
    const missingIndex = pathParts.indexOf(missingSegment);
    const parentPath = missingIndex > 0 ? pathParts.slice(0, missingIndex).join('/') : '';

    let parent: FileTree.AnyFileTreeDirectoryItem;
    if (parentPath === '') {
      parent = sourceRoot;
    } else {
      const parentResult = navigateToDirectory(sourceRoot, parentPath);
      if (parentResult.isFailure()) {
        return fail(`Cannot find parent directory '${parentPath}': ${parentResult.message}`);
      }
      parent = parentResult.value;
    }

    if (!FileTree.isMutableDirectoryItem(parent)) {
      return fail(`${parent.absolutePath}: directory creation not supported`);
    }

    const createResult = parent.createChildDirectory(missingSegment);
    if (createResult.isFailure()) {
      return fail(`Failed to create directory '${missingSegment}': ${createResult.message}`);
    }
  }

  return directoryNavigator(sourceRoot).onSuccess((dir) => {
    if (!FileTree.isMutableDirectoryItem(dir)) {
      return fail(`${dir.absolutePath}: directory is not mutable`);
    }
    return succeed(dir);
  });
}

export function ensureMutableDataDirectory(options: {
  readonly mutableDataDirectory: FileTree.IMutableFileTreeDirectoryItem | undefined;
  readonly mutableSourceRoot: FileTree.IMutableFileTreeDirectoryItem | undefined;
  readonly directoryNavigator: SubLibraryDirectoryNavigator;
}): Result<FileTree.IMutableFileTreeDirectoryItem> {
  const { mutableDataDirectory, mutableSourceRoot, directoryNavigator } = options;

  if (mutableDataDirectory !== undefined) {
    return succeed(mutableDataDirectory);
  }

  if (mutableSourceRoot === undefined) {
    return fail('No writable data directory available');
  }

  const navResult = directoryNavigator(mutableSourceRoot);
  if (navResult.isSuccess()) {
    const dir = navResult.value;
    if (!FileTree.isMutableDirectoryItem(dir)) {
      return fail(`${dir.absolutePath}: directory is not mutable`);
    }
    return succeed(dir);
  }

  return createDataDirectoryPath(mutableSourceRoot, directoryNavigator);
}

export function findActiveMutableSource(
  fileSources: ReadonlyArray<SubLibraryFileTreeSource>,
  directoryNavigator: SubLibraryDirectoryNavigator
): {
  sourceName?: string;
  mutableDataDirectory?: FileTree.IMutableFileTreeDirectoryItem;
  mutableSourceRoot?: FileTree.IMutableFileTreeDirectoryItem;
} {
  for (const source of fileSources) {
    if (source.mutable === false || source.mutable === undefined) {
      continue;
    }
    const dataDirResult = directoryNavigator(source.directory);
    if (dataDirResult.isSuccess() && FileTree.isMutableDirectoryItem(dataDirResult.value)) {
      return {
        sourceName: source.sourceName,
        mutableDataDirectory: dataDirResult.value
      };
    }
    if (FileTree.isMutableDirectoryItem(source.directory)) {
      return {
        sourceName: source.sourceName,
        mutableSourceRoot: source.directory
      };
    }
  }
  return {};
}
