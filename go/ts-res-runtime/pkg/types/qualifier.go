package types

import (
	"errors"
	"fmt"
)

// ConditionOperator represents the supported condition operators
type ConditionOperator string

const (
	ConditionOperatorAlways  ConditionOperator = "always"
	ConditionOperatorNever   ConditionOperator = "never"
	ConditionOperatorMatches ConditionOperator = "matches"
)

// QualifierMatchScore represents a match score between 0.0 (no match) and 1.0 (perfect match)
type QualifierMatchScore float64

const (
	NoMatch      QualifierMatchScore = 0.0
	PerfectMatch QualifierMatchScore = 1.0
)

// QualifierConditionValue represents a validated condition value
type QualifierConditionValue string

// QualifierContextValue represents a validated context value
type QualifierContextValue string

// QualifierType defines the interface for qualifier type implementations
// This interface mirrors the TypeScript IQualifierType interface
type QualifierType interface {
	// Name returns the name of this qualifier type
	Name() string

	// Index returns the global index for this qualifier type
	Index() *int

	// SetIndex sets the global index for this qualifier type (immutable once set)
	SetIndex(index int) error

	// IsValidConditionValue validates a condition value for this qualifier type
	IsValidConditionValue(value string) bool

	// IsValidContextValue validates a context value for this qualifier type
	IsValidContextValue(value string) bool

	// IsPotentialMatch determines if a condition value could potentially match a context value
	IsPotentialMatch(conditionValue, contextValue string) bool

	// ValidateCondition validates that a value and operator are valid for use in a condition
	ValidateCondition(value string, operator ConditionOperator) (QualifierConditionValue, error)

	// ValidateContextValue validates that a value is valid for use in a runtime context
	ValidateContextValue(value string) (QualifierContextValue, error)

	// Matches determines the extent to which a condition matches a context value
	Matches(condition QualifierConditionValue, context QualifierContextValue, operator ConditionOperator) QualifierMatchScore

	// AllowContextList indicates whether this qualifier type allows list values in context
	AllowContextList() bool
}

// BaseQualifierType provides a base implementation for common qualifier type functionality
// This mirrors the TypeScript QualifierType abstract class
type BaseQualifierType struct {
	name             string
	index            *int
	allowContextList bool
}

// NewBaseQualifierType creates a new BaseQualifierType
func NewBaseQualifierType(name string, allowContextList bool) *BaseQualifierType {
	return &BaseQualifierType{
		name:             name,
		allowContextList: allowContextList,
	}
}

// Name returns the name of this qualifier type
func (qt *BaseQualifierType) Name() string {
	return qt.name
}

// Index returns the global index for this qualifier type
func (qt *BaseQualifierType) Index() *int {
	return qt.index
}

// SetIndex sets the global index for this qualifier type
func (qt *BaseQualifierType) SetIndex(index int) error {
	if qt.index != nil {
		return errors.New("qualifier type index is immutable once set")
	}
	qt.index = &index
	return nil
}

// AllowContextList indicates whether this qualifier type allows list values in context
func (qt *BaseQualifierType) AllowContextList() bool {
	return qt.allowContextList
}

// ValidateCondition provides a default implementation for condition validation
func (qt *BaseQualifierType) ValidateCondition(value string, operator ConditionOperator) (QualifierConditionValue, error) {
	// Validate operator
	switch operator {
	case ConditionOperatorAlways, ConditionOperatorNever, ConditionOperatorMatches:
		// Valid operators
	default:
		return "", fmt.Errorf("invalid condition operator: %s", operator)
	}

	// For 'always' and 'never', the value should be empty
	if operator == ConditionOperatorAlways || operator == ConditionOperatorNever {
		if value != "" {
			return "", fmt.Errorf("condition value must be empty for operator '%s'", operator)
		}
		return QualifierConditionValue(value), nil
	}

	// For 'matches', delegate to the specific qualifier type implementation
	// This will be overridden by concrete implementations
	return QualifierConditionValue(value), nil
}

// ValidateContextValue provides a default implementation for context validation
func (qt *BaseQualifierType) ValidateContextValue(value string) (QualifierContextValue, error) {
	// Default implementation - concrete types should override
	return QualifierContextValue(value), nil
}

// IsValidQualifierMatchScore validates that a score is in the valid range [0.0, 1.0]
func IsValidQualifierMatchScore(score QualifierMatchScore) bool {
	return score >= 0.0 && score <= 1.0
}

// IsValidConditionOperator validates that an operator is one of the supported values
func IsValidConditionOperator(operator ConditionOperator) bool {
	switch operator {
	case ConditionOperatorAlways, ConditionOperatorNever, ConditionOperatorMatches:
		return true
	default:
		return false
	}
}