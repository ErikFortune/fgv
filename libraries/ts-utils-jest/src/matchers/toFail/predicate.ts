import { Result } from '../../ts-utils';

export const matcherName: string = 'toFail';

export function predicate<T>(received: Result<T>): boolean {
  return received.isFailure();
}
