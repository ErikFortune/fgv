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

import React from 'react';
import { act } from '@testing-library/react';
import { succeed } from '@fgv/ts-utils';
import { type CollectionId, Editing, type LibraryData, Workspace } from '@fgv/ts-chocolate';

import { renderWithProviders } from '../../helpers';
import { useNavigationStore } from '../../../packlets/navigation';
import { type ICollectionActions, useCollectionActions } from '../../../packlets/sidebar';
import { ReactiveWorkspace } from '../../../packlets/workspace';

describe('useCollectionActions', () => {
  beforeEach(() => {
    const navigation = useNavigationStore.getState();
    navigation.setMode('production');
    navigation.setTab('locations');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    const navigation = useNavigationStore.getState();
    navigation.setMode('library');
    navigation.setTab('confections');
  });

  test('createCollection delegates to manager.createWithFile', async () => {
    const workspace = Workspace.create({ builtin: true }).orThrow();
    const reactiveWorkspace = new ReactiveWorkspace(workspace);

    let actions: ICollectionActions | undefined;
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    function TestComponent() {
      actions = useCollectionActions();
      return null;
    }

    const createWithFileSpy = jest.fn(
      async (collectionId: CollectionId, metadata: LibraryData.ICollectionFileMetadata) => {
        expect(collectionId).toBe('secret-fillings');
        expect(metadata).toEqual({
          name: 'Secret Fillings',
          secretName: 'top-secret'
        });
        // Return value type is not important for this test — only checking delegation
        return succeed(undefined as unknown as never);
      }
    );

    const fakeManager = {
      createWithFile: createWithFileSpy
    } as unknown as Editing.PersistedCollectionManager<string, string, unknown>;

    jest.spyOn(workspace.userData.entities, 'getCollectionManager').mockReturnValue(fakeManager);

    renderWithProviders(React.createElement(TestComponent), { reactiveWorkspace });

    await act(async () => {
      await actions!.createCollection({
        id: 'secret-fillings',
        name: 'Secret Fillings',
        secretName: 'top-secret'
      });
    });

    expect(createWithFileSpy).toHaveBeenCalledTimes(1);
  });
});
