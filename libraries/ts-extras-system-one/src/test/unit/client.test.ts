/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Logging } from '@fgv/ts-utils';
import * as Sdk from '@typesafe-ai/sdk';
import {
  askSystemOne,
  choice,
  createSystemOneClient,
  listSystemOneModels,
  noul,
  score,
  type ISystemOneClient
} from '../../index';
import {
  clientFor,
  jsonResponse,
  scriptedFetch,
  sentBody,
  shortChoice,
  shortChoiceBody,
  textResponse,
  threeQuestions
} from './fixtures';

const envNames = [
  'TYPESAFE_BASE_URL',
  'TYPESAFE_DEFAULT_MODEL',
  'TYPESAFE_API_KEY',
  'TYPESAFE_LOG_LEVEL'
] as const;

describe('createSystemOneClient', () => {
  const saved: Partial<Record<(typeof envNames)[number], string>> = {};

  beforeEach(() => {
    for (const name of envNames) {
      saved[name] = process.env[name];
    }
  });

  afterEach(() => {
    for (const name of envNames) {
      if (saved[name] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = saved[name];
      }
    }
    jest.restoreAllMocks();
  });

  test('U24 rejects a relative or non-http(s) baseUrl and a blank model; accepts an empty apiKey', async () => {
    const base = { model: 'clm-latest', apiKey: 'k' };
    expect(createSystemOneClient({ ...base, baseUrl: 'cfg.test:8700/v1' })).toFailWith(
      /baseUrl must be an absolute http\(s\) URL/
    );
    expect(createSystemOneClient({ ...base, baseUrl: '/v1' })).toFailWith(/baseUrl/);
    expect(createSystemOneClient({ ...base, baseUrl: 'ftp://cfg.test' })).toFailWith(/baseUrl/);
    expect(createSystemOneClient({ ...base, baseUrl: 'http://cfg.test/?x=1' })).toFailWith(/baseUrl/);
    expect(createSystemOneClient({ ...base, baseUrl: 'http://cfg.test/#frag' })).toFailWith(/baseUrl/);
    expect(createSystemOneClient({ ...base, baseUrl: 'http://user:pw@cfg.test' })).toFailWith(/baseUrl/);
    // a rejected URL is never echoed: not its credentials, not a token in its query
    for (const secretBearing of [
      'https://user:hunter2-secret@cfg.test',
      'https://cfg.test/?token=hunter2-secret',
      'https://cfg.test/#hunter2-secret'
    ]) {
      const refused = createSystemOneClient({ ...base, baseUrl: secretBearing });
      expect(refused).toFailWith(
        /baseUrl must be an absolute http\(s\) URL with no query, fragment or credentials/
      );
      expect(refused.message).not.toContain('hunter2');
    }
    expect(createSystemOneClient({ ...base, baseUrl: 'http://user@cfg.test' })).toFailWith(/baseUrl/);
    // a bare `?` or `#` parses to an empty search or hash, but the SDK receives the raw string
    expect(createSystemOneClient({ ...base, baseUrl: 'http://cfg.test/?' })).toFailWith(/baseUrl/);
    expect(createSystemOneClient({ ...base, baseUrl: 'http://cfg.test/#' })).toFailWith(/baseUrl/);
    expect(createSystemOneClient({ baseUrl: 'http://cfg.test', model: '   ', apiKey: 'k' })).toFailWith(
      /model must be a non-empty string/
    );

    // an empty key is used as given, never replaced by the environment's
    process.env.TYPESAFE_API_KEY = 'env-key';
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const keyless = clientFor(fetch, { apiKey: '', model: '  clm-latest  ' });
    expect(keyless.model).toBe('clm-latest');
    expect(
      await askSystemOne(keyless, { state: 's', questions: { q: shortChoice() }, inputLimit: 'unchecked' })
    ).toSucceed();
    expect(new Headers(calls[0].init?.headers).get('authorization')).toBe('Bearer');
  });

  test('the client is frozen, and the model sent is the one it was created with', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const client = clientFor(fetch);
    expect(Object.isFrozen(client)).toBe(true);
    expect(
      await askSystemOne(client, { state: 's', questions: { q: shortChoice() }, inputLimit: 'unchecked' })
    ).toSucceed();
    expect(sentBody(calls[0])).toEqual(expect.objectContaining({ model: 'clm-latest' }));
  });

  test('U24 an option the SDK refuses is a failure, not a throw', () => {
    expect(
      createSystemOneClient({ baseUrl: 'http://cfg.test', model: 'm', apiKey: 'k', timeoutMs: -1 })
    ).toFailWith(/timeout/);
  });

  test('U21 the request body carries the configured model, whatever TYPESAFE_DEFAULT_MODEL says', async () => {
    process.env.TYPESAFE_DEFAULT_MODEL = 'env-model';
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    expect(
      await askSystemOne(clientFor(fetch), {
        state: 's',
        questions: { q: shortChoice() },
        inputLimit: 'unchecked'
      })
    ).toSucceed();
    expect(sentBody(calls[0])).toEqual(expect.objectContaining({ model: 'clm-latest' }));
  });

  test('U22 the configured baseUrl is the one called, whatever TYPESAFE_BASE_URL says', async () => {
    process.env.TYPESAFE_BASE_URL = 'http://env.test';
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    expect(
      await askSystemOne(clientFor(fetch), {
        state: 's',
        questions: { q: shortChoice() },
        inputLimit: 'unchecked'
      })
    ).toSucceed();
    expect(calls[0].url).toBe('http://cfg.test:8700/v1/systemone');
  });

  test('U23 the state never reaches a log, even with TYPESAFE_LOG_LEVEL=debug and a logger at all', async () => {
    process.env.TYPESAFE_LOG_LEVEL = 'debug';
    const logger = new Logging.InMemoryLogger('all');
    const seen: unknown[] = [];
    for (const method of ['detail', 'info', 'warn', 'error'] as const) {
      const original = logger[method].bind(logger);
      jest.spyOn(logger, method).mockImplementation((message?: unknown, ...parameters: unknown[]) => {
        seen.push(message, ...parameters);
        return original(message, ...parameters);
      });
    }
    const { fetch } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const client = clientFor(fetch, { logger });
    expect(
      await askSystemOne(client, {
        state: 'ticket MARKER-7f3a says hello',
        questions: { q: shortChoice() },
        inputLimit: 'unchecked'
      })
    ).toSucceed();
    // the SDK logged its request summary, so logging is live
    expect(seen.some((entry) => String(entry).includes('POST /v1/systemone'))).toBe(true);
    const rendered = seen
      .map((entry) => (typeof entry === 'string' ? entry : JSON.stringify(entry)))
      .join('\n');
    expect(rendered).not.toContain('MARKER-7f3a');
  });

  test('U23 a server that echoes the state puts it in no failure message and no log', async () => {
    process.env.TYPESAFE_LOG_LEVEL = 'debug';
    const marker = 'MARKER-9c41';
    const logger = new Logging.InMemoryLogger('all');
    const seen: unknown[] = [];
    for (const method of ['detail', 'info', 'warn', 'error'] as const) {
      const original = logger[method].bind(logger);
      jest.spyOn(logger, method).mockImplementation((message?: unknown, ...parameters: unknown[]) => {
        seen.push(message, ...parameters);
        return original(message, ...parameters);
      });
    }
    const echoes: ReadonlyArray<[string, ReadonlyArray<Response>]> = [
      [
        'a pydantic 422 with no msg',
        [jsonResponse(422, { detail: [{ loc: ['body', 'state'], input: marker }] })]
      ],
      [
        'a pydantic 422 whose msg quotes the input',
        [jsonResponse(422, { detail: [{ loc: ['body', 'state'], msg: `bad: ${marker}`, input: marker }] })]
      ],
      ['a 400 error string', [jsonResponse(400, { error: `unknown model for ${marker}` })]],
      ['a 400 text body', [textResponse(400, `state was ${marker}`)]],
      [
        'a retried 503 that echoes, twice',
        [jsonResponse(503, { message: marker }), jsonResponse(503, { message: marker })]
      ],
      ['a 2xx that echoes the request', [jsonResponse(200, { request: { state: marker } })]],
      ['a 2xx text echo', [textResponse(200, `you said ${marker}`)]],
      [
        'a 2xx answer whose choice is the state',
        [
          jsonResponse(200, {
            ...shortChoiceBody('q'),
            answers: { q: { type: 'choice', choice: marker, probabilities: { a: 0.5, b: 0.5 } } }
          })
        ]
      ],
      [
        'a 2xx answer keyed by the state',
        [
          jsonResponse(200, {
            ...shortChoiceBody('q'),
            answers: { q: { type: 'choice', choice: 'a', probabilities: { a: 0.5, [marker]: 0.5 } } }
          })
        ]
      ],
      ['a 2xx extra answer id that is the state', [jsonResponse(200, shortChoiceBody('q', marker))]],
      [
        'a 2xx malformed answer under the state',
        [
          jsonResponse(200, {
            ...shortChoiceBody('q'),
            answers: {
              q: { type: 'choice', choice: 'a', probabilities: { a: 1, b: 0 } },
              [marker]: { type: marker }
            }
          })
        ]
      ]
    ];
    for (const [label, replies] of echoes) {
      const { fetch } = scriptedFetch(...replies);
      const client = clientFor(fetch, {
        logger,
        retry: { maxRetries: 1, backoffInitialMs: 1, backoffMaxMs: 1 }
      });
      const result = await askSystemOne(client, {
        state: `ticket ${marker} says hello`,
        questions: { q: shortChoice() },
        inputLimit: 'unchecked'
      });
      expect({ label, failed: result.isFailure() }).toEqual({ label, failed: true });
      expect({ label, message: result.message }).not.toEqual({
        label,
        message: expect.stringContaining(marker)
      });
    }
    // the SDK logged its retry, so the retry path ran with logging live
    expect(seen.some((entry) => String(entry).includes('retrying'))).toBe(true);
    const rendered = seen
      .map((entry) =>
        entry instanceof Error
          ? `${entry.name}: ${entry.message}`
          : typeof entry === 'string'
          ? entry
          : JSON.stringify(entry)
      )
      .join('\n');
    expect(rendered).not.toContain(marker);
  });

  test('U23 with no logger, console is never called', async () => {
    process.env.TYPESAFE_LOG_LEVEL = 'info';
    const spies = (['log', 'debug', 'info', 'warn', 'error'] as const).map((method) =>
      jest.spyOn(console, method).mockImplementation(() => undefined)
    );
    const { fetch, calls } = scriptedFetch(
      jsonResponse(503, { error: 'busy' }),
      jsonResponse(200, shortChoiceBody('q'))
    );
    const client = clientFor(fetch, { retry: { maxRetries: 1, backoffInitialMs: 1, backoffMaxMs: 1 } });
    expect(
      await askSystemOne(client, { state: 's', questions: { q: shortChoice() }, inputLimit: 'unchecked' })
    ).toSucceed();
    expect(calls).toHaveLength(2);
    for (const spy of spies) {
      expect(spy).not.toHaveBeenCalled();
    }
  });

  test('U25 noul, choice and score are the SDK’s own functions', () => {
    expect(noul).toBe(Sdk.noul);
    expect(choice).toBe(Sdk.choice);
    expect(score).toBe(Sdk.score);
  });

  test('a client not created by createSystemOneClient is refused', async () => {
    const forged: ISystemOneClient = { model: 'clm-latest' };
    const asked = await askSystemOne(forged, {
      state: 's',
      questions: threeQuestions,
      inputLimit: 'unchecked'
    });
    expect(asked).toFailWith(/^invalid-request: client was not created by createSystemOneClient/);
    expect(asked.detail).toBe('invalid-request');
    expect(await listSystemOneModels(forged)).toFailWith(/^invalid-request: client was not created/);
  });
});

describe('listSystemOneModels', () => {
  const card = { name: 'clm-latest', description: 'CLM v0.1 8B', release_date: '2026-09-01' };

  test('U19 a CLM { models: [...] } body succeeds, keeping only the declared fields', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, { models: [{ ...card, extra: 'x' }] }));
    expect(await listSystemOneModels(clientFor(fetch))).toSucceedWith([card]);
    expect(calls[0].url).toBe('http://cfg.test:8700/v1/models');
  });

  test('U19 a bare array is invalid-response', async () => {
    const { fetch } = scriptedFetch(jsonResponse(200, []));
    expect(await listSystemOneModels(clientFor(fetch))).toFailWith(
      /^invalid-response \(status 200\): Unexpected response shape/
    );
    const withId = scriptedFetch(jsonResponse(200, [], { 'x-typesafe-request-id': 'req-5' }));
    expect(await listSystemOneModels(clientFor(withId.fetch))).toFailWith(
      /^invalid-response \(status 200\) \(request req-5\): Unexpected response shape/
    );
  });

  test('U19 an element missing name is invalid-response', async () => {
    const { fetch } = scriptedFetch(
      jsonResponse(
        200,
        { models: [{ description: card.description, release_date: card.release_date }] },
        { 'x-typesafe-request-id': 'req-4' }
      )
    );
    expect(await listSystemOneModels(clientFor(fetch))).toFailWith(
      /^invalid-response \(status 200\) \(request req-4\):.*name/
    );
  });

  test('U19 an HTTP failure is classified as askSystemOne would', async () => {
    const { fetch } = scriptedFetch(jsonResponse(401, { error: 'bad key' }));
    expect(await listSystemOneModels(clientFor(fetch))).toFailWith(/^unauthorized \(status 401\)/);
  });
});
