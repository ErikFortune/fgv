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

import * as TsRes from '@fgv/ts-res';

/**
 * Default system configuration for ts-res CLI tool
 * This matches the configuration used in the ts-res-browser tool
 */
export const DEFAULT_SYSTEM_CONFIGURATION: TsRes.Config.Model.ISystemConfiguration = {
  name: 'Default CLI Configuration',
  description: 'Built-in default configuration for ts-res CLI tool',
  qualifierTypes: [
    {
      name: 'language',
      systemType: 'language',
      configuration: {}
    },
    {
      name: 'territory',
      systemType: 'territory',
      configuration: {}
    }
  ],
  qualifiers: [
    {
      name: 'language',
      typeName: 'language',
      token: 'language',
      defaultPriority: 600
    },
    {
      name: 'territory',
      typeName: 'territory',
      token: 'territory',
      defaultPriority: 500
    }
  ],
  resourceTypes: [
    {
      name: 'json',
      typeName: 'json'
    }
  ]
};
