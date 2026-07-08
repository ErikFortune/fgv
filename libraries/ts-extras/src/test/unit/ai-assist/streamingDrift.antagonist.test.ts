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
 * Antagonist torture tests — target class 5 (ai-assist-antagonist phase 2):
 * streaming drift instrumentation cross-stream independence, plus one extra
 * SSE-parser split-frame adversarial case. `streamingAdaptersDriftInstrument.test.ts`
 * already exhaustively covers same-stream dedup (same name twice warns once;
 * two different names warn twice) and the payload-preview safety/opt-in
 * behavior — this file extends into the one genuinely uncovered angle: whether
 * the per-name dedup set is stream-scoped or leaks across separate stream
 * invocations.
 */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
import { Logging, type MessageLogLevel, type Success, succeed } from '@fgv/ts-utils';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiProviderDescriptor } from '../../../packlets/ai-assist/model';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { parseSseEvent, readSseEvents } from '../../../packlets/ai-assist/sseParser';

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

function mockSseResponse(chunks: ReadonlyArray<string>): void {
  const body = makeReadable(chunks);
  const response = {
    ok: true,
    status: 200,
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

const TEST_PROMPT = new AiAssist.AiPrompt('hello', 'system');
const OPENAI_TOOLS: ReadonlyArray<AiAssist.AiServerToolConfig> = [{ type: 'web_search' }];

describe('unrecognized-event dedup does not leak across separate stream invocations (antagonist)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // Wrong impl this guards: a module-level (rather than per-call) Set tracking warned
  // event names would dedup across unrelated streams, silently suppressing a drift
  // warning on the SECOND stream's first-ever occurrence of a name already seen on an
  // earlier, unrelated stream.
  test('a fresh stream that sees a previously-warned-about name warns again', async () => {
    const sseChunksForOneUnknownEvent = (foo: number): string[] => [
      `event: response.totally_new_event_type\ndata: ${JSON.stringify({ foo })}\n\n`,
      `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
    ];

    const loggerA = new RecordingLogger();
    mockSseResponse(sseChunksForOneUnknownEvent(1));
    const resultA = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest(),
      tools: OPENAI_TOOLS,
      logger: loggerA
    });
    expect(resultA).toSucceed();
    if (resultA.isSuccess()) {
      await collect(resultA.value);
    }
    expect(loggerA.entries.filter((e) => e.level === 'warning')).toHaveLength(1);

    // Second, independent stream — a fresh adapter call, same unknown event name.
    const loggerB = new RecordingLogger();
    mockSseResponse(sseChunksForOneUnknownEvent(2));
    const resultB = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest(),
      tools: OPENAI_TOOLS,
      logger: loggerB
    });
    expect(resultB).toSucceed();
    if (resultB.isSuccess()) {
      await collect(resultB.value);
    }
    // The second stream must warn independently — the dedup set must not have leaked
    // from stream A's already-warned 'response.totally_new_event_type'.
    const warningsB = loggerB.entries.filter((e) => e.level === 'warning');
    expect(warningsB).toHaveLength(1);
    expect(warningsB[0].message).toContain("'response.totally_new_event_type'");
  });
});

describe('SSE frame reassembly — split mid keyword (antagonist)', () => {
  // Wrong impl this guards: a parser that keys off the FIRST chunk containing the
  // literal substring "data:" (rather than buffering until a full message is
  // available) would misparse a message whose `data:` keyword itself is split
  // across two read() calls (e.g. "da" then "ta: hello\n\n").
  test('reassembles a message whose "data:" keyword is split across read() boundaries', async () => {
    const full = 'data: hello-world\n\n';
    const splitPoint = 2; // splits between "da" and "ta: hello-world\n\n"
    const iter = readSseEvents(makeReadable([full.slice(0, splitPoint), full.slice(splitPoint)]));
    const collected: Array<{ event?: string; data: string }> = [];
    for await (const ev of iter) {
      collected.push(ev);
    }
    expect(collected).toEqual([{ data: 'hello-world' }]);
    // Sanity: parseSseEvent alone (no buffering) would mis-parse the raw first
    // fragment as a message with no data line.
    expect(parseSseEvent(full.slice(0, splitPoint))).toBeUndefined();
  });
});
