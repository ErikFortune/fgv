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
 * Session-specific model interfaces for the runtime packlet.
 *
 * These interfaces extend the library-runtime interfaces to add
 * session creation and management capabilities.
 *
 * @packageDocumentation
 */

import { Result } from '@fgv/ts-utils';
import type { Collections } from '@fgv/ts-utils';

import { ConfectionId, Measurement } from '../common';
import type { EditingSession } from './session/editingSession';
import {
  AnyConfectionVersion,
  IConfectionContext,
  ILibraryRuntimeContext,
  IConfectionBase,
  IFillingRecipe
} from '../library-runtime';

// ============================================================================
// Session Context Interface
// ============================================================================

/**
 * Context interface for session creation.
 * Extends IConfectionContext with the ability to create filling editing sessions.
 *
 * This interface is used by confection editing sessions to manage filling scaling.
 *
 * @public
 */
export interface ISessionContext extends IConfectionContext {
  /**
   * Creates an editing session for a filling recipe at a target weight.
   * Used by confection sessions to manage filling scaling.
   * @param filling - The runtime filling recipe to create a session for
   * @param targetWeight - Target weight for the filling in grams
   * @returns Success with EditingSession, or Failure if creation fails
   */
  createFillingSession(filling: IFillingRecipe, targetWeight: Measurement): Result<EditingSession>;
}

// ============================================================================
// Runtime Context Interface
// ============================================================================

/**
 * Full runtime context interface with session capabilities.
 *
 * Extends ILibraryRuntimeContext with:
 * - Session creation methods
 * - Confection access and caching
 *
 * This is the complete entry point for consumers who need both
 * library resolution and session management.
 *
 * @public
 */
export interface IRuntimeContext extends ILibraryRuntimeContext {
  /**
   * Gets the number of cached confections.
   */
  readonly cachedConfectionCount: number;

  /**
   * Gets all unique tags used across confections.
   */
  getAllConfectionTags(): ReadonlyArray<string>;

  /**
   * Creates an editing session for a filling recipe at a target weight.
   * Used by confection sessions to manage filling scaling.
   * @param filling - The runtime filling recipe to create a session for
   * @param targetWeight - Target weight for the filling in grams
   * @returns Success with EditingSession, or Failure if creation fails
   */
  createFillingSession(filling: IFillingRecipe, targetWeight: Measurement): Result<EditingSession>;
}

// Re-export confection version type for convenience
export type { AnyConfectionVersion as AnyRuntimeConfectionVersion };
