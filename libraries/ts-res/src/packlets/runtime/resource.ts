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

import { Result, captureResult, fail } from '@fgv/ts-utils';
import * as Common from '../common';
import { EntityArray } from '../utils';
import { Decision } from './decision';
import { IResourceType } from './resourceType';
import { getVerifiedResourcePath } from './utils';

/**
 * Parameters to create a {@link Resource | Resource} object.
 * @public
 */
export interface IResourceCreateParams {
  from: Common.IResource;
  parentPath?: Common.ResourcePath;
  decisions: EntityArray<Decision>;
  resourceTypes: EntityArray<IResourceType>;
}

/**
 * Represents a resource in the runtime environment.
 * @public
 */
export class Resource {
  public readonly name: Common.ResourceName;
  public readonly path: Common.ResourcePath;
  public readonly decision: Decision;
  public readonly instanceValues: Common.InstanceValue[];
  public readonly type: IResourceType;

  protected constructor(
    name: Common.ResourceName,
    path: Common.ResourcePath,
    decision: Decision,
    instanceValues: Common.InstanceValue[],
    type: IResourceType
  ) {
    this.name = name;
    this.path = path;
    this.decision = decision;
    this.instanceValues = instanceValues;
    this.type = type;
  }

  public static create(init: IResourceCreateParams): Result<Resource> {
    const { from, parentPath, decisions, resourceTypes } = init;
    const { path, name, decisionIndex, instanceValues, typeIndex } = from;
    return getVerifiedResourcePath(name, parentPath, path, `resource ${name}`).onSuccess((verifiedPath) => {
      return resourceTypes.get(typeIndex, `resource ${verifiedPath}`).onSuccess((type) => {
        return decisions.get(decisionIndex, `resource ${verifiedPath}`).onSuccess((decision) => {
          if (decision.numConditionSets !== instanceValues.length) {
            return fail(
              `resource ${verifiedPath}: Decision ${decision.index} has ${decision.numConditionSets} condition sets, but ${instanceValues.length} instance values were provided.`
            );
          }
          return captureResult(() => new Resource(name, verifiedPath, decision, instanceValues, type));
        });
      });
    });
  }
}
