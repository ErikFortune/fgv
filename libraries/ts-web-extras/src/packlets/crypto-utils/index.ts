/*
 * Copyright (c) 2025 Erik Fortune
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

/**
 * Browser-compatible cryptographic utilities using the Web Crypto API.
 * @packageDocumentation
 */

export * from './browserHashProvider';
export * from './browserCryptoProvider';
export * from './idbPrivateKeyStorage';

// HpkeProvider re-export: implementation lives in @fgv/ts-extras CryptoUtils packlet;
// re-exported here so browser callers can import from @fgv/ts-web-extras for this primitive.
// We import from the top-level namespace to avoid relying on package.json exports path
// resolution (which requires moduleResolution: node16 or bundler).
import { CryptoUtils } from '@fgv/ts-extras';

/**
 * HPKE base mode (RFC 9180) — `DHKEM(X25519, HKDF-SHA256) + HKDF-SHA256 + AES-256-GCM`.
 * Re-exported from `@fgv/ts-extras` for browser consumers.
 * @see {@link CryptoUtils.HpkeProvider}
 * @public
 */
export const HpkeProvider: typeof CryptoUtils.HpkeProvider = CryptoUtils.HpkeProvider;

/**
 * Output of `HpkeProvider.sealBase`. Re-exported from `@fgv/ts-extras`.
 * @public
 */
export type IHpkeSealResult = CryptoUtils.IHpkeSealResult;
