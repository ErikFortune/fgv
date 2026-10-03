/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { noul, type ScoreQuestion } from '@typesafe-ai/sdk';
import { askSystemOne, type ISystemOneClient, type SystemOneFailureReason } from '../../index';
import {
  clientFor,
  clmBody,
  delayedReply,
  hangingReply,
  jevBody,
  jsonResponse,
  scriptedFetch,
  shortChoice,
  shortChoiceBody,
  textResponse,
  threeQuestions,
  byIndex,
  type Reply
} from './fixtures';

const unchecked = 'unchecked' as const;

async function askOnce(
  client: ISystemOneClient,
  signal?: AbortSignal
): ReturnType<typeof askSystemOne<{ q: ReturnType<typeof shortChoice> }>> {
  return askSystemOne(client, { state: 's', questions: { q: shortChoice() }, inputLimit: unchecked, signal });
}

/** Asks one short question against a single scripted reply, returning the failure reason. */
async function reasonFor(reply: Reply): Promise<SystemOneFailureReason | undefined> {
  const { fetch } = scriptedFetch(reply);
  const result = await askOnce(clientFor(fetch, { timeoutMs: 20 }));
  expect(result).toFail();
  return result.detail;
}

describe('askSystemOne', () => {
  describe('a well-formed answer', () => {
    test('a CLM-shaped body succeeds with the questions answered', async () => {
      const { fetch } = scriptedFetch(jsonResponse(200, clmBody()));
      expect(
        await askSystemOne(clientFor(fetch), {
          state: 'I was charged twice',
          questions: threeQuestions,
          inputLimit: { maxChars: 2400 }
        })
      ).toSucceedAndSatisfy(({ result }) => {
        expect(result.answers.billing.noul).toBe(0.91);
        expect(result.answers.route.choice).toBe('billing');
        expect(result.answers.route.probabilities.tech).toBe(0.1);
        expect(result.answers.urgency.score).toBe(0.6);
        expect(result.answers.urgency.legend[2]).toBe('very urgent');
      });
    });
  });

  test('U10 an empty question set, or a score question with one level, is invalid-request with no request made', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const client = clientFor(fetch);
    const empty = await askSystemOne(client, { state: 's', questions: {}, inputLimit: { maxChars: 10 } });
    expect(empty).toFailWith(/invalid-request: At least one question is required/);
    expect(empty.detail).toBe('invalid-request');
    const oneLevel = { type: 'score', instructions: 'q', criteria: ['only'] } as unknown as ScoreQuestion;
    const single = await askSystemOne(client, {
      state: 's',
      questions: { s: oneLevel },
      inputLimit: unchecked
    });
    expect(single).toFailWith(/invalid-request: Score question "s" has 1 criteria/);
    expect(single.detail).toBe('invalid-request');
    expect(calls).toHaveLength(0);
  });

  describe('failure classification', () => {
    test('U11 every classification row has its own reason', async () => {
      expect(await reasonFor(jsonResponse(401, { error: 'bad key' }))).toBe('unauthorized');
      expect(await reasonFor(jsonResponse(403, { error: 'denied' }))).toBe('unauthorized');
      expect(await reasonFor(jsonResponse(408, { error: 'slow' }))).toBe('timeout');
      expect(await reasonFor(jsonResponse(429, { error: 'slow down' }))).toBe('rate-limited');
      expect(await reasonFor(jsonResponse(400, { error: 'bad' }))).toBe('invalid-request');
      expect(await reasonFor(jsonResponse(418, { error: 'teapot' }))).toBe('invalid-request');
      expect(await reasonFor(jsonResponse(500, { error: 'boom' }))).toBe('server');
      expect(await reasonFor(jsonResponse(502, { detail: 'embedder unreachable' }))).toBe('server');
      expect(await reasonFor(textResponse(302, ''))).toBe('server');
      expect(await reasonFor(new TypeError('fetch failed'))).toBe('connection');
      expect(await reasonFor(hangingReply)).toBe('timeout');
      expect(await reasonFor(textResponse(200, 'ok'))).toBe('invalid-response');
    });

    test('U11 the failure message carries the status and the request id', async () => {
      const { fetch } = scriptedFetch(
        jsonResponse(403, { error: 'denied' }, { 'x-typesafe-request-id': 'req-9' })
      );
      expect(await askOnce(clientFor(fetch))).toFailWith(
        /^unauthorized \(status 403\) \(request req-9\): 403 denied/
      );
    });

    test('U12 an unknown model or bad request is invalid-request on every backend', async () => {
      // CLM: 422 with a FastAPI detail
      expect(
        await reasonFor(jsonResponse(422, { detail: "unknown model 'nope'; available: ['clm-latest']" }))
      ).toBe('invalid-request');
      // openjev / Jev: 400 api_usage_error
      expect(
        await reasonFor(jsonResponse(400, { error: { type: 'api_usage_error', message: 'unknown model' } }))
      ).toBe('invalid-request');
      expect(await reasonFor(jsonResponse(404, { error: 'not found' }))).toBe('invalid-request');
    });

    test('U13 a 529 is retried and then server; a 503 then 200 succeeds', async () => {
      const overloaded = scriptedFetch(jsonResponse(529, { error: 'overloaded' }));
      const retry = { maxRetries: 2, backoffInitialMs: 1, backoffMaxMs: 1 };
      const failed = await askOnce(clientFor(overloaded.fetch, { retry }));
      expect(failed).toFailWith(/^server \(status 529\)/);
      expect(failed.detail).toBe('server');
      expect(overloaded.calls).toHaveLength(3);

      const recovering = scriptedFetch(
        jsonResponse(503, { error: 'busy' }),
        jsonResponse(200, shortChoiceBody('q'))
      );
      expect(await askOnce(clientFor(recovering.fetch, { retry }))).toSucceed();
      expect(recovering.calls).toHaveLength(2);
    });

    test('U14 a fetch that never settles is timeout; a fetch that rejects is connection', async () => {
      const hanging = scriptedFetch(hangingReply);
      const timedOut = await askOnce(clientFor(hanging.fetch, { timeoutMs: 20 }));
      expect(timedOut).toFailWith(/^timeout: Request timed out after 20ms/);
      expect(timedOut.detail).toBe('timeout');

      const refused = scriptedFetch(new TypeError('connect ECONNREFUSED 127.0.0.1:8700'));
      const failed = await askOnce(clientFor(refused.fetch));
      expect(failed).toFailWith(/^connection: Connection error: connect ECONNREFUSED/);
      expect(failed.detail).toBe('connection');
    });

    test('U15 an abort, before or during the request, is aborted', async () => {
      const before = scriptedFetch(hangingReply);
      const controller = new AbortController();
      controller.abort();
      const preAborted = await askOnce(clientFor(before.fetch, { timeoutMs: 5000 }), controller.signal);
      expect(preAborted).toFailWith(/^aborted/);
      expect(preAborted.detail).toBe('aborted');

      const during = scriptedFetch(hangingReply);
      const inFlight = new AbortController();
      setTimeout(() => inFlight.abort(), 10);
      const aborted = await askOnce(clientFor(during.fetch, { timeoutMs: 5000 }), inFlight.signal);
      expect(aborted.detail).toBe('aborted');
    });

    test('U17 a 2xx body that is not JSON, or is empty, is invalid-response', async () => {
      expect(await reasonFor(textResponse(200, 'ok'))).toBe('invalid-response');
      expect(await reasonFor(textResponse(200, ''))).toBe('invalid-response');
      const { fetch } = scriptedFetch(textResponse(200, 'ok', { 'x-typesafe-request-id': 'req-2' }));
      expect(await askOnce(clientFor(fetch))).toFailWith(
        /^invalid-response \(status 200\) \(request req-2\)/
      );
    });
  });

  describe('response validation', () => {
    async function validate(
      questions: Parameters<typeof askSystemOne>[1]['questions'],
      body: unknown
    ): ReturnType<typeof askSystemOne> {
      const { fetch } = scriptedFetch(jsonResponse(200, body));
      return askSystemOne(clientFor(fetch), { state: 's', questions, inputLimit: unchecked });
    }

    function body(
      answers: Record<string, unknown>,
      usage: unknown = { input_tokens: 1, output_tokens: 0 }
    ): unknown {
      return { model: 'clm-latest', answers, usage };
    }

    const choiceXY = { type: 'choice', instructions: null, criteria: { x: null, y: null } } as const;
    const score3 = { type: 'score', instructions: null, criteria: ['l0', 'l1', 'l2'] } as const;
    const legend3 = byIndex(['l0', 'l1', 'l2']);
    const goodChoice = { type: 'choice', choice: 'x', probabilities: { x: 0.5, y: 0.5 } };

    test('U16a an extra answer id is invalid-response', async () => {
      const result = await validate({ a: choiceXY }, body({ a: goodChoice, b: { type: 'noul', noul: 0.5 } }));
      expect(result).toFailWith(/^invalid-response.*extra \[b\]/);
      expect(result.detail).toBe('invalid-response');
    });

    test('U16b a missing answer id is invalid-response', async () => {
      expect(await validate({ a: choiceXY, b: choiceXY }, body({ a: goodChoice }))).toFailWith(
        /^invalid-response.*missing \[b\]/
      );
    });

    test("U16c an answer whose type is not its question's is invalid-response", async () => {
      expect(await validate({ a: choiceXY }, body({ a: { type: 'noul', noul: 0.5 } }))).toFailWith(
        /^invalid-response.*wrong type \[a\]/
      );
    });

    test('U16d choice probability keys must equal the criteria keys', async () => {
      expect(
        await validate(
          { a: choiceXY },
          body({ a: { type: 'choice', choice: 'x', probabilities: { x: 0.5, z: 0.5 } } })
        )
      ).toFailWith(/^invalid-response.*probability keys \[x, z\] are not \[x, y\]/);
    });

    test('U16e the choice must be one of the labels', async () => {
      expect(
        await validate(
          { a: choiceXY },
          body({ a: { type: 'choice', choice: 'z', probabilities: { x: 0.5, y: 0.5 } } })
        )
      ).toFailWith(/^invalid-response.*choice 'z' is not a label/);
    });

    test('U16f the score must be within [0, n-1]', async () => {
      const probabilities = byIndex([0, 0, 1]);
      expect(
        await validate(
          { s: score3 },
          body({ s: { type: 'score', score: 3, legend: legend3, probabilities } })
        )
      ).toFailWith(/^invalid-response.*score 3 is not in \[0, 2\]/);
      expect(
        await validate(
          { s: score3 },
          body({ s: { type: 'score', score: -0.1, legend: legend3, probabilities } })
        )
      ).toFailWith(/score -0.1 is not in \[0, 2\]/);
      expect(
        await validate(
          { s: score3 },
          body({ s: { type: 'score', score: 2, legend: legend3, probabilities } })
        )
      ).toSucceed();
    });

    test('U16g noul must be within [0, 1]', async () => {
      const q = { n: noul('q') };
      expect(await validate(q, body({ n: { type: 'noul', noul: 1.5 } }))).toFailWith(
        /^invalid-response.*noul is not a finite number in \[0, 1\]/
      );
      expect(await validate(q, body({ n: { type: 'noul', noul: -0.5 } }))).toFailWith(/noul is not a finite/);
      expect(await validate(q, body({ n: { type: 'noul', noul: 1 } }))).toSucceed();
    });

    test('U16h a non-finite value is invalid-response', async () => {
      const infinite = (text: string): Promise<SystemOneFailureReason | undefined> =>
        reasonFor(textResponse(200, text, { 'content-type': 'application/json' }));
      // JSON.parse turns 1e999 into Infinity
      expect(
        await infinite(
          '{"model":"m","answers":{"q":{"type":"choice","choice":"a","probabilities":{"a":1e999,"b":0}}},"usage":{"input_tokens":1,"output_tokens":0}}'
        )
      ).toBe('invalid-response');
      expect(
        await infinite(
          '{"model":"m","answers":{"q":{"type":"choice","choice":"a","probabilities":{"a":1,"b":0}}},"usage":{"input_tokens":1e999,"output_tokens":0}}'
        )
      ).toBe('invalid-response');
    });

    test('U16i each distribution must sum to 1 within 1e-3', async () => {
      expect(
        await validate(
          { a: choiceXY },
          body({ a: { type: 'choice', choice: 'x', probabilities: { x: 0.5, y: 0.497 } } })
        )
      ).toFailWith(/^invalid-response.*probabilities sum to 0.997/);
      expect(
        await validate(
          { a: choiceXY },
          body({ a: { type: 'choice', choice: 'x', probabilities: { x: 0.5, y: 0.4995 } } })
        )
      ).toSucceed();
    });

    test('U16j score probability keys and legend keys must be exactly 0..n-1', async () => {
      expect(
        await validate(
          { s: score3 },
          body({ s: { type: 'score', score: 1, legend: legend3, probabilities: byIndex([0.5, 0.5]) } })
        )
      ).toFailWith(/^invalid-response.*probability keys \[0, 1\] are not \[0, 1, 2\]/);
      expect(
        await validate(
          { s: score3 },
          body({
            s: {
              type: 'score',
              score: 1,
              legend: Object.fromEntries([
                ['0', 'l0'],
                ['1', 'l1'],
                ['3', 'l3']
              ]),
              probabilities: byIndex([0.3, 0.4, 0.3])
            }
          })
        )
      ).toFailWith(/^invalid-response.*legend keys \[0, 1, 3\] are not \[0, 1, 2\]/);
      expect(
        await validate(
          { s: score3 },
          body({
            s: {
              type: 'score',
              score: 1,
              legend: byIndex(['l0', 7, 'l2']),
              probabilities: byIndex([1, 0, 0])
            }
          })
        )
      ).toFailWith(/^invalid-response/);
    });

    test('U16k model must be a non-empty string and usage finite counts >= 0', async () => {
      const answers = { a: goodChoice };
      expect(
        await validate({ a: choiceXY }, { model: '', answers, usage: { input_tokens: 1, output_tokens: 0 } })
      ).toFailWith(/^invalid-response.*model/);
      expect(
        await validate({ a: choiceXY }, { answers, usage: { input_tokens: 1, output_tokens: 0 } })
      ).toFailWith(/^invalid-response.*model/);
      expect(
        await validate({ a: choiceXY }, body(answers, { input_tokens: -1, output_tokens: 0 }))
      ).toFailWith(/^invalid-response.*input_tokens/);
      expect(await validate({ a: choiceXY }, body(answers, { input_tokens: 1 }))).toFailWith(
        /^invalid-response.*output_tokens/
      );
      expect(await validate({ a: choiceXY }, { model: 'm', answers })).toFailWith(/^invalid-response.*usage/);
      expect(await validate({ a: choiceXY }, body({ a: { type: 'rank', choice: 'x' } }))).toFailWith(
        /^invalid-response/
      );
    });

    test('U18 choice and score answers carry no confidence, and no undeclared field survives', async () => {
      for (const sent of [clmBody(), jevBody()]) {
        const { fetch } = scriptedFetch(jsonResponse(200, sent));
        const result = await askSystemOne(clientFor(fetch), {
          state: 's',
          questions: threeQuestions,
          inputLimit: unchecked
        });
        expect(result).toSucceedAndSatisfy(({ result: answer }) => {
          expect('confidence' in answer.answers.route).toBe(false);
          expect('confidence' in answer.answers.urgency).toBe(false);
          expect(Object.keys(answer).sort()).toEqual(['answers', 'model', 'usage']);
          expect(Object.keys(answer.answers.billing).sort()).toEqual(['noul', 'type']);
          expect(Object.keys(answer.answers.route).sort()).toEqual(['choice', 'probabilities', 'type']);
          expect(Object.keys(answer.answers.urgency).sort()).toEqual([
            'legend',
            'probabilities',
            'score',
            'type'
          ]);
          expect(Object.keys(answer.usage).sort()).toEqual(['input_tokens', 'output_tokens']);
        });
      }
    });
  });

  describe('meta', () => {
    test('U20 requestId, timing headers, model and usage come from the response', async () => {
      const timing = 'embed;dur=12.5, heads;dur=0.3';
      const { fetch } = scriptedFetch(
        jsonResponse(200, clmBody(), {
          'x-typesafe-request-id': 'req-1',
          'server-timing': timing,
          'x-clm-latency-ms': '15.2'
        })
      );
      expect(
        await askSystemOne(clientFor(fetch), { state: 's', questions: threeQuestions, inputLimit: unchecked })
      ).toSucceedAndSatisfy(({ meta }) => {
        expect(meta.requestId).toBe('req-1');
        expect(meta.timingHeaders).toEqual({ 'server-timing': timing, 'x-clm-latency-ms': '15.2' });
        expect(meta.model).toBe('clm-latest');
        expect(meta.usage).toEqual({ billing_units: 3, input_tokens: 42, output_tokens: 0 });
      });
    });

    test('U20 requestId is undefined and timing headers are omitted when the server sends none', async () => {
      const { fetch } = scriptedFetch(jsonResponse(200, jevBody()));
      expect(
        await askSystemOne(clientFor(fetch), { state: 's', questions: threeQuestions, inputLimit: unchecked })
      ).toSucceedAndSatisfy(({ meta }) => {
        expect(meta.requestId).toBeUndefined();
        expect('timingHeaders' in meta).toBe(false);
        expect(meta.model).toBe('jev-latest');
        expect(meta.usage).toEqual({ input_tokens: 17, output_tokens: 0 });
      });
      const onlyClm = scriptedFetch(jsonResponse(200, shortChoiceBody('q'), { 'x-clm-latency-ms': '9.0' }));
      expect(await askOnce(clientFor(onlyClm.fetch))).toSucceedAndSatisfy(({ meta }) => {
        expect(meta.timingHeaders).toEqual({ 'x-clm-latency-ms': '9.0' });
      });
    });

    test('U20 billing_units is kept only when it is a finite number', async () => {
      const sent = {
        ...shortChoiceBody('q'),
        usage: { input_tokens: 1, output_tokens: 0, billing_units: 'three' }
      };
      const { fetch } = scriptedFetch(jsonResponse(200, sent));
      expect(await askOnce(clientFor(fetch))).toSucceedAndSatisfy(({ meta }) => {
        expect(meta.usage).toEqual({ input_tokens: 1, output_tokens: 0 });
      });
    });

    test('U20 elapsedMs covers retries and back-off', async () => {
      const { fetch, calls } = scriptedFetch(
        delayedReply(45, jsonResponse(503, { error: 'busy' })),
        jsonResponse(200, shortChoiceBody('q'))
      );
      const client = clientFor(fetch, { retry: { maxRetries: 1, backoffInitialMs: 1, backoffMaxMs: 1 } });
      expect(await askOnce(client)).toSucceedAndSatisfy(({ meta }) => {
        expect(meta.elapsedMs).toBeGreaterThanOrEqual(40);
      });
      expect(calls).toHaveLength(2);
    });
  });
});
