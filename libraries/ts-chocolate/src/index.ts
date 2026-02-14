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

// Workspace - primary application entry point
export {
  Workspace,
  IWorkspace,
  IWorkspaceCreateParams,
  IWorkspaceFactoryParams,
  WorkspaceState,
  createNodeWorkspace,
  createNodeWorkspaceLegacy,
  type ICreateNodeWorkspaceParams,
  type DirectoryLayoutParams,
  type ISingleRootParams,
  type IDualRootParams,
  type IMultiRootParams,
  type StartupMode,
  type MissingFileBehavior,
  type DirectoryLayoutMode,
  initializeNodePlatform,
  createWorkspaceFromPlatform,
  initializeWorkspace,
  IWorkspaceInitParams,
  IWorkspaceInitResult,
  type IWorkspaceCreateWithSettingsParams,
  type IPlatformInitResult,
  type IPlatformInitOptions,
  type IPlatformInitializer,
  type ICommonWorkspaceInitParams,
  type IResolvedExternalLibrary,
  toLibraryFileSources,
  toUserLibrarySource,
  ensureDirectoryPath,
  ensureWorkspaceDirectoriesInTree
} from './packlets/workspace';

// All branded types and common utilities
export * from './packlets/common';

import * as BuiltIn from './packlets/built-in';
import * as Editing from './packlets/editing';
import * as Entities from './packlets/entities';
import * as LibraryData from './packlets/library-data';
import * as LibraryRuntime from './packlets/library-runtime';
import * as Settings from './packlets/settings';
import * as UserEntities from './packlets/user-entities';
import * as UserLibrary from './packlets/user-library';

export { BuiltIn, Editing, Entities, LibraryData, LibraryRuntime, Settings, UserEntities, UserLibrary };
