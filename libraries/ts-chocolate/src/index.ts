// Copyright (c) 2024 Erik Fortune
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
 * Main exports for \@fgv/ts-chocolate library
 * @packageDocumentation
 */

// ============================================================================
// PRIMARY EXPORTS - Classes developers use directly
// ============================================================================

// Main library entry point
export { ChocolateLibrary } from './packlets/library-runtime';

// Runtime context for queries and resolved operations
export { RuntimeContext } from './packlets/runtime';

// Workspace - primary application entry point
export {
  Workspace,
  IWorkspace,
  IWorkspaceCreateParams,
  IWorkspaceFactoryParams,
  WorkspaceState,
  createNodeWorkspace
} from './packlets/workspace';

// All branded types and common utilities
export * from './packlets/common';

// ============================================================================
// NAMESPACE EXPORTS
// ============================================================================

// Data layer - models, converters, collections, libraries
import * as Entities from './packlets/entities';
export { Entities };

// Library runtime - materialized projections of library entities
import * as LibraryRuntime from './packlets/library-runtime';
export { LibraryRuntime };

// Runtime - session infrastructure and editing capabilities
import * as Runtime from './packlets/runtime';
export { Runtime };

// Note: Converters is exported via 'export * from ./packlets/common'
// Entity-specific converters are accessible via Entities.Fillings.Converters, etc.

// ============================================================================
// SUPPORTING NAMESPACES
// ============================================================================

import * as CryptoUtils from './packlets/crypto-utils';
import * as LibraryData from './packlets/library-data';
import * as LibraryPersistence from './packlets/library-persistence';
import * as BuiltIn from './packlets/built-in';
import * as Editing from './packlets/editing';
import * as UserLibrary from './packlets/user-library';
import * as UserRuntime from './packlets/user-runtime';

export { CryptoUtils, LibraryData, LibraryPersistence, BuiltIn, Editing, UserLibrary, UserRuntime };
