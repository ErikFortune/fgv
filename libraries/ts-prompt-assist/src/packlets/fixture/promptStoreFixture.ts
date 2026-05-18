/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import { Yaml } from '@fgv/ts-extras';
import { Qualifiers } from '@fgv/ts-res';
import { PromptId, ScopeKey, SlotName } from '../types';
import { SlotBinding } from '../types';
import { IPromptDescriptor, IScopeSlotBindingsRecord, ITypedPromptCandidateRecord } from '../types';
import { defaultScopeEncoding } from '../store';
import { FileTreePromptStore } from '../store';
import { IPromptStore } from '../store';

/**
 * Fixture-seed-only descriptor shape: `id` is optional. Per F12, on
 * the fixture path the outer `IPromptStoreFixtureSeedRecord.id` already
 * carries the prompt id, so the nested `descriptor.id` is redundant —
 * the fixture defaults it from the outer id when omitted. An explicit
 * `descriptor.id` that mismatches the outer id is rejected loudly.
 *
 * The on-disk-YAML schema is unchanged: the filename stem matters
 * there, so `IPromptDescriptor.id` remains required on the
 * loader-facing descriptor type.
 *
 * @public
 */
export type IPromptStoreFixtureDescriptor = Omit<IPromptDescriptor, 'id'> & {
  readonly id?: PromptId;
};

/**
 * Fixture-seed-only record shape: descriptor.id is optional and
 * defaults to the outer record id (per F12). Candidate `conditions`
 * keys are narrowed by `TQualifierNames` (per F1) so typo'd axis
 * names fail at compile time when the seed is threaded through a
 * `TQualifierNames`-typed fixture build. Default
 * `TQualifierNames = string` keeps unnarrowed seeds compiling
 * unchanged.
 *
 * Other fields mirror {@link IStoredPromptRecord}.
 *
 * @public
 */
export interface IPromptStoreFixtureSeedRecord<TQualifierNames extends string = string> {
  readonly scope: ScopeKey;
  readonly id: PromptId;
  readonly descriptor: IPromptStoreFixtureDescriptor;
  readonly candidates: ReadonlyArray<ITypedPromptCandidateRecord<TQualifierNames>>;
}

/**
 * Seed describing the in-memory FileTree state for a test fixture.
 *
 * @remarks
 * Parameterized on `TQualifierNames extends string` (per F1). When
 * `PromptStoreFixture.build` infers `TQualifierNames` from a typed
 * call site (e.g. an `IPromptStoreFixtureSeed<'tone'>` annotation, or
 * via the inferring `build<TQualifierNames>(seed)` signature), the
 * candidates' `conditions` keys are narrowed to that union. Default
 * `TQualifierNames = string` keeps existing call sites working
 * unchanged.
 *
 * @public
 */
export interface IPromptStoreFixtureSeed<TQualifierNames extends string = string> {
  readonly records?: ReadonlyArray<IPromptStoreFixtureSeedRecord<TQualifierNames>>;
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

function serializePromptRecord(record: IPromptStoreFixtureSeedRecord<string>): Result<string> {
  return defaultDescriptorIdFromOuter(record).onSuccess((descriptor) =>
    Yaml.yamlStringify({ ...descriptor, candidates: record.candidates })
  );
}

/**
 * Per F12: descriptor.id is optional on the fixture seed. If omitted,
 * default from the outer record.id. If explicitly supplied and it
 * mismatches the outer id, reject loudly — the redundancy is gone but
 * silent inconsistency must remain impossible.
 */
function defaultDescriptorIdFromOuter(
  record: IPromptStoreFixtureSeedRecord<string>
): Result<IPromptDescriptor> {
  const descriptor = record.descriptor;
  if (descriptor.id === undefined) {
    return succeed({ ...descriptor, id: record.id });
  }
  if (descriptor.id !== record.id) {
    return fail(
      `fixture: record id '${record.id}' does not match descriptor.id '${descriptor.id}'; ` +
        `descriptor.id is optional on the fixture seed but, if supplied, must match the outer id`
    );
  }
  return succeed({ ...descriptor, id: descriptor.id });
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
 * @remarks
 * Generic over `TQualifierNames extends string` (per F1). Inferred from
 * the supplied seed when the seed's `IPromptStoreFixtureSeed<...>`
 * type parameter is narrowed at the call site — e.g.
 * `PromptStoreFixture.build<'tone'>(seed)` or via an annotated
 * `const seed: IPromptStoreFixtureSeed<'tone'> = { ... }`. The
 * resulting store has the same runtime shape regardless of
 * `TQualifierNames`; the parameter exists purely to drive compile-
 * time narrowing of candidate `conditions` keys.
 *
 * @public
 */
export const PromptStoreFixture: {
  build<TQualifierNames extends string = string>(
    seed: IPromptStoreFixtureSeed<TQualifierNames>
  ): Promise<Result<IPromptStore>>;
} = {
  /**
   * Builds an in-memory FileTree from the seed, then wraps it in a
   * `FileTreePromptStore`. Returns the store ready for use.
   */
  async build<TQualifierNames extends string = string>(
    seed: IPromptStoreFixtureSeed<TQualifierNames>
  ): Promise<Result<IPromptStore>> {
    return buildSeededStore(seed);
  }
} as const;

function buildSeededStore(seed: IPromptStoreFixtureSeed<string>): Promise<Result<IPromptStore>> {
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
  records: ReadonlyArray<IPromptStoreFixtureSeedRecord<string>> | undefined,
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
