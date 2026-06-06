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

import * as path from 'path';

/**
 * Absolute path to the tutorial package root. Resolved at load time so
 * lessons and tests can reference the bundled sample data regardless of
 * the current working directory.
 *
 * @remarks
 * At runtime the compiled lesson files live in `lib/utils/paths.js`, so
 * two levels up from `__dirname` points at the package root.
 *
 * @public
 */
export const TUTORIAL_ROOT: string = path.resolve(__dirname, '..', '..');

/**
 * Absolute path to the bundled `data/` folder that ships with the tutorial.
 * @public
 */
export const DATA_ROOT: string = path.join(TUTORIAL_ROOT, 'data');

/**
 * Absolute path to the YAML system configuration file that every lesson
 * loads.
 * @public
 */
export const CONFIG_FILE: string = path.join(DATA_ROOT, 'config', 'system.yaml');

/**
 * Absolute path to the `data/resources/` folder that the importer scans
 * in lessons 2-4.
 * @public
 */
export const RESOURCES_ROOT: string = path.join(DATA_ROOT, 'resources');
