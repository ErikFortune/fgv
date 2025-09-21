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
 * Expected registry counts from IANA test data.
 * These constants reflect the content of test data files and should be updated
 * when test data is refreshed from IANA.
 *
 * @internal
 */
export const EXPECTED_REGISTRY_COUNTS = {
  // Core language registry counts
  languages: 8787,
  extlangs: 256,
  scripts: 274,
  regions: 343,
  variants: 134,

  // Additional language registry categories
  collections: 116,
  macrolanguages: 63,
  privateUse: 520,
  special: 4,
  grandfathered: 26,
  redundant: 67,

  // Extensions registry counts
  extensions: 2
} as const;

/**
 * Core registry count subset for loader tests and integration scenarios.
 * Contains the most commonly tested registry categories.
 *
 * @internal
 */
export const CORE_REGISTRY_COUNTS = {
  languages: EXPECTED_REGISTRY_COUNTS.languages,
  scripts: EXPECTED_REGISTRY_COUNTS.scripts,
  regions: EXPECTED_REGISTRY_COUNTS.regions,
  extensions: EXPECTED_REGISTRY_COUNTS.extensions
} as const;

/**
 * Test file paths commonly used across IANA registry tests.
 *
 * @internal
 */
export const TEST_DATA_PATHS = {
  registryJson: 'src/test/data/iana/language-subtag-registry.json',
  registryTxt: 'src/test/data/iana/language-subtag-registry.txt',
  subtagsJson: 'src/data/iana/language-subtags.json'
} as const;
