import { getTypeOfProperty, getValueOfPropertyOrDefault } from '@fgv/ts-utils';
import { matcherHint, printExpected, printReceived } from 'jest-matcher-utils';
import { IMatchedCall, matcherName, predicate } from './predicate';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars,  @typescript-eslint/naming-convention
    interface Matchers<R> {
      /**
       * Use .toSucceedWith to verify that a Result<T> is a success
       * and that the result value matches the supplied value
       * @param expected -
       */
      toHaveBeenCalledWithArgumentsMatching(expected: unknown): R;
    }
  }
}

function getRange(length: number, cursor: number): { start: number; end: number } {
  // less than 3 return everything
  if (length < 3) {
    return { start: 0, end: length };
  }

  if (cursor === 0) {
    return { start: 0, end: 3 };
  } else if (cursor >= length - 1) {
    return { start: length - 3, end: length };
  }
  return { start: cursor - 1, end: cursor + 2 };
}

function formatOneCall(index: number, received: unknown, cursor: boolean): string {
  const indexString = index.toLocaleString([], { maximumFractionDigits: 0, minimumIntegerDigits: 3 });
  const cursorString = cursor ? '*' : ' ';
  return `${cursorString}${indexString}: ${printReceived(received)}`;
}

function formatArgsMessage(received: jest.Mock, cursor?: number): string[] {
  const calls = received.mock.calls;

  if (calls.length > 0) {
    // if there's no cursor, show the last 3
    const { start, end } = getRange(calls.length, cursor !== undefined ? cursor : calls.length - 1);
    const callsToShow = calls.slice(start, end);
    return callsToShow.map((c, i) => formatOneCall(start + i, c, start + i === cursor));
  }
  return [];
}

function passMessage(received: jest.Mock, expected: unknown, matched: IMatchedCall): () => string {
  return () =>
    [
      matcherHint(`.not.${matcherName}`),
      'Expected no call with arguments matching:',
      `      ${printExpected(expected)}`,
      `Received (${received.mock.calls.length} total):`,
      ...formatArgsMessage(received, matched.index)
    ].join('\n');
}

function failMessage(received: jest.Mock, expected: unknown): () => string {
  return () =>
    [
      matcherHint(`${matcherName}`),
      'Expected call with arguments matching:',
      `      ${printExpected(expected)}`,
      `Received (${received.mock.calls.length} total):`,
      ...formatArgsMessage(received)
    ].join('\n');
}

function isMock(received: unknown): received is jest.Mock {
  if (received !== null && !Array.isArray(received)) {
    return (
      getValueOfPropertyOrDefault('_isMockFunction', received as object) === true &&
      getTypeOfProperty('mock', received as object) === 'object'
    );
  }
  return false;
}

export default {
  toHaveBeenCalledWithArgumentsMatching: function (
    received: jest.Mock,
    expected: unknown
  ): jest.CustomMatcherResult {
    if (!isMock(received)) {
      throw new Error('Test error: toHaveBeenCalledWithArgumentsMatching called with other than jest.Mock');
    }

    const matched = predicate(received, expected);
    if (matched !== undefined) {
      return { pass: true, message: passMessage(received, expected, matched) };
    }

    return { pass: false, message: failMessage(received, expected) };
  }
};
