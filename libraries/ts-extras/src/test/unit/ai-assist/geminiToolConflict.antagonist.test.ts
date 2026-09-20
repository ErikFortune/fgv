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
 * Antagonist torture tests — target class 7 (ai-assist-antagonist phase 2):
 * server-tool x function-calling mutual exclusion.
 *
 * Gemini's `generateContent` HTTP-400s (`INVALID_ARGUMENT`) when built-in
 * grounding (mapped from `web_search` to `google_search`) and function calling
 * (`function_declarations`, from client tools) are combined in the same request.
 * Phase 2 surfaced that ai-assist had NO pre-flight guard — the combination was
 * serialized straight to the wire.
 *
 * The guard added in response was a hard failure keyed on
 * `descriptor.apiFormat === 'gemini'`. A consumer ask (2026-09-19) pointed out
 * that this pushed the same provider-identity branch into every host: the
 * library knew the rule and refused, so the host had to know it too in order to
 * build a request that worked. The rule is now **declared** on the descriptor
 * (`serverToolsExclusiveWithClientTools`) and **resolved** generically by
 * `resolveToolConflicts`, which by default drops the exclusive server tool and
 * keeps the turn.
 *
 * So this suite locks in three things: the exclusion is still enforced (the
 * combination never reaches the wire), it is enforced from the *declaration*
 * rather than from the provider's identity, and what was dropped is reported
 * rather than silent.
 */

import '@fgv/ts-utils-jest';

import { succeed } from '@fgv/ts-utils';
import { JsonSchema } from '@fgv/ts-json-base';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { executeClientToolTurn } from '../../../packlets/ai-assist/streamingAdapters/clientToolContinuationBuilder';
import {
  AiPrompt,
  defaultToolConflictPolicy,
  resolveToolConflicts,
  type AiServerToolConfig,
  type IAiClientTool,
  type IAiProviderDescriptor
} from '../../../packlets/ai-assist';

const querySchema = JsonSchema.object({ query: JsonSchema.string() });

function clientTool(name: string): IAiClientTool {
  return {
    config: {
      type: 'client_tool',
      name,
      description: `tool ${name}`,
      parametersSchema: querySchema
    },
    execute: async () => succeed('ok')
  };
}

const webSearch: AiServerToolConfig = { type: 'web_search' };

function geminiDescriptor(): IAiProviderDescriptor {
  return {
    id: 'google-gemini',
    label: 'Gemini',
    buttonLabel: 'Gemini',
    needsSecret: true,
    apiFormat: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-3.5-flash',
    supportedTools: ['web_search'],
    serverToolsExclusiveWithClientTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: false
  };
}

/**
 * Same provider, but declaring no exclusion — the "provider lifted its limit" case.
 * An explicit `undefined` rather than a deleted key: the field is optional and the
 * resolver reads it through `?? []`, so the two are indistinguishable to it, and
 * this spelling needs no cast.
 */
function unconstrainedGeminiDescriptor(): IAiProviderDescriptor {
  return { ...geminiDescriptor(), serverToolsExclusiveWithClientTools: undefined };
}

const prompt = new AiPrompt('hello', 'system');

// ---- live-stream harness -----------------------------------------------------
// The interesting assertions are about the REQUEST BODY (which tools were actually
// serialized) and the turn result's report — neither is observable from the
// synchronous Result, which succeeds no matter what `effectiveTools` ended up
// holding. So these tests drive the whole turn against a mocked SSE stream.

function makeReadable(chunks: ReadonlyArray<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller: ReadableStreamDefaultController<Uint8Array>): void {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i++]));
      } else {
        controller.close();
      }
    }
  });
}

/** A Gemini stream with one functionCall part, capturing the request body sent. */
function mockGeminiToolCall(toolName: string): () => Record<string, unknown> | undefined {
  const chunks = [
    `data: ${JSON.stringify({
      candidates: [
        {
          content: { parts: [{ functionCall: { name: toolName, args: { query: 'x' } } }] },
          finishReason: 'TOOL_CODE'
        }
      ]
    })}\n\n`,
    `data: ${JSON.stringify({
      candidates: [{ content: { parts: [{ text: '' }] }, finishReason: 'STOP' }]
    })}\n\n`
  ];
  let captured: Record<string, unknown> | undefined;
  (global.fetch as jest.Mock).mockImplementation((...args: unknown[]) => {
    const init = args[1] as RequestInit;
    captured = JSON.parse(init.body as string) as Record<string, unknown>;
    return Promise.resolve({
      ok: true,
      status: 200,
      body: makeReadable(chunks),
      text: jest.fn().mockResolvedValue(''),
      headers: new Map([['content-type', 'text/event-stream']])
    });
  });
  return () => captured;
}

/** A Gemini stream that just answers with text — no tool call. */
function mockGeminiTextOnly(): () => Record<string, unknown> | undefined {
  const chunks = [
    `data: ${JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'answer' }] }, finishReason: 'STOP' }]
    })}\n\n`
  ];
  let captured: Record<string, unknown> | undefined;
  (global.fetch as jest.Mock).mockImplementation((...args: unknown[]) => {
    const init = args[1] as RequestInit;
    captured = JSON.parse(init.body as string) as Record<string, unknown>;
    return Promise.resolve({
      ok: true,
      status: 200,
      body: makeReadable(chunks),
      text: jest.fn().mockResolvedValue(''),
      headers: new Map([['content-type', 'text/event-stream']])
    });
  });
  return () => captured;
}

/** The tool entries Gemini was actually sent, as raw wire objects. */
function sentTools(body: Record<string, unknown> | undefined): ReadonlyArray<Record<string, unknown>> {
  return (body?.tools as ReadonlyArray<Record<string, unknown>>) ?? [];
}

/**
 * Runs the stream to completion. The events are not the subject of these tests —
 * the request body and the conflict report are — but `nextTurn` only resolves
 * once the stream has been consumed.
 */
async function drain(iter: AsyncIterable<unknown>): Promise<number> {
  let seen = 0;
  for await (const event of iter) {
    if (event !== undefined) {
      seen++;
    }
  }
  return seen;
}

describe('resolveToolConflicts (declared exclusion, generic resolution)', () => {
  test('conflicts only when BOTH an exclusive server tool and at least one client tool are present', () => {
    // Wrong impl this catches: a check that fires on either tool kind alone, or
    // that ignores the server-tool side entirely.
    expect(resolveToolConflicts(geminiDescriptor(), [webSearch], [clientTool('a')])).toSucceedAndSatisfy(
      (r) => {
        expect(r.serverTools).toEqual([]);
        expect(r.clientTools).toHaveLength(1);
        expect(r.report.droppedServerTools).toEqual(['web_search']);
      }
    );
  });

  test('no conflict when there are no client tools (grounding-only is legal)', () => {
    // Wrong impl this catches: gating on the server tool alone and stripping
    // grounding from a valid web-search-only request.
    expect(resolveToolConflicts(geminiDescriptor(), [webSearch], [])).toSucceedAndSatisfy((r) => {
      expect(r.serverTools).toEqual([webSearch]);
      expect(r.report.droppedServerTools).toEqual([]);
      expect(r.report.droppedClientTools).toEqual([]);
    });
  });

  test('no conflict when there is no server tool (function-calling-only is legal)', () => {
    // tools undefined (no server tools) and tools present-but-empty both resolve
    // to "no grounding" — a client-tools-only request must pass untouched.
    for (const serverTools of [undefined, []]) {
      expect(resolveToolConflicts(geminiDescriptor(), serverTools, [clientTool('a')])).toSucceedAndSatisfy(
        (r) => {
          expect(r.clientTools).toHaveLength(1);
          expect(r.report.droppedServerTools).toEqual([]);
        }
      );
    }
  });

  test('a descriptor that declares no exclusion keeps both kinds', () => {
    // This is the whole point of moving the rule onto the descriptor: the day
    // Gemini lifts the limit, deleting one line restores the combination — no
    // consumer and no library call site changes. Wrong impl this catches: the
    // rule still keyed on apiFormat, or on the tool type, rather than read from
    // the descriptor.
    expect(
      resolveToolConflicts(unconstrainedGeminiDescriptor(), [webSearch], [clientTool('a')])
    ).toSucceedAndSatisfy((r) => {
      expect(r.serverTools).toEqual([webSearch]);
      expect(r.clientTools).toHaveLength(1);
      expect(r.report.droppedServerTools).toEqual([]);
      expect(r.report.droppedClientTools).toEqual([]);
    });
  });

  test('a server tool the provider does not list as exclusive survives alongside client tools', () => {
    // Wrong impl this catches: dropping every server tool on a descriptor that
    // declares *any* exclusion, rather than only the declared ones.
    const descriptor: IAiProviderDescriptor = {
      ...geminiDescriptor(),
      serverToolsExclusiveWithClientTools: []
    };
    expect(resolveToolConflicts(descriptor, [webSearch], [clientTool('a')])).toSucceedAndSatisfy((r) => {
      expect(r.serverTools).toEqual([webSearch]);
      expect(r.report.droppedServerTools).toEqual([]);
    });
  });

  test("'prefer-server-tools' keeps grounding and drops the client tools, naming them", () => {
    expect(
      resolveToolConflicts(
        geminiDescriptor(),
        [webSearch],
        [clientTool('recall'), clientTool('notify')],
        'prefer-server-tools'
      )
    ).toSucceedAndSatisfy((r) => {
      expect(r.serverTools).toEqual([webSearch]);
      expect(r.clientTools).toEqual([]);
      expect(r.report.droppedClientTools).toEqual(['recall', 'notify']);
      expect(r.report.droppedServerTools).toEqual([]);
    });
  });

  test("'fail' refuses and names the conflicting tool", () => {
    expect(resolveToolConflicts(geminiDescriptor(), [webSearch], [clientTool('a')], 'fail')).toFailWith(
      /provider "google-gemini" cannot combine server tool\(s\) \[web_search\] with client \(function\) tools/i
    );
  });

  test('the report carries the policy that was in force even when nothing conflicted', () => {
    // Wrong impl this catches: reporting a policy only on the conflict path, so a
    // host cannot distinguish "nothing conflicted" from "this build reports nothing".
    expect(resolveToolConflicts(geminiDescriptor(), undefined, [])).toSucceedAndSatisfy((r) => {
      expect(r.report.policy).toBe(defaultToolConflictPolicy);
    });
    expect(
      resolveToolConflicts(geminiDescriptor(), undefined, [], 'prefer-server-tools')
    ).toSucceedAndSatisfy((r) => {
      expect(r.report.policy).toBe('prefer-server-tools');
    });
  });
});

describe('executeClientToolTurn — declared server/client tool exclusion (antagonist)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('by default drops the exclusive server tool from the WIRE and reports it', async () => {
    // Wrong impl this catches: the pre-policy hard failure (which forced every host
    // to strip `web_search` itself by branching on the provider's identity), AND the
    // subtler one where the turn is allowed to proceed but `google_search` still
    // rides along in the request — which is the opaque 400 this guard exists to stop.
    // Asserting only the synchronous Result cannot tell those apart; it succeeds
    // either way.
    const getBody = mockGeminiToolCall('recall');
    const result = executeClientToolTurn({
      descriptor: geminiDescriptor(),
      apiKey: 'test-key',
      ...prompt.toRequest(),
      tools: [webSearch],
      clientTools: [clientTool('recall')],
      model: 'gemini-3.5-flash'
    });
    expect(result).toSucceed();
    if (result.isFailure()) return;

    await drain(result.value.events);
    const turnResult = await result.value.nextTurn;

    const tools = sentTools(getBody());
    expect(tools.some((t) => 'google_search' in t)).toBe(false);
    expect(tools.some((t) => 'function_declarations' in t)).toBe(true);

    expect(turnResult).toSucceedAndSatisfy((r) => {
      expect(r.toolConflicts).toEqual({
        policy: 'drop-server-tools',
        droppedServerTools: ['web_search'],
        droppedClientTools: []
      });
    });
  });

  test("'prefer-server-tools' sends grounding alone and reports the dropped client tools", async () => {
    // A previously impossible state: a client-tool turn that offers no client tools.
    // Wrong impl this catches: a stray `function_declarations` entry surviving into
    // the request, or the turn breaking on an empty dispatch map.
    const getBody = mockGeminiTextOnly();
    const result = executeClientToolTurn({
      descriptor: geminiDescriptor(),
      apiKey: 'test-key',
      ...prompt.toRequest(),
      tools: [webSearch],
      clientTools: [clientTool('recall'), clientTool('notify')],
      model: 'gemini-3.5-flash',
      toolConflictPolicy: 'prefer-server-tools'
    });
    expect(result).toSucceed();
    if (result.isFailure()) return;

    await drain(result.value.events);
    const turnResult = await result.value.nextTurn;

    const tools = sentTools(getBody());
    expect(tools.some((t) => 'google_search' in t)).toBe(true);
    expect(tools.some((t) => 'function_declarations' in t)).toBe(false);

    expect(turnResult).toSucceedAndSatisfy((r) => {
      // No tool call happened, so there is no continuation — but the report is
      // present regardless, which is the whole reason it is required.
      expect(r.continuation).toBeUndefined();
      expect(r.toolConflicts).toEqual({
        policy: 'prefer-server-tools',
        droppedServerTools: [],
        droppedClientTools: ['recall', 'notify']
      });
    });
  });

  test('a duplicate client tool name is still reported when a policy would drop those tools', () => {
    // A duplicate name is a defect in the host's registration, not a property of
    // this turn. Wrong impl this catches: scanning for duplicates over the
    // post-conflict survivors, which makes a deterministic host bug go quiet on
    // exactly the turns where a policy removed the colliding pair — and reappear on
    // the next provider.
    const result = executeClientToolTurn({
      descriptor: geminiDescriptor(),
      apiKey: 'test-key',
      ...prompt.toRequest(),
      tools: [webSearch],
      clientTools: [clientTool('recall'), clientTool('recall')],
      model: 'gemini-3.5-flash',
      toolConflictPolicy: 'prefer-server-tools'
    });
    expect(result).toFailWith(/duplicate client tool name 'recall'/i);
  });

  test('a turn with no conflict still carries a report', async () => {
    // Wrong impl this catches: populating `toolConflicts` only on the conflict
    // path, leaving a host unable to tell "nothing was dropped" from "this build
    // does not report".
    mockGeminiToolCall('recall');
    const result = executeClientToolTurn({
      descriptor: geminiDescriptor(),
      apiKey: 'test-key',
      ...prompt.toRequest(),
      clientTools: [clientTool('recall')],
      model: 'gemini-3.5-flash'
    });
    expect(result).toSucceed();
    if (result.isFailure()) return;

    await drain(result.value.events);
    expect(await result.value.nextTurn).toSucceedAndSatisfy((r) => {
      expect(r.toolConflicts).toEqual({
        policy: 'drop-server-tools',
        droppedServerTools: [],
        droppedClientTools: []
      });
    });
  });

  test("fails fast (before any wire call) under toolConflictPolicy: 'fail'", () => {
    // Wrong impl this catches: no pre-flight guard at all, so the combination
    // serializes to google_search + function_declarations and Gemini answers an
    // opaque 400. The opt-out must still keep it off the wire.
    const result = executeClientToolTurn({
      descriptor: geminiDescriptor(),
      apiKey: 'test-key',
      ...prompt.toRequest(),
      tools: [webSearch],
      clientTools: [clientTool('recall')],
      model: 'gemini-3.5-flash',
      toolConflictPolicy: 'fail'
    });
    expect(result).toFailWith(
      /executeClientToolTurn: provider "google-gemini" cannot combine server tool\(s\) \[web_search\] with client \(function\) tools/i
    );
  });
});
