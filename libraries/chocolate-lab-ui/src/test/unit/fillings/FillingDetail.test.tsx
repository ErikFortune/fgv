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
import { FillingDetail } from '../../../packlets/fillings';

describe('FillingDetail', () => {
  it('renders with built-in filling data', () => {
    const workspace = Workspace.create({ builtin: true }).orThrow();
    const fillings = Array.from(workspace.data.fillings.values());
    expect(fillings.length).toBeGreaterThan(0);

    const firstFilling = fillings[0];
    const reactiveWorkspace = new ReactiveWorkspace(workspace);

    render(
      <WorkspaceProvider reactiveWorkspace={reactiveWorkspace}>
        <FillingDetail filling={firstFilling} />
      </WorkspaceProvider>
    );

    expect(screen.getByText(firstFilling.name)).toBeInTheDocument();
  });

  it('displays filling description if present', () => {
    const workspace = Workspace.create({ builtin: true }).orThrow();
    const reactiveWorkspace = new ReactiveWorkspace(workspace);

    const fillings = Array.from(workspace.data.fillings.values());
    const describedFilling = fillings.find((f: LibraryRuntime.FillingRecipe) => f.description);

    if (describedFilling && describedFilling.description) {
      render(
        <WorkspaceProvider reactiveWorkspace={reactiveWorkspace}>
          <FillingDetail filling={describedFilling} />
        </WorkspaceProvider>
      );

      expect(screen.getByText(describedFilling.name)).toBeInTheDocument();
    }
  });

  it('displays filling tags if present', () => {
    const workspace = Workspace.create({ builtin: true }).orThrow();
    const reactiveWorkspace = new ReactiveWorkspace(workspace);

    const fillings = Array.from(workspace.data.fillings.values());
    const taggedFilling = fillings.find((f: LibraryRuntime.FillingRecipe) => f.tags && f.tags.length > 0);

    if (taggedFilling && taggedFilling.tags) {
      render(
        <WorkspaceProvider reactiveWorkspace={reactiveWorkspace}>
          <FillingDetail filling={taggedFilling} />
        </WorkspaceProvider>
      );

      expect(screen.getByText(taggedFilling.name)).toBeInTheDocument();
      expect(screen.getByText(taggedFilling.tags[0])).toBeInTheDocument();
    }
  });
});
