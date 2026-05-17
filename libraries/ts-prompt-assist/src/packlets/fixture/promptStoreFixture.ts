/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import { Yaml } from '@fgv/ts-extras';
import { Qualifiers } from '@fgv/ts-res';
import { ScopeKey, SlotName } from '../types';
import { SlotBinding } from '../types';
import { IScopeSlotBindingsRecord, IStoredPromptRecord } from '../types';
import { defaultScopeEncoding } from '../store';
import { FileTreePromptStore } from '../store';
import { IPromptStore } from '../store';

/**
 * Seed describing the in-memory FileTree state for a test fixture.
 * @public
 */
export interface IPromptStoreFixtureSeed {
  readonly records?: ReadonlyArray<IStoredPromptRecord>;
  readonly bindings?: ReadonlyArray<IScopeSlotBindingsRecord>;
  readonly qualifiers?: ReadonlyArray<Qualifiers.IQualifierDecl>;
  /**
   * Optional scope encoder. Defaults to identity (path-safety enforced
   * via {@link defaultScopeEncoding}).
   */
  readonly scopeEncoding?: (scope: ScopeKey) => Result<string>;
  /**
   * Optional scope decoder. Defaults to identity (path-safety enforced
   * via {@link defaultScopeDecoding}). When `scopeEncoding` is non-
   * identity, supplying a paired `scopeDecoding` is REQUIRED — otherwise
   * `store.list()` (and any operation that walks directory names back to
   * `ScopeKey`s) will round-trip incorrectly.
   */
  readonly scopeDecoding?: (encoded: string) => Result<ScopeKey>;
}

function serializeBindingsRecord(record: IScopeSlotBindingsRecord): Result<string> {
  const bindings: Record<string, SlotBinding> = {};
  record.bindings.forEach((b, slot: SlotName) => {
    bindings[slot] = b;
  });
  return Yaml.yamlStringify({ bindings });
}

function serializePromptRecord(record: IStoredPromptRecord): Result<string> {
  const { descriptor, candidates } = record;
  return Yaml.yamlStringify({ ...descriptor, candidates });
}

function serializeQualifiers(qualifiers: ReadonlyArray<Qualifiers.IQualifierDecl>): Result<string> {
  return Yaml.yamlStringify({ qualifiers });
}

/**
 * Test fixture helper that builds an `InMemoryFileTree` containing the
 * supplied records / bindings / qualifier config and returns a
 * `FileTreePromptStore` backed by it. Per design §5.2: no standalone
 * `InMemoryPromptStore`; tests round-trip through the same YAML schema
 * the FsTree adapter would.
 *
 * @public
 */
export const PromptStoreFixture: {
  build(seed: IPromptStoreFixtureSeed): Promise<Result<IPromptStore>>;
} = {
  /**
   * Builds an in-memory FileTree from the seed, then wraps it in a
   * `FileTreePromptStore`. Returns the store ready for use.
   */
  async build(seed: IPromptStoreFixtureSeed): Promise<Result<IPromptStore>> {
    return buildSeededStore(seed);
  }
} as const;

function buildSeededStore(seed: IPromptStoreFixtureSeed): Promise<Result<IPromptStore>> {
  const encode = seed.scopeEncoding ?? defaultScopeEncoding;

  // Single chained pipeline — each step runs only after the previous
  // succeeds, so an early failure short-circuits without wasted
  // serialization work.
  const buildResult: Result<FileTree.IFileTreeDirectoryItem> = encodeRecords(seed.records, encode).onSuccess(
    (recordFiles) =>
      encodeBindings(seed.bindings, encode).onSuccess((bindingFiles) =>
        encodeQualifiers(seed.qualifiers).onSuccess((qualifierFile) => {
          const files: FileTree.IInMemoryFile[] = [...recordFiles, ...bindingFiles];
          if (qualifierFile !== undefined) {
            files.push(qualifierFile);
          }
          return FileTree.inMemory(files)
            .withErrorFormat((msg) => `fixture: failed to build in-memory file tree: ${msg}`)
            .onSuccess((tree) =>
              tree
                .getDirectory('/')
                .withErrorFormat((msg) => `fixture: failed to access in-memory root: ${msg}`)
            );
        })
      )
  );

  /* c8 ignore next 3 - defensive: upstream Yaml/encode failures are unit-tested at their site; this is the catch-all that funnels them to a rejected Promise */
  if (buildResult.isFailure()) {
    return Promise.resolve(fail(buildResult.message));
  }
  return FileTreePromptStore.create({
    root: buildResult.value,
    scopeEncoding: seed.scopeEncoding,
    scopeDecoding: seed.scopeDecoding
  });
}

function encodeRecords(
  records: ReadonlyArray<IStoredPromptRecord> | undefined,
  encode: (scope: ScopeKey) => Result<string>
): Result<ReadonlyArray<FileTree.IInMemoryFile>> {
  return mapResults(
    (records ?? []).map((record) =>
      encode(record.scope)
        .withErrorFormat((msg) => `fixture: failed to encode record scope: ${msg}`)
        .onSuccess((encoded) =>
          serializePromptRecord(record)
            .withErrorFormat((msg) => `fixture: failed to serialize record: ${msg}`)
            .onSuccess((text) => succeed({ path: `/${encoded}/${record.id}.yaml`, contents: text }))
        )
    )
  );
}

function encodeBindings(
  bindings: ReadonlyArray<IScopeSlotBindingsRecord> | undefined,
  encode: (scope: ScopeKey) => Result<string>
): Result<ReadonlyArray<FileTree.IInMemoryFile>> {
  return mapResults(
    (bindings ?? []).map((bindingsRecord) =>
      encode(bindingsRecord.scope)
        .withErrorFormat((msg) => `fixture: failed to encode bindings scope: ${msg}`)
        .onSuccess((encoded) =>
          serializeBindingsRecord(bindingsRecord)
            .withErrorFormat((msg) => `fixture: failed to serialize bindings: ${msg}`)
            .onSuccess((text) => succeed({ path: `/${encoded}/_bindings.yaml`, contents: text }))
        )
    )
  );
}

function encodeQualifiers(
  qualifiers: ReadonlyArray<Qualifiers.IQualifierDecl> | undefined
): Result<FileTree.IInMemoryFile | undefined> {
  if (qualifiers === undefined) {
    return succeed(undefined);
  }
  return serializeQualifiers(qualifiers)
    .withErrorFormat((msg) => `fixture: failed to serialize qualifiers: ${msg}`)
    .onSuccess((text) => succeed({ path: '/_qualifiers.yaml', contents: text }));
}
