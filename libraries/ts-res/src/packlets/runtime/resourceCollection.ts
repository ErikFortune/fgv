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

import { captureResult, mapResults, Result, succeed } from '@fgv/ts-utils';
import * as Common from '../common';
import { EntityArray } from '../utils';
import { Condition, ConditionFactory } from './condition';
import { ConditionSet } from './conditionSet';
import { Decision } from './decision';
import * as File from './file';
import { Qualifier } from './qualifier';
import { IQualifierType, IQualifierTypeFactory } from './qualifierType';
import { Resource } from './resource';
import { IResourceType, IResourceTypeFactory } from './resourceType';

/**
 * Parameters to create a {@link ResourceCollection | ResourceCollection} object.
 * @public
 */
export interface IResourceCollectionCreateParams {
  from: File.IResourceCollection;
  qualifierTypes: IQualifierTypeFactory;
  resourceTypes: IResourceTypeFactory;
}

/**
 * Represents a collection of resources in the runtime environment.
 * @public
 */
export class ResourceCollection {
  public readonly qualifierTypes: EntityArray<IQualifierType>;
  public readonly qualifiers: EntityArray<Qualifier>;
  public readonly conditions: EntityArray<Condition>;
  public readonly conditionSets: EntityArray<ConditionSet>;
  public readonly decisions: EntityArray<Decision>;
  public readonly resourceTypes: EntityArray<IResourceType>;
  public readonly resources: ReadonlyMap<Common.ResourcePath, Resource>;

  protected constructor(init: IResourceCollectionCreateParams) {
    this.qualifierTypes = mapResults(
      init.from.qualifierTypes.map((qt, i) => init.qualifierTypes.getQualifierType(i, qt.name, qt.config))
    )
      .onSuccess((qts) =>
        EntityArray.create<IQualifierType, Common.QualifierTypeIndex>(qts, 'qualifier type')
      )
      .orThrow();

    this.qualifiers = mapResults(
      init.from.qualifiers.map((q, i) =>
        Qualifier.create({ from: q, index: i, qualifierTypes: this.qualifierTypes })
      )
    )
      .onSuccess((qs) => EntityArray.create<Qualifier, Common.QualifierIndex>(qs, 'qualifier'))
      .orThrow();

    this.conditions = mapResults(
      init.from.conditions.map((c, i) =>
        ConditionFactory.create({ from: c, index: i, qualifiers: this.qualifiers })
      )
    )
      .onSuccess((cs) => EntityArray.create<Condition, Common.ConditionIndex>(cs, 'condition'))
      .orThrow();

    this.conditionSets = mapResults(
      init.from.conditionSets.map((cs, i) =>
        ConditionSet.create({ from: cs, index: i, conditions: this.conditions })
      )
    )
      .onSuccess((css) => EntityArray.create<ConditionSet, Common.ConditionSetIndex>(css, 'condition set'))
      .orThrow();

    this.decisions = mapResults(
      init.from.decisions.map((d, i) =>
        Decision.create({ from: d, index: i, conditionSets: this.conditionSets })
      )
    )
      .onSuccess((ds) => EntityArray.create<Decision, Common.DecisionIndex>(ds, 'decision'))
      .orThrow();

    this.resourceTypes = mapResults(
      init.from.resourceTypes.map((rt, i) => init.resourceTypes.getResourceType(i, rt.name, rt.config))
    )
      .onSuccess((rts) => EntityArray.create<IResourceType, Common.ResourceTypeIndex>(rts, 'resource type'))
      .orThrow();

    const _resources = new Map<Common.ResourcePath, Resource>();
    for (const [path, r] of Object.entries(init.from.resources)) {
      const parentPath = Common.Validate.resourcePath.validate(path).orThrow();
      for (const [name, from] of Object.entries(r)) {
        if (from.name !== name) {
          throw new Error(`Resource name mismatch: ${from.name} !== ${name}`);
        }
        Resource.create({ from, parentPath, decisions: this.decisions, resourceTypes: this.resourceTypes })
          .onSuccess((resource) => succeed(_resources.set(resource.path, resource)))
          .orThrow();
      }
    }
    this.resources = _resources;
  }

  public static create(init: IResourceCollectionCreateParams): Result<ResourceCollection> {
    return captureResult(() => new ResourceCollection(init));
  }
}
