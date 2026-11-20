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

import { clientToolRunVerdicts } from '../../../scenarios/anthropicClientTools';

describe('anthropic-client-tools run verdicts', () => {
  test('one round sent nothing back, so nothing about the replay passed', () => {
    const v = clientToolRunVerdicts({ rounds: 1, clientToolCalls: 0, serverToolEvents: 2, mixedRounds: 0 });
    expect(v.header).toMatch(/NOT EXERCISED/);
    expect(v.header).not.toMatch(/PASS/);
    expect(v.gates.join('\n')).not.toMatch(/\[PASS\] (Continuation replay|Thinking-block signature)/);
    expect(v.gates).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^ {2}\[NOT EXERCISED\] Continuation replay: .*only one round ran/),
        expect.stringMatching(/^ {2}\[NOT EXERCISED\] Thinking-block signature: .*only one round ran/),
        expect.stringMatching(/^ {2}\[not exercised\] Server tool and client tool in one round/)
      ])
    );
  });

  test('a replayed continuation without a search round passes the replay, not the server-tool path', () => {
    const v = clientToolRunVerdicts({ rounds: 2, clientToolCalls: 1, serverToolEvents: 0, mixedRounds: 0 });
    expect(v.header).toMatch(/: PASS$/);
    expect(v.gates).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^ {2}\[PASS\] Continuation replay/),
        expect.stringMatching(/^ {2}\[PASS\] Thinking-block signature/),
        expect.stringMatching(/^ {2}\[not exercised\] Server tool and client tool in one round/)
      ])
    );
  });

  test('a search round beside a client call, replayed, exercises the server-tool path', () => {
    const v = clientToolRunVerdicts({ rounds: 2, clientToolCalls: 1, serverToolEvents: 2, mixedRounds: 1 });
    expect(v.header).toMatch(/: PASS$/);
    expect(v.gates).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^ {2}\[exercised\] Server tool and client tool in one round/)
      ])
    );
  });
});
