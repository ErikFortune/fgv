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
import * as Common from '../../common';
import { JsonValue } from '@fgv/ts-json-base';

/**
 * Represents a compiled qualifier type with a name.
 * @public
 */
export interface ICompiledQualifierType {
  /**
   * The name of the qualifier type.
   */
  name: Common.QualifierTypeName;
}

/**
 * Represents a compiled qualifier with a name and type reference.
 * @public
 */
export interface ICompiledQualifier {
  /**
   * The name of the qualifier.
   */
  name: Common.QualifierName;
  /**
   * Index reference to the qualifier type.
   */
  type: Common.QualifierTypeIndex;

  /**
   * The token used to identify the qualifier in resource names or paths.
   */
  defaultPriority: Common.ConditionPriority;
}

/**
 * Represents a compiled resource type with a name.
 * @public
 */
export interface ICompiledResourceType {
  /**
   * The name of the resource type.
   */
  name: Common.ResourceTypeName;
}

/**
 * Represents a compiled condition used for resource selection.
 * @public
 */
export interface ICompiledCondition {
  /**
   * Index reference to the qualifier being evaluated.
   */
  qualifierIndex: Common.QualifierIndex;
  /**
   * Optional operator to apply in the condition evaluation.
   */
  operator?: Common.ConditionOperator;
  /**
   * The value to compare against when evaluating the condition.
   */
  value: string;
  /**
   * The priority of the condition when multiple conditions match.
   */
  priority: Common.ConditionPriority;
  /**
   * Optional score to use when treating this condition as a default.
   */
  scoreAsDefault?: Common.QualifierMatchScore;
}

/**
 * Represents a compiled set of conditions that must be satisfied together.
 * @public
 */
export interface ICompiledConditionSet {
  /**
   * Array of indices referencing the conditions in this set.
   */
  conditions: ReadonlyArray<Common.ConditionIndex>;
}

/**
 * Represents a compiled abstract decision with condition sets.
 * @public
 */
export interface ICompiledAbstractDecision {
  /**
   * Array of indices referencing the condition sets for this decision.
   */
  conditionSets: ReadonlyArray<Common.ConditionSetIndex>;
}

/**
 * Represents a compiled resource candidate with JSON value and merge properties.
 * @public
 */
export interface ICompiledCandidate {
  /**
   * The JSON value of the candidate.
   */
  json: JsonValue;
  /**
   * Indicates if this is a partial resource that needs to be merged.
   */
  isPartial: boolean;
  /**
   * The method to use when merging this candidate with others.
   */
  mergeMethod: Common.ResourceValueMergeMethod;
}

/**
 * Represents a compiled resource with an identifier and associated candidates.
 * @public
 */
export interface ICompiledResource {
  /**
   * The unique identifier of the resource.
   */
  id: Common.ResourceId;

  /**
   * Index reference to the resource type of this resource.
   */
  type: Common.ResourceTypeIndex;

  /**
   * Index reference to the decision that determines when this resource applies.
   */
  decision: Common.DecisionIndex;
  /**
   * Array of candidate values for this resource.
   */
  candidates: ReadonlyArray<ICompiledCandidate>;
}

/**
 * Represents a complete compiled collection of resources with their associated
 * qualifiers, types, conditions, and decisions.
 * @public
 */
export interface ICompiledResourceCollection {
  /**
   * Array of all qualifier types in the collection.
   */
  qualifierTypes: ReadonlyArray<ICompiledQualifierType>;
  /**
   * Array of all qualifiers in the collection.
   */
  qualifiers: ReadonlyArray<ICompiledQualifier>;
  /**
   * Array of all resource types in the collection.
   */
  resourceTypes: ReadonlyArray<ICompiledResourceType>;
  /**
   * Array of all conditions in the collection.
   */
  conditions: ReadonlyArray<ICompiledCondition>;
  /**
   * Array of all condition sets in the collection.
   */
  conditionSets: ReadonlyArray<ICompiledConditionSet>;
  /**
   * Array of all decisions in the collection.
   */
  decisions: ReadonlyArray<ICompiledAbstractDecision>;
  /**
   * Array of all resources in the collection.
   */
  resources: ReadonlyArray<ICompiledResource>;
}
