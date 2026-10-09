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
import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js';
import { SseError } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPError } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

// eslint-disable-next-line @rushstack/packlets/mechanics
import { classifySdkError, makeClient, makeHttpTransport, makeStdioTransport } from '../../packlets/mcp/sdk';

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

  describe('classifySdkError', () => {
    const SESSION = { phase: 'session', closed: false } as const;
    const CLOSED = { phase: 'session', closed: true } as const;
    const CONNECT = { phase: 'connect' } as const;

    test('maps a value that throws when inspected to transport, or not-connected on a closed session', () => {
      const unreadableName = Object.defineProperty(new Error('e'), 'name', {
        get(): string {
          throw new Error('name');
        }
      });
      const hostile = new Proxy(
        {},
        {
          getPrototypeOf(): never {
            throw new Error('trap');
          }
        }
      );
      for (const error of [unreadableName, hostile]) {
        expect(classifySdkError(error, { phase: 'connect' })).toEqual({ kind: 'transport' });
        expect(classifySdkError(error, { phase: 'session', closed: false })).toEqual({ kind: 'transport' });
        expect(classifySdkError(error, { phase: 'session', closed: true })).toEqual({
          kind: 'not-connected'
        });
      }
    });

    test('maps the SDK timeout code to timeout, never to transport or protocol', () => {
      const err = McpError.fromError(ErrorCode.RequestTimeout, 'Request timed out', { timeout: 5 });
      expect(classifySdkError(err, SESSION)).toEqual({ kind: 'timeout' });
    });

    test('maps -32000 to not-connected only when the close was observed, or during the handshake', () => {
      const err = McpError.fromError(ErrorCode.ConnectionClosed, 'Connection closed');
      expect(classifySdkError(err, CLOSED)).toEqual({ kind: 'not-connected' });
      expect(classifySdkError(err, CONNECT)).toEqual({ kind: 'not-connected' });
    });

    test('maps -32000 on a session that is still open to protocol — a server generic error, not a dead session', () => {
      const err = new McpError(ErrorCode.ConnectionClosed, 'server busy');
      expect(classifySdkError(err, SESSION)).toEqual({ kind: 'protocol', code: ErrorCode.ConnectionClosed });
    });

    test('maps a response that failed the SDK result schema to protocol, with no code', () => {
      // zod 4 core names it `$ZodError` (the real case is proven end to end in failures.test.ts);
      // zod 3 and zod 4 classic name it `ZodError`.
      for (const name of ['$ZodError', 'ZodError']) {
        const schemaError = new Error('[{"path":["content"],"message":"Expected array"}]');
        schemaError.name = name;
        expect(classifySdkError(schemaError, SESSION)).toEqual({ kind: 'protocol' });
      }
    });

    test('maps an untyped error on a closed session to not-connected, never during the handshake', () => {
      expect(classifySdkError(new Error('Not connected'), CLOSED)).toEqual({ kind: 'not-connected' });
      expect(classifySdkError(new Error('Not connected'), CONNECT)).toEqual({ kind: 'transport' });
    });

    test('keeps an HTTP status classification (and its status) on a closed session', () => {
      expect(classifySdkError(new StreamableHTTPError(500, 'x'), CLOSED)).toEqual({
        kind: 'transport',
        status: 500
      });
    });

    test('maps any other JSON-RPC error code to protocol, carrying the code', () => {
      for (const code of [
        ErrorCode.InvalidParams,
        ErrorCode.MethodNotFound,
        ErrorCode.InternalError,
        ErrorCode.InvalidRequest,
        -1234
      ]) {
        expect(classifySdkError(new McpError(code, 'x'), SESSION)).toEqual({ kind: 'protocol', code });
      }
    });

    test('maps the SDK UnauthorizedError to unauthorized with no status', () => {
      expect(classifySdkError(new UnauthorizedError(), SESSION)).toEqual({ kind: 'unauthorized' });
    });

    test('maps HTTP 401 and 403 to unauthorized, carrying the status', () => {
      expect(classifySdkError(new StreamableHTTPError(401, 'x'), SESSION)).toEqual({
        kind: 'unauthorized',
        status: 401
      });
      expect(classifySdkError(new StreamableHTTPError(403, 'x'), CONNECT)).toEqual({
        kind: 'unauthorized',
        status: 403
      });
    });

    test('maps HTTP 404 to session-expired only once a session exists', () => {
      expect(classifySdkError(new StreamableHTTPError(404, 'x'), SESSION)).toEqual({
        kind: 'session-expired'
      });
      expect(classifySdkError(new StreamableHTTPError(404, 'x'), CONNECT)).toEqual({
        kind: 'transport',
        status: 404
      });
    });

    test('maps any other HTTP status to transport, carrying the status', () => {
      expect(classifySdkError(new StreamableHTTPError(500, 'x'), SESSION)).toEqual({
        kind: 'transport',
        status: 500
      });
    });

    test('omits a status that is not an HTTP status', () => {
      expect(classifySdkError(new StreamableHTTPError(-1, 'x'), SESSION)).toEqual({ kind: 'transport' });
      expect(classifySdkError(new StreamableHTTPError(undefined, 'x'), SESSION)).toEqual({
        kind: 'transport'
      });
    });

    test('classifies the legacy SSE transport error by status the same way', () => {
      const event = { type: 'error' } as unknown as ConstructorParameters<typeof SseError>[2];
      expect(classifySdkError(new SseError(401, 'x', event), SESSION)).toEqual({
        kind: 'unauthorized',
        status: 401
      });
    });

    test('is total: anything else, thrown or not an Error at all, is transport', () => {
      expect(classifySdkError(new Error('Not connected'), SESSION)).toEqual({ kind: 'transport' });
      expect(classifySdkError(new TypeError('fetch failed'), SESSION)).toEqual({ kind: 'transport' });
      expect(classifySdkError('a string', SESSION)).toEqual({ kind: 'transport' });
      expect(classifySdkError(undefined, CONNECT)).toEqual({ kind: 'transport' });
    });
  });
});
