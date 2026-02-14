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

// ============================================================================
// Type aliases for Decoration Collections types
// ============================================================================

import { BaseDecorationId, DecorationId } from '../../common';
import {
  SubLibraryCollection,
  SubLibraryCollectionEntry,
  SubLibraryCollectionValidator,
  SubLibraryEntryInit
} from '../../library-data';
import { IDecorationEntity } from './model';

/**
 * A single entry in a decorations collection.
 * @public
 */
export type DecorationCollectionEntry = SubLibraryCollectionEntry<BaseDecorationId, IDecorationEntity>;

/**
 * Initialization type for a DecorationsLibrary collection entry.
 * @public
 */
export type DecorationCollectionEntryInit = SubLibraryEntryInit<BaseDecorationId, IDecorationEntity>;

/**
 * Validator type for DecorationsLibrary collections.
 * @public
 */
export type DecorationCollectionValidator = SubLibraryCollectionValidator<DecorationId, IDecorationEntity>;

/**
 * Type for the collections in a DecorationsLibrary.
 * @public
 */
export type DecorationCollection = SubLibraryCollection<BaseDecorationId, IDecorationEntity>;
