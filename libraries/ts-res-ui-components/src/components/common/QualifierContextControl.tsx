import React, { useMemo } from 'react';
import { ProcessedResources } from '../../types';

export interface QualifierContextControlProps {
  qualifierName: string;
  value: string | undefined;
  onChange: (qualifierName: string, value: string | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  resources?: ProcessedResources | null;
  className?: string;
}

/** @public */
export const QualifierContextControl: React.FC<QualifierContextControlProps> = ({
  qualifierName,
  value,
  onChange,
  disabled = false,
  placeholder,
  resources,
  className = ''
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

  const handleChange = (newValue: string) => {
    onChange(qualifierName, newValue || undefined);
  };

  const handleClear = () => {
    onChange(qualifierName, undefined);
  };

  const effectiveValue = value ?? '';
  const hasEnumeratedValues = qualifierInfo.hasEnumeratedValues && qualifierInfo.enumeratedValues.length > 0;

  return (
    <div className={`bg-white rounded border border-gray-200 p-2 ${className}`}>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">{qualifierName}:</label>
        <div className="flex-1 flex items-center gap-1">
          {hasEnumeratedValues ? (
            // Dropdown for enumerated values
            <select
              value={effectiveValue}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              className={`flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm min-w-0 ${
                disabled ? 'bg-gray-100 text-gray-400' : ''
              }`}
            >
              <option value="">
                {disabled
                  ? 'Disabled'
                  : value === undefined
                  ? '(undefined)'
                  : placeholder || 'Select value...'}
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
              disabled={disabled}
              className={`flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm min-w-0 ${
                disabled ? 'bg-gray-100 text-gray-400' : ''
              }`}
              placeholder={
                disabled
                  ? 'Disabled'
                  : value === undefined
                  ? '(undefined)'
                  : placeholder || `Enter ${qualifierName} value`
              }
            />
          )}
          {!disabled && value !== undefined && (
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
