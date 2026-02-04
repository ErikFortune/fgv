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
// Type aliases for Session Collection types
// ============================================================================

import { BaseSessionId } from '../../common';
import {
  SubLibraryCollection,
  SubLibraryCollectionEntry,
  SubLibraryCollectionValidator,
  SubLibraryEntryInit
} from '../../library-data';
import { AnySessionEntity } from './model';

/**
 * A single entry in a session collection.
 * @public
 */
export type SessionCollectionEntry = SubLibraryCollectionEntry<BaseSessionId, AnySessionEntity>;

/**
 * Initialization type for a SessionLibrary collection entry.
 * @public
 */
export type SessionCollectionEntryInit = SubLibraryEntryInit<BaseSessionId, AnySessionEntity>;

/**
 * Validator type for SessionLibrary collections.
 * @public
 */
export type SessionCollectionValidator = SubLibraryCollectionValidator<BaseSessionId, AnySessionEntity>;

/**
 * Type for the collections in a SessionLibrary.
 * @public
 */
export type SessionCollection = SubLibraryCollection<BaseSessionId, AnySessionEntity>;
