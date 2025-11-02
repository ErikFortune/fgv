/*
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Brand } from '@fgv/ts-utils';
import { JsonCompatibleType } from '../../../packlets/json';

// Type-level helpers for positive assertions without extra tooling
export type IsAssignable<From, To> = From extends To ? true : false;
export type Assert<T extends true> = T;

// Shared example types used across tests
export interface IUser {
  id: string;
  name: string;
  age?: number;
  tags: string[];
  meta: Record<string, string | number | boolean>;
}

export interface IUserWithFunction extends IUser {
  // Non-JSON-compatible
  compute?: () => number;
}

export interface IRecordContainer {
  values: Record<string, number>;
}

export interface IArrayContainer {
  items: Array<{ id: string; count: number }>;
}

export type Kind = 'alpha' | 'beta';

export interface IAlpha {
  kind: 'alpha';
  value: string;
}

export interface IBeta {
  kind: 'beta';
  count: number;
}

export type AlphaBeta = IAlpha | IBeta;

// Branded examples
export type UserId = Brand<string, 'UserId'>;
export interface IBrandedUser {
  userId: UserId;
  email: string;
}

// Utilities that exercise JsonCompatibleType directly (compile-time only)
export type EnsureUserIsJsonCompatible = Assert<IsAssignable<JsonCompatibleType<IUser>, IUser>>; // IUser is JSON-compatible

// Factory helpers for runtime sections
export function makeUser(overrides: Partial<IUser> = {}): IUser {
  return {
    id: 'u1',
    name: 'Test User',
    tags: ['a', 'b'],
    meta: { active: true, score: 10 },
    ...overrides
  };
}

export function makeAlpha(): IAlpha {
  return { kind: 'alpha', value: 'ok' };
}

export function makeBeta(): IBeta {
  return { kind: 'beta', count: 3 };
}
