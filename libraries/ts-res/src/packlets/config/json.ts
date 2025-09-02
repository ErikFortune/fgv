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

import * as QualifierTypes from '../qualifier-types';
import * as Qualifiers from '../qualifiers';
import * as ResourceTypes from '../resource-types';

/**
 * System configuration for both runtime or build.
 * @public
 */
export interface ISystemConfiguration {
  /** Optional human-readable name for the configuration. */

  name?: string;
  /** Optional description explaining the purpose and use case of the configuration. */
  description?: string;
  /** Qualifier type configurations that define the available qualifier types in the system. */
  qualifierTypes: QualifierTypes.Config.IAnyQualifierTypeConfig[];
  /** Qualifier declarations that define the available qualifiers in the system. */
  qualifiers: Qualifiers.IQualifierDecl[];
  /** Resource type configurations that define the available resource types in the system. */
  resourceTypes: ResourceTypes.Config.IResourceTypeConfig[];
}
