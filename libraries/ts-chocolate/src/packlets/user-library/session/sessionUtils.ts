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
 * Session utility functions shared between recipe and confection editing sessions
 * @packageDocumentation
 */

import { Result } from '@fgv/ts-utils';

import { BaseJournalId, BaseSessionId, SessionSpec, Converters as CommonConverters } from '../../common';

// ============================================================================
// ID Generators
// ============================================================================

/**
 * Generates a SessionId in the format YYYY-MM-DD-HHMMSS-xxxxxxxx
 * @returns Result with a valid SessionId
 * @public
 */
export function generateSessionId(): Result<SessionSpec> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const random = Math.random().toString(16).substring(2, 10).padStart(8, '0');
  return CommonConverters.sessionSpec.convert(
    `${year}-${month}-${day}-${hours}${minutes}${seconds}-${random}`
  );
}

/**
 * Generates a JournalBaseId in the format YYYY-MM-DD-HHMMSS-xxxxxxxx
 * @returns Result with a valid JournalBaseId
 * @public
 */
export function generateJournalId(): Result<BaseJournalId> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const random = Math.random().toString(16).substring(2, 10).padStart(8, '0');
  return CommonConverters.baseJournalId.convert(
    `${year}-${month}-${day}-${hours}${minutes}${seconds}-${random}`
  );
}

/**
 * Generates a SessionBaseId in the format YYYY-MM-DD-HHMMSS-xxxxxxxx
 * @param now - Optional date to base the ID on (defaults to current date/time)
 * @returns Result with a valid SessionBaseId
 * @public
 */
export function generateSessionBaseId(now?: Date): Result<BaseSessionId> {
  now = now ?? new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const random = Math.random().toString(16).substring(2, 10).padStart(8, '0');
  return CommonConverters.baseSessionId.convert(
    `${year}-${month}-${day}-${hours}${minutes}${seconds}-${random}`
  );
}

// ============================================================================
// Date/Time Utilities
// ============================================================================

/**
 * Gets the current date as an ISO 8601 date string (YYYY-MM-DD)
 * @returns Date string
 * @public
 */
export function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Gets the current timestamp as an ISO 8601 timestamp string
 * @returns Timestamp string
 * @public
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
