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
// Type aliases for Collections types
// ============================================================================

import { BaseLocationId, LocationId } from '../../common';
import {
  SubLibraryCollection,
  SubLibraryCollectionEntry,
  SubLibraryCollectionValidator,
  SubLibraryEntryInit
} from '../../library-data';
import { ILocationEntity } from './model';

/**
 * A single entry in a locations collection.
 * @public
 */
export type LocationCollectionEntry = SubLibraryCollectionEntry<BaseLocationId, ILocationEntity>;

/**
 * Initialization type for a LocationsLibrary collection entry.
 * @public
 */
export type LocationCollectionEntryInit = SubLibraryEntryInit<BaseLocationId, ILocationEntity>;

/**
 * Validator type for LocationsLibrary collections.
 * @public
 */
export type LocationCollectionValidator = SubLibraryCollectionValidator<LocationId, ILocationEntity>;

/**
 * Type for the collections in a LocationsLibrary.
 * @public
 */
export type LocationCollection = SubLibraryCollection<BaseLocationId, ILocationEntity>;
