/**
 * Normalizes a supplied `string`, removing non-alphanumeric characters and forcing to lower case.
 * @param from - the `string` to be normalized
 * @public
 */
export function normalize(from: string): string;

/**
 * Normalizes an optional supplied string, removing non-alphanumeric characters and forcing to lower case
 * if a string is supplied.  Returns `undefined` if input is undefined.
 * @param from - the `string` to be normalized
 * @public
 */
export function normalize(from: string | undefined): string | undefined;
export function normalize(from: string | undefined): string | undefined {
  return from?.replace(/\W+/g, '').toLowerCase();
}
