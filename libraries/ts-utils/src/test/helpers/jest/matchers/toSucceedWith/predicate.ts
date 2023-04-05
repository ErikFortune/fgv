import { equals } from '@jest/expect-utils';
import { Result } from '../../../../../index';

export const matcherName: string = 'toSucceedWith';

export function predicate<T>(received: Result<T>, expected: unknown): boolean {
  if (received.isSuccess()) {
    if (typeof received.value === 'string' && expected instanceof RegExp) {
      return expected.test(received.value);
    }
    return equals(received.value, expected);
  }
  return false;
}
