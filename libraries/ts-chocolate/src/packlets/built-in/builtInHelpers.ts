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

/**
 * Helper functions for working with built-in data
 * @packageDocumentation
 */

import { ILibraryLoadParams, ILoadCollectionFromFileTreeParams, LibraryLoadSpec } from '../library-data';

/**
 * Converts a LibraryLoadSpec to ILoadCollectionFromFileTreeParams for the CollectionLoader.
 * Built-in collections are always immutable.
 *
 * @param spec - The LibraryLoadSpec to convert.
 * @returns The loading parameters, or undefined if no collections should be loaded (spec is false).
 * @public
 */
export function builtInSpecToLoadParams<TCollectionId extends string>(
  spec: LibraryLoadSpec<TCollectionId>
): ILoadCollectionFromFileTreeParams<TCollectionId> | undefined {
  // false means no built-ins
  if (spec === false) {
    return undefined;
  }

  // true means load all with default settings
  if (spec === true) {
    return {
      mutable: false // Built-ins are always immutable
    };
  }

  // Array of collection IDs means load only those collections
  if (Array.isArray(spec)) {
    return {
      included: spec,
      mutable: false
    };
  }

  // ILibraryLoadParams - fine-grained control
  const params = spec as ILibraryLoadParams;
  return {
    included: params.included,
    excluded: params.excluded,
    recurseWithDelimiter: params.recurseWithDelimiter,
    mutable: false // Built-ins are always immutable
  };
}
