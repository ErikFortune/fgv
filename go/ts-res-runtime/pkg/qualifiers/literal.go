package qualifiers

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/types"
)

// LiteralQualifierType implements literal value matching
// This mirrors the TypeScript LiteralQualifierType class
type LiteralQualifierType struct {
	*types.BaseQualifierType
	caseSensitive      bool
	enumeratedValues   []string
	hierarchy          *LiteralValueHierarchy
}

// LiteralQualifierTypeConfig holds configuration for creating a LiteralQualifierType
type LiteralQualifierTypeConfig struct {
	Name               string
	AllowContextList   bool
	CaseSensitive      bool
	EnumeratedValues   []string
	Hierarchy          LiteralValueHierarchyDecl
	Index              *int
}

// identifierPattern matches valid identifier strings (letters, numbers, underscore, hyphen)
var identifierPattern = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_-]*$`)

// NewLiteralQualifierType creates a new LiteralQualifierType with default settings
func NewLiteralQualifierType() *LiteralQualifierType {
	return &LiteralQualifierType{
		BaseQualifierType: types.NewBaseQualifierType("literal", true),
		caseSensitive:     false,
		enumeratedValues:  nil,
		hierarchy:         nil,
	}
}

// NewLiteralQualifierTypeWithConfig creates a new LiteralQualifierType with the specified configuration
func NewLiteralQualifierTypeWithConfig(config LiteralQualifierTypeConfig) *LiteralQualifierType {
	name := config.Name
	if name == "" {
		name = "literal"
	}
	
	qt := &LiteralQualifierType{
		BaseQualifierType: types.NewBaseQualifierType(name, config.AllowContextList),
		caseSensitive:     config.CaseSensitive,
		enumeratedValues:  config.EnumeratedValues,
		hierarchy:         nil,
	}
	
	// Create hierarchy if provided
	if config.Hierarchy != nil && len(config.Hierarchy) > 0 {
		hierarchyConfig := LiteralValueHierarchyConfig{
			Values:    config.EnumeratedValues,
			Hierarchy: config.Hierarchy,
		}
		hierarchy, err := NewLiteralValueHierarchy(hierarchyConfig)
		if err != nil {
			// For now, ignore hierarchy errors and fall back to non-hierarchical matching
			// In a production system, you might want to return the error
		} else {
			qt.hierarchy = hierarchy
		}
	}
	
	if config.Index != nil {
		qt.SetIndex(*config.Index)
	}
	
	return qt
}

// IsValidConditionValue validates a condition value for literal qualifier type
// Mirrors TypeScript LiteralQualifierType.isValidConditionValue
func (lqt *LiteralQualifierType) IsValidConditionValue(value string) bool {
	// If we have enumerated values, check against those
	if lqt.enumeratedValues != nil {
		if lqt.caseSensitive {
			for _, enumValue := range lqt.enumeratedValues {
				if enumValue == value {
					return true
				}
			}
			return false
		} else {
			lowerValue := strings.ToLower(value)
			for _, enumValue := range lqt.enumeratedValues {
				if strings.ToLower(enumValue) == lowerValue {
					return true
				}
			}
			return false
		}
	}
	
	// Otherwise, validate as an identifier
	return isValidLiteralIdentifier(value)
}

// IsValidContextValue validates a context value for literal qualifier type
func (lqt *LiteralQualifierType) IsValidContextValue(value string) bool {
	// Context values can be comma-separated lists if allowContextList is true
	if lqt.AllowContextList() && strings.Contains(value, ",") {
		// Split by comma and validate each part
		parts := strings.Split(value, ",")
		for _, part := range parts {
			trimmed := strings.TrimSpace(part)
			if trimmed == "" || !lqt.IsValidConditionValue(trimmed) {
				return false
			}
		}
		return true
	}
	
	// Single value - use the same validation as condition values
	return lqt.IsValidConditionValue(value)
}

// IsPotentialMatch determines if a condition value could potentially match a context value
// Mirrors TypeScript LiteralQualifierType.isPotentialMatch
func (lqt *LiteralQualifierType) IsPotentialMatch(conditionValue, contextValue string) bool {
	if !lqt.IsValidConditionValue(conditionValue) || !lqt.IsValidContextValue(contextValue) {
		return false
	}
	
	// Check direct match first
	score := lqt.matchOne(types.QualifierConditionValue(conditionValue), types.QualifierContextValue(contextValue), types.ConditionOperatorMatches)
	if score != types.NoMatch {
		return true
	}
	
	// Check against context lists if allowed
	if lqt.AllowContextList() && strings.Contains(contextValue, ",") {
		score := lqt.matchAgainstList(types.QualifierConditionValue(conditionValue), types.QualifierContextValue(contextValue))
		if score != types.NoMatch {
			return true
		}
	}
	
	// Check hierarchy if available
	if lqt.hierarchy != nil {
		return lqt.hierarchy.IsAncestor(conditionValue, contextValue)
	}
	
	return false
}

// ValidateCondition validates that a value and operator are valid for use in a condition
func (lqt *LiteralQualifierType) ValidateCondition(value string, operator types.ConditionOperator) (types.QualifierConditionValue, error) {
	// Use base implementation for operator validation
	baseResult, err := lqt.BaseQualifierType.ValidateCondition(value, operator)
	if err != nil {
		return "", err
	}
	
	// For 'matches' operator, validate the condition value
	if operator == types.ConditionOperatorMatches {
		if !lqt.IsValidConditionValue(value) {
			return "", fmt.Errorf("invalid condition value '%s' for literal qualifier type", value)
		}
	}
	
	return baseResult, nil
}

// ValidateContextValue validates that a value is valid for use in a runtime context
func (lqt *LiteralQualifierType) ValidateContextValue(value string) (types.QualifierContextValue, error) {
	if !lqt.IsValidContextValue(value) {
		return "", fmt.Errorf("invalid context value '%s' for literal qualifier type", value)
	}
	return types.QualifierContextValue(value), nil
}

// Matches determines the extent to which a condition matches a context value
// Mirrors TypeScript LiteralQualifierType.matches
func (lqt *LiteralQualifierType) Matches(condition types.QualifierConditionValue, context types.QualifierContextValue, operator types.ConditionOperator) types.QualifierMatchScore {
	// Handle special operators
	switch operator {
	case types.ConditionOperatorAlways:
		return types.PerfectMatch
	case types.ConditionOperatorNever:
		return types.NoMatch
	case types.ConditionOperatorMatches:
		// Handle context lists if allowed
		if lqt.AllowContextList() && strings.Contains(string(context), ",") {
			return lqt.matchAgainstList(condition, context)
		}
		return lqt.matchOne(condition, context, operator)
	default:
		return types.NoMatch
	}
}

// matchOne performs matching against a single context value
// Mirrors TypeScript LiteralQualifierType._matchOne
func (lqt *LiteralQualifierType) matchOne(condition types.QualifierConditionValue, context types.QualifierContextValue, operator types.ConditionOperator) types.QualifierMatchScore {
	// Use hierarchy matching if available
	if lqt.hierarchy != nil {
		return lqt.hierarchy.Match(string(condition), string(context), operator)
	}
	
	// Direct comparison fallback
	if lqt.caseSensitive {
		if string(condition) == string(context) {
			return types.PerfectMatch
		}
	} else {
		if strings.ToLower(string(condition)) == strings.ToLower(string(context)) {
			return types.PerfectMatch
		}
	}
	
	return types.NoMatch
}

// matchAgainstList performs matching against a comma-separated list of context values
func (lqt *LiteralQualifierType) matchAgainstList(condition types.QualifierConditionValue, context types.QualifierContextValue) types.QualifierMatchScore {
	parts := strings.Split(string(context), ",")
	var bestScore types.QualifierMatchScore = types.NoMatch
	
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		score := lqt.matchOne(condition, types.QualifierContextValue(trimmed), types.ConditionOperatorMatches)
		if score > bestScore {
			bestScore = score
		}
		// Short circuit on perfect match
		if bestScore == types.PerfectMatch {
			break
		}
	}
	
	return bestScore
}

// isValidLiteralIdentifier validates that a string is a valid identifier
// Mirrors TypeScript LiteralQualifierType.isValidLiteralConditionValue
func isValidLiteralIdentifier(value string) bool {
	return identifierPattern.MatchString(value)
}

// GetCaseSensitive returns whether this qualifier type is case sensitive
func (lqt *LiteralQualifierType) GetCaseSensitive() bool {
	return lqt.caseSensitive
}

// GetEnumeratedValues returns the enumerated values constraint, if any
func (lqt *LiteralQualifierType) GetEnumeratedValues() []string {
	if lqt.enumeratedValues == nil {
		return nil
	}
	// Return a copy to prevent external modification
	result := make([]string, len(lqt.enumeratedValues))
	copy(result, lqt.enumeratedValues)
	return result
}

// GetHierarchy returns the hierarchy, if any
func (lqt *LiteralQualifierType) GetHierarchy() *LiteralValueHierarchy {
	return lqt.hierarchy
}