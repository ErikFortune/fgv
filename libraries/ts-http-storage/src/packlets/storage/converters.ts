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

import { type Converter, Converters } from '@fgv/ts-utils';

import type {
  IStorageFileResponse,
  IStoragePathRequest,
  IStorageSyncRequest,
  IStorageTreeChildrenResponse,
  IStorageTreeItem,
  IStorageWriteFileRequest,
  StorageItemType
} from './model';

const storageItemType: Converter<StorageItemType> = Converters.enumeratedValue<StorageItemType>([
  'file',
  'directory'
]);

/**
 * Converter for {@link IStorageTreeItem}.
 * @public
 */
export const storageTreeItem: Converter<IStorageTreeItem> = Converters.strictObject<IStorageTreeItem>({
  path: Converters.string,
  name: Converters.string,
  type: storageItemType
});

/**
 * Converter for path-based requests.
 * @public
 */
export const storagePathRequest: Converter<IStoragePathRequest> =
  Converters.strictObject<IStoragePathRequest>({
    path: Converters.string,
    namespace: Converters.string.optional()
  });

/**
 * Converter for write-file requests.
 * @public
 */
export const storageWriteFileRequest: Converter<IStorageWriteFileRequest> =
  Converters.strictObject<IStorageWriteFileRequest>({
    path: Converters.string,
    contents: Converters.string,
    contentType: Converters.string.optional(),
    namespace: Converters.string.optional()
  });

/**
 * Converter for sync requests.
 * @public
 */
export const storageSyncRequest: Converter<IStorageSyncRequest> =
  Converters.strictObject<IStorageSyncRequest>({
    namespace: Converters.string.optional()
  });

/**
 * Converter for file responses.
 * @public
 */
export const storageFileResponse: Converter<IStorageFileResponse> =
  Converters.strictObject<IStorageFileResponse>({
    path: Converters.string,
    contents: Converters.string,
    contentType: Converters.string.optional()
  });

/**
 * Converter for children list responses.
 * @public
 */
export const storageTreeChildrenResponse: Converter<IStorageTreeChildrenResponse> =
  Converters.strictObject<IStorageTreeChildrenResponse>({
    path: Converters.string,
    children: Converters.arrayOf(storageTreeItem)
  });
