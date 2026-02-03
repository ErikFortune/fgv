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
 * Browser-safe crypto packlet for encrypted collection support.
 * Excludes Node.js-specific crypto provider.
 * @packageDocumentation
 */

// Types and interfaces
export * from './model';

// Key store types and class
import * as KeyStore from './keystore';
export { KeyStore };

// Converters namespace
import * as Converters from './converters';
export { Converters };

// Browser crypto provider only (no Node.js provider)
export { BrowserCryptoProvider, createBrowserCryptoProvider } from './browserCryptoProvider';

// High-level helpers
export {
  createEncryptedCollectionFile,
  decryptCollectionFile,
  tryDecryptCollectionFile,
  EncryptionHelper,
  ICreateEncryptedFileParams
} from './encryptionHelper';
