// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Lowercase letters
 * @public
 */
export const lowerCase: string = 'abcdefghijklmnopqrstuvwxyz';
/**
 * Uppercase letters
 * @public
 */
export const upperCase: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
/**
 * Digits
 * @public
 */
export const digits: string = '0123456789';
/**
 * Letters
 * @public
 */
export const letters: string = lowerCase + upperCase;
/**
 * Alphanumeric
 * @public
 */
export const alphanumeric: string = letters + digits;
/**
 * Symbols
 * @public
 */
export const symbols: string = '!@#$%^&*()_+-=[]{}|;:,.<>?';
/**
 * Whitespace
 * @public
 */
export const whitespace: string = ' \t\n\r';
/**
 * Printable
 * @public
 */
export const printable: string = letters + digits + symbols + whitespace;
/**
 * All
 * @public
 */
export const all: string = printable;
/**
 * Hex digits
 * @public
 */
export const hexDigits: string = '0123456789abcdef';
/**
 * Hex digits upper
 * @public
 */
export const hexDigitsUpper: string = '0123456789ABCDEF';
/**
 * Hex
 * @public
 */
export const hex: string = hexDigits + hexDigitsUpper;
/**
 * Base64
 * @public
 */
export const base64: string = letters + digits + '+/';
/**
 * Base64 URL
 * @public
 */
export const base64Url: string = letters + digits + '-_';
/**
 * Base64 URL no padding
 * @public
 */
export const base64UrlNoPadding: string = base64Url + '=';
