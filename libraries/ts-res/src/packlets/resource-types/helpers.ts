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

import { fail, Result } from '@fgv/ts-utils';
import { IResourceTypeConfig } from './config';
import { ResourceType } from './resourceType';
import { JsonResourceType } from './jsonResourceType';
import { Convert as CommonConverters } from '../common';

/**
 * Creates a {@link ResourceTypes.ResourceType | ResourceType} from a configuration object.
 * @param config - The {@link ResourceTypes.Config.IResourceTypeConfig | configuration object}
 * containing the name and type name of the resource type.
 * @returns `Success` with the new {@link ResourceTypes.ResourceType | ResourceType}
 * if successful, `Failure` with an error message otherwise.
 * @public
 */
export function createResourceTypeFromConfig(config: IResourceTypeConfig): Result<ResourceType> {
  if (config.typeName === 'json') {
    return CommonConverters.resourceTypeName
      .convert(config.name)
      .onSuccess((key) => JsonResourceType.create({ key }));
  }
  return fail(`${config.typeName}: Unknown resource type.`);
}
