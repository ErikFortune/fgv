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
 * Entities packlet - consolidated data layer types and converters
 * @packageDocumentation
 */

// Re-export models, collections, and libraries (not Converters which would conflict)
export * from './confections/model';
export * from './confections/collection';
export * from './confections/library';

export * from './fillings/model';
export * from './fillings/collection';
export * from './fillings/library';

export * from './ingredients/model';
export * from './ingredients/collection';
export * from './ingredients/library';

export * from './journal/model';
export * from './journal/library';

export * from './molds/model';
export * from './molds/collection';
export * from './molds/library';

export * from './procedures/model';
export * from './procedures/collection';
export * from './procedures/library';

export * from './tasks/model';
export * from './tasks/collection';
export * from './tasks/library';

// Export aggregated converters namespace
import * as Converters from './converters';
export { Converters };

// Export as namespaces for consumers who prefer that style (includes Converters)
import * as Confections from './confections';
import * as Fillings from './fillings';
import * as Ingredients from './ingredients';
import * as Journal from './journal';
import * as Molds from './molds';
import * as Procedures from './procedures';
import * as Tasks from './tasks';

export { Confections, Fillings, Ingredients, Journal, Molds, Procedures, Tasks };
