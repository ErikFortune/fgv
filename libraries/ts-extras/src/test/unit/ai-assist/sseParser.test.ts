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

// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  type ISseEvent,
  parseSseEvent,
  parseSseEventJson,
  readSseEvents
} from '../../../packlets/ai-assist/sseParser';

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

async function collect(iter: AsyncIterable<ISseEvent>): Promise<ISseEvent[]> {
  const out: ISseEvent[] = [];
  for await (const ev of iter) {
    out.push(ev);
  }
  return out;
}

describe('parseSseEvent', () => {
  test('parses a data-only message', () => {
    expect(parseSseEvent('data: hello')).toEqual({ data: 'hello' });
  });

  test('parses an event + data pair', () => {
    expect(parseSseEvent('event: ping\ndata: hi')).toEqual({ event: 'ping', data: 'hi' });
  });

  test('joins multi-line data with a newline', () => {
    expect(parseSseEvent('data: line1\ndata: line2')).toEqual({ data: 'line1\nline2' });
  });

  test('strips exactly one leading space after the data colon', () => {
    expect(parseSseEvent('data:  twoSpaces')).toEqual({ data: ' twoSpaces' });
    expect(parseSseEvent('data:noSpace')).toEqual({ data: 'noSpace' });
  });

  test('returns undefined for chunks with no data line (comment/heartbeat)', () => {
    expect(parseSseEvent(': heartbeat')).toBeUndefined();
    expect(parseSseEvent('event: ping')).toBeUndefined();
    expect(parseSseEvent('')).toBeUndefined();
  });

  test('trims whitespace around the event name', () => {
    expect(parseSseEvent('event:   spaced  \ndata: x')).toEqual({ event: 'spaced', data: 'x' });
  });
});

describe('parseSseEventJson', () => {
  test('parses valid JSON', () => {
    expect(parseSseEventJson('{"a":1}')).toEqual({ a: 1 });
  });

  test('returns undefined for the [DONE] sentinel', () => {
    expect(parseSseEventJson('[DONE]')).toBeUndefined();
  });

  test('returns undefined for malformed JSON instead of throwing', () => {
    expect(parseSseEventJson('{not json')).toBeUndefined();
    expect(parseSseEventJson('')).toBeUndefined();
  });
});

describe('readSseEvents', () => {
  test('yields events from chunks split on blank lines', async () => {
    const events = await collect(readSseEvents(makeReadable(['data: a\n\ndata: b\n\n'])));
    expect(events).toEqual([{ data: 'a' }, { data: 'b' }]);
  });

  test('reassembles a message split across read() boundaries', async () => {
    const full = 'data: hello-world\n\n';
    const mid = Math.floor(full.length / 2);
    const events = await collect(readSseEvents(makeReadable([full.slice(0, mid), full.slice(mid)])));
    expect(events).toEqual([{ data: 'hello-world' }]);
  });

  test('flushes a trailing partial chunk on stream close', async () => {
    // No terminating blank line — parser should still emit the buffered event at EOF.
    const events = await collect(readSseEvents(makeReadable(['data: tail'])));
    expect(events).toEqual([{ data: 'tail' }]);
  });

  test('normalizes \\r\\n separators', async () => {
    const events = await collect(readSseEvents(makeReadable(['data: a\r\n\r\ndata: b\r\n\r\n'])));
    expect(events).toEqual([{ data: 'a' }, { data: 'b' }]);
  });

  test('skips empty/comment chunks between real events', async () => {
    const events = await collect(readSseEvents(makeReadable([': heartbeat\n\ndata: real\n\n'])));
    expect(events).toEqual([{ data: 'real' }]);
  });

  test('skips a trailing buffer that has no data lines', async () => {
    // EOF flush path: buffer holds a comment-only chunk; nothing should be yielded.
    const events = await collect(readSseEvents(makeReadable([': only-a-comment'])));
    expect(events).toEqual([]);
  });

  test('preserves event names alongside data', async () => {
    const events = await collect(
      readSseEvents(makeReadable(['event: ping\ndata: 1\n\nevent: pong\ndata: 2\n\n']))
    );
    expect(events).toEqual([
      { event: 'ping', data: '1' },
      { event: 'pong', data: '2' }
    ]);
  });
});
