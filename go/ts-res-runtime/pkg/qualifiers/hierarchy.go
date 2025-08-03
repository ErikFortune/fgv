package qualifiers

import (
	"fmt"

	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/types"
)

// LiteralValueHierarchyDecl represents a hierarchy declaration where keys are children and values are parents
type LiteralValueHierarchyDecl map[string]string

// LiteralValue represents a single value in the hierarchy with parent/child relationships
type LiteralValue struct {
	Name     string
	Parent   *LiteralValue
	Children []*LiteralValue
}

// LiteralValueHierarchy implements hierarchical matching for literal values
// This mirrors the TypeScript LiteralValueHierarchy class
type LiteralValueHierarchy struct {
	values      map[string]*LiteralValue
	isOpenValues bool // true if created without enumerated values (allows any values)
}

// LiteralValueHierarchyConfig holds configuration for creating a hierarchy
type LiteralValueHierarchyConfig struct {
	Values    []string                   // enumerated values (if empty, hierarchy is open)
	Hierarchy LiteralValueHierarchyDecl // child -> parent mappings
}

// NewLiteralValueHierarchy creates a new hierarchy from configuration
func NewLiteralValueHierarchy(config LiteralValueHierarchyConfig) (*LiteralValueHierarchy, error) {
	values := make(map[string]*LiteralValue)
	
	// Determine if this is an open hierarchy (no enumerated values)
	isOpenValues := len(config.Values) == 0
	
	// Collect all values to include
	var allValues []string
	if isOpenValues {
		// Open hierarchy - collect all values from hierarchy declaration
		valueSet := make(map[string]bool)
		for child, parent := range config.Hierarchy {
			valueSet[child] = true
			valueSet[parent] = true
		}
		for value := range valueSet {
			allValues = append(allValues, value)
		}
	} else {
		// Constrained hierarchy - use provided values
		allValues = config.Values
	}
	
	// Create LiteralValue objects for all values
	for _, value := range allValues {
		values[value] = &LiteralValue{
			Name:     value,
			Parent:   nil,
			Children: make([]*LiteralValue, 0),
		}
	}
	
	// Build parent-child relationships
	for child, parent := range config.Hierarchy {
		childValue, childExists := values[child]
		parentValue, parentExists := values[parent]
		
		if !isOpenValues {
			// In constrained mode, both child and parent must be in enumerated values
			if !childExists {
				return nil, fmt.Errorf("child value '%s' not found in enumerated values", child)
			}
			if !parentExists {
				return nil, fmt.Errorf("parent value '%s' not found in enumerated values", parent)
			}
		} else {
			// In open mode, create values on-demand
			if !childExists {
				childValue = &LiteralValue{
					Name:     child,
					Parent:   nil,
					Children: make([]*LiteralValue, 0),
				}
				values[child] = childValue
			}
			if !parentExists {
				parentValue = &LiteralValue{
					Name:     parent,
					Parent:   nil,
					Children: make([]*LiteralValue, 0),
				}
				values[parent] = parentValue
			}
		}
		
		// Set parent-child relationship
		childValue.Parent = parentValue
		parentValue.Children = append(parentValue.Children, childValue)
	}
	
	return &LiteralValueHierarchy{
		values:       values,
		isOpenValues: isOpenValues,
	}, nil
}

// HasValue checks if a value exists in the hierarchy
func (h *LiteralValueHierarchy) HasValue(value string) bool {
	_, exists := h.values[value]
	return exists
}

// IsAncestor checks if ancestor is an ancestor of descendant in the hierarchy
func (h *LiteralValueHierarchy) IsAncestor(ancestor, descendant string) bool {
	if ancestor == descendant {
		return true
	}
	
	descendantValue, exists := h.values[descendant]
	if !exists {
		return false
	}
	
	// Walk up the hierarchy from descendant
	current := descendantValue.Parent
	for current != nil {
		if current.Name == ancestor {
			return true
		}
		current = current.Parent
	}
	
	return false
}

// GetAncestors returns all ancestors of a value (parent, grandparent, etc.)
func (h *LiteralValueHierarchy) GetAncestors(value string) ([]string, error) {
	literalValue, exists := h.values[value]
	if !exists {
		return nil, fmt.Errorf("value '%s' not found in hierarchy", value)
	}
	
	var ancestors []string
	current := literalValue.Parent
	for current != nil {
		ancestors = append(ancestors, current.Name)
		current = current.Parent
	}
	
	return ancestors, nil
}

// GetDescendants returns all descendants of a value (children, grandchildren, etc.)
func (h *LiteralValueHierarchy) GetDescendants(value string) ([]string, error) {
	literalValue, exists := h.values[value]
	if !exists {
		return nil, fmt.Errorf("value '%s' not found in hierarchy", value)
	}
	
	var descendants []string
	var collectDescendants func(*LiteralValue)
	collectDescendants = func(node *LiteralValue) {
		for _, child := range node.Children {
			descendants = append(descendants, child.Name)
			collectDescendants(child)
		}
	}
	
	collectDescendants(literalValue)
	return descendants, nil
}

// Match performs hierarchical matching between condition and context values
// This mirrors the TypeScript LiteralValueHierarchy.match method
func (h *LiteralValueHierarchy) Match(condition, context string, operator types.ConditionOperator) types.QualifierMatchScore {
	// For open hierarchies, skip validation and allow any values
	if !h.isOpenValues {
		// Validate that both condition and context exist in the hierarchy
		if !h.HasValue(condition) {
			return types.NoMatch
		}
		if !h.HasValue(context) {
			return types.NoMatch
		}
	}
	
	// Perfect match if condition == context
	if condition == context {
		return types.PerfectMatch
	}
	
	// For open hierarchies, if values aren't in the hierarchy, treat as no match
	contextValue, contextExists := h.values[context]
	if !contextExists {
		return types.NoMatch
	}
	
	// Walk up the ancestry from context, looking for condition
	current := contextValue.Parent
	if current == nil {
		// Context is a root with no parent - no match unless exact
		return types.NoMatch
	}
	
	score := float64(types.PerfectMatch)
	for current != nil {
		score *= 0.9 // Decay score by 10% for each level up
		if current.Name == condition {
			// Validate the score is still in valid range
			if score >= 0.0 && score <= 1.0 {
				return types.QualifierMatchScore(score)
			}
			return types.NoMatch
		}
		current = current.Parent
	}
	
	return types.NoMatch
}

// IsOpenValues returns whether this hierarchy allows any values (open mode)
func (h *LiteralValueHierarchy) IsOpenValues() bool {
	return h.isOpenValues
}

// GetValues returns all values in the hierarchy
func (h *LiteralValueHierarchy) GetValues() []string {
	values := make([]string, 0, len(h.values))
	for value := range h.values {
		values = append(values, value)
	}
	return values
}