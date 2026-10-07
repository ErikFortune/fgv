/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  askSystemOne,
  createSystemOneClient,
  listSystemOneModels,
  measureSystemOneInput,
  type ICreateSystemOneClientParams,
  type ISystemOneClient,
  type ISystemOneRequest,
  type Questions
} from '../../index';
import { clientFor, jsonResponse, scriptedFetch, shortChoice, shortChoiceBody } from './fixtures';

/** Hands a JavaScript caller's value to a typed parameter, as an untyped caller would. */
function untyped<T>(value: unknown): T {
  return value as T;
}

const SECRET = 'PLANTED-SECRET-71c3';

describe('a JavaScript caller’s malformed input is a classified Result, never a throw', () => {
  test('U28 createSystemOneClient converts its parameters before reading any field', () => {
    const base = { baseUrl: 'http://cfg.test', model: 'clm-latest', apiKey: SECRET };
    const cases: ReadonlyArray<[string, unknown]> = [
      ['undefined', undefined],
      ['null', null],
      ['a number', 5],
      ['an array', [base]],
      ['a numeric model', { ...base, model: 5 }],
      ['no apiKey', { baseUrl: base.baseUrl, model: base.model }],
      ['a numeric baseUrl', { ...base, baseUrl: 8700 }],
      ['a string timeoutMs', { ...base, timeoutMs: '10' }],
      ['an array of retry overrides', { ...base, retry: [1] }],
      ['a logger without methods', { ...base, logger: { logLevel: 'info' } }],
      ['a non-function fetch', { ...base, fetch: 'fetch' }]
    ];
    for (const [label, params] of cases) {
      let result: ReturnType<typeof createSystemOneClient> | undefined;
      expect(() => {
        result = createSystemOneClient(untyped<ICreateSystemOneClientParams>(params));
      }).not.toThrow();
      expect({ label, message: result?.message }).toEqual({
        label,
        message: expect.stringMatching(/^invalid-request: /)
      });
      expect({ label, message: result?.message }).not.toEqual({
        label,
        message: expect.stringContaining(SECRET)
      });
    }
    expect(createSystemOneClient(untyped<ICreateSystemOneClientParams>({ ...base, model: 5 }))).toFailWith(
      /^invalid-request: invalid \[model\] in the client parameters$/
    );
  });

  test('U29 askSystemOne checks the request before reading any field, and every failure has a reason', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const client = clientFor(fetch);
    const good = { state: 's', questions: { q: shortChoice() }, inputLimit: 'unchecked' as const };
    const cases: ReadonlyArray<[string, unknown]> = [
      ['undefined', undefined],
      ['null', null],
      ['a string', 'ask'],
      ['a numeric state', { ...good, state: 5 }],
      ['no state', { questions: good.questions, inputLimit: good.inputLimit }],
      ['an array of questions', { ...good, questions: [shortChoice()] }],
      ['no questions', { state: 's', inputLimit: 'unchecked' }],
      ['a non-signal signal', { ...good, signal: 'stop' }],
      ['no inputLimit', { state: 's', questions: good.questions }]
    ];
    for (const [label, request] of cases) {
      const result = await askSystemOne(client, untyped<ISystemOneRequest<Questions>>(request));
      expect({ label, detail: result.detail }).toEqual({ label, detail: 'invalid-request' });
      expect(result).toFailWith(/^invalid-request: /);
    }
    for (const forged of [undefined, null, 5, {}]) {
      const result = await askSystemOne(untyped<ISystemOneClient>(forged), good);
      expect(result.detail).toBe('invalid-request');
    }
    expect(calls).toHaveLength(0);
  });

  test('U27b a malformed question is invalid-request in unchecked mode too, with nothing sent', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const client = clientFor(fetch);
    const malformed: ReadonlyArray<[string, unknown]> = [
      ['a choice with null criteria', { type: 'choice', instructions: 'q', criteria: null }],
      ['a score with no criteria', { type: 'score', instructions: 'q' }],
      ['a score with object criteria', { type: 'score', instructions: 'q', criteria: { a: 'x' } }],
      ['an unknown type', { type: 'rank', instructions: 'q' }],
      [
        'a noul with an extra criterion',
        { type: 'noul', instructions: 'q', criteria: { true: 'y', maybe: 'm' } }
      ],
      ['a numeric instruction', { type: 'noul', instructions: 7 }],
      ['not an object', 'noul']
    ];
    for (const inputLimit of ['unchecked' as const, { maxChars: 100 }]) {
      for (const [label, question] of malformed) {
        const result = await askSystemOne(client, {
          state: 's',
          questions: untyped<Questions>({ q: question }),
          inputLimit
        });
        expect({ label, inputLimit, detail: result.detail }).toEqual({
          label,
          inputLimit,
          detail: 'invalid-request'
        });
        expect(result).toFailWith(
          /^invalid-request: \[q\] are not well-formed noul, choice or score questions$/
        );
      }
    }
    expect(calls).toHaveLength(0);
  });

  test('U28 listSystemOneModels refuses a forged client as invalid-request', async () => {
    for (const forged of [undefined, null, 5, {}]) {
      expect(await listSystemOneModels(untyped<ISystemOneClient>(forged))).toFailWith(
        /^invalid-request: client was not created by createSystemOneClient/
      );
    }
  });

  test('U28 measureSystemOneInput fails invalid-request without quoting the input', () => {
    const circular: Record<string, unknown> = { note: SECRET };
    circular.self = circular;
    expect(measureSystemOneInput('s', untyped<Questions>(undefined))).toFailWith(
      /^invalid-request: questions must be an object of named questions$/
    );
    expect(measureSystemOneInput('s', untyped<Questions>([shortChoice()]))).toFailWith(
      /^invalid-request: questions must be/
    );
    const unserializable = measureSystemOneInput(untyped({ secret: SECRET, self: circular }), {
      q: shortChoice()
    });
    expect(unserializable).toFailWith(/^invalid-request: the state or a question is not JSON-serializable/);
    expect(unserializable.message).not.toContain(SECRET);
  });
});
