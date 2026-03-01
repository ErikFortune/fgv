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
 * Tests for MoldDetail component.
 */

import '@fgv/ts-utils-jest';
import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Workspace } from '@fgv/ts-chocolate';

import { ReactiveWorkspace, WorkspaceProvider } from '../../../packlets/workspace';
import { MoldDetail } from '../../../packlets/molds';

describe('MoldDetail', () => {
  it('renders with built-in mold data', () => {
    const workspace = Workspace.create({ builtin: true }).orThrow();
    const molds = Array.from(workspace.data.molds.values());
    expect(molds.length).toBeGreaterThan(0);

    const firstMold = molds[0];
    const reactiveWorkspace = new ReactiveWorkspace(workspace);

    render(
      <WorkspaceProvider reactiveWorkspace={reactiveWorkspace}>
        <MoldDetail mold={firstMold} />
      </WorkspaceProvider>
    );

    expect(screen.getByText(firstMold.displayName)).toBeInTheDocument();
    expect(screen.getByText(firstMold.manufacturer)).toBeInTheDocument();
  });

  it('displays cavity information correctly', () => {
    const workspace = Workspace.create({ builtin: true }).orThrow();
    const reactiveWorkspace = new ReactiveWorkspace(workspace);

    const molds = Array.from(workspace.data.molds.values());
    const moldWithGrid = molds.find((m) => m.cavities.kind === 'grid');

    if (moldWithGrid) {
      render(
        <WorkspaceProvider reactiveWorkspace={reactiveWorkspace}>
          <MoldDetail mold={moldWithGrid} />
        </WorkspaceProvider>
      );

      expect(screen.getByText(moldWithGrid.displayName)).toBeInTheDocument();
      expect(screen.getByText(/grid/i)).toBeInTheDocument();
    }
  });

  it('handles molds without optional fields', () => {
    const workspace = Workspace.create({ builtin: true }).orThrow();
    const reactiveWorkspace = new ReactiveWorkspace(workspace);

    const molds = Array.from(workspace.data.molds.values());
    const simpleMold = molds.find((m) => !m.cavityDimensions);

    if (simpleMold) {
      render(
        <WorkspaceProvider reactiveWorkspace={reactiveWorkspace}>
          <MoldDetail mold={simpleMold} />
        </WorkspaceProvider>
      );

      expect(screen.getByText(simpleMold.displayName)).toBeInTheDocument();
    }
  });
});
