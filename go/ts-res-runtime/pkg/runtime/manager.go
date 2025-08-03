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
	resourceMap      map[string]*types.CompiledResource
	
	// Index arrays for O(1) access by index
	conditions    []*types.CompiledCondition
	conditionSets []*types.CompiledConditionSet
	decisions     []*types.CompiledAbstractDecision
	qualifiers    []*types.CompiledQualifier
	qualifierTypes []*types.CompiledQualifierType
	resourceTypes []*types.CompiledResourceType
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
	
	// Build qualifier arrays and maps
	rm.qualifiers = make([]*types.CompiledQualifier, len(collection.Qualifiers))
	for i := range collection.Qualifiers {
		q := &collection.Qualifiers[i]
		rm.qualifierMap[q.Name] = q
		rm.qualifiers[i] = q
	}
	
	rm.qualifierTypes = make([]*types.CompiledQualifierType, len(collection.QualifierTypes))
	for i := range collection.QualifierTypes {
		qt := &collection.QualifierTypes[i]
		rm.qualifierTypeMap[qt.Name] = qt
		rm.qualifierTypes[i] = qt
	}
	
	rm.resourceTypes = make([]*types.CompiledResourceType, len(collection.ResourceTypes))
	for i := range collection.ResourceTypes {
		rt := &collection.ResourceTypes[i]
		rm.resourceTypeMap[rt.Name] = rt
		rm.resourceTypes[i] = rt
	}
	
	// Build condition arrays (direct index mapping)
	rm.conditions = make([]*types.CompiledCondition, len(collection.Conditions))
	for i := range collection.Conditions {
		c := &collection.Conditions[i]
		rm.conditions[i] = c
	}
	
	// Build condition set arrays (direct index mapping)
	rm.conditionSets = make([]*types.CompiledConditionSet, len(collection.ConditionSets))
	for i := range collection.ConditionSets {
		cs := &collection.ConditionSets[i]
		rm.conditionSets[i] = cs
	}
	
	// Build decision arrays (direct index mapping)
	rm.decisions = make([]*types.CompiledAbstractDecision, len(collection.Decisions))
	for i := range collection.Decisions {
		d := &collection.Decisions[i]
		rm.decisions[i] = d
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

// GetQualifierByIndex returns a qualifier by its index
func (rm *ResourceManager) GetQualifierByIndex(index int) (*types.CompiledQualifier, error) {
	if index < 0 || index >= len(rm.qualifiers) {
		return nil, fmt.Errorf("qualifier index out of range: %d", index)
	}
	return rm.qualifiers[index], nil
}

// GetQualifierTypeByIndex returns a qualifier type by its index
func (rm *ResourceManager) GetQualifierTypeByIndex(index int) (*types.CompiledQualifierType, error) {
	if index < 0 || index >= len(rm.qualifierTypes) {
		return nil, fmt.Errorf("qualifier type index out of range: %d", index)
	}
	return rm.qualifierTypes[index], nil
}

// GetResourceTypeByIndex returns a resource type by its index
func (rm *ResourceManager) GetResourceTypeByIndex(index int) (*types.CompiledResourceType, error) {
	if index < 0 || index >= len(rm.resourceTypes) {
		return nil, fmt.Errorf("resource type index out of range: %d", index)
	}
	return rm.resourceTypes[index], nil
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