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
 * Main exports for \@fgv/ts-chocolate library
 * @packageDocumentation
 */

export * from './packlets/common';

import * as BuiltIn from './packlets/built-in';
import * as Calculations from './packlets/calculations';
import * as Confections from './packlets/confections';
import * as Crypto from './packlets/crypto';
import * as Ingredients from './packlets/ingredients';
import * as Journal from './packlets/journal';
import * as LibraryData from './packlets/library-data';
import * as Molds from './packlets/molds';
import * as Procedures from './packlets/procedures';
import * as Recipes from './packlets/recipes';
import * as Runtime from './packlets/runtime';

export {
  BuiltIn,
  Calculations,
  Confections,
  Crypto,
  Ingredients,
  Journal,
  LibraryData,
  Molds,
  Procedures,
  Recipes,
  Runtime
};
