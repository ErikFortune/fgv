import { printExpected, printReceived } from 'jest-matcher-utils';
import { DetailedResult, Result } from '../ts-utils';
import { createColorStripWrapper } from './colorHelpers';

// Create color-stripped versions of Jest matcher utilities
const printExpectedClean: typeof printExpected = createColorStripWrapper(printExpected);
const printReceivedClean: typeof printReceived = createColorStripWrapper(printReceived);

function printExpectedValue<T>(outcome: string, expected?: T): string {
  return expected !== undefined ? `  ${outcome} with ${printExpectedClean(expected)}` : `  ${outcome}`;
}

export function printExpectedResult<T>(expect: 'success' | 'failure', isNot: boolean, expected?: T): string {
  return [
    'Expected:',
    isNot
      ? expect === 'success'
        ? printExpectedValue('Success', expected)
        : printExpectedValue('Failure', expected)
      : expect === 'success'
      ? printExpectedValue('Not success', expected)
      : printExpectedValue('Not failure', expected)
  ].join('\n');
}

export function printExpectedDetailedResult<T, TD>(
  expect: 'success' | 'failure',
  isNot: boolean,
  expectedMessage?: T,
  expectedDetail?: TD
): string {
  /* c8 ignore next */
  return [
    'Expected:',
    isNot
      ? expect === 'success'
        ? printExpectedValue('Success', expectedMessage)
        : printExpectedValue('Failure', expectedMessage)
      : expect === 'success'
      ? printExpectedValue('Not success', expectedMessage)
      : printExpectedValue('Not failure', expectedMessage),
    `  Detail: "${printExpectedClean(expectedDetail)}"`
  ].join('\n');
}

export function printReceivedResult<T>(received: Result<T>): string {
  return [
    'Received:',
    received.isSuccess()
      ? `  Success with ${printReceivedClean(received.value)}`
      : `  Failure with "${received.message}"`
  ].join('\n');
}

export function printReceivedDetailedResult<T, TD>(received: DetailedResult<T, TD>): string {
  return [
    'Received:',
    received.isSuccess()
      ? `  Success with "${printReceivedClean(received.value)}"\n  Detail: "${printReceivedClean(
          received.detail
        )}"`
      : `  Failure with "${received.message}"\n  Detail: "${printReceivedClean(received.detail)}"`
  ].join('\n');
}
