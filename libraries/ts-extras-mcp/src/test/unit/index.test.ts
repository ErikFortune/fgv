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

import * as mcp from '../../index';

describe('@fgv/ts-extras-mcp package barrel', () => {
  test('re-exports the public boundary primitives', () => {
    expect(typeof mcp.createStdioTransport).toBe('function');
    expect(typeof mcp.createHttpTransport).toBe('function');
    expect(typeof mcp.connectMcpSession).toBe('function');
    expect(typeof mcp.closeMcpSession).toBe('function');
    expect(typeof mcp.listMcpTools).toBe('function');
    expect(typeof mcp.callMcpTool).toBe('function');
    expect(typeof mcp.adaptMcpTools).toBe('function');
  });
});
