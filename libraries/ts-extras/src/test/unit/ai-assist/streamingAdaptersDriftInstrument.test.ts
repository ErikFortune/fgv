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
 * Tests for the per-stream "unrecognized SSE event" warning instrument added to
 * the OpenAI Responses and Anthropic streaming adapters.
 *
 * The instrument exists as the empirical diagnostic for provider drift — when a
 * provider adds (or renames) an SSE event type that the adapter does not have
 * an explicit handler for, the adapter logs a single warning per stream per
 * event name and continues. The warning surfaces drift the next time the
 * affected stream runs; silent no-op'd events (the prior failure mode that
 * required tcpdump-style instrumentation to diagnose) are no longer possible.
 *
 * Lives in its own file so the main `streamingAdapters.test.ts` stays under
 * the per-file line cap and so the drift-instrument tests are easy to find.
 *
 * @packageDocumentation
 */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
import { Logging, type MessageLogLevel, type Success, succeed } from '@fgv/ts-utils';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiProviderDescriptor } from '../../../packlets/ai-assist/model';

// ============================================================================
// Test helpers
// ============================================================================

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

function mockSseResponse(chunks: ReadonlyArray<string>, status: number = 200): void {
  const body = makeReadable(chunks);
  const response = {
    ok: status >= 200 && status < 300,
    status,
    body,
    text: jest.fn().mockResolvedValue(''),
    headers: new Headers(),
    statusText: 'OK'
  };
  (global.fetch as jest.Mock).mockResolvedValue(response);
}

async function collect(iter: AsyncIterable<AiAssist.IAiStreamEvent>): Promise<AiAssist.IAiStreamEvent[]> {
  const out: AiAssist.IAiStreamEvent[] = [];
  for await (const event of iter) {
    out.push(event);
  }
  return out;
}

function makeAnthropicDescriptor(): IAiProviderDescriptor {
  return {
    id: 'anthropic',
    label: 'Anthropic',
    buttonLabel: 'AI Assist | Anthropic',
    needsSecret: true,
    apiFormat: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: true,
    thinkingMode: 'optional'
  };
}

function makeOpenAiResponsesDescriptor(): IAiProviderDescriptor {
  return {
    id: 'openai',
    label: 'OpenAI',
    buttonLabel: 'AI Assist | OpenAI',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: true,
    thinkingMode: 'optional'
  };
}

const TEST_PROMPT = new AiAssist.AiPrompt('hello', 'system');
const OPENAI_TOOLS: ReadonlyArray<AiAssist.AiServerToolConfig> = [{ type: 'web_search' }];
const ANTHROPIC_TOOLS: ReadonlyArray<AiAssist.AiServerToolConfig> = [{ type: 'web_search' }];

/**
 * Test logger that records every formatted (level, message) pair `_log` is called with.
 * Extending `LoggerBase` keeps us on the canonical surface — no duck-typed mocks of the
 * `ILogger` interface that drift when ts-utils adds methods.
 */
class RecordingLogger extends Logging.LoggerBase {
  public readonly entries: Array<{ level: MessageLogLevel; message: string }> = [];
  public constructor() {
    super('all');
  }
  protected _log(message: string, level: MessageLogLevel): Success<string | undefined> {
    this.entries.push({ level, message });
    return succeed(message);
  }
}

// ============================================================================
// OpenAI Responses adapter — drift instrument
// ============================================================================

describe('OpenAI Responses streaming adapter — unrecognized-event drift instrument', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('warns once per stream when an SSE event name is not in the recognized allowlist', async () => {
    // Two unknown events arrive (one repeated twice — we should warn ONCE for that name)
    // followed by a recognized event so the stream completes normally.
    const sseChunks: string[] = [
      `event: response.totally_new_event_type\ndata: ${JSON.stringify({ foo: 1 })}\n\n`,
      `event: response.totally_new_event_type\ndata: ${JSON.stringify({ foo: 2 })}\n\n`,
      `event: response.also_unknown\ndata: ${JSON.stringify({ bar: 3 })}\n\n`,
      `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
    ];
    mockSseResponse(sseChunks);

    const logger = new RecordingLogger();

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      prompt: TEST_PROMPT,
      tools: OPENAI_TOOLS,
      logger
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    await collect(result.value);

    // Exactly two warnings — one per unknown event name (the duplicate `totally_new_event_type`
    // is deduplicated within the stream — the second occurrence with `foo: 2` is suppressed).
    const warnings = logger.entries.filter((e) => e.level === 'warning');
    expect(warnings).toHaveLength(2);
    expect(warnings[0].message).toContain("'response.totally_new_event_type'");
    expect(warnings[1].message).toContain("'response.also_unknown'");
    // Each warning must start with the stable filter prefix so production deployments
    // can alert on the prefix without coupling to the per-adapter detail message.
    for (const w of warnings) {
      expect(w.message.startsWith('ai-assist:unrecognized-event ')).toBe(true);
      // The warning must also mention the allowlist constant so a developer can find it.
      expect(w.message).toContain('RECOGNIZED_OPENAI_RESPONSES_EVENTS');
      // The warning must include a payload preview so a triager can see the JSON shape
      // that arrived without re-running the scenario under a debugger.
      expect(w.message).toContain('payload preview:');
    }
    // First warning fires on the first occurrence of `totally_new_event_type` with foo:1
    // (the second occurrence is deduped). Its preview reflects that payload.
    expect(warnings[0].message).toContain('"foo":1');
    expect(warnings[1].message).toContain('"bar":3');
  });

  test('does not warn for recognized-but-silently-handled lifecycle, reasoning, and content-part events', async () => {
    // Every event here is in RECOGNIZED_OPENAI_RESPONSES_EVENTS but has no handler arm —
    // the adapter ignores them by design. No warnings should fire.
    const sseChunks: string[] = [
      `event: response.created\ndata: ${JSON.stringify({ response: {} })}\n\n`,
      `event: response.in_progress\ndata: ${JSON.stringify({ response: {} })}\n\n`,
      `event: response.queued\ndata: ${JSON.stringify({ response: {} })}\n\n`,
      `event: response.output_text.done\ndata: ${JSON.stringify({ text: 'hi' })}\n\n`,
      `event: response.content_part.added\ndata: ${JSON.stringify({})}\n\n`,
      `event: response.content_part.done\ndata: ${JSON.stringify({})}\n\n`,
      `event: response.output_item.done\ndata: ${JSON.stringify({ item: { type: 'message' } })}\n\n`,
      `event: response.reasoning_summary_text.delta\ndata: ${JSON.stringify({ delta: 'reasoning' })}\n\n`,
      `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
    ];
    mockSseResponse(sseChunks);

    const logger = new RecordingLogger();

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      prompt: TEST_PROMPT,
      tools: OPENAI_TOOLS,
      logger
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    await collect(result.value);

    expect(logger.entries.filter((e) => e.level === 'warning')).toHaveLength(0);
  });

  test('unknown-event drift instrument is a no-op when no logger is supplied (still dedups internally)', async () => {
    // Drives the same unknown-event flow as the warn test, but without a logger. Verifies
    // the optional-chain `logger?.warn` branch is safe (does not throw) and the stream
    // completes normally. Coverage-closure for the no-logger arm.
    const sseChunks: string[] = [
      `event: response.totally_new_event_type\ndata: ${JSON.stringify({ foo: 1 })}\n\n`,
      `event: response.totally_new_event_type\ndata: ${JSON.stringify({ foo: 2 })}\n\n`,
      `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
    ];
    mockSseResponse(sseChunks);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      prompt: TEST_PROMPT,
      tools: OPENAI_TOOLS
      // intentionally no logger
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const events = await collect(result.value);
    const doneEvent = events[events.length - 1] as AiAssist.IAiStreamDone;
    expect(doneEvent.type).toBe('done');
  });

  test('drift warning truncates verbose payloads with an ellipsis (log-volume bound)', async () => {
    // Build a payload longer than the 200-char preview cap so the warning's preview gets
    // truncated. Truncation must produce a stable suffix (ellipsis) and stay on one line.
    const longString = 'x'.repeat(500);
    const sseChunks: string[] = [
      `event: response.verbose_unknown\ndata: ${JSON.stringify({ huge: longString })}\n\n`,
      `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
    ];
    mockSseResponse(sseChunks);

    const logger = new RecordingLogger();

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      prompt: TEST_PROMPT,
      tools: OPENAI_TOOLS,
      logger
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    await collect(result.value);

    const warnings = logger.entries.filter((e) => e.level === 'warning');
    expect(warnings).toHaveLength(1);
    const msg = warnings[0].message;
    expect(msg).toContain('payload preview:');
    // Truncation marker present.
    expect(msg).toContain('…');
    // The preview substring sits between the "payload preview: " marker and the trailing
    // ". This may indicate" sentence; verify it's bounded.
    const previewStart = msg.indexOf('payload preview: ') + 'payload preview: '.length;
    const previewEnd = msg.indexOf('. This may indicate', previewStart);
    expect(previewEnd).toBeGreaterThan(previewStart);
    const preview = msg.slice(previewStart, previewEnd);
    // 200-char cap + 1 ellipsis character = 201 chars max in the preview substring.
    expect(preview.length).toBeLessThanOrEqual(201);
  });

  test('drift warning includes `<no payload>` marker when an unknown event arrives with no data', async () => {
    // SSE permits event-only records (no data: lines). The preview helper renders these
    // as `<no payload>` so the warning still reads cleanly.
    const sseChunks: string[] = [
      `event: response.empty_unknown\ndata: \n\n`,
      `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
    ];
    mockSseResponse(sseChunks);

    const logger = new RecordingLogger();

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      prompt: TEST_PROMPT,
      tools: OPENAI_TOOLS,
      logger
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    await collect(result.value);

    const warnings = logger.entries.filter((e) => e.level === 'warning');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain('payload preview: <no payload>');
  });
});

// ============================================================================
// Anthropic adapter — drift instrument
// ============================================================================

describe('Anthropic streaming adapter — unrecognized-event drift instrument', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('warns once per stream when an Anthropic SSE event name is not in the recognized allowlist', async () => {
    const sseChunks: string[] = [
      `event: future_anthropic_event\ndata: ${JSON.stringify({ foo: 1 })}\n\n`,
      `event: future_anthropic_event\ndata: ${JSON.stringify({ foo: 2 })}\n\n`,
      `event: another_unknown\ndata: ${JSON.stringify({ bar: 3 })}\n\n`,
      `event: message_stop\ndata: ${JSON.stringify({})}\n\n`
    ];
    mockSseResponse(sseChunks);

    const logger = new RecordingLogger();

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'sk',
      prompt: TEST_PROMPT,
      tools: ANTHROPIC_TOOLS,
      logger
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    await collect(result.value);

    const warnings = logger.entries.filter((e) => e.level === 'warning');
    expect(warnings).toHaveLength(2);
    expect(warnings[0].message).toContain("'future_anthropic_event'");
    expect(warnings[1].message).toContain("'another_unknown'");
    // Each warning must start with the stable filter prefix so production deployments
    // can alert on the prefix without coupling to the per-adapter detail message.
    for (const w of warnings) {
      expect(w.message.startsWith('ai-assist:unrecognized-event ')).toBe(true);
      expect(w.message).toContain('RECOGNIZED_ANTHROPIC_EVENTS');
      // The warning must include a payload preview so a triager can see the JSON shape
      // that arrived without re-running the scenario under a debugger.
      expect(w.message).toContain('payload preview:');
    }
    expect(warnings[0].message).toContain('"foo":1');
    expect(warnings[1].message).toContain('"bar":3');
  });

  test('does not warn for recognized-but-silently-handled Anthropic lifecycle events (message_start, ping)', async () => {
    const sseChunks: string[] = [
      `event: message_start\ndata: ${JSON.stringify({ message: { id: 'msg_1' } })}\n\n`,
      `event: ping\ndata: ${JSON.stringify({})}\n\n`,
      `event: ping\ndata: ${JSON.stringify({})}\n\n`,
      `event: message_stop\ndata: ${JSON.stringify({})}\n\n`
    ];
    mockSseResponse(sseChunks);

    const logger = new RecordingLogger();

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'sk',
      prompt: TEST_PROMPT,
      tools: ANTHROPIC_TOOLS,
      logger
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    await collect(result.value);

    expect(logger.entries.filter((e) => e.level === 'warning')).toHaveLength(0);
  });

  test('Anthropic drift instrument: unknown event is a no-op when no logger is supplied', async () => {
    const sseChunks: string[] = [
      `event: future_anthropic_event\ndata: ${JSON.stringify({})}\n\n`,
      `event: message_stop\ndata: ${JSON.stringify({})}\n\n`
    ];
    mockSseResponse(sseChunks);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'sk',
      prompt: TEST_PROMPT,
      tools: ANTHROPIC_TOOLS
      // intentionally no logger
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const events = await collect(result.value);
    const doneEvent = events[events.length - 1] as AiAssist.IAiStreamDone;
    expect(doneEvent.type).toBe('done');
  });
});
