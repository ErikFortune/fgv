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

import { Result, fail } from '@fgv/ts-utils';
import { Entities, BaseMoldId, Converters as CommonConverters, MoldFormat } from '@fgv/ts-chocolate';

import { promptInput, confirmAction, showMenu } from '../../shared';

/**
 * Prompts the user to build a new mold entity interactively.
 * @returns Result containing the new mold entity
 */
export async function promptNewMold(): Promise<Result<Entities.IMoldEntity>> {
  const manufacturer = await promptInput('Manufacturer:');
  if (!manufacturer.trim()) {
    return fail('Manufacturer is required');
  }

  const productNumber = await promptInput('Product number:');
  if (!productNumber.trim()) {
    return fail('Product number is required');
  }

  const baseIdInput = await promptInput(
    'Base ID (leave empty to auto-generate from manufacturer+productNumber):'
  );
  let baseId: BaseMoldId;
  if (baseIdInput.trim()) {
    const idResult = CommonConverters.baseMoldId.convert(baseIdInput.trim());
    if (idResult.isFailure()) {
      return fail(`Invalid base ID: ${idResult.message}`);
    }
    baseId = idResult.value;
  } else {
    // Auto-generate from manufacturer + productNumber: lowercase, replace spaces with hyphens, strip non-alphanumeric
    const combined = `${manufacturer.trim()}-${productNumber.trim()}`;
    baseId = combined
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '') as BaseMoldId;
    if (!baseId) {
      return fail('Could not generate a valid base ID from manufacturer and product number');
    }
  }

  const name = await promptInput('Name (shape name):');
  if (!name.trim()) {
    return fail('Name is required');
  }

  const description = await promptInput('Description (optional):');

  // Select format
  const formatResult = await showMenu<MoldFormat>({
    message: 'Select mold format:',
    choices: [
      { value: 'series-1000', name: 'series-1000' },
      { value: 'series-2000', name: 'series-2000' },
      { value: 'other', name: 'other' }
    ],
    showBack: false,
    showExit: false
  });
  if (formatResult.action !== 'value') {
    return fail('Mold format selection cancelled');
  }
  const format = formatResult.value;

  // Select cavities kind
  const cavitiesKindResult = await showMenu<'grid' | 'count'>({
    message: 'Select cavity configuration:',
    choices: [
      { value: 'grid', name: 'Grid (rows × columns)', description: 'Rectangular grid layout' },
      { value: 'count', name: 'Count', description: 'Total number of cavities' }
    ],
    showBack: false,
    showExit: false
  });
  if (cavitiesKindResult.action !== 'value') {
    return fail('Cavity configuration selection cancelled');
  }
  const cavitiesKind = cavitiesKindResult.value;

  let cavities: Entities.Molds.ICavities;
  if (cavitiesKind === 'grid') {
    const columnsInput = await promptInput('Number of columns:');
    const columns = parseInt(columnsInput, 10);
    if (isNaN(columns) || columns <= 0) {
      return fail('Columns must be a positive integer');
    }

    const rowsInput = await promptInput('Number of rows:');
    const rows = parseInt(rowsInput, 10);
    if (isNaN(rows) || rows <= 0) {
      return fail('Rows must be a positive integer');
    }

    cavities = { kind: 'grid', columns, rows };
  } else {
    const countInput = await promptInput('Number of cavities:');
    const count = parseInt(countInput, 10);
    if (isNaN(count) || count <= 0) {
      return fail('Count must be a positive integer');
    }

    cavities = { kind: 'count', count };
  }

  // Optional: add cavity weight
  const addWeight = await confirmAction('Add cavity weight information?', false);
  if (addWeight) {
    const weightInput = await promptInput('Cavity weight (e.g., "10 g"):');
    if (weightInput.trim()) {
      const weightResult = CommonConverters.measurement.convert(parseFloat(weightInput));
      if (weightResult.isFailure()) {
        return fail(`Invalid weight value: ${weightResult.message}`);
      }
      cavities = {
        ...cavities,
        info: {
          weight: weightResult.value
        }
      };
    }
  }

  const entity: Entities.IMoldEntity = {
    baseId,
    manufacturer: manufacturer.trim(),
    productNumber: productNumber.trim(),
    name: name.trim(),
    ...(description.trim() && { description: description.trim() }),
    cavities,
    format
  };

  return validateMold(entity);
}

/**
 * Prompts the user to edit an existing mold entity interactively.
 * Fields are pre-filled with current values.
 * @param existing - The existing mold entity to edit
 * @returns Result containing the updated mold entity
 */
export async function promptEditMold(existing: Entities.IMoldEntity): Promise<Result<Entities.IMoldEntity>> {
  const manufacturer = await promptInput('Manufacturer:', existing.manufacturer);
  if (!manufacturer.trim()) {
    return fail('Manufacturer is required');
  }

  const productNumber = await promptInput('Product number:', existing.productNumber);
  if (!productNumber.trim()) {
    return fail('Product number is required');
  }

  const name = await promptInput('Name (shape name):', existing.name);
  if (!name.trim()) {
    return fail('Name is required');
  }

  const description = await promptInput('Description (optional):', existing.description);

  // Select format
  const formatResult = await showMenu<MoldFormat>({
    message: `Select mold format (current: ${existing.format}):`,
    choices: [
      { value: 'series-1000', name: 'series-1000' },
      { value: 'series-2000', name: 'series-2000' },
      { value: 'other', name: 'other' }
    ],
    showBack: false,
    showExit: false
  });
  if (formatResult.action !== 'value') {
    return fail('Mold format selection cancelled');
  }
  const format = formatResult.value;

  // Determine current cavities display
  const currentCavitiesDesc =
    existing.cavities.kind === 'grid'
      ? `grid (${existing.cavities.columns} × ${existing.cavities.rows})`
      : `count (${existing.cavities.count})`;

  // Select cavities kind
  const cavitiesKindResult = await showMenu<'grid' | 'count'>({
    message: `Select cavity configuration (current: ${currentCavitiesDesc}):`,
    choices: [
      { value: 'grid', name: 'Grid (rows × columns)', description: 'Rectangular grid layout' },
      { value: 'count', name: 'Count', description: 'Total number of cavities' }
    ],
    showBack: false,
    showExit: false
  });
  if (cavitiesKindResult.action !== 'value') {
    return fail('Cavity configuration selection cancelled');
  }
  const cavitiesKind = cavitiesKindResult.value;

  let cavities: Entities.Molds.ICavities;
  if (cavitiesKind === 'grid') {
    const defaultColumns =
      existing.cavities.kind === 'grid' ? existing.cavities.columns.toString() : undefined;
    const columnsInput = await promptInput('Number of columns:', defaultColumns);
    const columns = parseInt(columnsInput, 10);
    if (isNaN(columns) || columns <= 0) {
      return fail('Columns must be a positive integer');
    }

    const defaultRows = existing.cavities.kind === 'grid' ? existing.cavities.rows.toString() : undefined;
    const rowsInput = await promptInput('Number of rows:', defaultRows);
    const rows = parseInt(rowsInput, 10);
    if (isNaN(rows) || rows <= 0) {
      return fail('Rows must be a positive integer');
    }

    cavities = { kind: 'grid', columns, rows };
  } else {
    const defaultCount = existing.cavities.kind === 'count' ? existing.cavities.count.toString() : undefined;
    const countInput = await promptInput('Number of cavities:', defaultCount);
    const count = parseInt(countInput, 10);
    if (isNaN(count) || count <= 0) {
      return fail('Count must be a positive integer');
    }

    cavities = { kind: 'count', count };
  }

  // Preserve existing cavity info if available, or prompt to add
  const hasWeight = existing.cavities.info?.weight !== undefined;
  const editWeight = await confirmAction(
    hasWeight ? 'Edit cavity weight information?' : 'Add cavity weight information?',
    hasWeight
  );

  if (editWeight) {
    const defaultWeight =
      existing.cavities.info?.weight !== undefined ? existing.cavities.info.weight.toString() : undefined;
    const weightInput = await promptInput('Cavity weight (e.g., "10 g"):', defaultWeight);
    if (weightInput.trim()) {
      const weightResult = CommonConverters.measurement.convert(parseFloat(weightInput));
      if (weightResult.isFailure()) {
        return fail(`Invalid weight value: ${weightResult.message}`);
      }
      cavities = {
        ...cavities,
        info: {
          weight: weightResult.value
        }
      };
    }
  } else if (existing.cavities.info) {
    // Preserve existing info if not editing
    cavities = {
      ...cavities,
      info: existing.cavities.info
    };
  }

  let entity: Entities.IMoldEntity = {
    baseId: existing.baseId,
    manufacturer: manufacturer.trim(),
    productNumber: productNumber.trim(),
    name: name.trim(),
    ...(description.trim() && { description: description.trim() }),
    cavities,
    format
  };

  // Preserve tags, related, notes, urls from existing
  if (existing.tags) {
    entity = { ...entity, tags: existing.tags };
  }
  if (existing.related) {
    entity = { ...entity, related: existing.related };
  }
  if (existing.notes) {
    entity = { ...entity, notes: existing.notes };
  }
  if (existing.urls) {
    entity = { ...entity, urls: existing.urls };
  }

  return validateMold(entity);
}

/**
 * Validates a mold entity through the converter.
 */
function validateMold(entity: Entities.IMoldEntity): Result<Entities.IMoldEntity> {
  return Entities.Converters.Molds.moldEntity
    .convert(entity)
    .withErrorFormat((msg) => `Mold validation failed: ${msg}`);
}
