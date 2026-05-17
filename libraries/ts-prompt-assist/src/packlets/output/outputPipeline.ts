/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { MessageAggregator, Result, fail, succeed } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';
import {
  IBindingTraceEntry,
  IJsonOutputContract,
  IPromptDescriptor,
  PromptId,
  SlotName,
  ValidatorId
} from '../types';
import { IPromptOutputValidator, IPromptRegistry } from '../registry';

/**
 * Asserts that every `outputValidations[]` entry on the descriptor is
 * registered and that its `appliesTo` covers the producing kind declared by
 * `descriptor.output.converterId`'s registered Converter. This is the loader-
 * side belt per design §17.2.4. The runtime safety net in
 * {@link runOutputValidationPipeline} provides the suspenders.
 *
 * @remarks
 * Free-text descriptors with `outputValidations[]` are already rejected by
 * the descriptor file Converter (B-1a). This function therefore only
 * exercises the `'json'` branch — `'free-text'` descriptors return success
 * without consulting the registry.
 *
 * @internal
 */
export function assertOutputValidationsCompatible<TResponse extends { kind: string }>(
  descriptor: IPromptDescriptor,
  registry: IPromptRegistry<TResponse> | undefined
): Result<true> {
  const validationIds = descriptor.outputValidations ?? [];
  if (descriptor.output.kind !== 'json' || validationIds.length === 0) {
    return succeed(true as const);
  }
  const contract: IJsonOutputContract = descriptor.output;
  if (registry === undefined) {
    return fail(
      `prompt '${descriptor.id}': output.kind 'json' requires a registry; none supplied to PromptLibrary.create`
    );
  }

  return registry.converters
    .getKind(contract.converterId)
    .withErrorFormat(
      (msg) => `prompt '${descriptor.id}': output.converterId '${contract.converterId}': ${msg}`
    )
    .onSuccess((producingKind) => {
      const aggregator = new MessageAggregator();
      for (const id of validationIds) {
        registry.outputValidations
          .get(id)
          .onSuccess((validator) => {
            const targets = appliesToList(validator);
            if (!targets.includes(producingKind)) {
              return fail<true>(
                `validator '${id}' (appliesTo: ${targets.join('|')}) does not match converter '${
                  contract.converterId
                }' producing kind '${producingKind}'`
              );
            }
            return succeed(true as const);
          })
          .withErrorFormat((msg) => `prompt '${descriptor.id}': validator '${id}': ${msg}`)
          .aggregateError(aggregator);
      }
      return aggregator.hasMessages ? fail(aggregator.toString('; ')) : succeed(true as const);
    });
}

/**
 * Runs the locked design §8 output validation pipeline for a `'json'`
 * descriptor: fence-strip via {@link AiAssist.extractJsonText} →
 * `JSON.parse` → registered Converter (kind-verified via the no-kind
 * overload — `T extends TResponse` flows from the caller's type
 * parameter) → `outputValidations[]` chain (each validator's `appliesTo`
 * narrows by `value.kind` at runtime per §17.2.4).
 *
 * @internal
 */
export function runOutputValidationPipeline<TResponse extends { kind: string }, T extends TResponse>(params: {
  readonly descriptor: IPromptDescriptor;
  readonly contract: IJsonOutputContract;
  readonly registry: IPromptRegistry<TResponse>;
  readonly rawOutput: string;
  readonly substitutions: ReadonlyMap<SlotName, IBindingTraceEntry>;
}): Result<T> {
  const { descriptor, contract, registry, rawOutput, substitutions } = params;

  return registry.converters
    .get<T>(contract.converterId)
    .withErrorFormat(
      (msg) => `prompt '${descriptor.id}': output.converterId '${contract.converterId}': ${msg}`
    )
    .onSuccess((converter) =>
      AiAssist.fencedStringifiedJson<T>({ inner: converter })
        .convert(rawOutput)
        .withErrorFormat((msg) => formatPipelineError(descriptor.id, rawOutput, msg))
    )
    .onSuccess((value) => runValidatorChain(descriptor, registry, value, substitutions));
}

function runValidatorChain<TResponse extends { kind: string }, T extends TResponse>(
  descriptor: IPromptDescriptor,
  registry: IPromptRegistry<TResponse>,
  value: T,
  substitutions: ReadonlyMap<SlotName, IBindingTraceEntry>
): Result<T> {
  const ids = descriptor.outputValidations ?? [];
  if (ids.length === 0) {
    return succeed(value);
  }
  const aggregator = new MessageAggregator();
  for (const id of ids) {
    runOneValidator(descriptor.id, registry, id, value, substitutions).aggregateError(aggregator);
  }
  return aggregator.hasMessages
    ? fail<T>(`prompt '${descriptor.id}': output validation failed: ${aggregator.toString('; ')}`)
    : succeed(value);
}

function runOneValidator<TResponse extends { kind: string }, T extends TResponse>(
  promptId: PromptId,
  registry: IPromptRegistry<TResponse>,
  id: ValidatorId,
  value: T,
  substitutions: ReadonlyMap<SlotName, IBindingTraceEntry>
): Result<true> {
  return registry.outputValidations
    .get(id)
    .onSuccess((validator) => {
      const targets = appliesToList(validator);
      if (!targets.includes(value.kind)) {
        // Suspenders per design §17.2.4: even with the loader-side belt
        // (assertOutputValidationsCompatible) we re-check at runtime so a
        // mid-process registry mutation or a Converter that lies about its
        // produced kind still fails loudly here.
        return fail<true>(`(appliesTo: ${targets.join('|')}) does not match output kind '${value.kind}'`);
      }
      return validator.validate(value, { promptId, substitutions });
    })
    .withErrorFormat((msg) => `validator '${id}': ${msg}`);
}

function appliesToList<TResponse extends { kind: string }>(
  validator: IPromptOutputValidator<TResponse>
): ReadonlyArray<TResponse['kind']> {
  const appliesTo: TResponse['kind'] | ReadonlyArray<TResponse['kind']> = validator.appliesTo;
  if (isReadonlyArrayOfKind<TResponse>(appliesTo)) {
    return appliesTo;
  }
  return [appliesTo];
}

function isReadonlyArrayOfKind<TResponse extends { kind: string }>(
  value: TResponse['kind'] | ReadonlyArray<TResponse['kind']>
): value is ReadonlyArray<TResponse['kind']> {
  return Array.isArray(value);
}

function formatPipelineError(promptId: PromptId, rawOutput: string, msg: string): string {
  // Design §8 step 2: include the prompt id and the first 200 characters of
  // the raw output so a failure during fence-strip / JSON.parse / Converter
  // is debuggable without exposing the whole (potentially-large) response.
  const truncated = rawOutput.length > 200 ? `${rawOutput.slice(0, 200)}…` : rawOutput;
  return `prompt '${promptId}': output validation failed: ${msg} (raw[0..200]: ${JSON.stringify(truncated)})`;
}
