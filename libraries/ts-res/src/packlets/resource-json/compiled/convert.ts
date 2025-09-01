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
import { Converters } from '@fgv/ts-utils';
import { Converters as JsonConverters } from '@fgv/ts-json-base';
import * as Model from './json';

/* eslint-disable @rushstack/typedef-var */

/**
 * Converter for a {@link ResourceJson.Compiled.ICompiledConditionMetadata | compiled condition metadata}.
 * @public
 */
export const compiledConditionMetadata = Converters.strictObject<Model.ICompiledConditionMetadata>({
  key: Common.Convert.conditionKey
});

/**
 * Converter for a {@link ResourceJson.Compiled.ICompiledConditionSetMetadata | compiled condition set metadata}.
 * @public
 */
export const compiledConditionSetMetadata = Converters.strictObject<Model.ICompiledConditionSetMetadata>({
  key: Common.Convert.conditionSetKey
});

/**
 * Converter for a {@link ResourceJson.Compiled.ICompiledDecisionMetadata | compiled decision metadata}.
 * @public
 */
export const compiledDecisionMetadata = Converters.strictObject<Model.ICompiledDecisionMetadata>({
  key: Common.Convert.decisionKey
});

/**
 * Converter for a {@link ResourceJson.Compiled.ICompiledQualifierType | compiled qualifier type}.
 * @public
 */
export const compiledQualifierType = Converters.strictObject<Model.ICompiledQualifierType>({
  name: Common.Convert.qualifierTypeName
});

/**
 * Converter for a {@link ResourceJson.Compiled.ICompiledQualifier | compiled qualifier}.
 * @public
 */
export const compiledQualifier = Converters.strictObject<Model.ICompiledQualifier>({
  name: Common.Convert.qualifierName,
  type: Common.Convert.qualifierTypeIndex,
  defaultPriority: Common.Convert.conditionPriority
});

/**
 * Converter for a {@link ResourceJson.Compiled.ICompiledResourceType | compiled resource type}.
 * @public
 */
export const compiledResourceType = Converters.strictObject<Model.ICompiledResourceType>({
  name: Common.Convert.resourceTypeName
});

/**
 * Converter for a {@link ResourceJson.Compiled.ICompiledCondition | compiled condition}.
 * @public
 */
export const compiledCondition = Converters.strictObject<Model.ICompiledCondition>({
  qualifierIndex: Common.Convert.qualifierIndex,
  operator: Common.Convert.conditionOperator.optional(),
  value: Converters.string,
  priority: Common.Convert.conditionPriority,
  scoreAsDefault: Common.Convert.qualifierMatchScore.optional(),
  metadata: compiledConditionMetadata.optional()
});

/**
 * Converter for a {@link ResourceJson.Compiled.ICompiledConditionSet | compiled condition set}.
 * @public
 */
export const compiledConditionSet = Converters.strictObject<Model.ICompiledConditionSet>({
  conditions: Converters.arrayOf(Common.Convert.conditionIndex),
  metadata: compiledConditionSetMetadata.optional()
});
/**
 * Converter for a {@link ResourceJson.Compiled.ICompiledAbstractDecision | compiled abstract decision}.
 * @public
 */
export const compiledAbstractDecision = Converters.strictObject<Model.ICompiledAbstractDecision>({
  conditionSets: Converters.arrayOf(Common.Convert.conditionSetIndex),
  metadata: compiledDecisionMetadata.optional()
});

/**
 * Converter for a {@link ResourceJson.Compiled.ICompiledCandidate | compiled candidate}.
 * @public
 */
export const compiledCandidate = Converters.strictObject<Model.ICompiledCandidate>({
  valueIndex: Common.Convert.candidateValueIndex,
  isPartial: Converters.boolean,
  mergeMethod: Common.Convert.resourceValueMergeMethod
});

/**
 * Converter for a {@link ResourceJson.Compiled.ICompiledResource | compiled resource}.
 * @public
 */
export const compiledResource = Converters.strictObject<Model.ICompiledResource>({
  id: Common.Convert.resourceId,
  type: Common.Convert.resourceTypeIndex,
  decision: Common.Convert.decisionIndex,
  candidates: Converters.arrayOf(compiledCandidate)
});

/**
 * Converter for a {@link ResourceJson.Compiled.ICompiledResourceCollection | compiled resource collection}.
 * This combines all the individual converters into a single converter for the entire resource collection.
 * @public
 */
export const compiledResourceCollection = Converters.strictObject<Model.ICompiledResourceCollection>({
  qualifiers: Converters.arrayOf(compiledQualifier),
  qualifierTypes: Converters.arrayOf(compiledQualifierType),
  resourceTypes: Converters.arrayOf(compiledResourceType),
  conditions: Converters.arrayOf(compiledCondition),
  conditionSets: Converters.arrayOf(compiledConditionSet),
  decisions: Converters.arrayOf(compiledAbstractDecision),
  candidateValues: Converters.arrayOf(JsonConverters.jsonValue),
  resources: Converters.arrayOf(compiledResource)
});
