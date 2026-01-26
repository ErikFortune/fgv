// Copyright (c) 2025 Erik Fortune
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
 * Configuration for parsing collection storage data
 * @public
 */
export interface ICollectionStorageConfig {
  /**
   * The path prefix for the data directory (e.g., '/data/ingredients')
   */
  readonly dataPath: string;
}

/**
 * Standard storage keys for local collections
 * @public
 */
export const LocalStorageKeys = {
  ingredients: 'chocolate-lab-web:ingredients:collections:v1',
  fillings: 'chocolate-lab-web:fillings:collections:v1',
  molds: 'chocolate-lab-web:molds:collections:v1',
  tasks: 'chocolate-lab-web:tasks:collections:v1',
  procedures: 'chocolate-lab-web:procedures:collections:v1',
  journals: 'chocolate-lab-web:journals:collections:v1',
  confections: 'chocolate-lab-web:confections:collections:v1'
} as const;

/**
 * Type for the sublibrary names
 * @public
 */
export type SubLibraryStorageKey = keyof typeof LocalStorageKeys;

/**
 * Standard data paths for each sublibrary
 * @public
 */
export const SubLibraryDataPaths: Record<SubLibraryStorageKey, string> = {
  ingredients: '/data/ingredients',
  fillings: '/data/fillings',
  molds: '/data/molds',
  tasks: '/data/tasks',
  procedures: '/data/procedures',
  journals: '/data/journals',
  confections: '/data/confections'
} as const;
