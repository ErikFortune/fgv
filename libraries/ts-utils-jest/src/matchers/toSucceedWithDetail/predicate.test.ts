import { failWithDetail, succeedWithDetail } from '../../ts-utils';
import { predicate } from './predicate';

describe('toSucceedWithDetail', () => {
  test('returns true with success results and matching value and detail', () => {
    expect(predicate(succeedWithDetail('hello', 'detail'), 'hello', 'detail')).toBe(true);
  });

  test('returns false with failed results', () => {
    expect(predicate(failWithDetail('oops', 'detail'), 'oops', 'detail')).toBe(false);
  });

  test('returns false with a successful result and matching detail but non-matching success value', () => {
    expect(predicate(succeedWithDetail('hello', 'detail'), 'goodbye', 'detail')).toBe(false);
  });

  test('returns false with a successful result and matching success value but non-matching detail', () => {
    expect(predicate(succeedWithDetail('hello', 'detail'), 'hello', 'other detail')).toBe(false);
  });

  test('returns true for success with a string value and matching expected RegExp', () => {
    expect(predicate(succeedWithDetail('hello sailor'), /sailor/i, undefined)).toBe(true);
  });

  test('returns false for success with a string value and non-matching expected RegExp', () => {
    expect(predicate(succeedWithDetail('hello sailor'), /soldier/i, undefined)).toBe(false);
  });

  test('returns false for success with a non-string value and non-matching expected RegExp', () => {
    expect(predicate(succeedWithDetail(10), /soldier/i, undefined)).toBe(false);
  });

  test('returns true for success with a matching asymmetric match', () => {
    expect(
      predicate(
        succeedWithDetail(
          {
            title: 'A title string',
            subtitles: ['subtitle 1', 'subtitle 2']
          },
          'detail'
        ),
        expect.objectContaining({
          title: expect.stringMatching(/.*title.*/i),
          subtitles: expect.arrayContaining(['subtitle 1', expect.stringContaining('2')])
        }),
        'detail'
      )
    ).toBe(true);
  });

  test('returns false for success with a non-matching asymmetric match', () => {
    expect(
      predicate(
        succeedWithDetail(
          {
            title: 'A title string',
            subtitles: ['subtitle 1', 'subtitle 2']
          },
          'detail'
        ),
        expect.objectContaining({
          title: expect.stringMatching(/.*title*/),
          subtitles: expect.arrayContaining(['subtitle 1', expect.stringContaining('3')])
        }),
        'detail'
      )
    ).toBe(false);
  });
});
