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

import * as ResourceJson from '../resource-json';
import { IValidatedContextDecl } from '../context';

/**
 * Options for resource declaration operations with strongly-typed context filtering.
 * Extends the base IDeclarationOptions with proper type safety for context filtering.
 *
 * @example
 * ```typescript
 * // Preferred Result pattern with onSuccess chaining
 * resourceManager.validateContext({ language: 'en' })
 *   .onSuccess((validatedContext) => {
 *     return resourceManager.clone({ validatedFilterContext: validatedContext });
 *   })
 *   .onSuccess((clonedManager) => {
 *     return clonedManager.getResourceCollectionDecl();
 *   })
 *   .onFailure((error) => {
 *     console.error('Failed to create filtered clone:', error);
 *   });
 * ```
 * @public
 */
export interface IResourceDeclarationOptions extends ResourceJson.Helpers.IDeclarationOptions {
  /**
   * If provided, filters resource candidates to only include those that can match the
   * specified validated context. This provides strongly-typed context filtering.
   *
   * Use resourceManager.validateContext() to create a validated context from an IContextDecl.
   */
  validatedFilterContext?: IValidatedContextDecl;

  /**
   * Whether to include metadata in compiled outputs.
   * Metadata includes human-readable information like semantic keys
   * that can be useful for debugging or tooling.
   * @defaultValue false
   */
  includeMetadata?: boolean;
}

/**
 * Extended compiled resource options that includes context filtering capabilities.
 * This interface combines the standard compilation options with strongly-typed
 * context filtering for resource candidates.
 * @public
 */
export interface ICompiledResourceOptionsWithFilter extends ResourceJson.Compiled.ICompiledResourceOptions {
  /**
   * If provided, filters resource candidates to only include those that can match the
   * specified validated context. This provides strongly-typed context filtering.
   *
   * Use resourceManager.validateContext() to create a validated context from an IContextDecl.
   */
  validatedFilterContext?: IValidatedContextDecl;
}
