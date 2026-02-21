import React from 'react';

import { useWorkspace } from '../../workspace';

export interface ILibrarySectionProps {}

interface ISubLibraryRow {
  readonly label: string;
  readonly collectionCount: number;
  readonly itemCount: number;
}

export function LibrarySection(__props: ILibrarySectionProps): React.ReactElement {
  const workspace = useWorkspace();
  const entities = workspace.data.entities;

  const subLibraries: ISubLibraryRow[] = [
    {
      label: 'Ingredients',
      collectionCount: entities.ingredients.collectionCount,
      itemCount: entities.ingredients.size
    },
    {
      label: 'Fillings',
      collectionCount: entities.fillings.collectionCount,
      itemCount: entities.fillings.size
    },
    {
      label: 'Confections',
      collectionCount: entities.confections.collectionCount,
      itemCount: entities.confections.size
    },
    {
      label: 'Decorations',
      collectionCount: entities.decorations.collectionCount,
      itemCount: entities.decorations.size
    },
    { label: 'Molds', collectionCount: entities.molds.collectionCount, itemCount: entities.molds.size },
    {
      label: 'Procedures',
      collectionCount: entities.procedures.collectionCount,
      itemCount: entities.procedures.size
    },
    { label: 'Tasks', collectionCount: entities.tasks.collectionCount, itemCount: entities.tasks.size }
  ];

  const totalCollections = subLibraries.reduce((sum, s) => sum + s.collectionCount, 0);
  const totalItems = subLibraries.reduce((sum, s) => sum + s.itemCount, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Libraries</h2>
        <p className="text-xs text-gray-400 mb-4">
          Sub-libraries loaded in this session — {totalCollections} collection
          {totalCollections !== 1 ? 's' : ''}, {totalItems} item{totalItems !== 1 ? 's' : ''} total.
        </p>

        <table className="w-full text-sm text-gray-700">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-200">
              <th className="text-left font-medium pb-2">Sub-library</th>
              <th className="text-right font-medium pb-2">Collections</th>
              <th className="text-right font-medium pb-2">Items</th>
            </tr>
          </thead>
          <tbody>
            {subLibraries.map((row) => (
              <tr key={row.label} className="border-b border-gray-50 last:border-0">
                <td className="py-2 font-medium">{row.label}</td>
                <td className="py-2 text-right tabular-nums">
                  {row.collectionCount === 0 ? <span className="text-gray-300">—</span> : row.collectionCount}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {row.itemCount === 0 ? <span className="text-gray-300">—</span> : row.itemCount}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 text-xs text-gray-500 font-medium">
              <td className="pt-2">Total</td>
              <td className="pt-2 text-right tabular-nums">{totalCollections}</td>
              <td className="pt-2 text-right tabular-nums">{totalItems}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
