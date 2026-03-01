/*
 * Copyright (c) 2026 Erik Fortune
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

/**
 * Test rendering utilities for chocolate-lab-ui components.
 *
 * Provides helpers to render components with necessary providers:
 * - WorkspaceProvider (ReactiveWorkspace)
 * - MessagesProvider (for observability)
 *
 * @packageDocumentation
 */

import React from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';

import { WorkspaceProvider, ReactiveWorkspace } from '../../packlets/workspace';

/**
 * Options for rendering a component with test providers.
 * @public
 */
export interface ITestRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Pre-configured ReactiveWorkspace instance.
   * Must be provided by the test.
   */
  readonly reactiveWorkspace: ReactiveWorkspace;
}

/**
 * Extended render result that includes the test workspace and reactive wrapper.
 * @public
 */
export interface ITestRenderResult extends RenderResult {
  /** The reactive workspace instance */
  readonly reactiveWorkspace: ReactiveWorkspace;
}

/**
 * Renders a component with all necessary providers for testing.
 *
 * @example
 * ```typescript
 * import { createTestWorkspace } from '@fgv/ts-chocolate/test/helpers';
 * import { ReactiveWorkspace } from '@fgv/chocolate-lab-ui';
 *
 * const { workspace } = createTestWorkspace({ withFixtureData: true }).orThrow();
 * const reactiveWorkspace = new ReactiveWorkspace(workspace);
 *
 * const { getByText } = renderWithProviders(
 *   <MoldDetail mold={testMold} />,
 *   { reactiveWorkspace }
 * );
 * ```
 *
 * @param ui - The component to render
 * @param options - Rendering and workspace options
 * @returns Extended render result with workspace access
 * @public
 */
export function renderWithProviders(ui: React.ReactElement, options: ITestRenderOptions): ITestRenderResult {
  const { reactiveWorkspace, ...renderOptions } = options;

  function Wrapper({ children }: { readonly children: React.ReactNode }): React.ReactElement {
    return <WorkspaceProvider reactiveWorkspace={reactiveWorkspace}>{children}</WorkspaceProvider>;
  }

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...result,
    reactiveWorkspace
  };
}
