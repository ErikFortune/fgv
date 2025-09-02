'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.HierarchyEditor = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
/**
 * Interactive editor for defining hierarchical relationships between qualifier values.
 *
 * The HierarchyEditor allows users to define parent-child relationships between qualifier values,
 * enabling hierarchical resolution in the ts-res system. It provides an intuitive interface for
 * creating, viewing, and managing value hierarchies with visual tree representation.
 *
 * @example
 * ```tsx
 * import { ConfigurationTools } from '@fgv/ts-res-ui-components';
 *
 * // Basic hierarchy editing for region qualifiers
 * const [regionHierarchy, setRegionHierarchy] = useState({
 *   'quebec': 'canada',
 *   'ontario': 'canada',
 *   'california': 'usa',
 *   'texas': 'usa'
 * });
 *
 * <ConfigurationTools.HierarchyEditor
 *   hierarchy={regionHierarchy}
 *   onChange={setRegionHierarchy}
 *   availableValues={['quebec', 'ontario', 'california', 'texas']}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Hierarchy editing for language qualifiers with dynamic values
 * const [languageHierarchy, setLanguageHierarchy] = useState({
 *   'en-CA': 'en',
 *   'en-US': 'en',
 *   'fr-CA': 'fr',
 *   'fr-FR': 'fr'
 * });
 *
 * <ConfigurationTools.HierarchyEditor
 *   hierarchy={languageHierarchy}
 *   onChange={setLanguageHierarchy}
 *   availableValues={[]} // Allow free-form input
 *   className="my-hierarchy-editor"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Integration with qualifier type configuration
 * const QualifierTypeEditor = ({ qualifierType, onSave }) => {
 *   const [hierarchy, setHierarchy] = useState(qualifierType.hierarchy || {});
 *
 *   const handleSave = () => {
 *     onSave({
 *       ...qualifierType,
 *       hierarchy: Object.keys(hierarchy).length > 0 ? hierarchy : undefined
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <ConfigurationTools.HierarchyEditor
 *         hierarchy={hierarchy}
 *         onChange={setHierarchy}
 *         availableValues={qualifierType.enumeratedValues || []}
 *       />
 *       <button onClick={handleSave}>Save Qualifier Type</button>
 *     </div>
 *   );
 * };
 * ```
 *
 * @public
 */
const HierarchyEditor = ({ hierarchy, onChange, availableValues, className = '' }) => {
  const [newChild, setNewChild] = (0, react_1.useState)('');
  const [newParent, setNewParent] = (0, react_1.useState)('');
  // Ensure hierarchy is a valid object with string values
  const safeHierarchy = react_1.default.useMemo(() => {
    if (!hierarchy || typeof hierarchy !== 'object') {
      return {};
    }
    // Filter out any non-string values
    const safe = {};
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
  const handleRemoveRelationship = (child) => {
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
    const buildTree = (value, level = 0) => {
      const childrenOfValue = Object.entries(safeHierarchy).filter(([, parent]) => parent === value);
      return {
        value,
        level,
        children: childrenOfValue.map(([child]) => buildTree(child, level + 1))
      };
    };
    return Array.from(roots).map((root) => buildTree(root));
  };
  const renderTree = (nodes) => {
    return nodes.map((node) => {
      const parentValue = safeHierarchy[node.value];
      return react_1.default.createElement(
        'div',
        { key: node.value, className: 'ml-4' },
        react_1.default.createElement(
          'div',
          { className: 'flex items-center space-x-2 py-1' },
          react_1.default.createElement(
            'span',
            { className: 'text-sm text-gray-700', style: { marginLeft: `${node.level * 20}px` } },
            node.level > 0 && '└─ ',
            node.value
          ),
          parentValue &&
            react_1.default.createElement(
              'span',
              { className: 'text-xs text-gray-500' },
              '\u2192 ',
              parentValue
            )
        ),
        node.children.length > 0 && renderTree(node.children)
      );
    });
  };
  return react_1.default.createElement(
    'div',
    { className: className },
    react_1.default.createElement(
      'label',
      { className: 'block text-sm font-medium text-gray-700 mb-2' },
      'Value Hierarchy'
    ),
    react_1.default.createElement(
      'div',
      { className: 'border border-gray-300 rounded-md p-3 bg-white' },
      react_1.default.createElement(
        'div',
        { className: 'mb-4 p-3 bg-gray-50 rounded border' },
        react_1.default.createElement(
          'div',
          { className: 'text-sm font-medium text-gray-700 mb-2' },
          'Add Parent-Child Relationship'
        ),
        react_1.default.createElement(
          'div',
          { className: 'grid grid-cols-3 gap-2 items-end' },
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement(
              'label',
              { className: 'block text-xs text-gray-600' },
              'Child Value'
            ),
            availableValues.length > 0
              ? react_1.default.createElement(
                  'select',
                  {
                    value: newChild,
                    onChange: (e) => setNewChild(e.target.value),
                    className:
                      'w-full text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  },
                  react_1.default.createElement('option', { value: '' }, 'Select child...'),
                  availableValues.map((value) =>
                    react_1.default.createElement('option', { key: value, value: value }, value)
                  )
                )
              : react_1.default.createElement('input', {
                  type: 'text',
                  value: newChild,
                  onChange: (e) => setNewChild(e.target.value),
                  placeholder: 'Enter child value',
                  className:
                    'w-full text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                })
          ),
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement(
              'label',
              { className: 'block text-xs text-gray-600' },
              'Parent Value'
            ),
            react_1.default.createElement('input', {
              type: 'text',
              value: newParent,
              onChange: (e) => setNewParent(e.target.value),
              placeholder: 'Enter parent value',
              className: 'w-full text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            })
          ),
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement(
              'button',
              {
                onClick: handleAddRelationship,
                disabled: !newChild || !newParent || newChild === newParent,
                className:
                  'w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
              },
              'Add'
            )
          )
        ),
        react_1.default.createElement(
          'div',
          { className: 'text-xs text-gray-500 mt-1' },
          availableValues.length > 0
            ? "Define which values are children of other values. The parent doesn't need to be in the enumerated values list."
            : 'Define which values are children of other values. Enter any valid values for this qualifier type.'
        )
      ),
      Object.keys(safeHierarchy).length > 0 &&
        react_1.default.createElement(
          'div',
          { className: 'mb-4' },
          react_1.default.createElement(
            'div',
            { className: 'text-sm font-medium text-gray-700 mb-2' },
            'Current Relationships (',
            Object.keys(safeHierarchy).length,
            ')'
          ),
          react_1.default.createElement(
            'div',
            { className: 'max-h-24 overflow-y-auto border border-gray-200 rounded bg-white p-2' },
            react_1.default.createElement(
              'div',
              { className: 'space-y-1' },
              Object.entries(safeHierarchy).map(([child, parent]) =>
                react_1.default.createElement(
                  'div',
                  { key: child, className: 'flex items-center justify-between bg-gray-50 px-2 py-1 rounded' },
                  react_1.default.createElement(
                    'span',
                    { className: 'text-sm' },
                    react_1.default.createElement('span', { className: 'font-medium' }, child),
                    ' \u2192',
                    ' ',
                    react_1.default.createElement('span', { className: 'text-gray-600' }, parent)
                  ),
                  react_1.default.createElement(
                    'button',
                    {
                      onClick: () => handleRemoveRelationship(child),
                      className: 'text-red-600 hover:text-red-800 text-xs ml-2 flex-shrink-0'
                    },
                    'Remove'
                  )
                )
              )
            )
          )
        ),
      (availableValues.length > 0 || Object.keys(safeHierarchy).length > 0) &&
        react_1.default.createElement(
          'div',
          null,
          react_1.default.createElement(
            'div',
            { className: 'text-sm font-medium text-gray-700 mb-2' },
            'Hierarchy Tree'
          ),
          react_1.default.createElement(
            'div',
            { className: 'bg-gray-50 border rounded max-h-32 overflow-y-auto' },
            react_1.default.createElement(
              'div',
              { className: 'p-2 text-sm font-mono' },
              getHierarchyTree().length > 0
                ? renderTree(getHierarchyTree())
                : react_1.default.createElement(
                    'div',
                    { className: 'text-gray-500 text-center py-2' },
                    'No hierarchy defined. Add relationships above to see the tree structure.'
                  )
            )
          )
        )
    )
  );
};
exports.HierarchyEditor = HierarchyEditor;
exports.default = exports.HierarchyEditor;
//# sourceMappingURL=HierarchyEditor.js.map
