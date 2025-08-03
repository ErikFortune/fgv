package runtime

import (
	"fmt"

	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/types"
)

// ResourceManager provides read-only access to bundle resources
type ResourceManager struct {
	bundle *types.Bundle
	
	// Index maps for fast lookups
	qualifierMap     map[string]*types.CompiledQualifier
	qualifierTypeMap map[string]*types.CompiledQualifierType
	resourceTypeMap  map[string]*types.CompiledResourceType
	conditionMap     map[string]*types.CompiledCondition
	conditionSetMap  map[string]*types.CompiledConditionSet
	decisionMap      map[string]*types.CompiledAbstractDecision
	resourceMap      map[string]*types.CompiledResource
	
	// Index arrays for O(1) access by index
	conditions    []*types.CompiledCondition
	conditionSets []*types.CompiledConditionSet
	decisions     []*types.CompiledAbstractDecision
}

// NewResourceManager creates a new resource manager from a bundle
func NewResourceManager(bundle *types.Bundle) (*ResourceManager, error) {
	if bundle == nil {
		return nil, fmt.Errorf("bundle cannot be nil")
	}
	
	rm := &ResourceManager{
		bundle:           bundle,
		qualifierMap:     make(map[string]*types.CompiledQualifier),
		qualifierTypeMap: make(map[string]*types.CompiledQualifierType),
		resourceTypeMap:  make(map[string]*types.CompiledResourceType),
		conditionMap:     make(map[string]*types.CompiledCondition),
		conditionSetMap:  make(map[string]*types.CompiledConditionSet),
		decisionMap:      make(map[string]*types.CompiledAbstractDecision),
		resourceMap:      make(map[string]*types.CompiledResource),
	}
	
	if err := rm.buildIndexes(); err != nil {
		return nil, fmt.Errorf("failed to build indexes: %w", err)
	}
	
	return rm, nil
}

// buildIndexes creates lookup maps and arrays for fast access
func (rm *ResourceManager) buildIndexes() error {
	collection := &rm.bundle.CompiledCollection
	
	// Build qualifier maps
	for i := range collection.Qualifiers {
		q := &collection.Qualifiers[i]
		rm.qualifierMap[q.Name] = q
	}
	
	for i := range collection.QualifierTypes {
		qt := &collection.QualifierTypes[i]
		rm.qualifierTypeMap[qt.Name] = qt
	}
	
	for i := range collection.ResourceTypes {
		rt := &collection.ResourceTypes[i]
		rm.resourceTypeMap[rt.Name] = rt
	}
	
	// Build condition maps and arrays
	rm.conditions = make([]*types.CompiledCondition, len(collection.Conditions))
	for i := range collection.Conditions {
		c := &collection.Conditions[i]
		rm.conditionMap[c.Key] = c
		
		// If index is set, use it; otherwise use array index
		index := i
		if c.Index != nil {
			index = *c.Index
		}
		
		if index >= len(rm.conditions) {
			// Extend array if needed
			newConditions := make([]*types.CompiledCondition, index+1)
			copy(newConditions, rm.conditions)
			rm.conditions = newConditions
		}
		rm.conditions[index] = c
	}
	
	// Build condition set maps and arrays
	rm.conditionSets = make([]*types.CompiledConditionSet, len(collection.ConditionSets))
	for i := range collection.ConditionSets {
		cs := &collection.ConditionSets[i]
		rm.conditionSetMap[cs.Key] = cs
		
		index := i
		if cs.Index != nil {
			index = *cs.Index
		}
		
		if index >= len(rm.conditionSets) {
			newConditionSets := make([]*types.CompiledConditionSet, index+1)
			copy(newConditionSets, rm.conditionSets)
			rm.conditionSets = newConditionSets
		}
		rm.conditionSets[index] = cs
	}
	
	// Build decision maps and arrays
	rm.decisions = make([]*types.CompiledAbstractDecision, len(collection.Decisions))
	for i := range collection.Decisions {
		d := &collection.Decisions[i]
		rm.decisionMap[d.Key] = d
		
		index := i
		if d.Index != nil {
			index = *d.Index
		}
		
		if index >= len(rm.decisions) {
			newDecisions := make([]*types.CompiledAbstractDecision, index+1)
			copy(newDecisions, rm.decisions)
			rm.decisions = newDecisions
		}
		rm.decisions[index] = d
	}
	
	// Build resource map
	for i := range collection.Resources {
		r := &collection.Resources[i]
		rm.resourceMap[r.ID] = r
	}
	
	return nil
}

// GetBundle returns the underlying bundle
func (rm *ResourceManager) GetBundle() *types.Bundle {
	return rm.bundle
}

// ListResourceIDs returns all resource IDs in the bundle
func (rm *ResourceManager) ListResourceIDs() []string {
	ids := make([]string, 0, len(rm.resourceMap))
	for id := range rm.resourceMap {
		ids = append(ids, id)
	}
	return ids
}

// GetResource returns a resource by ID
func (rm *ResourceManager) GetResource(id string) (*types.CompiledResource, error) {
	resource, exists := rm.resourceMap[id]
	if !exists {
		return nil, fmt.Errorf("resource not found: %s", id)
	}
	return resource, nil
}

// GetQualifier returns a qualifier by name
func (rm *ResourceManager) GetQualifier(name string) (*types.CompiledQualifier, error) {
	qualifier, exists := rm.qualifierMap[name]
	if !exists {
		return nil, fmt.Errorf("qualifier not found: %s", name)
	}
	return qualifier, nil
}

// GetQualifierType returns a qualifier type by name
func (rm *ResourceManager) GetQualifierType(name string) (*types.CompiledQualifierType, error) {
	qualifierType, exists := rm.qualifierTypeMap[name]
	if !exists {
		return nil, fmt.Errorf("qualifier type not found: %s", name)
	}
	return qualifierType, nil
}

// GetResourceType returns a resource type by name
func (rm *ResourceManager) GetResourceType(name string) (*types.CompiledResourceType, error) {
	resourceType, exists := rm.resourceTypeMap[name]
	if !exists {
		return nil, fmt.Errorf("resource type not found: %s", name)
	}
	return resourceType, nil
}

// GetCondition returns a condition by key
func (rm *ResourceManager) GetCondition(key string) (*types.CompiledCondition, error) {
	condition, exists := rm.conditionMap[key]
	if !exists {
		return nil, fmt.Errorf("condition not found: %s", key)
	}
	return condition, nil
}

// GetConditionSet returns a condition set by key
func (rm *ResourceManager) GetConditionSet(key string) (*types.CompiledConditionSet, error) {
	conditionSet, exists := rm.conditionSetMap[key]
	if !exists {
		return nil, fmt.Errorf("condition set not found: %s", key)
	}
	return conditionSet, nil
}

// GetDecision returns a decision by key
func (rm *ResourceManager) GetDecision(key string) (*types.CompiledAbstractDecision, error) {
	decision, exists := rm.decisionMap[key]
	if !exists {
		return nil, fmt.Errorf("decision not found: %s", key)
	}
	return decision, nil
}

// GetConditionByIndex returns a condition by its index (for O(1) lookup)
func (rm *ResourceManager) GetConditionByIndex(index int) (*types.CompiledCondition, error) {
	if index < 0 || index >= len(rm.conditions) {
		return nil, fmt.Errorf("condition index out of range: %d", index)
	}
	condition := rm.conditions[index]
	if condition == nil {
		return nil, fmt.Errorf("no condition at index: %d", index)
	}
	return condition, nil
}

// GetConditionSetByIndex returns a condition set by its index (for O(1) lookup)
func (rm *ResourceManager) GetConditionSetByIndex(index int) (*types.CompiledConditionSet, error) {
	if index < 0 || index >= len(rm.conditionSets) {
		return nil, fmt.Errorf("condition set index out of range: %d", index)
	}
	conditionSet := rm.conditionSets[index]
	if conditionSet == nil {
		return nil, fmt.Errorf("no condition set at index: %d", index)
	}
	return conditionSet, nil
}

// GetDecisionByIndex returns a decision by its index (for O(1) lookup)
func (rm *ResourceManager) GetDecisionByIndex(index int) (*types.CompiledAbstractDecision, error) {
	if index < 0 || index >= len(rm.decisions) {
		return nil, fmt.Errorf("decision index out of range: %d", index)
	}
	decision := rm.decisions[index]
	if decision == nil {
		return nil, fmt.Errorf("no decision at index: %d", index)
	}
	return decision, nil
}

// GetNumResources returns the number of resources
func (rm *ResourceManager) GetNumResources() int {
	return len(rm.resourceMap)
}

// GetNumCandidates returns the total number of candidates across all resources
func (rm *ResourceManager) GetNumCandidates() int {
	total := 0
	for _, resource := range rm.resourceMap {
		total += len(resource.Candidates)
	}
	return total
}

// ValidateContext validates a context against available qualifiers
func (rm *ResourceManager) ValidateContext(context map[string]interface{}) error {
	for key, value := range context {
		qualifier, exists := rm.qualifierMap[key]
		if !exists {
			return fmt.Errorf("unknown qualifier in context: %s", key)
		}
		
		qualifierType, exists := rm.qualifierTypeMap[qualifier.QualifierType]
		if !exists {
			return fmt.Errorf("qualifier %s references unknown type: %s", key, qualifier.QualifierType)
		}
		
		// Basic type validation based on qualifier type
		if err := validateValueType(value, qualifierType.ValueType); err != nil {
			return fmt.Errorf("invalid value for qualifier %s: %w", key, err)
		}
	}
	return nil
}

// validateValueType performs basic type validation
func validateValueType(value interface{}, expectedType string) error {
	switch expectedType {
	case "string":
		if _, ok := value.(string); !ok {
			return fmt.Errorf("expected string, got %T", value)
		}
	case "number":
		switch value.(type) {
		case int, int32, int64, float32, float64:
			// OK
		default:
			return fmt.Errorf("expected number, got %T", value)
		}
	case "boolean":
		if _, ok := value.(bool); !ok {
			return fmt.Errorf("expected boolean, got %T", value)
		}
	}
	return nil
}