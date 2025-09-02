package qualifiers

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/types"
)

// territoryCodePattern matches valid ISO-3166-2 Alpha-2 territory codes (2 letters)
var territoryCodePattern = regexp.MustCompile(`^[a-zA-Z]{2}$`)

// TerritoryQualifierType implements territory value matching with ISO-3166-2 Alpha-2 codes
// This mirrors the TypeScript TerritoryQualifierType class
type TerritoryQualifierType struct {
	*types.BaseQualifierType
	allowedTerritories []string // normalized to uppercase
	acceptLowercase    bool
	hierarchy          *LiteralValueHierarchy
}

// TerritoryQualifierTypeConfig holds configuration for creating a TerritoryQualifierType
type TerritoryQualifierTypeConfig struct {
	Name               string
	AllowContextList   bool
	AllowedTerritories []string                  // enumerated allowed territories
	AcceptLowercase    bool                      // whether to accept lowercase input
	Hierarchy          LiteralValueHierarchyDecl // territory hierarchy (e.g., regions)
	Index              *int
}

// NewTerritoryQualifierType creates a new TerritoryQualifierType with default settings
func NewTerritoryQualifierType() *TerritoryQualifierType {
	return &TerritoryQualifierType{
		BaseQualifierType:  types.NewBaseQualifierType("territory", false), // Default: no context lists
		allowedTerritories: nil,
		acceptLowercase:    false, // Default: require uppercase
		hierarchy:          nil,
	}
}

// NewTerritoryQualifierTypeWithConfig creates a new TerritoryQualifierType with the specified configuration
func NewTerritoryQualifierTypeWithConfig(config TerritoryQualifierTypeConfig) (*TerritoryQualifierType, error) {
	name := config.Name
	if name == "" {
		name = "territory"
	}

	qt := &TerritoryQualifierType{
		BaseQualifierType: types.NewBaseQualifierType(name, config.AllowContextList),
		acceptLowercase:   config.AcceptLowercase,
		hierarchy:         nil,
	}

	// Validate and normalize allowed territories to uppercase
	if config.AllowedTerritories != nil {
		normalizedTerritories := make([]string, len(config.AllowedTerritories))
		for i, territory := range config.AllowedTerritories {
			normalized := strings.ToUpper(territory)
			if !isValidTerritoryCode(normalized) {
				return nil, fmt.Errorf("invalid territory code '%s'", territory)
			}
			normalizedTerritories[i] = normalized
		}
		qt.allowedTerritories = normalizedTerritories
	}

	// Create hierarchy if provided
	if config.Hierarchy != nil && len(config.Hierarchy) > 0 {
		hierarchyConfig := LiteralValueHierarchyConfig{
			Values:    config.AllowedTerritories, // Use original case for values
			Hierarchy: config.Hierarchy,
		}
		hierarchy, err := NewLiteralValueHierarchy(hierarchyConfig)
		if err != nil {
			return nil, fmt.Errorf("failed to create territory hierarchy: %w", err)
		}
		qt.hierarchy = hierarchy
	}

	if config.Index != nil {
		if err := qt.SetIndex(*config.Index); err != nil {
			return nil, fmt.Errorf("failed to set index: %w", err)
		}
	}

	return qt, nil
}

// IsValidConditionValue validates a condition value for territory qualifier type
// Mirrors TypeScript TerritoryQualifierType.isValidConditionValue
func (tqt *TerritoryQualifierType) IsValidConditionValue(value string) bool {
	normalized := value
	if tqt.acceptLowercase {
		normalized = strings.ToUpper(value)
	}

	// First check if it's a valid territory code format
	if !isValidTerritoryCode(normalized) {
		return false
	}

	// If we have allowed territories, check against the list
	if tqt.allowedTerritories != nil {
		for _, allowed := range tqt.allowedTerritories {
			if allowed == normalized {
				return true
			}
		}
		return false
	}

	// If acceptLowercase is false, the original value must be uppercase
	if !tqt.acceptLowercase && value != strings.ToUpper(value) {
		return false
	}

	return true
}

// IsValidContextValue validates a context value for territory qualifier type
func (tqt *TerritoryQualifierType) IsValidContextValue(value string) bool {
	// Context values can be comma-separated lists if allowContextList is true
	if tqt.AllowContextList() && strings.Contains(value, ",") {
		// Split by comma and validate each part
		parts := strings.Split(value, ",")
		for _, part := range parts {
			trimmed := strings.TrimSpace(part)
			if trimmed == "" || !tqt.IsValidConditionValue(trimmed) {
				return false
			}
		}
		return true
	}

	// Single value - use the same validation as condition values
	return tqt.IsValidConditionValue(value)
}

// IsPotentialMatch determines if a condition value could potentially match a context value
// Mirrors TypeScript TerritoryQualifierType.isPotentialMatch  
func (tqt *TerritoryQualifierType) IsPotentialMatch(conditionValue, contextValue string) bool {
	// For territory matching, check if normalized values are valid territory codes
	// This allows case-insensitive potential matching regardless of acceptLowercase setting
	normalizedCondition := strings.ToUpper(conditionValue)
	normalizedContext := strings.ToUpper(contextValue)
	
	if !isValidTerritoryCode(normalizedCondition) || !isValidTerritoryCode(normalizedContext) {
		return false
	}

	// Check direct match first
	score := tqt.matchOne(types.QualifierConditionValue(conditionValue), types.QualifierContextValue(contextValue), types.ConditionOperatorMatches)
	if score != types.NoMatch {
		return true
	}

	// Check against context lists if allowed
	if tqt.AllowContextList() && strings.Contains(contextValue, ",") {
		score := tqt.matchAgainstList(types.QualifierConditionValue(conditionValue), types.QualifierContextValue(contextValue))
		if score != types.NoMatch {
			return true
		}
	}

	// Check hierarchy if available
	if tqt.hierarchy != nil {
		return tqt.hierarchy.IsAncestor(normalizedCondition, normalizedContext)
	}

	return false
}

// ValidateCondition validates that a value and operator are valid for use in a condition
func (tqt *TerritoryQualifierType) ValidateCondition(value string, operator types.ConditionOperator) (types.QualifierConditionValue, error) {
	// Use base implementation for operator validation
	baseResult, err := tqt.BaseQualifierType.ValidateCondition(value, operator)
	if err != nil {
		return "", err
	}

	// For 'matches' operator, validate the condition value
	if operator == types.ConditionOperatorMatches {
		if !tqt.IsValidConditionValue(value) {
			return "", fmt.Errorf("invalid territory condition value '%s'", value)
		}
	}

	return baseResult, nil
}

// ValidateContextValue validates that a value is valid for use in a runtime context
func (tqt *TerritoryQualifierType) ValidateContextValue(value string) (types.QualifierContextValue, error) {
	if !tqt.IsValidContextValue(value) {
		return "", fmt.Errorf("invalid territory context value '%s'", value)
	}
	return types.QualifierContextValue(value), nil
}

// Matches determines the extent to which a condition matches a context value
// Mirrors TypeScript TerritoryQualifierType.matches
func (tqt *TerritoryQualifierType) Matches(condition types.QualifierConditionValue, context types.QualifierContextValue, operator types.ConditionOperator) types.QualifierMatchScore {
	// Handle special operators
	switch operator {
	case types.ConditionOperatorAlways:
		return types.PerfectMatch
	case types.ConditionOperatorNever:
		return types.NoMatch
	case types.ConditionOperatorMatches:
		// Handle context lists if allowed
		if tqt.AllowContextList() && strings.Contains(string(context), ",") {
			return tqt.matchAgainstList(condition, context)
		}
		return tqt.matchOne(condition, context, operator)
	default:
		return types.NoMatch
	}
}

// matchOne performs matching against a single context value
// Mirrors TypeScript TerritoryQualifierType._matchOne
func (tqt *TerritoryQualifierType) matchOne(condition types.QualifierConditionValue, context types.QualifierContextValue, operator types.ConditionOperator) types.QualifierMatchScore {
	// For territory matching, we always normalize to uppercase for comparison
	// This allows case-insensitive matching even when acceptLowercase=false
	normalizedCondition := strings.ToUpper(string(condition))
	normalizedContext := strings.ToUpper(string(context))
	
	// Check if normalized values are valid territory codes
	if !isValidTerritoryCode(normalizedCondition) || !isValidTerritoryCode(normalizedContext) {
		return types.NoMatch
	}

	// Perfect match if identical after normalization
	if normalizedCondition == normalizedContext {
		return types.PerfectMatch
	}

	// Use hierarchy matching if available
	if tqt.hierarchy != nil {
		return tqt.hierarchy.Match(normalizedCondition, normalizedContext, operator)
	}

	return types.NoMatch
}

// matchAgainstList performs matching against a comma-separated list of context values
func (tqt *TerritoryQualifierType) matchAgainstList(condition types.QualifierConditionValue, context types.QualifierContextValue) types.QualifierMatchScore {
	parts := strings.Split(string(context), ",")
	var bestScore types.QualifierMatchScore = types.NoMatch

	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		score := tqt.matchOne(condition, types.QualifierContextValue(trimmed), types.ConditionOperatorMatches)
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

// isValidTerritoryCode validates that a string is a valid ISO-3166-2 Alpha-2 territory code
// Mirrors TypeScript TerritoryQualifierType.isValidTerritoryConditionValue
func isValidTerritoryCode(value string) bool {
	return territoryCodePattern.MatchString(value)
}

// IsValidTerritoryConditionValue validates that a string is a valid territory condition value
// This is a public helper function matching the TypeScript API
func IsValidTerritoryConditionValue(value string, acceptLowercase bool) bool {
	if !acceptLowercase && value != strings.ToUpper(value) {
		return false
	}
	return isValidTerritoryCode(strings.ToUpper(value))
}

// ToTerritoryConditionValue converts a string to a territory condition value
// This is a public helper function matching the TypeScript API
func ToTerritoryConditionValue(value string, acceptLowercase bool) (types.QualifierConditionValue, error) {
	normalized := strings.ToUpper(value)
	if IsValidTerritoryConditionValue(normalized, acceptLowercase) {
		return types.QualifierConditionValue(normalized), nil
	}
	return "", fmt.Errorf("%s: not a valid territory code", value)
}

// GetAllowedTerritories returns the allowed territories constraint, if any
func (tqt *TerritoryQualifierType) GetAllowedTerritories() []string {
	if tqt.allowedTerritories == nil {
		return nil
	}
	// Return a copy to prevent external modification
	result := make([]string, len(tqt.allowedTerritories))
	copy(result, tqt.allowedTerritories)
	return result
}

// GetAcceptLowercase returns whether this qualifier type accepts lowercase input
func (tqt *TerritoryQualifierType) GetAcceptLowercase() bool {
	return tqt.acceptLowercase
}

// GetHierarchy returns the hierarchy, if any
func (tqt *TerritoryQualifierType) GetHierarchy() *LiteralValueHierarchy {
	return tqt.hierarchy
}