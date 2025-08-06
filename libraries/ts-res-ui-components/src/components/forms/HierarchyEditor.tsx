import React, { useState } from 'react';

export interface HierarchyEditorProps {
  hierarchy: Record<string, string>;
  onChange: (hierarchy: Record<string, string>) => void;
  availableValues: string[];
  className?: string;
}

export const HierarchyEditor: React.FC<HierarchyEditorProps> = ({
  hierarchy,
  onChange,
  availableValues,
  className = ''
}) => {
  const [newChild, setNewChild] = useState('');
  const [newParent, setNewParent] = useState('');

  // Ensure hierarchy is a valid object with string values
  const safeHierarchy = React.useMemo(() => {
    if (!hierarchy || typeof hierarchy !== 'object') {
      return {};
    }
    // Filter out any non-string values
    const safe: Record<string, string> = {};
    for (const [key, value] of Object.entries(hierarchy)) {
      if (typeof value === 'string') {
        safe[key] = value;
      }
    }
    return safe;
  }, [hierarchy]);

  const handleAddRelationship = () => {
    if (newChild && newParent && newChild !== newParent) {
      const updatedHierarchy = { ...safeHierarchy, [newChild]: newParent };
      onChange(updatedHierarchy);
      setNewChild('');
      setNewParent('');
    }
  };

  const handleRemoveRelationship = (child: string) => {
    const updatedHierarchy = { ...safeHierarchy };
    delete updatedHierarchy[child];
    onChange(updatedHierarchy);
  };

  const getHierarchyTree = () => {
    const roots = new Set(availableValues);
    const children = new Set(Object.keys(safeHierarchy));
    const parents = new Set(Object.values(safeHierarchy));

    // Remove children from roots (they have parents)
    children.forEach((child) => roots.delete(child));

    // Add parents that aren't in available values (for display purposes)
    parents.forEach((parent) => {
      if (!availableValues.includes(parent)) {
        roots.add(parent);
      }
    });

    const buildTree = (value: string, level = 0): any => {
      const childrenOfValue = Object.entries(safeHierarchy).filter(([, parent]) => parent === value);
      return {
        value,
        level,
        children: childrenOfValue.map(([child]) => buildTree(child, level + 1))
      };
    };

    return Array.from(roots).map((root) => buildTree(root));
  };

  const renderTree = (nodes: any[]): React.ReactNode => {
    return nodes.map((node) => {
      const parentValue = safeHierarchy[node.value];

      return (
        <div key={node.value} className="ml-4">
          <div className="flex items-center space-x-2 py-1">
            <span className="text-sm text-gray-700" style={{ marginLeft: `${node.level * 20}px` }}>
              {node.level > 0 && '└─ '}
              {node.value}
            </span>
            {parentValue && <span className="text-xs text-gray-500">→ {parentValue}</span>}
          </div>
          {node.children.length > 0 && renderTree(node.children)}
        </div>
      );
    });
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">Value Hierarchy</label>
      <div className="border border-gray-300 rounded-md p-3 bg-white">
        {/* Add new relationship form */}
        <div className="mb-4 p-3 bg-gray-50 rounded border">
          <div className="text-sm font-medium text-gray-700 mb-2">Add Parent-Child Relationship</div>
          <div className="grid grid-cols-3 gap-2 items-end">
            <div>
              <label className="block text-xs text-gray-600">Child Value</label>
              {availableValues.length > 0 ? (
                <select
                  value={newChild}
                  onChange={(e) => setNewChild(e.target.value)}
                  className="w-full text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select child...</option>
                  {availableValues.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={newChild}
                  onChange={(e) => setNewChild(e.target.value)}
                  placeholder="Enter child value"
                  className="w-full text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-600">Parent Value</label>
              <input
                type="text"
                value={newParent}
                onChange={(e) => setNewParent(e.target.value)}
                placeholder="Enter parent value"
                className="w-full text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <button
                onClick={handleAddRelationship}
                disabled={!newChild || !newParent || newChild === newParent}
                className="w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {availableValues.length > 0
              ? "Define which values are children of other values. The parent doesn't need to be in the enumerated values list."
              : 'Define which values are children of other values. Enter any valid values for this qualifier type.'}
          </div>
        </div>

        {/* Current relationships */}
        {Object.keys(safeHierarchy).length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Current Relationships ({Object.keys(safeHierarchy).length})
            </div>
            <div className="max-h-24 overflow-y-auto border border-gray-200 rounded bg-white p-2">
              <div className="space-y-1">
                {Object.entries(safeHierarchy).map(([child, parent]) => (
                  <div key={child} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                    <span className="text-sm">
                      <span className="font-medium">{child}</span> →{' '}
                      <span className="text-gray-600">{parent}</span>
                    </span>
                    <button
                      onClick={() => handleRemoveRelationship(child)}
                      className="text-red-600 hover:text-red-800 text-xs ml-2 flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hierarchy visualization */}
        {(availableValues.length > 0 || Object.keys(safeHierarchy).length > 0) && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Hierarchy Tree</div>
            <div className="bg-gray-50 border rounded max-h-32 overflow-y-auto">
              <div className="p-2 text-sm font-mono">
                {getHierarchyTree().length > 0 ? (
                  renderTree(getHierarchyTree())
                ) : (
                  <div className="text-gray-500 text-center py-2">
                    No hierarchy defined. Add relationships above to see the tree structure.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HierarchyEditor;
