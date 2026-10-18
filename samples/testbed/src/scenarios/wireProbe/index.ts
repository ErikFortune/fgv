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

/**
 * `wire-probe` scenario (CLI-only): sends each fixture schema, unadapted, to every provider wire
 * whose key is configured, and compares what the provider accepts with the keyword-capability
 * table `ai-assist` adapts that wire's schemas with. See `./probe` for the method and the exit
 * status.
 *
 * **Usage.** Live keys, on demand, never in CI:
 *
 * ```sh
 * ANTHROPIC_API_KEY=… OPENAI_API_KEY=… GEMINI_API_KEY=… XAI_API_KEY=… \
 *   node bin/testbed.js --scenario wire-probe
 *
 * # a subset of wires:
 * WIRE_PROBE_WIRES=anthropic-tools,gemini-tools node bin/testbed.js --scenario wire-probe
 * ```
 *
 * A wire whose provider has no key is skipped and says so in the report.
 *
 * @packageDocumentation
 */

import { fail } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';

import type { ICliScenarioImpl, IScenario, IScenarioContext } from '../../shell';
import { requiredSecretsForProviders } from '../aiProviderSecrets';
import { WIRE_PROBE_WIRES } from './wires';
import { type IWireProbeDeps, runWireProbe, selectWires } from './probe';

export * from './fixtures';
export * from './probe';
export * from './report';
export * from './wires';

/**
 * Runs the probe over the wires `env` selects.
 * @public
 */
export async function runWireProbeScenario(
  context: IScenarioContext,
  deps: IWireProbeDeps,
  env: Readonly<Record<string, string | undefined>>
): Promise<Result<string>> {
  const wires = selectWires(env, WIRE_PROBE_WIRES);
  if (wires.isFailure()) {
    return fail(wires.message);
  }
  return runWireProbe(context, deps, wires.value);
}

const cliImpl: ICliScenarioImpl = {
  async run(context: IScenarioContext): Promise<Result<string>> {
    // The live seams load only here, so a test that imports this module never reaches them.
    const { LIVE_WIRE_PROBE_DEPS } = await import('./live');
    return runWireProbeScenario(context, LIVE_WIRE_PROBE_DEPS, process.env);
  }
};

/**
 * The wire-probe scenario (CLI-only). Registered in `scenarios/index.ts`.
 * @public
 */
export const wireProbeScenario: IScenario = {
  id: 'wire-probe',
  title: 'Provider wire probe',
  description:
    'Sends fixture schemas unadapted to each configured provider wire (Anthropic tools and JSON ' +
    'outputs, OpenAI and xAI Responses tools and strict output, Gemini tools and responseSchema) ' +
    "and compares what each accepts with ai-assist's keyword tables; then confirms each adapted " +
    'request is accepted. Exits non-zero only on an unsafe row. Live keys; CLI-only; never in CI.',
  category: 'ai',
  tags: ['ai-assist', 'json-schema', 'wire-probe', 'diagnostic', 'cli'],
  requiredSecrets: requiredSecretsForProviders(['anthropic', 'openai', 'google-gemini', 'xai-grok']),
  cli: cliImpl
};
