/*
 * Copyright (c) 2026 Erik Fortune
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

import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { Mustache } from '@fgv/ts-extras';
import type { ResourceJson } from '@fgv/ts-res';
import type {
  IExpectedQualifierAxis,
  IJsonOutputContract,
  IPromptCandidateRecord,
  IPromptDescriptor,
  IPromptExamplePair,
  IPromptExampleSet,
  IPromptJoinPolicy,
  IPromptQualifierMetadata,
  IPromptSafeguardOverrides,
  IPromptSlot,
  IStoredPromptRecord,
  ITextOutputContract,
  PromptId,
  PromptOutputContract,
  ScopeKey
} from '../types';
import { Convert, slotDirectiveConverter, slotWritabilityConverter } from '../types';
import { slotBindingConverter } from './slotBindingConverter';

/** Converter that passes any unknown value through unchanged. */
const unknownConverter: Converter<unknown> = Converters.generic<unknown>((from: unknown) => succeed(from));

/**
 * Validates that a prompt body uses only triple-brace tokens.
 * Double-brace `{{name}}` tokens (token type `'name'`) are rejected; use `{{{name}}}` instead.
 */
function validateBodyTokens(body: string, promptId: PromptId, candidateIndex: number): Result<string> {
  const templateResult = Mustache.MustacheTemplate.create(body, { escape: 'none' });
  if (templateResult.isFailure()) {
    return fail(
      `prompt '${promptId}' candidate ${candidateIndex}: invalid Mustache body: ${templateResult.message}`
    );
  }
  if (/\{\{&/.test(body)) {
    return fail(
      `prompt '${promptId}' candidate ${candidateIndex}: body uses '{{& ...}}' syntax; use triple-brace '{{{name}}}' instead`
    );
  }
  const variables = templateResult.value.extractVariables();
  for (const variable of variables) {
    if (variable.tokenType === 'name') {
      return fail(
        `prompt '${promptId}' candidate ${candidateIndex}: body uses double-brace token '{{${variable.name}}}'; use triple-brace '{{{${variable.name}}}}'`
      );
    }
  }
  return succeed(body);
}

const expectedQualifierAxisConverter: Converter<IExpectedQualifierAxis> =
  Converters.object<IExpectedQualifierAxis>({
    name: Convert.axisName,
    description: Converters.string.optional(),
    suggestedValues: Converters.arrayOf(Converters.string).optional()
  });

const qualifierMetadataConverter: Converter<IPromptQualifierMetadata> =
  Converters.object<IPromptQualifierMetadata>({
    required: Converters.arrayOf(Convert.axisName).optional(),
    expected: Converters.arrayOf(expectedQualifierAxisConverter).optional(),
    disallowed: Converters.arrayOf(Convert.axisName).optional()
  });

const textOutputContractConverter: Converter<ITextOutputContract> = Converters.object<ITextOutputContract>({
  kind: Converters.literal<'free-text'>('free-text')
});

const jsonOutputContractConverter: Converter<IJsonOutputContract> = Converters.object<IJsonOutputContract>({
  kind: Converters.literal<'json'>('json'),
  converterId: Convert.converterId
});

const outputContractConverter: Converter<PromptOutputContract> = Converters.discriminatedObject<
  PromptOutputContract,
  'free-text' | 'json'
>('kind', {
  'free-text': textOutputContractConverter,
  json: jsonOutputContractConverter
});

const joinPolicyConverter: Converter<IPromptJoinPolicy> = Converters.object<IPromptJoinPolicy>({
  separator: Converters.string.optional(),
  order: Converters.enumeratedValue<'specificity-ascending' | 'specificity-descending'>([
    'specificity-ascending',
    'specificity-descending'
  ]).optional(),
  trimTrailingWhitespace: Converters.boolean.optional()
});

const safeguardOverridesConverter: Converter<IPromptSafeguardOverrides> =
  Converters.object<IPromptSafeguardOverrides>({
    defaultMaxLength: Converters.number.optional(),
    skipInjectionScreening: Converters.boolean.optional()
  });

const examplePairConverter: Converter<IPromptExamplePair> = Converters.object<IPromptExamplePair>({
  input: unknownConverter,
  output: unknownConverter
});

const exampleSetConverter: Converter<IPromptExampleSet> = Converters.object<IPromptExampleSet>({
  conditions: Converters.recordOf(Converters.string),
  pairs: Converters.arrayOf(examplePairConverter)
});

const promptSlotConverter: Converter<IPromptSlot> = Converters.object<IPromptSlot>({
  name: Convert.slotName,
  description: Converters.string,
  required: Converters.boolean.optional(),
  defaultBinding: slotBindingConverter.optional(),
  kind: Converters.string.optional(),
  serializerId: Convert.serializerId.optional(),
  allowedDirectives: Converters.arrayOf(slotDirectiveConverter).optional(),
  writableBy: slotWritabilityConverter.optional(),
  maxLength: Converters.number.optional(),
  source: Converters.string.optional()
});

const descriptorBaseConverter: Converter<IPromptDescriptor> = Converters.object<IPromptDescriptor>({
  id: Convert.promptId,
  title: Converters.string,
  description: Converters.string.optional(),
  schemaVersion: Converters.literal<'1'>('1'),
  surface: Converters.string,
  qualifiers: qualifierMetadataConverter.optional(),
  slots: Converters.arrayOf(promptSlotConverter),
  output: outputContractConverter,
  join: joinPolicyConverter.optional(),
  safeguards: safeguardOverridesConverter.optional(),
  examples: Converters.arrayOf(exampleSetConverter).optional(),
  outputValidations: Converters.arrayOf(Convert.validatorId).optional()
});

function parseCandidates(
  raw: ReadonlyArray<Record<string, unknown>>,
  promptId: PromptId
): Result<ReadonlyArray<IPromptCandidateRecord>> {
  const results: IPromptCandidateRecord[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    const bodyResult = Converters.string.convert(item.body);
    if (bodyResult.isFailure()) {
      return fail(`prompt '${promptId}' candidate ${i}: missing or invalid 'body' field`);
    }
    const body = bodyResult.value;
    const tokenResult = validateBodyTokens(body, promptId, i);
    if (tokenResult.isFailure()) {
      return fail(tokenResult.message);
    }
    const isPartial = item.isPartial === true ? (true as const) : undefined;
    const conditions: ResourceJson.Json.ConditionSetDecl =
      (item.conditions as ResourceJson.Json.ConditionSetDecl) ?? {};
    results.push({ conditions, isPartial, body });
  }
  return succeed(results);
}

/**
 * Creates a converter for a stored prompt record YAML file.
 * Validates that the descriptor's `id` field matches the expected filename-derived id.
 * @param scope - The scope to assign to the resulting record.
 * @param expectedId - The prompt id expected from the filename.
 * @public
 */
export function storedPromptRecordConverter(
  scope: ScopeKey,
  expectedId: PromptId
): Converter<IStoredPromptRecord> {
  return Converters.generic<IStoredPromptRecord>((from: unknown) => {
    const candidatesResult = Converters.object({
      candidates: Converters.arrayOf(Converters.recordOf(unknownConverter))
    }).convert(from);
    if (candidatesResult.isFailure()) {
      return fail(`stored prompt record: ${candidatesResult.message}`);
    }

    const descriptorResult = descriptorBaseConverter.convert(from);
    if (descriptorResult.isFailure()) {
      return fail(`stored prompt descriptor: ${descriptorResult.message}`);
    }
    const descriptor = descriptorResult.value;

    if (descriptor.id !== expectedId) {
      return fail(
        `stored prompt record: descriptor id '${descriptor.id}' does not match filename id '${expectedId}'`
      );
    }

    const parsedCandidatesResult = parseCandidates(candidatesResult.value.candidates, descriptor.id);
    if (parsedCandidatesResult.isFailure()) {
      return fail(parsedCandidatesResult.message);
    }

    return succeed({
      scope,
      id: expectedId,
      descriptor,
      candidates: parsedCandidatesResult.value
    });
  });
}
