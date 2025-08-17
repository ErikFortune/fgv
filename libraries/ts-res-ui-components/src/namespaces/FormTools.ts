/**
 * Tools and components for configuration form editing and management.
 *
 * This namespace contains form components for editing system configuration elements
 * including qualifier types, qualifiers, resource types, and hierarchical data structures.
 * These components are primarily used for administrative interfaces and configuration management.
 *
 * @example
 * ```tsx
 * import { FormTools } from '@fgv/ts-res-ui-components';
 *
 * // Use form components for configuration editing
 * function ConfigurationEditor() {
 *   const [qualifierType, setQualifierType] = useState(null);
 *   const [showEditor, setShowEditor] = useState(false);
 *
 *   const handleSaveQualifierType = (qt: QualifierTypes.Config.ISystemQualifierTypeConfig) => {
 *     // Save the qualifier type
 *     updateConfiguration(qt);
 *     setShowEditor(false);
 *   };
 *
 *   return (
 *     <div>
 *       {showEditor && (
 *         <FormTools.QualifierTypeEditForm
 *           qualifierType={qualifierType}
 *           onSave={handleSaveQualifierType}
 *           onCancel={() => setShowEditor(false)}
 *           existingNames={existingQualifierTypeNames}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using multiple form components together
 * import { FormTools } from '@fgv/ts-res-ui-components';
 *
 * function SystemConfigurationPanel() {
 *   const [activeForm, setActiveForm] = useState<'qualifierTypes' | 'qualifiers' | 'resourceTypes' | null>(null);
 *
 *   return (
 *     <div className="configuration-panel">
 *       <div className="form-tabs">
 *         <button onClick={() => setActiveForm('qualifierTypes')}>Qualifier Types</button>
 *         <button onClick={() => setActiveForm('qualifiers')}>Qualifiers</button>
 *         <button onClick={() => setActiveForm('resourceTypes')}>Resource Types</button>
 *       </div>
 *
 *       {activeForm === 'qualifierTypes' && (
 *         <FormTools.QualifierTypeEditForm
 *           onSave={handleSaveQualifierType}
 *           onCancel={() => setActiveForm(null)}
 *         />
 *       )}
 *
 *       {activeForm === 'qualifiers' && (
 *         <FormTools.QualifierEditForm
 *           onSave={handleSaveQualifier}
 *           onCancel={() => setActiveForm(null)}
 *         />
 *       )}
 *
 *       {activeForm === 'resourceTypes' && (
 *         <FormTools.ResourceTypeEditForm
 *           onSave={handleSaveResourceType}
 *           onCancel={() => setActiveForm(null)}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using HierarchyEditor for custom hierarchical data
 * import { FormTools } from '@fgv/ts-res-ui-components';
 *
 * function CustomHierarchyEditor() {
 *   const [hierarchyData, setHierarchyData] = useState([]);
 *
 *   return (
 *     <FormTools.HierarchyEditor
 *       items={hierarchyData}
 *       onItemsChange={setHierarchyData}
 *       placeholder="Add hierarchy item..."
 *       className="custom-hierarchy-editor"
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */

// Export form components for configuration management
export { QualifierTypeEditForm } from '../components/forms/QualifierTypeEditForm';
export { QualifierEditForm } from '../components/forms/QualifierEditForm';
export { ResourceTypeEditForm } from '../components/forms/ResourceTypeEditForm';
export { HierarchyEditor } from '../components/forms/HierarchyEditor';
