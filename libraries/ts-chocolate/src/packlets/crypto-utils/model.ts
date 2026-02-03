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

/**
 * Chocolate-specific encryption types.
 * General-purpose crypto utilities are provided by \@fgv/ts-extras Crypto namespace.
 */

import { CryptoUtils } from '@fgv/ts-extras';

// ============================================================================
// Chocolate-Specific Metadata
// ============================================================================

/**
 * Optional unencrypted metadata for encrypted collection files.
 * Allows filtering/display without decryption.
 * @public
 */
export interface IEncryptedCollectionMetadata {
  /**
   * Collection ID (unencrypted for filtering/display).
   */
  readonly collectionId?: string;

  /**
   * Human-readable description.
   */
  readonly description?: string;

  /**
   * Number of items in the collection.
   */
  readonly itemCount?: number;
}

// ============================================================================
// Chocolate-Specific Encrypted File Type
// ============================================================================

/**
 * Encrypted collection file format - an encrypted file with collection-specific metadata.
 * @public
 */
export type EncryptedCollectionFile = CryptoUtils.IEncryptedFile<IEncryptedCollectionMetadata>;

// ============================================================================
// Detection Helper
// ============================================================================

/**
 * Checks if a JSON object appears to be an encrypted collection file.
 * Uses the format field as a discriminator.
 * @param json - JSON object to check
 * @returns true if the object has the encrypted file format field
 * @public
 */
export function isEncryptedCollectionFile(json: unknown): boolean {
  return CryptoUtils.isEncryptedFile(json);
}
