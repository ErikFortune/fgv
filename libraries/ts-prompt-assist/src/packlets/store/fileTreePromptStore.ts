/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Logging, Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import { FileTree as FileTreeNs } from '@fgv/ts-json-base';
import { Yaml } from '@fgv/ts-extras';
import type {
  IQualifierDecl,
  IScopeSlotBindingsRecord,
  IStoredPromptRecord,
  PromptId,
  ScopeKey
} from '../types';
import type { IPromptStore, IPromptStoreListFilter } from './interfaces';
import {
  qualifierDeclsConverter,
  scopeSlotBindingsRecordConverter,
  storedPromptRecordConverter
} from '../converters';

/** Reserved filename stems that are not treated as prompt files. */
const RESERVED_STEMS: ReadonlySet<string> = new Set(['_bindings', '_qualifiers']);

/** Windows reserved device names (case-insensitive). */
const WINDOWS_RESERVED: ReadonlySet<string> = new Set([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  'COM1',
  'COM2',
  'COM3',
  'COM4',
  'COM5',
  'COM6',
  'COM7',
  'COM8',
  'COM9',
  'LPT1',
  'LPT2',
  'LPT3',
  'LPT4',
  'LPT5',
  'LPT6',
  'LPT7',
  'LPT8',
  'LPT9'
]);

/** POSIX portable filename characters. */
const POSIX_PORTABLE_RE: RegExp = /^[A-Za-z0-9._-]+$/;

/**
 * Validates that an encoded scope string is safe to use as a directory name (OQ-1).
 */
function validateDefaultScopeEncoding(encoded: string): Result<string> {
  if (encoded.includes('/') || encoded.includes('\\') || encoded.includes('\0')) {
    return fail(`scope encoding '${encoded}' contains path separators or null bytes`);
  }
  if (encoded.startsWith('.')) {
    return fail(`scope encoding '${encoded}' starts with '.'`);
  }
  if (encoded.includes(':')) {
    return fail(`scope encoding '${encoded}' contains ':' (not path-safe on Windows)`);
  }
  if (!POSIX_PORTABLE_RE.test(encoded)) {
    return fail(`scope encoding '${encoded}' contains characters outside the POSIX portable filename set`);
  }
  if (WINDOWS_RESERVED.has(encoded.toUpperCase())) {
    return fail(`scope encoding '${encoded}' is a reserved Windows device name`);
  }
  return succeed(encoded);
}

/**
 * Parameters for creating a {@link FileTreePromptStore}.
 * @public
 */
export interface IFileTreePromptStoreCreateParams {
  /** Root of the FileTree to read from. */
  readonly root: FileTreeNs.FileTree;
  /**
   * Custom scope encoding function.
   * Default: identity with path-safety validation.
   */
  readonly scopeEncoding?: (scope: ScopeKey) => Result<string>;
  /**
   * Custom scope decoding function.
   * Default: identity with path-safety validation.
   */
  readonly scopeDecoding?: (encoded: string) => Result<ScopeKey>;
  /** Optional logger for warnings during list operations. */
  readonly logger?: Logging.ILogger;
}

/**
 * FileTree-backed implementation of {@link IPromptStore}.
 * Read-only in v0.1; the optional write surface is not implemented.
 * @public
 */
export class FileTreePromptStore implements IPromptStore {
  private readonly _root: FileTreeNs.FileTree;
  private readonly _scopeEncoding: (scope: ScopeKey) => Result<string>;
  private readonly _scopeDecoding: (encoded: string) => Result<ScopeKey>;
  private readonly _logger: Logging.ILogger | undefined;

  private constructor(params: IFileTreePromptStoreCreateParams) {
    this._root = params.root;
    this._scopeEncoding = params.scopeEncoding ?? ((scope) => validateDefaultScopeEncoding(scope as string));
    this._scopeDecoding =
      params.scopeDecoding ??
      ((encoded) => validateDefaultScopeEncoding(encoded).onSuccess(() => succeed(encoded as ScopeKey)));
    this._logger = params.logger;
  }

  /**
   * Creates a new {@link FileTreePromptStore}.
   */
  public static create(params: IFileTreePromptStoreCreateParams): Result<FileTreePromptStore> {
    return captureResult(() => new FileTreePromptStore(params));
  }

  /** {@inheritDoc IPromptStore.get} */
  public async get(scope: ScopeKey, id: PromptId): Promise<Result<IStoredPromptRecord | undefined>> {
    const encodeResult = this._scopeEncoding(scope);
    if (encodeResult.isFailure()) {
      return fail(`scope '${scope}': ${encodeResult.message}`);
    }
    const encoded = encodeResult.value;
    const filePath = `${encoded}/${id}.yaml`;
    const fileResult = this._root.getFile(filePath);
    if (fileResult.isFailure()) {
      return succeed(undefined);
    }
    const rawResult = fileResult.value.getRawContents();
    if (rawResult.isFailure()) {
      return fail(`${filePath}: ${rawResult.message}`);
    }
    return Yaml.yamlConverter(storedPromptRecordConverter(scope, id)).convert(rawResult.value);
  }

  /** {@inheritDoc IPromptStore.list} */
  public async list(filter?: IPromptStoreListFilter): Promise<Result<ReadonlyArray<IStoredPromptRecord>>> {
    const rootDirResult = this._root.getDirectory('/');
    /* c8 ignore next 3 - defensive coding: root directory should always be accessible */
    if (rootDirResult.isFailure()) {
      return fail(`list: ${rootDirResult.message}`);
    }
    const childrenResult = rootDirResult.value.getChildren();
    /* c8 ignore next 3 - defensive coding: root directory children should always be listable */
    if (childrenResult.isFailure()) {
      return fail(`list: ${childrenResult.message}`);
    }

    const results: IStoredPromptRecord[] = [];
    for (const child of childrenResult.value) {
      if (child.type !== 'directory') continue;

      const scopeResult = this._scopeDecoding(child.name);
      if (scopeResult.isFailure()) continue;
      const scope = scopeResult.value;

      if (filter?.scope !== undefined && filter.scope !== scope) continue;

      const subDirResult = this._root.getDirectory(child.absolutePath);
      /* c8 ignore next 1 - defensive coding: subdirectory should always be accessible */
      if (subDirResult.isFailure()) continue;

      const filesResult = subDirResult.value.getChildren();
      /* c8 ignore next 1 - defensive coding: subdirectory children should always be listable */
      if (filesResult.isFailure()) continue;

      for (const file of filesResult.value) {
        if (file.type !== 'file') continue;
        if (!file.name.endsWith('.yaml')) continue;
        const stem = file.name.slice(0, -5);
        if (RESERVED_STEMS.has(stem)) continue;
        const id = stem as PromptId;
        if (filter?.id !== undefined && filter.id !== id) continue;

        const recordResult = await this.get(scope, id);
        if (recordResult.isFailure()) {
          this._logger?.warn(`list: skipping ${child.name}/${file.name}: ${recordResult.message}`);
          continue;
        }
        if (recordResult.value !== undefined) {
          results.push(recordResult.value);
        }
      }
    }
    return succeed(results);
  }

  /** {@inheritDoc IPromptStore.getBindings} */
  public async getBindings(scope: ScopeKey): Promise<Result<IScopeSlotBindingsRecord | undefined>> {
    const encodeResult = this._scopeEncoding(scope);
    if (encodeResult.isFailure()) {
      return fail(`scope '${scope}': ${encodeResult.message}`);
    }
    const encoded = encodeResult.value;
    const filePath = `${encoded}/_bindings.yaml`;
    const fileResult = this._root.getFile(filePath);
    if (fileResult.isFailure()) {
      return succeed(undefined);
    }
    const rawResult = fileResult.value.getRawContents();
    if (rawResult.isFailure()) {
      return fail(`${filePath}: ${rawResult.message}`);
    }
    return Yaml.yamlConverter(scopeSlotBindingsRecordConverter(scope)).convert(rawResult.value);
  }

  /** {@inheritDoc IPromptStore.getQualifierConfig} */
  public async getQualifierConfig(): Promise<Result<ReadonlyArray<IQualifierDecl> | undefined>> {
    const filePath = '_qualifiers.yaml';
    const fileResult = this._root.getFile(filePath);
    if (fileResult.isFailure()) {
      return succeed(undefined);
    }
    const rawResult = fileResult.value.getRawContents();
    if (rawResult.isFailure()) {
      return fail(`${filePath}: ${rawResult.message}`);
    }
    return Yaml.yamlConverter(qualifierDeclsConverter).convert(rawResult.value);
  }
}
