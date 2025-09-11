/**
 * Utility functions for handling ANSI color codes in test output.
 *
 * @packageDocumentation
 */

/**
 * Regular expression to match ANSI color/style escape sequences.
 *
 * This matches:
 * - ESC character (ASCII 27) followed by `[`
 * - `[0-9;]*` - Zero or more digits and semicolons (parameters)
 * - `[a-zA-Z]` - Single letter command (m for SGR, K for erase, etc.)
 *
 * Examples of what this matches:
 * - `\u001b[31m` - Red foreground
 * - `\u001b[39m` - Default foreground
 * - `\u001b[2m` - Dim/faint
 * - `\u001b[22m` - Normal intensity
 *
 * Using a pre-compiled regex literal to satisfy ESLint security requirements.
 * We use the unicode escape sequence \\u001b instead of \\x1b to avoid control-regex warnings.
 */
// eslint-disable-next-line no-control-regex
const ANSI_COLOR_REGEX: RegExp = /\u001b\[[0-9;]*[a-zA-Z]/g;

/**
 * Strips ANSI color/style escape sequences from a string.
 *
 * This function removes all ANSI escape sequences commonly used for
 * terminal colors and text styling, making the output suitable for
 * color-agnostic snapshot testing.
 *
 * @param text - The text that may contain ANSI escape sequences
 * @returns The text with all ANSI escape sequences removed
 *
 * @example
 * ```typescript
 * const coloredText = '\u001b[31mError:\u001b[39m Something failed';
 * const plainText = stripAnsiColors(coloredText);
 * console.log(plainText); // "Error: Something failed"
 * ```
 *
 * @example
 * ```typescript
 * // Common usage in Jest matchers
 * const formattedOutput = matcherUtils.printReceived(value);
 * const cleanOutput = stripAnsiColors(formattedOutput);
 * expect(cleanOutput).toMatchSnapshot();
 * ```
 *
 * @public
 */
export function stripAnsiColors(text: string): string {
  return text.replace(ANSI_COLOR_REGEX, '');
}

/**
 * Creates a wrapper function that strips ANSI colors from any string-returning function.
 *
 * This is useful for wrapping Jest matcher utility functions to make them
 * color-agnostic for snapshot testing.
 *
 * @param fn - A function that returns a string (potentially with ANSI colors)
 * @returns A wrapped function that returns the same string with colors stripped
 *
 * @example
 * ```typescript
 * import { printReceived } from 'jest-matcher-utils';
 *
 * const printReceivedClean = createColorStripWrapper(printReceived);
 * const output = printReceivedClean(someValue); // No colors
 * ```
 *
 * @public
 */
export function createColorStripWrapper<T extends (...args: unknown[]) => string>(fn: T): T {
  return ((...args: Parameters<T>) => {
    const result = fn(...args);
    return stripAnsiColors(result);
  }) as T;
}
