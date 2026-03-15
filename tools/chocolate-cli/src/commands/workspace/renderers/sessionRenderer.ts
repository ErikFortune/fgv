// Copyright (c) 2026 Erik Fortune
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

import { UserLibrary as UserLib } from '@fgv/ts-chocolate';

import { IEntityAction, IRenderResult } from './rendererTypes';

/**
 * Checks whether a session is a filling editing session (vs confection).
 */
function isFillingSession(
  session: UserLib.AnyMaterializedSession
): session is UserLib.Session.EditingSession {
  return session instanceof UserLib.Session.EditingSession;
}

/**
 * Renders a one-line summary for a session (for list display).
 */
export function renderSessionSummary(session: UserLib.AnyMaterializedSession): string {
  if (isFillingSession(session)) {
    return `${session.sessionId} - [filling] ${session.baseRecipe.fillingRecipe.name} (${session.targetWeight}g)`;
  }
  return `${session.sessionId} - [${session.baseConfection.confectionType}] ${session.baseConfection.name}`;
}

/**
 * Renders a full detail view for a filling editing session.
 */
function renderFillingSessionDetail(session: UserLib.Session.EditingSession): IRenderResult {
  const lines: string[] = [];
  const actions: IEntityAction[] = [];

  const recipe = session.baseRecipe;
  lines.push(`Session: ${recipe.fillingRecipe.name}`);
  lines.push(`Session ID: ${session.sessionId}`);
  lines.push(`Type: Filling`);
  lines.push(`Recipe: ${recipe.fillingRecipe.name} (${recipe.fillingId})`);
  lines.push(`Variation: ${recipe.variationSpec}`);
  lines.push(`Target Weight: ${session.targetWeight}g`);
  lines.push(`Has Changes: ${session.hasChanges ? 'yes' : 'no'}`);

  actions.push({
    label: `View filling: ${recipe.fillingRecipe.name}`,
    key: `view-filling:${recipe.fillingId}`,
    description: `Navigate to filling ${recipe.fillingId}`
  });

  return { text: lines.join('\n'), actions };
}

/**
 * Renders a full detail view for a confection editing session.
 */
function renderConfectionSessionDetail(session: UserLib.Session.AnyConfectionEditingSession): IRenderResult {
  const lines: string[] = [];
  const actions: IEntityAction[] = [];

  const confection = session.baseConfection;
  lines.push(`Session: ${confection.name}`);
  lines.push(`Session ID: ${session.sessionId}`);
  lines.push(`Type: ${confection.confectionType}`);
  lines.push(`Confection: ${confection.name} (${confection.id})`);

  const fillingCount = session.fillingSessions.size;
  lines.push(`Filling Sessions: ${fillingCount}`);

  if (fillingCount > 0) {
    lines.push('');
    lines.push('Filling Slots:');
    for (const [slotId, fillingSession] of session.fillingSessions.entries()) {
      lines.push(
        `  ${slotId}: ${fillingSession.baseRecipe.fillingRecipe.name} (${fillingSession.targetWeight}g)`
      );
    }
  }

  actions.push({
    label: `View confection: ${confection.name}`,
    key: `view-confection:${confection.id}`,
    description: `Navigate to confection ${confection.id}`
  });

  return { text: lines.join('\n'), actions };
}

/**
 * Renders a full detail view for any session type.
 */
export function renderSessionDetail(session: UserLib.AnyMaterializedSession): IRenderResult {
  if (isFillingSession(session)) {
    return renderFillingSessionDetail(session);
  }
  return renderConfectionSessionDetail(session);
}
