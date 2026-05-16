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
  /** Optional scope encoder. Defaults to identity (path-safety enforced). */
  readonly scopeEncoding?: (scope: ScopeKey) => Result<string>;
  // Copilot review (PR #362, deferred to B-1b): when a non-identity
  // `scopeEncoding` is supplied, the fixture does NOT plumb a paired
  // `scopeDecoding` through to FileTreePromptStore.create. `store.list()`
  // will then decode directory names via the default decoder, producing
  // ScopeKeys that don't round-trip with the custom encoder. B-1b should
  // either add `readonly scopeDecoding?` here and forward it, or constrain
  // the seed to require both halves. v0.1 fixture consumers stay on the
  // identity encoder; non-identity is exercised only as a coverage probe.
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

// Copilot review (PR #362, deferred to B-1b): the three `mapResults` /
// `serializeQualifiers` calls below run eagerly regardless of upstream
// failure (they only short-circuit when threaded through `onSuccess`).
// For small fixture seeds this is harmless; for large seeds with an
// early-input failure it wastes serialization work. B-1b should
// restructure as a single chained `mapResults` over the union of files,
// or compute each step lazily inside `onSuccess` callbacks.
function buildSeededStore(seed: IPromptStoreFixtureSeed): Promise<Result<IPromptStore>> {
  const encode = seed.scopeEncoding ?? defaultScopeEncoding;
  const files: FileTree.IInMemoryFile[] = [];

  const recordFiles = mapResults(
    (seed.records ?? []).map((record) =>
      encode(record.scope)
        .withErrorFormat((msg) => `fixture: failed to encode record scope: ${msg}`)
        .onSuccess((encoded) =>
          serializePromptRecord(record)
            .withErrorFormat((msg) => `fixture: failed to serialize record: ${msg}`)
            .onSuccess((text) => succeed({ path: `/${encoded}/${record.id}.yaml`, contents: text }))
        )
    )
  );

  const bindingFiles = mapResults(
    (seed.bindings ?? []).map((bindingsRecord) =>
      encode(bindingsRecord.scope)
        .withErrorFormat((msg) => `fixture: failed to encode bindings scope: ${msg}`)
        .onSuccess((encoded) =>
          serializeBindingsRecord(bindingsRecord)
            .withErrorFormat((msg) => `fixture: failed to serialize bindings: ${msg}`)
            .onSuccess((text) => succeed({ path: `/${encoded}/_bindings.yaml`, contents: text }))
        )
    )
  );

  const qualifierFile: Result<FileTree.IInMemoryFile | undefined> =
    seed.qualifiers === undefined
      ? succeed(undefined)
      : serializeQualifiers(seed.qualifiers)
          .withErrorFormat((msg) => `fixture: failed to serialize qualifiers: ${msg}`)
          .onSuccess((text) => succeed({ path: '/_qualifiers.yaml', contents: text }));

  return Promise.resolve(
    recordFiles.onSuccess((records) =>
      bindingFiles.onSuccess((bindings) =>
        qualifierFile.onSuccess((qualifiers) => {
          files.push(...records, ...bindings);
          if (qualifiers !== undefined) {
            files.push(qualifiers);
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
    )
  ).then(async (rootResult): Promise<Result<IPromptStore>> => {
    /* c8 ignore next 4 - upstream chain only fails on Yaml/encode error,
       which the dedicated fixture-error tests cover in earlier branches */
    if (rootResult.isFailure()) {
      return fail(rootResult.message);
    }
    return FileTreePromptStore.create({
      root: rootResult.value,
      scopeEncoding: seed.scopeEncoding
    });
  });
}
