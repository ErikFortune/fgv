/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Result, mapResults, succeed } from '@fgv/ts-utils';
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
  qualifiersFileConverter
} from '../converters';
import { IPromptStore, IPromptStoreListFilter } from './interfaces';
import { defaultScopeDecoding, defaultScopeEncoding } from './scopeEncoding';

/**
 * Parameters for {@link FileTreePromptStore.create}.
 * @public
 */
export interface IFileTreePromptStoreCreateParams {
  /** Root directory under which scope-encoded sub-trees live. */
  readonly root: FileTree.IFileTreeDirectoryItem;
  /** Default: identity (treat ScopeKey as path-safe). */
  readonly scopeEncoding?: (scope: ScopeKey) => Result<string>;
  /** Default: identity, validated against the path-safety contract. */
  readonly scopeDecoding?: (encoded: string) => Result<ScopeKey>;
}

const PROMPT_FILE_EXTENSION: string = '.yaml';
const BINDINGS_FILE_NAME: string = '_bindings.yaml';
const QUALIFIERS_FILE_NAME: string = '_qualifiers.yaml';

const promptYamlConverter: Converter<IPromptFileContents> = Yaml.yamlConverter(promptFileConverter);
const bindingsYamlConverter: Converter<IBindingsFileContents> = Yaml.yamlConverter(bindingsFileConverter);
const qualifiersYamlConverter: Converter<IQualifiersFileContents> =
  Yaml.yamlConverter(qualifiersFileConverter);

/**
 * Read-only FileTree-backed {@link IPromptStore}. v0.1 implements `get`,
 * `list`, `getBindings`, and `getQualifierConfig`; write methods and
 * `watch` are intentionally undefined (design §4.6 + OQ-3).
 *
 * @public
 */
export class FileTreePromptStore implements IPromptStore {
  private readonly _root: FileTree.IFileTreeDirectoryItem;
  private readonly _scopeEncoding: (scope: ScopeKey) => Result<string>;
  private readonly _scopeDecoding: (encoded: string) => Result<ScopeKey>;

  private constructor(params: IFileTreePromptStoreCreateParams) {
    this._root = params.root;
    this._scopeEncoding = params.scopeEncoding ?? defaultScopeEncoding;
    this._scopeDecoding = params.scopeDecoding ?? defaultScopeDecoding;
  }

  /**
   * Family-convention factory.
   *
   * @remarks
   * The signature is `Promise<Result<...>>` for forward compatibility
   * with FsTree adapters whose construction may do real I/O. The v0.1
   * FileTree backend is in-memory or already-loaded FsTree, so this
   * factory resolves synchronously via `Promise.resolve`.
   */
  public static create(params: IFileTreePromptStoreCreateParams): Promise<Result<FileTreePromptStore>> {
    return Promise.resolve(succeed(new FileTreePromptStore(params)));
  }

  public async get(scope: ScopeKey, id: PromptId): Promise<Result<IStoredPromptRecord | undefined>> {
    return this._getScopeDirectory(scope).onSuccess((scopeDir) => {
      if (scopeDir === undefined) {
        return succeed(undefined);
      }
      return this._readPromptFile(scope, id, scopeDir);
    });
  }

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
        .onSuccess((text) => promptYamlConverter.convert(text))
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
              .onSuccess((text) => promptYamlConverter.convert(text))
              .onSuccess((contents) => succeed(buildStoredPromptRecord(scope, contents)))
          )
        );
      })
    );
  }
}
