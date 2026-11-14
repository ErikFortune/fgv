/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * Captures an ai-assist request body without a network call.
 *
 * @remarks
 * `@fgv/ts-extras`' ai-assist exposes no per-call transport, so the only public way to see the
 * request its builders produce is to substitute `globalThis.fetch` for the duration of one call.
 * The substitute records the body and answers a fixed Anthropic completion; the original is
 * restored in a `finally`, whether the call succeeds, fails or throws. This is the one global the
 * journey touches, and it is recorded as a proving-ground finding.
 *
 * @packageDocumentation
 */

import { AiAssist } from '@fgv/ts-extras';
import { Converters as JsonConverters, JsonObject } from '@fgv/ts-json-base';
import { Converter, Converters, Result, captureAsyncResult, captureResult, succeed } from '@fgv/ts-utils';

/** Not a credential: the request never leaves the process. */
export const placeholderApiKey: string = 'placeholder-not-a-credential';

const anthropicCompletion: JsonObject = {
  content: [{ type: 'text', text: 'noted' }],
  stop_reason: 'end_turn'
};

/** What a captured Anthropic request carried in its `system` member, block by block. */
export interface ICapturedSystemBlock {
  readonly text: string;
  readonly cached: boolean;
}

/** A captured request: its system blocks and whole serialized body. */
export interface ICapturedRequest {
  readonly system: ReadonlyArray<ICapturedSystemBlock>;
  readonly body: string;
  /** Requests the substitute received during the call. */
  readonly requests: number;
}

interface IWireBlock {
  readonly text: string;
  readonly cache_control?: JsonObject;
}

/** Anthropic's `system`: a plain string, or text blocks some of which carry a cache breakpoint. */
const systemMember: Converter<ReadonlyArray<ICapturedSystemBlock>> = Converters.oneOf<
  ReadonlyArray<ICapturedSystemBlock>
>([
  Converters.string.map((text) => succeed([{ text, cached: false }])),
  Converters.arrayOf(
    Converters.object<IWireBlock>({
      text: Converters.string,
      cache_control: JsonConverters.jsonObject.optional()
    })
  ).map((blocks) => succeed(blocks.map((b) => ({ text: b.text, cached: b.cache_control !== undefined }))))
]);

const requestBody: Converter<{ readonly system: ReadonlyArray<ICapturedSystemBlock> }> = Converters.object({
  system: systemMember
});

/** Puts back the `fetch` a capture replaced — removing it again if there was none. */
function restoreFetch(original: typeof globalThis.fetch | undefined): void {
  if (original === undefined) {
    delete (globalThis as { fetch?: unknown }).fetch;
  } else {
    globalThis.fetch = original;
  }
}

/**
 * Sends `system` with `cache` through `AiAssist.callProviderCompletion` to Anthropic, with `fetch`
 * substituted, and returns what would have been sent.
 */
export async function captureAnthropicRequest(
  system: string,
  cache: AiAssist.IAiCacheRequest
): Promise<Result<ICapturedRequest>> {
  const original: typeof globalThis.fetch | undefined = globalThis.fetch;
  const bodies: string[] = [];
  globalThis.fetch = (async (__url: unknown, init: { readonly body?: unknown }) => {
    bodies.push(String(init.body));
    return {
      ok: true,
      status: 200,
      json: async () => anthropicCompletion
    };
  }) as unknown as typeof globalThis.fetch;
  try {
    return (
      await captureAsyncResult(async () =>
        AiAssist.callProviderCompletion({
          descriptor: AiAssist.getProviderDescriptor('anthropic').orThrow(),
          apiKey: placeholderApiKey,
          system,
          messages: [{ role: 'user', content: 'What should happen next?' }],
          cache
        })
      )
    )
      .onSuccess((completion) => completion)
      .withErrorFormat((message) => `capture: the completion call failed: ${message}`)
      .onSuccess(() => captureResult(() => JSON.parse(bodies[bodies.length - 1]) as unknown))
      .onSuccess((parsed) => requestBody.convert(parsed))
      .onSuccess((parsed) =>
        succeed({ system: parsed.system, body: bodies[bodies.length - 1], requests: bodies.length })
      );
  } finally {
    restoreFetch(original);
  }
}
