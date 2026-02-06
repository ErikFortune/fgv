// Copyright (c) 2024 Erik Fortune
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

import { Converter, Converters, Failure, Result, Success, Validator } from '@fgv/ts-utils';
import { Converters as JsonConverters } from '@fgv/ts-json-base';
import { CryptoUtils, Yaml } from '@fgv/ts-extras';
import {
  EncryptedCollectionFile,
  ICollection,
  ICollectionSourceFile,
  ICollectionSourceMetadata,
  IEncryptedCollectionMetadata
} from './model';

/**
 * Returns a converter that removes one of the specified extensions from the end of a string.
 * @param extensions - An array of extensions to remove.
 * @returns A converter that removes the specified extensions.
 * @public
 */
export function removeExtension(extensions: ReadonlyArray<string>): Converter<string> {
  if (extensions === undefined || extensions.length === 0) {
    return Converters.string;
  }
  return Converters.generic((value: unknown): Result<string> => {
    if (typeof value !== 'string') {
      return Failure.with(`${value}: not a string`);
    }
    for (const ext of extensions) {
      if (value.endsWith(ext)) {
        const truncated = value.slice(0, value.length - ext.length);
        if (truncated.length === 0) {
          return Failure.with(`${value}: name consists only of extension`);
        }
        return Success.with(truncated);
      }
    }
    return Failure.with(`${value}: no supported extension (${extensions.join(', ')})`);
  });
}

/**
 * A converter that removes the `.json` extension from the end of a string.
 * @public
 */
export const removeJsonExtension: Converter<string> = removeExtension(['.json']);

/**
 * Converter for collection source metadata.
 * All fields are optional.
 * @public
 */
export const collectionSourceMetadata: Converter<ICollectionSourceMetadata> =
  Converters.object<ICollectionSourceMetadata>({
    secretName: Converters.string.optional(),
    name: Converters.string.optional(),
    description: Converters.string.optional(),
    variation: Converters.string.optional(),
    tags: Converters.arrayOf(Converters.string).optional()
  });

/**
 * Creates a converter for collection source files with the new format.
 * @param itemConverter - Converter or validator for individual items.
 * @returns Converter for the source file format.
 * @public
 */
export function collectionSourceFile<T>(
  itemConverter: Converter<T> | Validator<T>
): Converter<ICollectionSourceFile<T>> {
  return Converters.object<ICollectionSourceFile<T>>({
    metadata: collectionSourceMetadata.optional(),
    items: Converters.recordOf(itemConverter)
  });
}

/**
 * Initialization parameters for the {@link LibraryData.Converters.collection | collection} converter.
 * @public
 */
export interface ICollectionConverterParams<TCOLLECTIONID extends string, TITEMID extends string, TITEM> {
  collectionIdConverter: Converter<TCOLLECTIONID>;
  itemConverter: Converter<TITEM> | Validator<TITEM>;
  itemIdConverter: Converter<TITEMID> | Validator<TITEMID>;
}

/**
 * Returns a converter that validates a {@link LibraryData.ICollection | collection} using the supplied converters.
 * @param params - {@link LibraryData.Converters.ICollectionConverterParams | Collection converter constructor parameters}
 * which specify the converters to use.
 * @returns The collection converter.
 * @public
 */
export function collection<TCOLLECTIONID extends string, TITEMID extends string, TITEM>(
  params: ICollectionConverterParams<TCOLLECTIONID, TITEMID, TITEM>
): Converter<ICollection<TITEM, TCOLLECTIONID, TITEMID>> {
  return Converters.object<ICollection<TITEM, TCOLLECTIONID, TITEMID>>({
    id: params.collectionIdConverter,
    isMutable: Converters.boolean,
    items: Converters.recordOf(params.itemConverter, { keyConverter: params.itemIdConverter }),
    metadata: collectionSourceMetadata.optional()
  });
}

// ============================================================================
// Encrypted Collection Converters
// ============================================================================

/**
 * Converter for {@link LibraryData.IEncryptedCollectionMetadata | encrypted collection metadata}.
 * @public
 */
export const encryptedCollectionMetadata: Converter<IEncryptedCollectionMetadata> =
  Converters.object<IEncryptedCollectionMetadata>({
    collectionId: Converters.string.optional(),
    description: Converters.string.optional(),
    itemCount: Converters.number.optional()
  });

/**
 * Converter for {@link LibraryData.EncryptedCollectionFile | encrypted collection files}.
 * Uses the factory from ts-extras with chocolate-specific metadata converter.
 * @public
 */
export const encryptedCollectionFile: Converter<EncryptedCollectionFile> =
  CryptoUtils.Converters.createEncryptedFileConverter(encryptedCollectionMetadata);

/**
 * Creates a converter for YAML collection source files.
 * Parses YAML string content and validates as a collection source file.
 * @param itemConverter - Converter for individual collection items
 * @returns Converter that parses YAML and validates as collection
 * @public
 */
export function collectionYamlConverter<T>(
  itemConverter: Converter<T> | Validator<T>
): Converter<ICollectionSourceFile<T>> {
  return Yaml.yamlConverter(collectionSourceFile(itemConverter));
}

/**
 * Creates a converter for JSON collection source files.
 * Parses JSON string content and validates as a collection source file.
 * @param itemConverter - Converter for individual collection items
 * @returns Converter that parses JSON and validates as collection
 * @public
 */
export function collectionJsonConverter<T>(
  itemConverter: Converter<T> | Validator<T>
): Converter<ICollectionSourceFile<T>> {
  return JsonConverters.jsonConverter(collectionSourceFile(itemConverter));
}
