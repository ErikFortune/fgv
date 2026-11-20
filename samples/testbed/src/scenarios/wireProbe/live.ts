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
 * The wire probe's live seams: the raw POST and the end-to-end call through `ai-assist`.
 *
 * @remarks
 * Excluded from coverage by `config/jest.config.json`'s `coveragePathIgnorePatterns`, as
 * `xaiCacheProbe/index.js` is, because both functions need a live provider. They are not pure
 * pass-throughs: `sendClientToolTurn` drains the turn's events and its error text is what
 * `observeAdapted` matches on, so a change here is checked only by a live run. Everything that reads
 * their results (classification, the control gate, the report) is in `./probe` and `./report` and
 * is covered over recorded responses.
 *
 * @packageDocumentation
 */

import { captureAsyncResult, fail, succeed } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';

import type { IAdaptedRequest, IHttpResponse, IWireProbeDeps } from './probe';
import type { IRawRequest } from './wires';
import { PROBE_PROMPT, PROBE_TOOL_NAME } from './wires';

/** The bound on one raw request, so a hung provider ends the run as inconclusive rather than stalling it. */
const RAW_TIMEOUT_MS: number = 60_000;

/**
 * Posts a raw request with the platform `fetch`.
 *
 * @remarks
 * Not `saferFetchJson`, which the testbed otherwise prefers: it never surfaces a non-2xx body
 * (error bodies can echo request content, so that is a deliberate opt-out), and the provider's
 * error text is what this probe exists to record. The URL is the registry's own `baseUrl`, not
 * caller input, and these request bodies carry no secret — the key is in a header.
 */
async function postJsonLive(request: IRawRequest): Promise<Result<IHttpResponse>> {
  return captureAsyncResult(async () => {
    const response = await fetch(request.url, {
      method: 'POST',
      headers: { ...request.headers, 'content-type': 'application/json' },
      body: JSON.stringify(request.body),
      signal: AbortSignal.timeout(RAW_TIMEOUT_MS)
    });
    return { status: response.status, body: await response.text() };
  });
}

/**
 * The cap on an end-to-end request. Larger than the raw cap because `ai-assist` reads the reply,
 * and a reasoning model can spend 16 tokens before writing any; an empty reply is reported as
 * inconclusive rather than accepted.
 */
const ADAPTED_MAX_TOKENS: number = 256;

/** Drains a client-tool turn: the first `error` event, or the turn's own failure, is the result. */
async function sendClientToolTurn(request: IAdaptedRequest): Promise<Result<string>> {
  const tool: AiAssist.IAiClientTool = {
    config: {
      type: 'client_tool',
      name: PROBE_TOOL_NAME,
      description: 'A probe tool. Do not call it.',
      parametersSchema: request.schema
    },
    execute: async () => succeed('ok')
  };
  const turn = AiAssist.executeClientToolTurn({
    descriptor: request.descriptor,
    apiKey: request.apiKey,
    messages: [{ role: 'user', content: PROBE_PROMPT }],
    clientTools: [tool],
    model: request.model,
    maxTokens: ADAPTED_MAX_TOKENS
  });
  if (turn.isFailure()) {
    return fail(turn.message);
  }
  for await (const event of turn.value.events) {
    if (event.type === 'error') {
      return fail(event.message);
    }
  }
  return (await turn.value.nextTurn).onSuccess(() => succeed('turn completed'));
}

/** One structured-output completion, `onUnsupported: 'fail'` so a refusal is not degraded away. */
async function sendStructuredOutput(request: IAdaptedRequest): Promise<Result<string>> {
  return (
    await AiAssist.callProviderCompletion({
      descriptor: request.descriptor,
      apiKey: request.apiKey,
      messages: [{ role: 'user', content: PROBE_PROMPT }],
      modelOverride: request.model,
      maxTokens: ADAPTED_MAX_TOKENS,
      structuredOutput: { mode: 'schema', schema: request.schema, onUnsupported: 'fail' }
    })
  ).onSuccess((response) => succeed(response.content));
}

/**
 * Live dependencies.
 * @public
 */
export const LIVE_WIRE_PROBE_DEPS: IWireProbeDeps = {
  postJson: postJsonLive,
  sendAdapted: (request) =>
    request.wire.kind === 'tools' ? sendClientToolTurn(request) : sendStructuredOutput(request)
};
