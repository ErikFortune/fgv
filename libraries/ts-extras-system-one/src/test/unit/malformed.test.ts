/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { TypeSafeError, choice, noul, score, type EntryType } from '@typesafe-ai/sdk';
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
import {
  clientFor,
  jsonResponse,
  scriptedFetch,
  sentBody,
  shortChoice,
  shortChoiceBody,
  textResponse
} from './fixtures';

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
    expect(unserializable).toFailWith(
      /^invalid-request: the state is not text, a JSON object or array, or null$/
    );
    expect(unserializable.message).not.toContain(SECRET);
  });

  test('U32 the factories are plain constructors: a malformed factory-built question is refused at askSystemOne', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const client = clientFor(fetch);
    const built: ReadonlyArray<[string, unknown]> = [
      ['choice with null criteria', choice('q', untyped<Record<string, null>>(null))],
      ['score with a Map level', score('q', untyped<[string, string]>(['low', new Map()]))],
      ['noul with a Map instruction', noul(untyped<string>(new Map()))],
      ['noul with an extra criterion', noul('q', untyped<{ true: string }>({ true: 'y', maybe: 'm' }))]
    ];
    for (const [label, question] of built) {
      const result = await askSystemOne(client, {
        state: 's',
        questions: untyped<Questions>({ q: question }),
        inputLimit: 'unchecked'
      });
      expect({ label, detail: result.detail }).toEqual({ label, detail: 'invalid-request' });
      expect(result).toFailWith(
        /^invalid-request: \[q\] are not well-formed noul, choice or score questions$/
      );
    }
    expect(calls).toHaveLength(0);
    // The one check a factory makes is the SDK's own: `score` throws in the caller's code, before
    // any call into this package, when its criteria are not a list.
    expect(() => score('q', untyped<[string, string]>({ a: 'x' }))).toThrow(TypeSafeError);
  });
});

/** An object that contains itself, with a planted secret. */
function circular(): Record<string, unknown> {
  const value: Record<string, unknown> = { note: SECRET };
  value.self = value;
  return value;
}

describe('a value no converter can describe — a cycle, a bigint — is a classified failure, never a throw', () => {
  test('U30 createSystemOneClient refuses a cycle or a bigint in its parameters', () => {
    const base = { baseUrl: 'http://cfg.test', model: 'clm-latest', apiKey: SECRET };
    const cases: ReadonlyArray<[string, unknown]> = [
      ['a bigint', BigInt(5)],
      ['a circular model', { ...base, model: circular() }],
      ['a circular logger', { ...base, logger: circular() }],
      ['a bigint timeoutMs', { ...base, timeoutMs: BigInt(10) }]
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
      expect(result?.message).not.toContain(SECRET);
    }
  });

  test('U30 askSystemOne refuses a cycle anywhere in the request, with nothing sent', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const client = clientFor(fetch);
    const good = { state: 's', questions: { q: shortChoice() }, inputLimit: 'unchecked' as const };
    const cases: ReadonlyArray<[string, unknown, RegExp]> = [
      ['a bigint request', BigInt(5), /^invalid-request: the request must be an object/],
      [
        'a circular state',
        { ...good, state: circular() },
        /^invalid-request: invalid \[state\] in the request$/
      ],
      [
        'a circular question',
        { ...good, questions: { q: { instructions: 'q', self: circular() } } },
        /^invalid-request: \[q\] are not well-formed/
      ],
      [
        'a circular choice criterion',
        {
          ...good,
          questions: { q: { type: 'choice', instructions: 'q', criteria: { a: circular(), b: null } } }
        },
        /^invalid-request: \[q\] are not well-formed/
      ],
      [
        'a circular noul criterion',
        { ...good, questions: { q: { type: 'noul', instructions: 'q', criteria: { true: circular() } } } },
        /^invalid-request: \[q\] are not well-formed/
      ],
      [
        'a circular input limit',
        { state: 's', questions: good.questions, inputLimit: circular() },
        /^invalid-request: inputLimit must be/
      ]
    ];
    for (const [label, request, expected] of cases) {
      const result = await askSystemOne(client, untyped<ISystemOneRequest<Questions>>(request));
      expect({ label, detail: result.detail }).toEqual({ label, detail: 'invalid-request' });
      expect({ label, message: result.message }).toEqual({ label, message: expect.stringMatching(expected) });
      expect(result.message).not.toContain(SECRET);
    }
    expect(calls).toHaveLength(0);
  });

  test('U30 measureSystemOneInput refuses a circular state or question without throwing', () => {
    expect(measureSystemOneInput(untyped(circular()), { q: shortChoice() })).toFailWith(
      /^invalid-request: the state is not/
    );
    expect(
      measureSystemOneInput('s', untyped<Questions>({ q: { instructions: 'q', self: circular() } }))
    ).toFailWith(/^invalid-request: \[q\] are not well-formed/);
  });
});

describe('an EntryType is JSON: text, a JSON object or array, or null, all the way down', () => {
  test('U31 a state, instruction or criterion that is not JSON is refused, with nothing sent', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const client = clientFor(fetch);
    const states: ReadonlyArray<[string, unknown]> = [
      ['a Map', new Map([['a', 1]])],
      ['a Date', new Date(0)],
      ['a bigint', BigInt(1)],
      ['a nested undefined', { a: undefined }],
      ['a nested Map', { a: [new Map()] }],
      ['a bare number', 5],
      ['a bare boolean', true]
    ];
    for (const [label, state] of states) {
      const result = await askSystemOne(client, {
        state: untyped(state),
        questions: { q: shortChoice() },
        inputLimit: 'unchecked'
      });
      expect({ label, detail: result.detail, message: result.message }).toEqual({
        label,
        detail: 'invalid-request',
        message: 'invalid-request: invalid [state] in the request'
      });
      expect(measureSystemOneInput(untyped(state), { q: shortChoice() })).toFailWith(
        /^invalid-request: the state is not/
      );
    }
    const questions: ReadonlyArray<[string, unknown]> = [
      ['a Map instruction', { type: 'noul', instructions: new Map() }],
      [
        'a Date in a choice criterion',
        { type: 'choice', instructions: 'q', criteria: { a: new Date(0), b: null } }
      ],
      ['a bigint score level', { type: 'score', instructions: 'q', criteria: ['low', BigInt(2)] }],
      ['a Set inside a noul criterion', { type: 'noul', criteria: { true: { n: new Set() } } }]
    ];
    for (const [label, question] of questions) {
      const result = await askSystemOne(client, {
        state: 's',
        questions: untyped<Questions>({ q: question }),
        inputLimit: 'unchecked'
      });
      expect({ label, detail: result.detail }).toEqual({ label, detail: 'invalid-request' });
      expect(result).toFailWith(/^invalid-request: \[q\] are not well-formed/);
    }
    expect(calls).toHaveLength(0);
  });

  test('U31 JSON entries of every allowed kind are still accepted', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const client = clientFor(fetch);
    for (const state of ['s', null, { a: [1, true, null, { b: 'c' }] }, ['x', 2]]) {
      expect(
        await askSystemOne(client, {
          state: untyped(state),
          questions: { q: shortChoice() },
          inputLimit: 'unchecked'
        })
      ).toSucceed();
    }
    expect(calls).toHaveLength(4);
  });
});

describe('a reserved __proto__ key cannot slip past an exact-key check', () => {
  test('U33 a __proto__ question id or choice label is invalid-request, with nothing sent', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const client = clientFor(fetch);
    const reservedId = await askSystemOne(client, {
      state: 's',
      questions: untyped<Questions>(JSON.parse('{"__proto__":{"type":"noul","instructions":"q"}}')),
      inputLimit: 'unchecked'
    });
    expect(reservedId.detail).toBe('invalid-request');
    expect(reservedId).toFailWith(
      /^invalid-request: \[__proto__\] is a reserved key and cannot be a question id$/
    );
    const reservedLabel = {
      q: { type: 'choice', instructions: 'q', criteria: JSON.parse('{"a":null,"__proto__":null}') }
    };
    const result = await askSystemOne(client, {
      state: 's',
      questions: untyped<Questions>(reservedLabel),
      inputLimit: 'unchecked'
    });
    expect(result.detail).toBe('invalid-request');
    expect(result).toFailWith(/^invalid-request: \[q\] are not well-formed/);
    expect(measureSystemOneInput('s', untyped<Questions>(reservedLabel))).toFailWith(
      /^invalid-request: \[q\]/
    );
    expect(calls).toHaveLength(0);
  });

  test('U33 a __proto__ probability, legend level or answer id is invalid-response', async () => {
    const choiceAnswer = '{"type":"choice","choice":"a","probabilities":{"a":0.5,"b":0.5,"__proto__":0}}';
    const scoreAnswer =
      '{"type":"score","score":1,"legend":{"0":"lo","1":"hi","__proto__":"x"},"probabilities":{"0":0.5,"1":0.5}}';
    const usage = '"usage":{"input_tokens":1,"output_tokens":0}';
    const cases: ReadonlyArray<[string, string, Questions]> = [
      ['probabilities', `{"model":"m","answers":{"q":${choiceAnswer}},${usage}}`, { q: shortChoice() }],
      ['legend', `{"model":"m","answers":{"q":${scoreAnswer}},${usage}}`, { q: score('q', ['lo', 'hi']) }],
      [
        'answer id',
        `{"model":"m","answers":{"q":{"type":"noul","noul":0.5},"__proto__":{"type":"noul","noul":0.5}},${usage}}`,
        { q: noul('q') }
      ]
    ];
    for (const [label, text, questions] of cases) {
      const { fetch } = scriptedFetch(textResponse(200, text, { 'content-type': 'application/json' }));
      const result = await askSystemOne(clientFor(fetch), { state: 's', questions, inputLimit: 'unchecked' });
      expect({ label, detail: result.detail }).toEqual({ label, detail: 'invalid-response' });
    }
    const { fetch } = scriptedFetch(textResponse(200, cases[2][1], { 'content-type': 'application/json' }));
    expect(
      await askSystemOne(clientFor(fetch), {
        state: 's',
        questions: { q: noul('q') },
        inputLimit: 'unchecked'
      })
    ).toFailWith(/answers that are not a noul, choice or score answer: \[\] and 1 with no question$/);
  });
});

describe('a reserved __proto__ key is refused at any depth of a JSON entry', () => {
  test('U38 a nested __proto__ in the state, an instruction or any criterion is invalid-request, with nothing sent', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const client = clientFor(fetch);
    const states: ReadonlyArray<[string, string]> = [
      ['two levels, object value', '{"a":{"__proto__":{"x":1},"b":2}}'],
      ['two levels, primitive value', '{"a":{"__proto__":1,"b":2}}'],
      ['inside an array', '{"a":[{"b":{"__proto__":null}}]}'],
      ['four levels', '[[{"a":{"b":{"__proto__":{"c":"d"}}}}]]']
    ];
    for (const [label, text] of states) {
      const state = untyped<EntryType>(JSON.parse(text));
      const result = await askSystemOne(client, {
        state,
        questions: { q: shortChoice() },
        inputLimit: 'unchecked'
      });
      expect({ label, detail: result.detail, message: result.message }).toEqual({
        label,
        detail: 'invalid-request',
        message: 'invalid-request: invalid [state] in the request'
      });
      expect(measureSystemOneInput(state, { q: shortChoice() })).toFailWith(
        /^invalid-request: the state is not/
      );
    }
    const nested = '{"d":{"__proto__":{"x":1},"e":2}}';
    const questions: ReadonlyArray<[string, string]> = [
      ['an instruction', `{"type":"noul","instructions":${nested}}`],
      ['a choice description', `{"type":"choice","criteria":{"a":${nested},"b":null}}`],
      ['a score level', `{"type":"score","criteria":["low",[${nested}]]}`],
      ['a noul criterion', `{"type":"noul","criteria":{"true":${nested}}}`]
    ];
    for (const [label, text] of questions) {
      const result = await askSystemOne(client, {
        state: 's',
        questions: untyped<Questions>({ q: JSON.parse(text) }),
        inputLimit: 'unchecked'
      });
      expect({ label, detail: result.detail }).toEqual({ label, detail: 'invalid-request' });
      expect(result).toFailWith(
        /^invalid-request: \[q\] are not well-formed noul, choice or score questions$/
      );
    }
    expect(calls).toHaveLength(0);
  });

  test('U38 nested JSON without a reserved key is sent intact', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const state = { a: [{ b: { c: ['d', null, 1, true] } }], proto: '__proto__' };
    expect(
      await askSystemOne(clientFor(fetch), {
        state,
        questions: { q: choice({ e: { f: 'g' } }, { a: null, b: null }) },
        inputLimit: 'unchecked'
      })
    ).toSucceed();
    expect(sentBody(calls[0])).toEqual(
      expect.objectContaining({
        state,
        questions: { q: expect.objectContaining({ instructions: { e: { f: 'g' } } }) }
      })
    );
  });

  test('U38 a nested __proto__ in a received distribution whose value is an object is invalid-response', async () => {
    // The response side converts no value through the JSON converter; every record at every depth
    // (answer set, probabilities, legend) is converted by `ownRecordOf`. U33 covers a primitive value.
    const text =
      '{"model":"m","answers":{"q":{"type":"choice","choice":"a","probabilities":{"a":0.5,"b":0.5,"__proto__":{"c":1}}}},"usage":{"input_tokens":1,"output_tokens":0}}';
    const { fetch } = scriptedFetch(textResponse(200, text, { 'content-type': 'application/json' }));
    const result = await askSystemOne(clientFor(fetch), {
      state: 's',
      questions: { q: shortChoice() },
      inputLimit: 'unchecked'
    });
    expect(result.detail).toBe('invalid-response');
  });
});
