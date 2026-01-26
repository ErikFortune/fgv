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
 * Runtime confection classes
 *
 * Provides concrete implementations for each confection type with type-safe
 * access to type-specific properties.
 *
 * @packageDocumentation
 */

// Base class
export { RuntimeConfectionBase } from './runtimeConfectionBase';

// Concrete confection classes
export { RuntimeMoldedBonBon } from './runtimeMoldedBonBon';
export { RuntimeBarTruffle } from './runtimeBarTruffle';
export { RuntimeRolledTruffle } from './runtimeRolledTruffle';

// Static factory and union type
export { RuntimeConfection, AnyRuntimeConfection } from './runtimeConfection';

// Version classes
export {
  RuntimeConfectionVersionBase,
  RuntimeMoldedBonBonVersion,
  RuntimeBarTruffleVersion,
  RuntimeRolledTruffleVersion
} from './versions';
