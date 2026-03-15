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

import '@fgv/ts-utils-jest';
import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Workspace, LibraryRuntime } from '@fgv/ts-chocolate';

import { ReactiveWorkspace, WorkspaceProvider } from '../../../packlets/workspace';
import { DecorationDetail } from '../../../packlets/decorations';

describe('DecorationDetail', () => {
  it('renders with built-in decoration data', () => {
    const workspace = Workspace.create({ builtin: true }).orThrow();
    const decorations = Array.from(workspace.data.decorations.values());
    expect(decorations.length).toBeGreaterThan(0);

    const firstDecoration = decorations[0];
    const reactiveWorkspace = new ReactiveWorkspace(workspace);

    render(
      <WorkspaceProvider reactiveWorkspace={reactiveWorkspace}>
        <DecorationDetail decoration={firstDecoration} />
      </WorkspaceProvider>
    );

    expect(screen.getByText(firstDecoration.name)).toBeInTheDocument();
  });

  it('displays decoration description if present', () => {
    const workspace = Workspace.create({ builtin: true }).orThrow();
    const reactiveWorkspace = new ReactiveWorkspace(workspace);

    const decorations = Array.from(workspace.data.decorations.values());
    const describedDecoration = decorations.find((d: LibraryRuntime.Decoration) => d.description);

    if (describedDecoration && describedDecoration.description) {
      render(
        <WorkspaceProvider reactiveWorkspace={reactiveWorkspace}>
          <DecorationDetail decoration={describedDecoration} />
        </WorkspaceProvider>
      );

      expect(screen.getByText(describedDecoration.name)).toBeInTheDocument();
    }
  });

  it('displays decoration tags if present', () => {
    const workspace = Workspace.create({ builtin: true }).orThrow();
    const reactiveWorkspace = new ReactiveWorkspace(workspace);

    const decorations = Array.from(workspace.data.decorations.values());
    const taggedDecoration = decorations.find((d: LibraryRuntime.Decoration) => d.tags && d.tags.length > 0);

    if (taggedDecoration && taggedDecoration.tags) {
      render(
        <WorkspaceProvider reactiveWorkspace={reactiveWorkspace}>
          <DecorationDetail decoration={taggedDecoration} />
        </WorkspaceProvider>
      );

      expect(screen.getByText(taggedDecoration.name)).toBeInTheDocument();
      expect(screen.getByText(taggedDecoration.tags[0])).toBeInTheDocument();
    }
  });
});
