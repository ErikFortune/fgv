/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  choice,
  noul,
  score,
  type ChoiceQuestion,
  type EntryType,
  type ScoreQuestion
} from '@typesafe-ai/sdk';
import { askSystemOne, measureSystemOneInput, type SystemOneInputLimit } from '../../index';
import { clientFor, jsonResponse, scriptedFetch, shortChoice, shortChoiceBody } from './fixtures';

describe('the input bound', () => {
  test('U1 the bound refuses before any request', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const result = await askSystemOne(clientFor(fetch), {
      state: 'x'.repeat(11),
      questions: { q: shortChoice() },
      inputLimit: { maxChars: 10 }
    });
    expect(result).toFailWith(/input-over-limit/);
    expect(result.detail).toBe('input-over-limit');
    expect(calls).toHaveLength(0);
  });

  test('U2 a measure equal to maxChars is sent; one more is refused', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const client = clientFor(fetch);
    // 8 + 2 (separator) + 0 (no instructions) = 10
    expect(
      await askSystemOne(client, {
        state: 'x'.repeat(8),
        questions: { q: shortChoice() },
        inputLimit: { maxChars: 10 }
      })
    ).toSucceed();
    expect(calls).toHaveLength(1);
    expect(
      await askSystemOne(client, {
        state: 'x'.repeat(9),
        questions: { q: shortChoice() },
        inputLimit: { maxChars: 10 }
      })
    ).toFailWith(/state\+instructions measures 11 characters, over the limit of 10/);
    expect(calls).toHaveLength(1);
  });

  test('U3 the measure counts the instructions and the two-character separator', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const client = clientFor(fetch);
    // 5 + 2 + 4 = 11: refused only if both the separator and the instructions are counted
    expect(
      await askSystemOne(client, {
        state: 'x'.repeat(5),
        questions: { q: shortChoice('i'.repeat(4)) },
        inputLimit: { maxChars: 10 }
      })
    ).toFailWith(/measures 11 characters/);
    // 5 + 2 + 6 = 13; the state alone is 5
    expect(
      await askSystemOne(client, {
        state: 'x'.repeat(5),
        questions: { q: shortChoice('i'.repeat(6)) },
        inputLimit: { maxChars: 10 }
      })
    ).toFailWith(/measures 13 characters/);
    expect(calls).toHaveLength(0);
  });

  test('U4 each candidate is bounded separately and named in the failure', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const client = clientFor(fetch);
    // a long description
    expect(
      await askSystemOne(client, {
        state: 'x',
        questions: { q: choice(null, { a: null, b: 'b'.repeat(11) }) },
        inputLimit: { maxChars: 10 }
      })
    ).toFailWith(/question 'q': criterion b measures 11 characters/);
    // a key standing in for an empty description
    expect(
      await askSystemOne(client, {
        state: 'x',
        questions: { q: choice(null, { a: null, ['k'.repeat(11)]: '' }) },
        inputLimit: { maxChars: 10 }
      })
    ).toFailWith(/criterion k{11} measures 11 characters/);
    // a noul with no criteria: "true: Yes. This is true: " + 80 = 105 and
    // "false: No. This is false: " + 80 = 106, while the state side is 0 + 2 + 80 = 82
    expect(
      await askSystemOne(client, {
        state: '',
        questions: { q: noul('i'.repeat(80)) },
        inputLimit: { maxChars: 100 }
      })
    ).toFailWith(/criterion true measures 105 characters/);
    expect(calls).toHaveLength(0);
  });

  test('U5 a structured state is measured by its JSON serialization', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    // {"k":"yyy…"} is 38 characters; "[object Object]" would be 15
    expect(
      await askSystemOne(clientFor(fetch), {
        state: { k: 'y'.repeat(30) },
        questions: { q: shortChoice() },
        inputLimit: { maxChars: 20 }
      })
    ).toFailWith(/measures 40 characters/);
    expect(calls).toHaveLength(0);
  });

  test('U6 the failure names the question that is over', async () => {
    const { fetch } = scriptedFetch(jsonResponse(200, shortChoiceBody('q1', 'q2')));
    expect(
      await askSystemOne(clientFor(fetch), {
        state: '',
        questions: { q1: shortChoice('i'.repeat(3)), q2: shortChoice('i'.repeat(30)) },
        inputLimit: { maxChars: 10 }
      })
    ).toFailWith(/question 'q2': state\+instructions measures 32/);
  });

  test("U7 'unchecked' skips the bound and the request is sent", async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    expect(
      await askSystemOne(clientFor(fetch), {
        state: 'x'.repeat(50),
        questions: { q: shortChoice() },
        inputLimit: 'unchecked'
      })
    ).toSucceed();
    expect(calls).toHaveLength(1);
  });

  test.each([0, -5, 2.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'U9 maxChars %p is invalid-request, with no request made',
    async (maxChars) => {
      const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
      const result = await askSystemOne(clientFor(fetch), {
        state: 'x',
        questions: { q: shortChoice() },
        inputLimit: { maxChars }
      });
      expect(result).toFailWith(/invalid-request: inputLimit.maxChars must be a positive integer/);
      expect(result.detail).toBe('invalid-request');
      expect(calls).toHaveLength(0);
    }
  );

  test('U26 measureSystemOneInput returns the numbers the refusal reports', async () => {
    const questions = {
      n: noul('Is it?', { true: 'yes it is', false: null }),
      c: choice('Which?', { left: 'the left one', right: null }),
      s: score({ rubric: 'r' }, ['low', null, { level: 'high' }])
    };
    const state = { ticket: 'abc' };
    expect(measureSystemOneInput(state, questions)).toSucceedWith({
      questions: [
        {
          questionId: 'n',
          stateAndInstructions: 16 + 2 + 6,
          criteria: [
            { key: 'true', length: 6 + 9 },
            { key: 'false', length: 7 + 19 + 6 }
          ]
        },
        {
          questionId: 'c',
          stateAndInstructions: 16 + 2 + 6,
          criteria: [
            { key: 'left', length: 12 },
            { key: 'right', length: 5 }
          ]
        },
        {
          questionId: 's',
          stateAndInstructions: 16 + 2 + 14,
          criteria: [
            { key: '0', length: 3 },
            { key: '1', length: 0 },
            { key: '2', length: 16 }
          ]
        }
      ]
    });
    // a noul with neither criteria nor instructions embeds the bare key
    expect(measureSystemOneInput(null, { q: noul() }).orThrow().questions[0]).toEqual({
      questionId: 'q',
      stateAndInstructions: 2,
      criteria: [
        { key: 'true', length: 10 },
        { key: 'false', length: 12 }
      ]
    });

    const { fetch } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const [n] = measureSystemOneInput(state, questions).orThrow().questions;
    const overCandidate = await askSystemOne(clientFor(fetch), {
      state,
      questions,
      inputLimit: { maxChars: 31 }
    });
    expect(overCandidate.message).toContain(
      `question 'n': criterion false measures ${n.criteria[1].length} `
    );
    const overState = await askSystemOne(clientFor(fetch), {
      state,
      questions,
      inputLimit: { maxChars: 23 }
    });
    expect(overState.message).toContain(
      `question 'n': state+instructions measures ${n.stateAndInstructions} `
    );
  });

  test('U27 malformed input is invalid-request, resolved, with no request made', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const client = clientFor(fetch);
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const cases: ReadonlyArray<[string, Parameters<typeof askSystemOne>[1]]> = [
      [
        'a score question with no criteria',
        {
          state: 's',
          questions: {
            s: { type: 'score', instructions: 'q', criteria: undefined } as unknown as ScoreQuestion
          },
          inputLimit: { maxChars: 100 }
        }
      ],
      [
        'a choice question with null criteria',
        {
          state: 's',
          questions: {
            c: { type: 'choice', instructions: 'q', criteria: null } as unknown as ChoiceQuestion
          },
          inputLimit: { maxChars: 100 }
        }
      ],
      [
        'no inputLimit',
        {
          state: 's',
          questions: { q: shortChoice() },
          inputLimit: undefined as unknown as SystemOneInputLimit
        }
      ],
      [
        'a maxChars that is not a number',
        {
          state: 's',
          questions: { q: shortChoice() },
          inputLimit: { maxChars: '10' } as unknown as SystemOneInputLimit
        }
      ],
      [
        'a circular state',
        {
          state: circular as unknown as EntryType,
          questions: { q: shortChoice() },
          inputLimit: { maxChars: 100 }
        }
      ],
      [
        'a bigint state',
        {
          state: { n: BigInt(1) } as unknown as EntryType,
          questions: { q: shortChoice() },
          inputLimit: { maxChars: 100 }
        }
      ]
    ];
    for (const [label, request] of cases) {
      const result = await askSystemOne(client, request);
      expect({ label, detail: result.detail }).toEqual({ label, detail: 'invalid-request' });
      expect(result).toFailWith(/^invalid-request: /);
    }
    expect(calls).toHaveLength(0);
    expect(
      measureSystemOneInput('s', { c: { type: 'choice', criteria: null } as unknown as ChoiceQuestion })
    ).toFailWith(/^invalid-request: \[c\] are not well-formed noul, choice or score questions$/);
  });

  test('U4 a whitespace-only description is measured as the larger of itself and the default', () => {
    expect(
      measureSystemOneInput('', {
        c: choice(null, { a: '   ', b: ' '.repeat(50) }),
        n: noul('abc', { true: '  ', false: null })
      })
    ).toSucceedAndSatisfy(({ questions }) => {
      expect(questions[0].criteria).toEqual([
        { key: 'a', length: 3 },
        { key: 'b', length: 50 }
      ]);
      // the default "Yes. This is true: " + "abc" (22) is longer than "  "
      expect(questions[1].criteria[0]).toEqual({ key: 'true', length: 4 + 2 + 22 });
    });
    expect(measureSystemOneInput('', { c: choice(null, { longkey: ' ' }) })).toSucceedAndSatisfy(
      ({ questions }) => {
        expect(questions[0].criteria).toEqual([{ key: 'longkey', length: 7 }]);
      }
    );
  });
});
