// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Per-model sampling-parameter (temperature) rules.
 * @packageDocumentation
 */

import { fail, type Result, succeed } from '@fgv/ts-utils';

import { type IAiProviderDescriptor, isExactOrDashBoundedPrefix, isThinkingRequiredModel } from './model';
import { resolveGeminiThinkingLevels } from './geminiThinking';
import { type IResolvedThinkingConfig, requestTurnsThinkingOff } from './thinkingOptionsResolver';

/**
 * Whether a concrete (already-resolved) model restricts a caller-supplied `temperature`, per the
 * descriptor's {@link IAiProviderDescriptor.samplingParamsRejectedModelPrefixes}
 * (exact-or-dash-bounded match).
 *
 * @remarks
 * A listed model rejects every `temperature` except the descriptor's
 * {@link IAiProviderDescriptor.samplingParamsAcceptedTemperature}, when one is declared. The
 * completion (`callProviderCompletion`), streaming (`callProviderCompletionStream`) and
 * client-tool (`executeClientToolTurn`) paths refuse any other value before anything is sent,
 * rather than letting the provider return a 400.
 *
 * @param descriptor - The provider descriptor supplying the prefix list.
 * @param modelId - The resolved concrete model id to test.
 * @returns `true` when `modelId` restricts `temperature`.
 * @public
 */
export function rejectsSamplingParams(descriptor: IAiProviderDescriptor, modelId: string): boolean {
  return (
    descriptor.samplingParamsRejectedModelPrefixes?.some((p) => isExactOrDashBoundedPrefix(modelId, p)) ??
    false
  );
}

/**
 * Whether a concrete (already-resolved) model restricts a caller-supplied `temperature` only while
 * reasoning, per the descriptor's
 * {@link IAiProviderDescriptor.samplingParamsRejectedWithThinkingModelPrefixes}
 * (exact-or-dash-bounded match).
 *
 * @remarks
 * A listed model reasons by default, and while it reasons rejects every `temperature` except the
 * descriptor's {@link IAiProviderDescriptor.samplingParamsAcceptedTemperature}, when one is
 * declared. A request that turns thinking off on the wire (see
 * {@link IAiProviderDescriptor.samplingParamsRejectedWithThinkingModelPrefixes}) may send any value.
 * The completion, streaming and client-tool paths refuse a rejected value before anything is sent.
 *
 * @param descriptor - The provider descriptor supplying the prefix list.
 * @param modelId - The resolved concrete model id to test.
 * @returns `true` when `modelId` restricts `temperature` while reasoning.
 * @public
 */
export function rejectsSamplingParamsWithThinking(
  descriptor: IAiProviderDescriptor,
  modelId: string
): boolean {
  return (
    descriptor.samplingParamsRejectedWithThinkingModelPrefixes?.some((p) =>
      isExactOrDashBoundedPrefix(modelId, p)
    ) ?? false
  );
}

/**
 * The `temperature` a model accepts even with thinking on: the descriptor's
 * {@link IAiProviderDescriptor.samplingParamsAcceptedTemperature} on a model that
 * {@link AiAssist.rejectsSamplingParams | restricts temperature} (with or without thinking) or
 * {@link AiAssist.rejectsSamplingParamsWithThinking | restricts it while reasoning}, otherwise
 * `undefined`.
 * @internal
 */
export function temperatureAcceptedWithThinking(
  descriptor: IAiProviderDescriptor,
  modelId: string
): number | undefined {
  return rejectsSamplingParams(descriptor, modelId) || rejectsSamplingParamsWithThinking(descriptor, modelId)
    ? descriptor.samplingParamsAcceptedTemperature
    : undefined;
}

/**
 * Refuses a `temperature` aimed at a model that rejects sampling parameters (see
 * {@link AiAssist.rejectsSamplingParams}), or at a model that rejects them while reasoning (see
 * {@link AiAssist.rejectsSamplingParamsWithThinking}) on a request that does not turn thinking off.
 * Succeeds with the temperature otherwise.
 * @internal
 */
export function checkSamplingParams(
  descriptor: IAiProviderDescriptor,
  modelId: string,
  temperature: number | undefined,
  resolvedThinking: IResolvedThinkingConfig | undefined
): Result<number | undefined> {
  if (temperature === undefined) {
    return succeed(temperature);
  }
  const accepted = descriptor.samplingParamsAcceptedTemperature;
  if (rejectsSamplingParams(descriptor, modelId)) {
    if (accepted === undefined) {
      return fail(`${modelId} does not accept temperature on any request: remove temperature`);
    }
    return temperature === accepted
      ? succeed(temperature)
      : fail(
          `${modelId} does not accept a non-default temperature (${temperature}): remove temperature, or send ${accepted}`
        );
  }
  if (
    !rejectsSamplingParamsWithThinking(descriptor, modelId) ||
    requestTurnsThinkingOff(resolvedThinking, descriptor.apiFormat)
  ) {
    return succeed(temperature);
  }
  // A generic 'none' turns thinking off only where it is sent as off: a thinking-required model
  // degrades it, and a Gemini level model sends it as a level.
  const noneTurnsOff =
    !isThinkingRequiredModel(descriptor, modelId) &&
    resolveGeminiThinkingLevels(descriptor, modelId) === undefined;
  const offHint = noneTurnsOff ? ", or set effort 'none'" : '';
  if (accepted === undefined) {
    return fail(`${modelId} does not accept temperature while reasoning: remove temperature${offHint}`);
  }
  return temperature === accepted
    ? succeed(temperature)
    : fail(
        `${modelId} does not accept a non-default temperature (${temperature}) while reasoning: ` +
          `remove temperature${noneTurnsOff ? ',' : ', or'} send ${accepted}${offHint}`
      );
}
