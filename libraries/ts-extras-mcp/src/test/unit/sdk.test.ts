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

// Exercises the real SDK-isolation seam (the one file that imports @modelcontextprotocol/sdk).
// Constructing the SDK objects is side-effect-free — no process is spawned and no network call is
// made until a transport is connected, so these factory calls are safe in a unit test.
// eslint-disable-next-line @rushstack/packlets/mechanics
import { makeClient, makeHttpTransport, makeStdioTransport } from '../../packlets/mcp/sdk';

describe('sdk isolation seam', () => {
  describe('makeClient', () => {
    test('constructs a client exposing the projected surface', () => {
      const client = makeClient('test-client', '9.9.9');
      expect(typeof client.connect).toBe('function');
      expect(typeof client.listTools).toBe('function');
      expect(typeof client.callTool).toBe('function');
      expect(typeof client.close).toBe('function');
      expect(typeof client.getServerVersion).toBe('function');
      // Before connecting, the server identity is unknown.
      expect(client.getServerVersion()).toBeUndefined();
    });
  });

  describe('makeStdioTransport', () => {
    test('constructs a transport with full params (args/env/cwd)', () => {
      const transport = makeStdioTransport({
        command: 'node',
        args: ['--version'],
        env: { FOO: 'bar' },
        cwd: '/tmp'
      });
      expect(transport).toBeDefined();
    });

    test('constructs a transport with only a command (args omitted)', () => {
      const transport = makeStdioTransport({ command: 'node' });
      expect(transport).toBeDefined();
    });
  });

  describe('makeHttpTransport', () => {
    test('constructs a transport with headers', () => {
      const transport = makeHttpTransport(new URL('http://localhost:9000/mcp'), {
        authorization: 'Bearer x'
      });
      expect(transport).toBeDefined();
    });

    test('constructs a transport without headers', () => {
      const transport = makeHttpTransport(new URL('https://example.com/mcp'));
      expect(transport).toBeDefined();
    });
  });
});
