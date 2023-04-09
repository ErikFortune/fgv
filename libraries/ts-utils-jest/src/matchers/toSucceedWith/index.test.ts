import { fail, succeed } from '../../ts-utils';
import matcher from './';
import toFailTestAndMatchSnapshot from '../toFailTestAndMatchSnapshot';

expect.extend({
  ...matcher,
  ...toFailTestAndMatchSnapshot
});

describe('.toSucceedWith', () => {
  test('succeeds with a success result that matches expected', () => {
    expect(succeed('hello')).toSucceedWith('hello');
    expect(succeed('hello')).toSucceedWith(expect.stringMatching(/h.*/i));
  });

  test('fails with a failure result', () => {
    expect(fail('oops')).not.toSucceedWith('oops');
  });

  test('fails with a success result but a non-matching value', () => {
    expect(succeed('hello')).not.toSucceedWith('goodbye');
  });

  test('succeeds with a string that matches an expected RegExp', () => {
    expect(succeed('hello sailor')).toSucceedWith(/sailor/i);
  });

  test('fails with a string that does not match an expected RegExp', () => {
    expect(succeed('hello sailor')).not.toSucceedWith(/soldier/i);
  });

  test('fails with a non-string and a RegExp', () => {
    expect(succeed({ data: 'hello sailor' })).not.toSucceedWith(/sailor/i);
  });

  test('passes with a matching asymmetric match', () => {
    expect(
      succeed({
        title: 'A title string',
        subtitles: ['subtitle 1', 'subtitle 2']
      })
    ).toSucceedWith(
      expect.objectContaining({
        title: expect.stringMatching(/.*title*/),
        subtitles: expect.arrayContaining(['subtitle 1', expect.stringContaining('2')])
      })
    );
  });

  test('fails with a non-matching asymmetric match', () => {
    expect(
      succeed({
        title: 'A title string',
        subtitles: ['subtitle 1', 'subtitle 2']
      })
    ).not.toSucceedWith(
      expect.objectContaining({
        title: expect.stringMatching(/.*title*/),
        subtitles: expect.arrayContaining(['subtitle 1', expect.stringContaining('3')])
      })
    );
  });

  test('reports details when it fails due to a success result with .not', () => {
    expect(() => {
      expect(succeed('hello')).not.toSucceedWith('hello');
    }).toFailTestAndMatchSnapshot();
  });

  test('reports details when it fails due to a failure result', () => {
    expect(() => {
      expect(fail('oops')).toSucceedWith('oops');
    }).toFailTestAndMatchSnapshot();
  });

  test('reports details when it fails due to success with a non-matching value', () => {
    expect(() => {
      expect(succeed('hello')).toSucceedWith('goodbye');
    }).toFailTestAndMatchSnapshot();
  });
});
