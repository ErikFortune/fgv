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

import { CryptoUtils } from '@fgv/ts-extras';
import { Converters as JsonConverters, FileTree } from '@fgv/ts-json-base';
import { Converter, fail, MessageAggregator, Result, succeed, Validator } from '@fgv/ts-utils';

import { CollectionId } from '../common';
import { collectionJsonConverter, collectionYamlConverter } from './converters';
import type { ICollectionSourceFile, IEncryptionConfig } from './model';
import { isEncryptedCollectionFile } from './model';

export interface IConflictCopyLookup {
  readonly sourceName: string | undefined;
}

function _readRawFileContents(
  sourceItem: FileTree.FileTreeItem | undefined,
  notReadableMessage: string,
  readFailurePrefix: string
): Result<{ name: string; raw: string }> {
  if (!sourceItem || sourceItem.type !== 'file') {
    return fail(notReadableMessage);
  }

  return sourceItem
    .getRawContents()
    .withErrorFormat((msg) => `${readFailurePrefix}: ${msg}`)
    .onSuccess((raw) => succeed({ name: sourceItem.name, raw }));
}

export function findConflictCopy<TCopy extends IConflictCopyLookup>(
  conflicts: ReadonlyMap<CollectionId, ReadonlyArray<TCopy>>,
  collectionId: string,
  sourceName: string | undefined
): TCopy | undefined {
  const list = conflicts.get(collectionId as CollectionId);
  if (!list?.length) {
    return undefined;
  }
  return list.find((copy) => copy.sourceName === sourceName);
}

export function readPlainSourceFile<TItem>(
  sourceItem: FileTree.FileTreeItem | undefined,
  collectionId: string,
  itemConverter: Converter<TItem> | Validator<TItem>
): Result<ICollectionSourceFile<TItem>> {
  return _readRawFileContents(
    sourceItem,
    `No readable source file for conflicting copy of "${collectionId}"`,
    `Failed to read source file for "${collectionId}"`
  ).onSuccess(({ name, raw }) => {
    const converter = name.endsWith('.json')
      ? collectionJsonConverter(itemConverter)
      : collectionYamlConverter(itemConverter);
    return converter
      .convert(raw)
      .withErrorFormat((msg) => `Failed to parse source file for "${collectionId}": ${msg}`);
  });
}

export async function getKeyForSecret(
  secretName: string,
  encryption: IEncryptionConfig
): Promise<Result<Uint8Array>> {
  if (encryption.secrets) {
    const secret = encryption.secrets.find((s) => s.name === secretName);
    if (secret) {
      return succeed(secret.key);
    }
  }

  if (encryption.secretProvider) {
    return encryption.secretProvider(secretName);
  }

  return fail(`No key available for secret "${secretName}"`);
}

export async function readEncryptedSourceFile<TItem>(params: {
  readonly sourceItem: FileTree.FileTreeItem | undefined;
  readonly collectionId: string;
  readonly secretName: string | undefined;
  readonly encryption: IEncryptionConfig | undefined;
  readonly itemConverter: Converter<TItem> | Validator<TItem>;
}): Promise<Result<ICollectionSourceFile<TItem>>> {
  const { sourceItem, collectionId, secretName, encryption, itemConverter } = params;

  if (!secretName) {
    return fail(`Encrypted copy of "${collectionId}" has no secret name`);
  }

  if (!encryption) {
    return fail(`Key "${secretName}" is required to decrypt the conflicting copy of "${collectionId}"`);
  }

  const jsonResult = _readRawFileContents(
    sourceItem,
    `No readable source file for encrypted conflicting copy of "${collectionId}"`,
    `Failed to read encrypted file for "${collectionId}"`
  )
    .onSuccess(({ raw }) =>
      JsonConverters.jsonObject
        .convert(raw)
        .withErrorFormat((msg) => `Failed to parse encrypted file for "${collectionId}": ${msg}`)
    )
    .onSuccess((json) => {
      if (!isEncryptedCollectionFile(json)) {
        return fail(`File for "${collectionId}" is not a valid encrypted collection`);
      }
      return succeed(json);
    });

  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }

  const keyResult = await getKeyForSecret(secretName, encryption);
  if (keyResult.isFailure()) {
    return fail(`Key "${secretName}" not available: ${keyResult.message}`);
  }

  const decryptResult = await CryptoUtils.decryptFile(
    jsonResult.value as unknown as CryptoUtils.IEncryptedFile<unknown>,
    keyResult.value,
    encryption.cryptoProvider,
    JsonConverters.jsonObject
  );
  if (decryptResult.isFailure()) {
    return fail(`Failed to decrypt "${collectionId}": ${decryptResult.message}`);
  }

  return _convertDecryptedItems(decryptResult.value, collectionId, secretName, itemConverter);
}

function _convertDecryptedItems<TItem>(
  decryptedData: Record<string, unknown>,
  collectionId: string,
  secretName: string,
  itemConverter: Converter<TItem> | Validator<TItem>
): Result<ICollectionSourceFile<TItem>> {
  const convertedItems: Record<string, TItem> = {};
  const errors = new MessageAggregator();

  for (const [itemId, itemData] of Object.entries(decryptedData)) {
    itemConverter
      .convert(itemData)
      .onSuccess((item) => {
        convertedItems[itemId] = item;
        return succeed(item);
      })
      .aggregateError(errors, (msg) => `${itemId}: ${msg}`);
  }

  if (errors.hasMessages) {
    return fail(`Failed to convert items from "${collectionId}": ${errors.toString('; ')}`);
  }

  return succeed({
    metadata: { secretName },
    items: convertedItems
  });
}
