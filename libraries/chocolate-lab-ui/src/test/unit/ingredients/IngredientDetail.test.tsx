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
import { IngredientDetail } from '../../../packlets/ingredients';

describe('IngredientDetail', () => {
  it('renders with built-in ingredient data', () => {
    const workspace = Workspace.create({ builtin: true }).orThrow();
    const ingredients = Array.from(workspace.data.ingredients.values());
    expect(ingredients.length).toBeGreaterThan(0);

    const firstIngredient = ingredients[0];
    const reactiveWorkspace = new ReactiveWorkspace(workspace);

    render(
      <WorkspaceProvider reactiveWorkspace={reactiveWorkspace}>
        <IngredientDetail ingredient={firstIngredient} />
      </WorkspaceProvider>
    );

    expect(screen.getByText(firstIngredient.name)).toBeInTheDocument();
  });

  it('displays ingredient with description', () => {
    const workspace = Workspace.create({ builtin: true }).orThrow();
    const reactiveWorkspace = new ReactiveWorkspace(workspace);

    const ingredients = Array.from(workspace.data.ingredients.values());
    const describedIngredient = ingredients.find((i: LibraryRuntime.AnyIngredient) => i.description);

    if (describedIngredient && describedIngredient.description) {
      render(
        <WorkspaceProvider reactiveWorkspace={reactiveWorkspace}>
          <IngredientDetail ingredient={describedIngredient} />
        </WorkspaceProvider>
      );

      expect(screen.getByText(describedIngredient.name)).toBeInTheDocument();
    }
  });

  it('displays ingredient tags if present', () => {
    const workspace = Workspace.create({ builtin: true }).orThrow();
    const reactiveWorkspace = new ReactiveWorkspace(workspace);

    const ingredients = Array.from(workspace.data.ingredients.values());
    const taggedIngredient = ingredients.find(
      (i: LibraryRuntime.AnyIngredient) => i.tags && i.tags.length > 0
    );

    if (taggedIngredient && taggedIngredient.tags) {
      render(
        <WorkspaceProvider reactiveWorkspace={reactiveWorkspace}>
          <IngredientDetail ingredient={taggedIngredient} />
        </WorkspaceProvider>
      );

      expect(screen.getByText(taggedIngredient.name)).toBeInTheDocument();
      expect(screen.getAllByText(taggedIngredient.tags[0]).length).toBeGreaterThan(0);
    }
  });
});
