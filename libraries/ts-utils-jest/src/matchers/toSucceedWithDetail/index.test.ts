import { failWithDetail, succeedWithDetail } from '../../ts-utils';
import matcher from './';
import toFailTestAndMatchSnapshot from '../toFailTestAndMatchSnapshot';

expect.extend({
  ...matcher,
  ...toFailTestAndMatchSnapshot
});

describe('.toSucceedWithDetail', () => {
  test('succeeds with a success result that matches expected value and detail', () => {
    expect(succeedWithDetail('hello', 'detail')).toSucceedWithDetail('hello', 'detail');
    expect(succeedWithDetail('hello')).toSucceedWithDetail(expect.stringMatching(/h.*/i), undefined);
  });

  test('fails with a failure result', () => {
    expect(failWithDetail('oops', 'detail')).not.toSucceedWithDetail('oops', 'detail');
  });

  test('fails with a success result and matching detail but a non-matching value', () => {
    expect(succeedWithDetail('hello', 'detail')).not.toSucceedWithDetail('goodbye', 'detail');
  });

  test('fails with a success result and matching value but a non-matching detail', () => {
    expect(succeedWithDetail('hello', 'detail')).not.toSucceedWithDetail('hello', 'otherDetail');
  });

  test('succeeds with a string that matches an expected RegExp', () => {
    expect(succeedWithDetail('hello sailor', 'detail')).toSucceedWithDetail(/sailor/i, 'detail');
  });

  test('fails with a string that does not match an expected RegExp', () => {
    expect(succeedWithDetail('hello sailor', 'detail')).not.toSucceedWithDetail(/soldier/i, 'detail');
  });

  test('fails with a non-string and a RegExp', () => {
    expect(succeedWithDetail({ data: 'hello sailor' })).not.toSucceedWithDetail(/sailor/i, undefined);
  });

  test('passes with a matching asymmetric match', () => {
    expect(
      succeedWithDetail(
        {
          title: 'A title string',
          subtitles: ['subtitle 1', 'subtitle 2']
        },
        'detail'
      )
    ).toSucceedWithDetail(
      expect.objectContaining({
        title: expect.stringMatching(/.*title*/),
        subtitles: expect.arrayContaining(['subtitle 1', expect.stringContaining('2')])
      }),
      'detail'
    );
  });

  test('fails with a non-matching asymmetric match', () => {
    expect(
      succeedWithDetail(
        {
          title: 'A title string',
          subtitles: ['subtitle 1', 'subtitle 2']
        },
        'detail'
      )
    ).not.toSucceedWithDetail(
      expect.objectContaining({
        title: expect.stringMatching(/.*title*/),
        subtitles: expect.arrayContaining(['subtitle 1', expect.stringContaining('3')])
      }),
      'detail'
    );
  });

  test('reports details when it fails due to a success result with .not', () => {
    expect(() => {
      expect(succeedWithDetail('hello', 'detail')).not.toSucceedWithDetail('hello', 'detail');
    }).toFailTestAndMatchSnapshot();
  });

  test('reports details when it fails due to a failure result', () => {
    expect(() => {
      expect(failWithDetail('oops', 'detail')).toSucceedWithDetail('oops', 'detail');
    }).toFailTestAndMatchSnapshot();
  });

  test('reports details when it fails due to success with a non-matching value', () => {
    expect(() => {
      expect(succeedWithDetail('hello', 'detail')).toSucceedWithDetail('goodbye', 'detail');
    }).toFailTestAndMatchSnapshot();
  });

  test('reports details when it fails due to success with a non-matching detail', () => {
    expect(() => {
      expect(succeedWithDetail('hello', 'detail')).toSucceedWithDetail('hello', 'other detail');
    }).toFailTestAndMatchSnapshot();
  });
});
