import '@fgv/ts-utils-jest';
import '@testing-library/jest-dom';

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { type SessionId, UserLibrary, Workspace } from '@fgv/ts-chocolate';

import { ReactiveWorkspace, WorkspaceProvider } from '../../../packlets/workspace';
import { FillingSessionPanel } from '../../../packlets/sessions';

describe('FillingSessionPanel', () => {
  it('opens recipe browser callback when recipe link is clicked', () => {
    const workspace = Workspace.create({ builtin: true }).orThrow();
    const reactiveWorkspace = new ReactiveWorkspace(workspace);
    const filling = Array.from(workspace.data.fillings.values())[0];
    const session = UserLibrary.Session.EditingSession.create(filling.goldenVariation, 1).orThrow();
    const onOpenFillingRecipe = jest.fn();
    const expectedLabel = `${filling.name} | ${
      session.baseRecipe.name ?? String(session.baseRecipe.variationSpec)
    }`;

    render(
      <WorkspaceProvider reactiveWorkspace={reactiveWorkspace}>
        <FillingSessionPanel
          sessionId={'test.test-session' as SessionId}
          session={session}
          onOpenFillingRecipe={onOpenFillingRecipe}
        />
      </WorkspaceProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: expectedLabel }));

    expect(onOpenFillingRecipe).toHaveBeenCalledTimes(1);
    expect(onOpenFillingRecipe).toHaveBeenCalledWith(filling.id, session.baseRecipe.variationSpec);
  });
});
