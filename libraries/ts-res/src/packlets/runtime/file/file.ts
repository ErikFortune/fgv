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

import { Result } from '@fgv/ts-utils';
import { IResourceCollection } from './model';
import { JsonFile } from '@fgv/ts-json-base';
import * as Validate from './validate';

/**
 * Synchronously loads and validates a JSON {@link IResourceCollection | resource collection} from a file.
 * @param path - Path to the file to load.
 * @returns An instantiated {@link IResourceCollection | resource collection} if the collection can
 * be loaded, or `Failure` with an error if an error occurs.
 * *Note:* This method parses and loads an {@link IResourceCollection | resource collection} but it
 * does not verify internal consistency.
 * @public
 */
export function loadResourceCollectionFile(path: string): Result<IResourceCollection> {
  return JsonFile.convertJsonFileSync(path, Validate.resourceCollection);
}
