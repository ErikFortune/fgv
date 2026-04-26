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
 * Server-Sent Events (SSE) parser primitives shared by the streaming format
 * adapters in `streamingClient.ts`. Implements the subset of the SSE wire
 * format that LLM providers actually emit: optional `event:` line, one or
 * more `data:` lines per message, messages separated by a blank line.
 *
 * @packageDocumentation
 */

/**
 * One parsed SSE message (the SSE spec calls each blank-line-terminated
 * record an "event").
 *
 * @internal
 */
export interface ISseEvent {
  /** The `event:` field, if present (some providers omit it). */
  readonly event?: string;
  /** Concatenated contents of the message's `data:` lines. */
  readonly data: string;
}

/**
 * Parses a single SSE message (the text between blank-line separators) into
 * an {@link ISseEvent}. Returns undefined for messages with no `data:` lines
 * (comments, heartbeats).
 *
 * @internal
 */
export function parseSseEvent(chunk: string): ISseEvent | undefined {
  let event: string | undefined;
  const dataLines: string[] = [];
  for (const line of chunk.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      // Per the SSE spec the value starts after the colon, with one optional leading space stripped.
      const value = line.slice(5);
      dataLines.push(value.startsWith(' ') ? value.slice(1) : value);
    }
  }
  if (dataLines.length === 0) {
    return undefined;
  }
  return event !== undefined ? { event, data: dataLines.join('\n') } : { data: dataLines.join('\n') };
}

/**
 * Reads an SSE response body and yields parsed events. Buffers across read()
 * boundaries so a message split mid-chunk still parses cleanly. Terminates
 * when the stream closes (normal EOF or aborted fetch).
 *
 * @internal
 */
export async function* readSseEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<ISseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    let streaming = true;
    while (streaming) {
      const { value, done } = await reader.read();
      if (done) {
        streaming = false;
        if (buffer.length > 0) {
          const tail = parseSseEvent(buffer.replace(/\r\n/g, '\n'));
          if (tail) {
            yield tail;
          }
        }
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      // SSE messages are separated by a blank line; some servers use \r\n.
      const normalized = buffer.replace(/\r\n/g, '\n');
      const parts = normalized.split('\n\n');
      // Last element is the partial chunk (no terminating blank line yet); buffer it.
      buffer = parts.pop() ?? '';
      for (const chunk of parts) {
        const event = parseSseEvent(chunk);
        if (event) {
          yield event;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Parses the `data` payload of an SSE event as JSON. Returns undefined for
 * the OpenAI `[DONE]` sentinel and for any payload that fails to parse —
 * adapters treat both as "skip this event."
 *
 * @internal
 */
export function parseSseEventJson(data: string): unknown | undefined {
  if (data === '[DONE]') {
    return undefined;
  }
  try {
    return JSON.parse(data);
  } catch {
    return undefined;
  }
}
