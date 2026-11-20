/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  askSystemOne,
  createSystemOneClient,
  measureSystemOneInput,
  type ICreateSystemOneClientParams,
  type ISystemOneRequest,
  type Questions
} from '../../index';
import { clientFor, jsonResponse, scriptedFetch, sentBody, shortChoice, shortChoiceBody } from './fixtures';

/** Hands a JavaScript caller's value to a typed parameter, as an untyped caller would. */
function untyped<T>(value: unknown): T {
  return value as T;
}

const SECRET = 'PLANTED-SECRET-9d04';

/** A getter body that answers `first` once, and throws on any later read. */
function once<T>(first: T): () => T {
  let reads = 0;
  return () => {
    reads += 1;
    if (reads > 1) {
      throw new Error(`read twice; ${SECRET}`);
    }
    return first;
  };
}

describe('every entry point reads the caller’s input once, and uses only what it converted', () => {
  test('U35 createSystemOneClient builds the client from one read of each parameter', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const seen: string[] = [];
    const logLevel = once('info');
    const logger = {
      get logLevel(): string {
        return logLevel();
      },
      detail(): void {
        // not logged at info
      },
      info(this: unknown, message: unknown): void {
        // The method is called on the caller's own logger.
        seen.push(this === logger ? String(message) : 'wrong this');
      },
      warn(): void {
        // nothing
      },
      error(): void {
        // nothing
      }
    };
    const maxRetries = once(0);
    const statuses = once(new Set([503]));
    const retry = {
      get maxRetries(): number {
        return maxRetries();
      },
      get httpStatuses(): Set<number> {
        return statuses();
      }
    };
    const reads = {
      baseUrl: once('http://cfg.test:8700'),
      model: once('clm-latest'),
      apiKey: once('first-key'),
      retry: once(retry),
      logger: once(logger),
      fetch: once(fetch)
    };
    const params = {
      get baseUrl(): string {
        return reads.baseUrl();
      },
      get model(): string {
        return reads.model();
      },
      get apiKey(): string {
        return reads.apiKey();
      },
      get retry(): unknown {
        return reads.retry();
      },
      get logger(): unknown {
        return reads.logger();
      },
      get fetch(): unknown {
        return reads.fetch();
      }
    };
    let created: ReturnType<typeof createSystemOneClient> | undefined;
    expect(() => {
      created = createSystemOneClient(untyped<ICreateSystemOneClientParams>(params));
    }).not.toThrow();
    const client = created!.orThrow();
    expect(client.model).toBe('clm-latest');
    expect(
      await askSystemOne(client, { state: 's', questions: { q: shortChoice() }, inputLimit: 'unchecked' })
    ).toSucceed();
    expect(calls[0].url).toBe('http://cfg.test:8700/v1/systemone');
    expect(new Headers(calls[0].init?.headers).get('authorization')).toBe('Bearer first-key');
    expect(sentBody(calls[0])).toEqual(expect.objectContaining({ model: 'clm-latest' }));
    expect(seen.length).toBeGreaterThan(0);
    expect(seen).not.toContain('wrong this');
  });

  test('U35 askSystemOne bounds, sends and validates against one read of the request', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const client = clientFor(fetch);
    const reads = {
      type: once('choice'),
      instructions: once('first instructions'),
      a: once('first description'),
      q: once<unknown>(undefined),
      state: once('first state'),
      questions: once<unknown>(undefined),
      maxChars: once(1000),
      inputLimit: once<unknown>(undefined)
    };
    const criteria = {
      get a(): string {
        return reads.a();
      },
      b: null
    };
    const question = {
      get type(): string {
        return reads.type();
      },
      get instructions(): string {
        return reads.instructions();
      },
      criteria
    };
    const questions = {
      get q(): unknown {
        return question;
      }
    };
    const inputLimit = {
      get maxChars(): number {
        return reads.maxChars();
      }
    };
    const request = {
      get state(): string {
        return reads.state();
      },
      get questions(): unknown {
        return questions;
      },
      get inputLimit(): unknown {
        return inputLimit;
      }
    };
    let pending: ReturnType<typeof askSystemOne> | undefined;
    expect(() => {
      pending = askSystemOne(client, untyped<ISystemOneRequest<Questions>>(request));
    }).not.toThrow();
    const result = await pending!;
    expect(result).toSucceedAndSatisfy((answer) => {
      expect(Object.keys(answer.result.answers)).toEqual(['q']);
    });
    expect(calls).toHaveLength(1);
    expect(sentBody(calls[0])).toEqual({
      model: 'clm-latest',
      state: 'first state',
      questions: {
        q: {
          type: 'choice',
          instructions: 'first instructions',
          criteria: { a: 'first description', b: null }
        }
      }
    });
  });

  test('U35 measureSystemOneInput measures one read of the state and questions', () => {
    const reads = { text: once('abcdef'), instructions: once('Is it?'), yes: once('It is.') };
    const state = {
      get text(): string {
        return reads.text();
      }
    };
    const questions = {
      n: {
        type: 'noul',
        get instructions(): string {
          return reads.instructions();
        }
      },
      // A choice between `null` and an object is made on one read: the object's getter is not read
      // while `null` is ruled out.
      y: {
        type: 'noul',
        criteria: {
          get true(): string {
            return reads.yes();
          }
        }
      },
      z: { type: 'noul', criteria: null }
    };
    let measured: ReturnType<typeof measureSystemOneInput> | undefined;
    expect(() => {
      measured = measureSystemOneInput(untyped(state), untyped<Questions>(questions));
    }).not.toThrow();
    const expected = measureSystemOneInput(
      { text: 'abcdef' },
      {
        n: { type: 'noul', instructions: 'Is it?' },
        y: { type: 'noul', criteria: { true: 'It is.' } },
        z: { type: 'noul', criteria: null }
      }
    ).orThrow();
    expect(measured).toSucceedWith(expected);
  });
});

describe('a Proxy whose traps throw is a classified failure, never a throw', () => {
  type Trap = 'getOwnPropertyDescriptor' | 'ownKeys' | 'get';
  const traps: ReadonlyArray<Trap> = ['getOwnPropertyDescriptor', 'ownKeys', 'get'];

  function throwing<T extends object>(target: T, trap: Trap): T {
    return new Proxy(target, {
      [trap]: () => {
        throw new Error(SECRET);
      }
    });
  }

  test('U36 createSystemOneClient refuses throwing parameters as invalid-request', () => {
    const base = { baseUrl: 'http://cfg.test', model: 'clm-latest', apiKey: 'k' };
    for (const trap of traps) {
      let result: ReturnType<typeof createSystemOneClient> | undefined;
      expect(() => {
        result = createSystemOneClient(untyped<ICreateSystemOneClientParams>(throwing(base, trap)));
      }).not.toThrow();
      expect({ trap, message: result?.message }).toEqual({
        trap,
        message: expect.stringMatching(/^invalid-request: /)
      });
      expect(result?.message).not.toContain(SECRET);
    }
  });

  test('U36 askSystemOne refuses a throwing request, questions, question or criteria, with nothing sent', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const client = clientFor(fetch);
    for (const trap of traps) {
      const cases: ReadonlyArray<[string, unknown]> = [
        ['request', throwing({ state: 's', questions: { q: shortChoice() }, inputLimit: 'unchecked' }, trap)],
        [
          'questions',
          { state: 's', questions: throwing({ q: shortChoice() }, trap), inputLimit: 'unchecked' }
        ],
        [
          'question',
          { state: 's', questions: { q: throwing(shortChoice(), trap) }, inputLimit: 'unchecked' }
        ],
        [
          'criteria',
          {
            state: 's',
            questions: { q: { type: 'choice', criteria: throwing({ a: null, b: null }, trap) } },
            inputLimit: 'unchecked'
          }
        ]
      ];
      for (const [label, request] of cases) {
        const result = await askSystemOne(client, untyped<ISystemOneRequest<Questions>>(request));
        expect({ trap, label, detail: result.detail }).toEqual({ trap, label, detail: 'invalid-request' });
        expect(result.message).not.toContain(SECRET);
      }
      expect(measureSystemOneInput('s', untyped<Questions>(throwing({ q: shortChoice() }, trap)))).toFailWith(
        /^invalid-request: /
      );
    }
    expect(calls).toHaveLength(0);
  });
});

describe('a logger’s level is one ts-utils publishes', () => {
  const methods = {
    detail: (): void => undefined,
    info: (): void => undefined,
    warn: (): void => undefined,
    error: (): void => undefined
  };
  const base = { baseUrl: 'http://cfg.test', model: 'clm-latest', apiKey: 'k' };

  test('U37 a level ts-utils does not publish is invalid-request', () => {
    for (const logLevel of ['debug', 'verbose', 'INFO', '']) {
      expect(
        createSystemOneClient(
          untyped<ICreateSystemOneClientParams>({ ...base, logger: { logLevel, ...methods } })
        )
      ).toFailWith(/^invalid-request: invalid \[logger\] in the client parameters$/);
    }
  });

  test('U37 every published level is accepted', () => {
    for (const logLevel of ['all', 'detail', 'info', 'warning', 'error', 'silent']) {
      expect(
        createSystemOneClient(
          untyped<ICreateSystemOneClientParams>({ ...base, logger: { logLevel, ...methods } })
        )
      ).toSucceed();
    }
  });
});
