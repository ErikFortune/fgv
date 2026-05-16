/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Converters, Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import { Convert, ScopeKey } from '../types';
import { EnumConvert } from '../types';
import { IExpectedQualifierAxis, IPromptQualifierMetadata } from '../types';
import { IPromptSlot } from '../types';
import { IPromptExamplePair, IPromptExampleSet } from '../types';
import { IJsonOutputContract, ITextOutputContract, PromptOutputContract } from '../types';
import {
  IPromptCandidateRecord,
  IPromptDescriptor,
  IPromptJoinPolicy,
  IPromptSafeguardOverrides,
  IStoredPromptRecord
} from '../types';
import { slotBindingConverter } from './bindingConverters';
import { scanCandidateBody } from './bodyTokenScanner';
import { ResourceJson } from '@fgv/ts-res';

const expectedAxisConverter: Converter<IExpectedQualifierAxis> = Converters.object<IExpectedQualifierAxis>(
  {
    name: Convert.axisName,
    description: Converters.string.optional(),
    suggestedValues: Converters.arrayOf(Converters.string).optional()
  },
  { optionalFields: ['description', 'suggestedValues'] }
);

const qualifierMetadataConverter: Converter<IPromptQualifierMetadata> =
  Converters.object<IPromptQualifierMetadata>(
    {
      required: Converters.arrayOf(Convert.axisName).optional(),
      expected: Converters.arrayOf(expectedAxisConverter).optional(),
      disallowed: Converters.arrayOf(Convert.axisName).optional()
    },
    { optionalFields: ['required', 'expected', 'disallowed'] }
  );

const slotConverter: Converter<IPromptSlot> = Converters.object<IPromptSlot>(
  {
    name: Convert.slotName,
    description: Converters.string,
    required: Converters.boolean.optional(),
    defaultBinding: slotBindingConverter.optional(),
    kind: Converters.string.optional(),
    serializerId: Convert.serializerId.optional(),
    allowedDirectives: Converters.arrayOf(EnumConvert.slotDirective).optional(),
    writableBy: EnumConvert.slotWritability.optional(),
    maxLength: Converters.number.optional(),
    source: Converters.string.optional()
  },
  {
    optionalFields: [
      'required',
      'defaultBinding',
      'kind',
      'serializerId',
      'allowedDirectives',
      'writableBy',
      'maxLength',
      'source'
    ]
  }
);

const textOutputConverter: Converter<ITextOutputContract> = Converters.object<ITextOutputContract>({
  kind: Converters.literal<'free-text'>('free-text')
});

const jsonOutputConverter: Converter<IJsonOutputContract> = Converters.object<IJsonOutputContract>({
  kind: Converters.literal<'json'>('json'),
  converterId: Convert.converterId
});

const outputConverter: Converter<PromptOutputContract> = Converters.generic<PromptOutputContract>(
  (from: unknown): Result<PromptOutputContract> => {
    if (typeof from !== 'object' || from === null) {
      return fail("output: expected an object with 'kind'");
    }
    const kindValue = (from as { kind?: unknown }).kind;
    if (kindValue === 'free-text') {
      return textOutputConverter.convert(from);
    }
    if (kindValue === 'json') {
      return jsonOutputConverter.convert(from);
    }
    return fail(`output: unknown kind '${String(kindValue)}'`);
  }
);

const joinPolicyConverter: Converter<IPromptJoinPolicy> = Converters.object<IPromptJoinPolicy>(
  {
    separator: Converters.string.optional(),
    order: Converters.enumeratedValue<'specificity-ascending' | 'specificity-descending'>([
      'specificity-ascending',
      'specificity-descending'
    ]).optional(),
    trimTrailingWhitespace: Converters.boolean.optional()
  },
  { optionalFields: ['separator', 'order', 'trimTrailingWhitespace'] }
);

const safeguardOverridesConverter: Converter<IPromptSafeguardOverrides> =
  Converters.object<IPromptSafeguardOverrides>(
    {
      defaultMaxLength: Converters.number.optional(),
      skipInjectionScreening: Converters.boolean.optional()
    },
    { optionalFields: ['defaultMaxLength', 'skipInjectionScreening'] }
  );

const examplePairConverter: Converter<IPromptExamplePair> = Converters.object<IPromptExamplePair>({
  input: Converters.generic<unknown>((from: unknown) => succeed(from)),
  output: Converters.generic<unknown>((from: unknown) => succeed(from))
});

const exampleSetConverter: Converter<IPromptExampleSet> = Converters.object<IPromptExampleSet>({
  conditions: Converters.recordOf(Converters.string),
  pairs: Converters.arrayOf(examplePairConverter)
});

/**
 * Converter for the prompt descriptor metadata (without the candidates).
 * Cross-cutting body validation lives on the {@link promptFileConverter}
 * because candidates carry the bodies.
 *
 * @public
 */
export const descriptorConverter: Converter<IPromptDescriptor> = Converters.object<IPromptDescriptor>(
  {
    id: Convert.promptId,
    title: Converters.string,
    description: Converters.string.optional(),
    schemaVersion: Converters.literal<'1'>('1'),
    surface: Converters.string,
    qualifiers: qualifierMetadataConverter.optional(),
    slots: Converters.arrayOf(slotConverter),
    output: outputConverter,
    join: joinPolicyConverter.optional(),
    safeguards: safeguardOverridesConverter.optional(),
    examples: Converters.arrayOf(exampleSetConverter).optional(),
    outputValidations: Converters.arrayOf(Convert.validatorId).optional()
  },
  {
    optionalFields: ['description', 'qualifiers', 'join', 'safeguards', 'examples', 'outputValidations']
  }
);

const conditionSetDeclConverter: Converter<ResourceJson.Normalized.ConditionSetDecl> =
  ResourceJson.Convert.conditionSetDecl;

const looseCandidateBodyConverter: Converter<IPromptCandidateRecord> =
  Converters.object<IPromptCandidateRecord>(
    {
      conditions: conditionSetDeclConverter,
      isPartial: Converters.boolean.optional(),
      body: Converters.string
    },
    { optionalFields: ['isPartial'] }
  );

/**
 * Shape of a `<prompt-id>.yaml` file body: the descriptor metadata plus the
 * candidates array (scope is reconstructed by the store from the directory
 * path).
 * @public
 */
export interface IPromptFileContents {
  readonly descriptor: IPromptDescriptor;
  readonly candidates: ReadonlyArray<IPromptCandidateRecord>;
}

/**
 * Converter for a single prompt YAML file. After the descriptor and
 * candidates parse, this converter additionally scans each candidate's body
 * for double-brace / ampersand-unescape Mustache tokens (locked by design
 * §6) and rejects free-text descriptors that declare `outputValidations`
 * (design §8).
 *
 * The store reconstructs the `IStoredPromptRecord` by stamping the scope
 * derived from the file's directory path.
 *
 * @public
 */
export const promptFileConverter: Converter<IPromptFileContents> = Converters.generic<IPromptFileContents>(
  (from: unknown): Result<IPromptFileContents> => {
    if (typeof from !== 'object' || from === null) {
      return fail('prompt file: expected an object');
    }
    // Split the prompt file into descriptor fields + candidates so the
    // descriptor Converter never sees the `candidates` field. This keeps
    // the file Converter robust against a future `Converters.object`
    // strict-by-default switch and avoids the wasted re-parse of the
    // entire object when descriptor Converters become more expensive.
    const { candidates: rawCandidates, ...descriptorRaw } = from as {
      readonly candidates?: unknown;
      readonly [key: string]: unknown;
    };
    return descriptorConverter
      .convert(descriptorRaw)
      .withErrorFormat((msg) => `prompt file: invalid descriptor: ${msg}`)
      .onSuccess((descriptor) => {
        if (descriptor.output.kind === 'free-text' && (descriptor.outputValidations?.length ?? 0) > 0) {
          return fail(
            `prompt '${descriptor.id}': free-text descriptors cannot declare outputValidations in v0.1`
          );
        }
        return Converters.arrayOf(looseCandidateBodyConverter)
          .convert(rawCandidates)
          .withErrorFormat((msg) => `prompt '${descriptor.id}': invalid candidates: ${msg}`)
          .onSuccess((candidates) =>
            mapResults(candidates.map((c, i) => scanCandidateBody(c.body, descriptor.id, i))).onSuccess(() =>
              succeed<IPromptFileContents>({ descriptor, candidates })
            )
          );
      });
  }
);

/**
 * Builds a fully-typed {@link IStoredPromptRecord} from a parsed prompt file
 * and the scope key derived from the file's directory location.
 * @public
 */
export function buildStoredPromptRecord(scope: ScopeKey, contents: IPromptFileContents): IStoredPromptRecord {
  return {
    scope,
    id: contents.descriptor.id,
    descriptor: contents.descriptor,
    candidates: contents.candidates
  };
}
