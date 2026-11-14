/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import { Yaml } from '@fgv/ts-extras';
import { Qualifiers } from '@fgv/ts-res';
import { PromptId, ScopeKey } from '../types';
import { IScopeSlotBindingsRecord, IStoredPromptRecord } from '../types';
import {
  IBindingsFileContents,
  IPromptFileContents,
  IQualifiersFileContents,
  bindingsFileConverter,
  buildBindingsRecord,
  buildStoredPromptRecord,
  promptFileConverter,
  qualifiersFileConverter,
  typedPromptFileConverter
} from '../converters';
import { IPromptStore, IPromptStoreListFilter } from './interfaces';
import { defaultScopeDecoding, defaultScopeEncoding } from './scopeEncoding';

/**
 * Parameters for {@link FileTreePromptStore.create}.
 *
 * @remarks
 * Parameterized on `TQualifierNames extends string = string` (B-3). The
 * optional `qualifierNameConverter` threads through to the YAML loader
 * so candidate `conditions` keys are validated at convert time against
 * a consumer-supplied literal-string union. When omitted, the loader
 * uses today's default-string `ResourceJson.Convert.conditionSetDecl`
 * — existing call sites behave unchanged.
 *
 * @public
 */
export interface IFileTreePromptStoreCreateParams<TQualifierNames extends string = string> {
  /** Root directory under which scope-encoded sub-trees live. */
  readonly root: FileTree.IFileTreeDirectoryItem;
  /** Default: identity (treat ScopeKey as path-safe). */
  readonly scopeEncoding?: (scope: ScopeKey) => Result<string>;
  /** Default: identity, validated against the path-safety contract. */
  readonly scopeDecoding?: (encoded: string) => Result<ScopeKey>;
  /**
   * Optional ts-res qualifier-name Converter (B-3). When supplied, the
   * YAML loader validates each candidate's `conditions` keys (record
   * form) or `qualifierName` fields (array form) against the
   * Converter's literal-string union via
   * `ResourceJson.Convert.typedConditionSetDecl(qc)`. A typo'd axis
   * name fails at convert time with a Converter-level error. When
   * omitted, the loader keeps today's permissive default-string
   * behavior.
   */
  readonly qualifierNameConverter?: Converter<TQualifierNames>;
}

const PROMPT_FILE_EXTENSION: string = '.yaml';
const BINDINGS_FILE_NAME: string = '_bindings.yaml';
const QUALIFIERS_FILE_NAME: string = '_qualifiers.yaml';

const bindingsYamlConverter: Converter<IBindingsFileContents> = Yaml.yamlConverter(bindingsFileConverter);
const qualifiersYamlConverter: Converter<IQualifiersFileContents> =
  Yaml.yamlConverter(qualifiersFileConverter);

/**
 * Per design §5.3 the descriptor's `id` field MUST equal the filename
 * stem (`<prompt-id>.yaml`). The loader rejects mismatches loudly so
 * round-trip stores and cross-backend tooling cannot drift between
 * the on-disk identifier and the in-record identifier.
 */
function verifyFilenameId(
  file: FileTree.IFileTreeFileItem,
  contents: IPromptFileContents
): Result<IPromptFileContents> {
  if (contents.descriptor.id !== file.baseName) {
    return fail(
      `prompt file '${file.absolutePath}': descriptor.id '${contents.descriptor.id}' does not match filename stem '${file.baseName}'`
    );
  }
  return succeed(contents);
}

interface IInternalStoreParams {
  readonly root: FileTree.IFileTreeDirectoryItem;
  readonly scopeEncoding?: (scope: ScopeKey) => Result<string>;
  readonly scopeDecoding?: (encoded: string) => Result<ScopeKey>;
  readonly promptYamlConverter: Converter<IPromptFileContents>;
}

/**
 * Read-only FileTree-backed {@link IPromptStore}. v0.1 implements `get`,
 * `list`, `getBindings`, and `getQualifierConfig`; write methods and
 * `watch` are intentionally undefined (design §4.6 + OQ-3).
 *
 * @remarks
 * Generic over `TQualifierNames extends string` (B-3). When the optional
 * `qualifierNameConverter` is supplied to `create`, the store's YAML
 * loader narrows candidate `conditions` keys to that union at convert
 * time. Default `TQualifierNames = string` keeps existing call sites
 * compiling unchanged.
 *
 * @public
 */
export class FileTreePromptStore implements IPromptStore {
  private readonly _root: FileTree.IFileTreeDirectoryItem;
  private readonly _scopeEncoding: (scope: ScopeKey) => Result<string>;
  private readonly _scopeDecoding: (encoded: string) => Result<ScopeKey>;
  private readonly _promptYamlConverter: Converter<IPromptFileContents>;

  private constructor(params: IInternalStoreParams) {
    this._root = params.root;
    this._scopeEncoding = params.scopeEncoding ?? defaultScopeEncoding;
    this._scopeDecoding = params.scopeDecoding ?? defaultScopeDecoding;
    this._promptYamlConverter = params.promptYamlConverter;
  }

  /**
   * Family-convention factory.
   *
   * @remarks
   * The signature is `Promise<Result<...>>` for forward compatibility
   * with FsTree adapters whose construction may do real I/O. The v0.1
   * FileTree backend is in-memory or already-loaded FsTree, so this
   * factory resolves synchronously via `Promise.resolve`.
   *
   * The optional `qualifierNameConverter` on `params` threads through
   * to the YAML loader (B-3) — a YAML candidate with a typo'd axis
   * name fails at convert time when the consumer's literal-string
   * union doesn't include the typo. Default-string keeps existing call
   * sites compiling unchanged.
   */
  public static create<TQualifierNames extends string = string>(
    params: IFileTreePromptStoreCreateParams<TQualifierNames>
  ): Promise<Result<FileTreePromptStore>> {
    // The typed-narrow effect lives at convert time: when a Converter
    // is supplied, the loader uses the typed sibling; otherwise the
    // default-string Converter. Both produce structurally compatible
    // `IPromptFileContents` records (string is the widest parameter),
    // so the field is typed at the default lower bound and the
    // narrow flows through the runtime validation.
    const promptYamlConverter: Converter<IPromptFileContents> =
      params.qualifierNameConverter !== undefined
        ? Yaml.yamlConverter(typedPromptFileConverter(params.qualifierNameConverter))
        : Yaml.yamlConverter(promptFileConverter);
    return Promise.resolve(
      succeed(
        new FileTreePromptStore({
          root: params.root,
          scopeEncoding: params.scopeEncoding,
          scopeDecoding: params.scopeDecoding,
          promptYamlConverter
        })
      )
    );
  }

  /** {@inheritDoc IPromptStore.get} */
  public async get(scope: ScopeKey, id: PromptId): Promise<Result<IStoredPromptRecord | undefined>> {
    return this._getScopeDirectory(scope).onSuccess((scopeDir) => {
      if (scopeDir === undefined) {
        return succeed(undefined);
      }
      return this._readPromptFile(scope, id, scopeDir);
    });
  }

  /** {@inheritDoc IPromptStore.list} */
  public async list(filter?: IPromptStoreListFilter): Promise<Result<ReadonlyArray<IStoredPromptRecord>>> {
    return this._root.getChildren().onSuccess((children) => {
      const scopeDirs = children.filter((c): c is FileTree.IFileTreeDirectoryItem => c.type === 'directory');
      const filteredScopeDirs = scopeDirs.filter((d) =>
        filter?.scope === undefined ? true : this._matchesScope(d.name, filter.scope)
      );
      return mapResults(filteredScopeDirs.map((d) => this._listScope(d, filter?.id))).onSuccess(
        (perScope) => {
          const flat = perScope.flatMap((arr) => arr);
          return succeed<ReadonlyArray<IStoredPromptRecord>>(flat);
        }
      );
    });
  }

  /** {@inheritDoc IPromptStore.getBindings} */
  public async getBindings(scope: ScopeKey): Promise<Result<IScopeSlotBindingsRecord | undefined>> {
    return this._getScopeDirectory(scope).onSuccess((scopeDir) => {
      if (scopeDir === undefined) {
        return succeed(undefined);
      }
      return scopeDir.getChildren().onSuccess((children) => {
        const file = children.find(
          (c): c is FileTree.IFileTreeFileItem => c.type === 'file' && c.name === BINDINGS_FILE_NAME
        );
        if (file === undefined) {
          return succeed(undefined);
        }
        return file
          .getRawContents()
          .onSuccess((text) => bindingsYamlConverter.convert(text))
          .onSuccess((contents) => succeed(buildBindingsRecord(scope, contents)));
      });
    });
  }

  /** {@inheritDoc IPromptStore.getQualifierConfig} */
  public async getQualifierConfig(): Promise<Result<ReadonlyArray<Qualifiers.IQualifierDecl> | undefined>> {
    return this._root.getChildren().onSuccess((children) => {
      const file = children.find(
        (c): c is FileTree.IFileTreeFileItem => c.type === 'file' && c.name === QUALIFIERS_FILE_NAME
      );
      if (file === undefined) {
        return succeed(undefined);
      }
      return file
        .getRawContents()
        .onSuccess((text) => qualifiersYamlConverter.convert(text))
        .onSuccess((contents) => succeed(contents.qualifiers));
    });
  }

  private _matchesScope(encodedDirName: string, targetScope: ScopeKey): boolean {
    return this._scopeEncoding(targetScope)
      .onSuccess((encodedTarget) => succeed(encodedDirName === encodedTarget))
      .orDefault(false);
  }

  private _getScopeDirectory(scope: ScopeKey): Result<FileTree.IFileTreeDirectoryItem | undefined> {
    return this._scopeEncoding(scope).onSuccess((encoded) =>
      this._root.getChildren().onSuccess((children) => {
        const dir = children.find(
          (c): c is FileTree.IFileTreeDirectoryItem => c.type === 'directory' && c.name === encoded
        );
        return succeed(dir);
      })
    );
  }

  private _readPromptFile(
    scope: ScopeKey,
    id: PromptId,
    scopeDir: FileTree.IFileTreeDirectoryItem
  ): Result<IStoredPromptRecord | undefined> {
    return scopeDir.getChildren().onSuccess((children) => {
      const targetName = `${id}${PROMPT_FILE_EXTENSION}`;
      const file = children.find(
        (c): c is FileTree.IFileTreeFileItem => c.type === 'file' && c.name === targetName
      );
      if (file === undefined) {
        return succeed(undefined);
      }
      return file
        .getRawContents()
        .onSuccess((text) => this._promptYamlConverter.convert(text))
        .onSuccess((contents) => verifyFilenameId(file, contents))
        .onSuccess((contents) => succeed(buildStoredPromptRecord(scope, contents)));
    });
  }

  private _listScope(
    scopeDir: FileTree.IFileTreeDirectoryItem,
    idFilter?: PromptId
  ): Result<ReadonlyArray<IStoredPromptRecord>> {
    return this._scopeDecoding(scopeDir.name).onSuccess((scope) =>
      scopeDir.getChildren().onSuccess((children) => {
        const promptFiles = children.filter(
          (c): c is FileTree.IFileTreeFileItem =>
            c.type === 'file' && c.name.endsWith(PROMPT_FILE_EXTENSION) && !c.name.startsWith('_')
        );
        const filteredFiles =
          idFilter === undefined ? promptFiles : promptFiles.filter((f) => f.baseName === idFilter);
        return mapResults(
          filteredFiles.map((file) =>
            file
              .getRawContents()
              .onSuccess((text) => this._promptYamlConverter.convert(text))
              .onSuccess((contents) => verifyFilenameId(file, contents))
              .onSuccess((contents) => succeed(buildStoredPromptRecord(scope, contents)))
          )
        );
      })
    );
  }
}
