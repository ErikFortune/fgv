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

import { Result, fail, succeed } from '@fgv/ts-utils';
import { ConfectionId, FillingId, UserLibrary as UserLib } from '@fgv/ts-chocolate';

import { interactiveSelect, ISelectableItem } from '../../shared';
import { showMenu, showInfo, showError } from '../shared';
import { renderSessionSummary, renderSessionDetail, IEntityAction } from '../renderers';
import { showFillingDetail } from './browseFillings';
import { showConfectionDetail } from './browseConfections';
import { IBrowseContext } from './browseTypes';

/**
 * Selectable session item for interactive selection.
 */
interface ISessionSelectableItem extends ISelectableItem {
  session: UserLib.AnyMaterializedSession;
}

/**
 * Builds selectable items from sessions, sorted by sessionId.
 */
function buildSessionItems(userLibrary: UserLib.IUserLibrary): ISessionSelectableItem[] {
  const items: ISessionSelectableItem[] = [];
  for (const session of userLibrary.sessions.values()) {
    const isFillingSession = session instanceof UserLib.Session.EditingSession;
    items.push({
      id: session.sessionId,
      name: session.sessionId,
      description: isFillingSession ? '[filling]' : `[${session.baseConfection.confectionType}]`,
      session
    });
  }
  // SessionId encodes timestamp (YYYY-MM-DD-HHMMSS-xxxxxxxx), so string sort gives chronological order
  items.sort((a, b) => a.id.localeCompare(b.id));
  return items;
}

/**
 * Shows the action menu for a session and handles navigation.
 */
async function showSessionActionMenu(
  actions: ReadonlyArray<IEntityAction>,
  sessionName: string,
  context: IBrowseContext
): Promise<'back' | 'continue' | 'exit'> {
  const choices = actions.map((action) => ({
    value: action.key,
    name: action.label,
    description: action.description
  }));

  const menuResult = await showMenu({
    message: `${sessionName} - Actions`,
    choices,
    showBack: true,
    showExit: true
  });

  if (menuResult.action === 'exit') {
    return 'exit';
  }

  if (menuResult.action === 'back') {
    return 'back';
  }

  if (menuResult.action === 'value') {
    const key = menuResult.value;

    if (key.startsWith('view-filling:')) {
      const fillingId = key.substring('view-filling:'.length) as FillingId;
      const fillingResult = context.library.fillings.get(fillingId);
      if (fillingResult.isSuccess()) {
        const detailResult = await showFillingDetail(fillingResult.value, context);
        if (detailResult.isFailure() && detailResult.message === 'exit') {
          return 'exit';
        }
        return 'continue';
      } else {
        showError(`Filling not found: ${fillingId}`);
      }
    }

    if (key.startsWith('view-confection:')) {
      const confectionId = key.substring('view-confection:'.length) as ConfectionId;
      const confectionResult = context.library.confections.get(confectionId);
      if (confectionResult.isSuccess()) {
        const detailResult = await showConfectionDetail(confectionResult.value, context);
        if (detailResult.isFailure() && detailResult.message === 'exit') {
          return 'exit';
        }
        return 'continue';
      } else {
        showError(`Confection not found: ${confectionId}`);
      }
    }
  }

  return 'back';
}

/**
 * Shows the detail view for a session with action menu.
 */
async function showSessionDetail(
  session: UserLib.AnyMaterializedSession,
  context: IBrowseContext
): Promise<Result<void>> {
  const isFillingSession = session instanceof UserLib.Session.EditingSession;
  const name = isFillingSession ? session.baseRecipe.fillingRecipe.name : session.baseConfection.name;

  context.breadcrumb.push(name);

  const result = renderSessionDetail(session);
  console.log('');
  console.log(result.text);
  console.log('');

  if (result.actions.length > 0) {
    while (true) {
      const navResult = await showSessionActionMenu(result.actions, name, context);
      if (navResult === 'exit') {
        context.breadcrumb.pop();
        return fail('exit');
      }
      if (navResult === 'back') {
        break;
      }
    }
  }

  context.breadcrumb.pop();
  return succeed(undefined);
}

/**
 * Browses sessions interactively.
 */
export async function browseSessionsInteractive(context: IBrowseContext): Promise<Result<void>> {
  context.breadcrumb.push('Sessions');

  const userLibrary = context.userLibrary;
  if (!userLibrary) {
    context.breadcrumb.pop();
    return fail('User library not available');
  }

  const items = buildSessionItems(userLibrary);

  if (items.length === 0) {
    showInfo('No sessions found');
    context.breadcrumb.pop();
    return succeed(undefined);
  }

  while (true) {
    const selectionResult = await interactiveSelect({
      items,
      prompt: `Select a session (${items.length} available):`,
      formatName: (item) => renderSessionSummary(item.session)
    });

    if (selectionResult.isFailure()) {
      showError(selectionResult.message);
      break;
    }

    if (selectionResult.value === 'cancelled') {
      break;
    }

    const selected = selectionResult.value as ISessionSelectableItem;
    const detailResult = await showSessionDetail(selected.session, context);
    if (detailResult.isFailure() && detailResult.message === 'exit') {
      context.breadcrumb.pop();
      return fail('exit');
    }
  }

  context.breadcrumb.pop();
  return succeed(undefined);
}
