import React, { useMemo } from 'react';
import { ProcessedResources, QualifierControlOptions } from '../../types';

/**
 * Props for the QualifierContextControl component.
 *
 * @public
 */
export interface QualifierContextControlProps {
  /** Name of the qualifier being controlled */
  qualifierName: string;
  /** Current value of the qualifier */
  value: string | undefined;
  /** Callback fired when the qualifier value changes */
  onChange: (qualifierName: string, value: string | undefined) => void;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Placeholder text for empty value */
  placeholder?: string;
  /** Optional processed resources for auto-suggesting values */
  resources?: ProcessedResources | null;
  /** Optional CSS classes to apply to the control */
  className?: string;
  /** Extended options for controlling the qualifier behavior */
  options?: QualifierControlOptions;
}

/**
 * A control component for managing individual qualifier context values.
 *
 * QualifierContextControl provides an interface for setting and modifying qualifier values
 * used in resource resolution context. It can optionally suggest values based on available
 * resources and supports both manual input and selection from predefined options.
 *
 * @example
 * ```tsx
 * import { ResolutionTools } from '@fgv/ts-res-ui-components';
 *
 * function QualifierSettings() {
 *   const [context, setContext] = useState<Record<string, string | undefined>>({
 *     language: 'en-US',
 *     platform: undefined
 *   });
 *
 *   const handleQualifierChange = (name: string, value: string | undefined) => {
 *     setContext(prev => ({ ...prev, [name]: value }));
 *   };
 *
 *   return (
 *     <div>
 *       <ResolutionTools.QualifierContextControl
 *         qualifierName="language"
 *         value={context.language}
 *         onChange={handleQualifierChange}
 *         placeholder="Select language..."
 *       />
 *       <ResolutionTools.QualifierContextControl
 *         qualifierName="platform"
 *         value={context.platform}
 *         onChange={handleQualifierChange}
 *         placeholder="Select platform..."
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using with processed resources for value suggestions
 * import { ResolutionTools, ResourceTools } from '@fgv/ts-res-ui-components';
 *
 * function SmartQualifierControl() {
 *   const { state } = ResourceTools.useResourceData();
 *   const [qualifierValue, setQualifierValue] = useState<string | undefined>();
 *
 *   return (
 *     <ResolutionTools.QualifierContextControl
 *       qualifierName="region"
 *       value={qualifierValue}
 *       onChange={(name, value) => setQualifierValue(value)}
 *       resources={state.resources}
 *       placeholder="Auto-suggested regions..."
 *       className="w-full"
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using with host-managed values and custom options
 * import { ResolutionTools } from '@fgv/ts-res-ui-components';
 *
 * function HostControlledQualifier() {
 *   return (
 *     <ResolutionTools.QualifierContextControl
 *       qualifierName="platform"
 *       value={undefined} // Ignored when hostValue is set
 *       onChange={() => {}} // Called only when editable
 *       options={{
 *         editable: false,
 *         hostValue: 'web',
 *         showHostValue: true,
 *         placeholder: 'Platform controlled by application',
 *         className: 'border-blue-300'
 *       }}
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using for selective visibility and editability
 * function ConditionalQualifierControls() {
 *   const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
 *
 *   return (
 *     <div>
 *       <ResolutionTools.QualifierContextControl
 *         qualifierName="environment"
 *         value={envValue}
 *         onChange={handleEnvChange}
 *         options={{
 *           visible: userRole === 'admin', // Only visible to admins
 *           editable: true,
 *           placeholder: 'Select environment...'
 *         }}
 *       />
 *       <ResolutionTools.QualifierContextControl
 *         qualifierName="language"
 *         value={langValue}
 *         onChange={handleLangChange}
 *         options={{
 *           visible: true,
 *           editable: userRole === 'admin', // Only editable by admins
 *           placeholder: userRole === 'admin' ? 'Select language...' : 'Language locked'
 *         }}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @public
 */
export const QualifierContextControl: React.FC<QualifierContextControlProps> = ({
  qualifierName,
  value,
  onChange,
  disabled = false,
  placeholder,
  resources,
  className = '',
  options
}) => {
  // Extract qualifier type information from system configuration
  const qualifierInfo = useMemo(() => {
    if (!resources?.system?.qualifiers) {
      return { hasEnumeratedValues: false, enumeratedValues: [] };
    }

    try {
      // Get qualifier declaration
      const qualifierResult = resources.system.qualifiers.validating.get(qualifierName);

      if (!qualifierResult.isSuccess()) {
        return { hasEnumeratedValues: false, enumeratedValues: [] };
      }

      const qualifier = qualifierResult.value;

      // Access the instantiated qualifier type
      if (qualifier.type) {
        const qualifierType = qualifier.type;
        // Use type assertion to access properties that may exist on specific subtypes
        const qtAny = qualifierType as unknown as Record<string, unknown>;
        const config = (qtAny.configuration || {}) as Record<string, unknown>;

        // Look for enumerated values in different possible locations
        const enumeratedValues =
          config.enumeratedValues ||
          config.allowedTerritories ||
          qtAny.enumeratedValues ||
          qtAny.allowedTerritories ||
          [];

        if (enumeratedValues && Array.isArray(enumeratedValues) && enumeratedValues.length > 0) {
          return {
            hasEnumeratedValues: true,
            enumeratedValues: enumeratedValues as string[],
            systemType: (qtAny.systemType as string) || 'literal',
            caseSensitive: config.caseSensitive !== false
          };
        }
      }

      return { hasEnumeratedValues: false, enumeratedValues: [] };
    } catch (error) {
      console.warn(`Failed to extract qualifier type info for ${qualifierName}:`, error);
      return { hasEnumeratedValues: false, enumeratedValues: [] };
    }
  }, [qualifierName, resources?.system?.qualifiers]);

  // Apply options with defaults
  const isVisible = options?.visible ?? true;
  const isEditable = options?.editable ?? true;
  const hostValue = options?.hostValue;
  const showHostValue = options?.showHostValue ?? true;
  const customPlaceholder = options?.placeholder;
  const customClassName = options?.className || '';

  // Determine effective values
  const isEffectivelyDisabled = disabled || !isEditable;
  const effectiveValue = hostValue !== undefined ? hostValue ?? '' : value ?? '';
  const isHostManaged = hostValue !== undefined;

  // Determine placeholder text
  const effectivePlaceholder = customPlaceholder || placeholder || `Enter ${qualifierName} value`;

  const handleChange = (newValue: string) => {
    // Only allow changes if not host-managed and editable
    if (!isHostManaged && isEditable) {
      onChange(qualifierName, newValue || undefined);
    }
  };

  const handleClear = () => {
    // Only allow clearing if not host-managed and editable
    if (!isHostManaged && isEditable) {
      onChange(qualifierName, undefined);
    }
  };

  const hasEnumeratedValues = qualifierInfo.hasEnumeratedValues && qualifierInfo.enumeratedValues.length > 0;

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`bg-white rounded border border-gray-200 p-2 ${className} ${customClassName}`}>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0 flex items-center gap-1">
          {qualifierName}:
          {isHostManaged && showHostValue && (
            <span
              className="text-[10px] px-1 py-0.5 rounded bg-blue-100 text-blue-700"
              title="Host-managed value"
            >
              HOST
            </span>
          )}
          {!isHostManaged && !isEditable && (
            <span
              className="text-[10px] px-1 py-0.5 rounded bg-gray-200 text-gray-700"
              title="Locked by host or configuration"
            >
              LOCKED
            </span>
          )}
        </label>
        <div className="flex-1 flex items-center gap-1">
          {hasEnumeratedValues ? (
            // Dropdown for enumerated values
            <select
              value={effectiveValue}
              onChange={(e) => handleChange(e.target.value)}
              disabled={isEffectivelyDisabled}
              title={isHostManaged ? 'Host-managed value - controlled externally' : undefined}
              className={`flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm min-w-0 ${
                isEffectivelyDisabled ? 'bg-gray-100 text-gray-400' : ''
              } ${isHostManaged ? 'border-blue-300 bg-blue-50' : ''}`}
            >
              <option value="">
                {isHostManaged
                  ? effectiveValue !== ''
                    ? effectiveValue
                    : '(undefined)'
                  : isEffectivelyDisabled
                  ? 'Disabled'
                  : effectiveValue === ''
                  ? '(undefined)'
                  : effectivePlaceholder}
              </option>
              {qualifierInfo.enumeratedValues.map((enumValue: string) => (
                <option key={enumValue} value={enumValue}>
                  {enumValue}
                </option>
              ))}
            </select>
          ) : (
            // Text input for non-enumerated values
            <input
              type="text"
              value={effectiveValue}
              onChange={(e) => handleChange(e.target.value)}
              disabled={isEffectivelyDisabled}
              title={isHostManaged ? 'Host-managed value - controlled externally' : undefined}
              className={`flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm min-w-0 ${
                isEffectivelyDisabled ? 'bg-gray-100 text-gray-400' : ''
              } ${isHostManaged ? 'border-blue-300 bg-blue-50' : ''}`}
              placeholder={
                isHostManaged && effectiveValue === ''
                  ? '(undefined)'
                  : isEffectivelyDisabled
                  ? 'Disabled'
                  : effectiveValue === ''
                  ? '(undefined)'
                  : effectivePlaceholder
              }
            />
          )}
          {!isEffectivelyDisabled && !isHostManaged && effectiveValue !== '' && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Set to undefined"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      {/* Show enumerated values indicator */}
      {hasEnumeratedValues && (
        <div className="mt-1 text-xs text-blue-600">
          {qualifierInfo.enumeratedValues.length} predefined values
        </div>
      )}
    </div>
  );
};

export default QualifierContextControl;
