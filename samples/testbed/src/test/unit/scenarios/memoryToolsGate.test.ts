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

import '@fgv/ts-utils-jest';
import { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { Logging } from '@fgv/ts-utils';

import { memoryToolsGateScenario } from '../../../scenarios/memoryToolsGate';
import type { IScenarioContext } from '../../../shell';

// The scenario builds a mocked SSE response body with the WHATWG `ReadableStream`
// (present in browsers and the Node CLI runtime). jsdom does not expose it as a
// global, so polyfill from `node:stream/web` for the duration of this suite.
const NEEDS_READABLE_STREAM_POLYFILL: boolean =
  (globalThis as { ReadableStream?: unknown }).ReadableStream === undefined;

describe('memoryToolsGateScenario', () => {
  beforeAll(() => {
    if (NEEDS_READABLE_STREAM_POLYFILL) {
      (globalThis as { ReadableStream?: unknown }).ReadableStream = NodeReadableStream;
    }
  });

  afterAll(() => {
    if (NEEDS_READABLE_STREAM_POLYFILL) {
      delete (globalThis as { ReadableStream?: unknown }).ReadableStream;
    }
  });

  test('is a CLI-only ai scenario', () => {
    expect(memoryToolsGateScenario.id).toBe('memory-tools-gate');
    expect(memoryToolsGateScenario.category).toBe('ai');
    expect(memoryToolsGateScenario.cli).toBeDefined();
    expect(memoryToolsGateScenario.web).toBeUndefined();
  });

  test('cli.run drives the mediated-write gate end-to-end (deny then confirm) against a real store', async () => {
    const context = {
      logger: new Logging.LogReporter<unknown>({ logger: new Logging.InMemoryLogger() })
    } as unknown as IScenarioContext;
    if (!memoryToolsGateScenario.cli) {
      throw new Error('expected a CLI implementation');
    }
    expect(await memoryToolsGateScenario.cli.run(context)).toSucceedAndSatisfy((summary: string) => {
      expect(summary).toContain('Run 1 (memory_write): DENIED by host gate');
      expect(summary).toContain('store.get(note-1) === undefined');
      expect(summary).toContain('Run 2 (memory_write): PROCEEDED under host confirmation');
      expect(summary).toContain('record durably persisted');
      expect(summary).toContain('memory-tools-gate scenario: PASS');
    });
  });
});
