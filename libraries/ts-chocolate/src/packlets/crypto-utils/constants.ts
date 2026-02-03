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

import { EncryptedCollectionFormat, EncryptionAlgorithm } from './model';

// ============================================================================
// Constants
// ============================================================================

/**
 * Current format version for encrypted collection files.
 * @public
 */
export const ENCRYPTED_COLLECTION_FORMAT: EncryptedCollectionFormat = 'encrypted-collection-v1';

/**
 * Default encryption algorithm.
 * @public
 */
export const DEFAULT_ALGORITHM: EncryptionAlgorithm = 'AES-256-GCM';

/**
 * Key size in bytes for AES-256.
 * @public
 */
export const AES_256_KEY_SIZE: number = 32;

/**
 * IV size in bytes for GCM mode.
 * @public
 */
export const GCM_IV_SIZE: number = 12;

/**
 * Auth tag size in bytes for GCM mode.
 * @public
 */
export const GCM_AUTH_TAG_SIZE: number = 16;
