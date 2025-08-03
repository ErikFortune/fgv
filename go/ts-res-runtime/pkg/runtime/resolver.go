package runtime

import (
	"fmt"
	"sort"

	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/types"
)

const NoMatch = -1

// MatchType represents the type of condition match
type MatchType string

const (
	MatchTypeMatch         MatchType = "match"
	MatchTypeMatchAsDefault MatchType = "matchAsDefault"
	MatchTypeNoMatch       MatchType = "noMatch"
)

// ConditionMatchResult represents the result of evaluating a condition
type ConditionMatchResult struct {
	Score     int       `json:"score"`
	Priority  int       `json:"priority"`
	MatchType MatchType `json:"matchType"`
}

// ConditionSetResolutionResult represents the result of resolving a condition set
type ConditionSetResolutionResult struct {
	MatchType  MatchType              `json:"matchType"`
	Score      int                    `json:"score"`
	Priority   int                    `json:"priority"`
	Conditions []ConditionMatchResult `json:"conditions"`
}

// DecisionResolutionResult represents the result of resolving a decision
type DecisionResolutionResult struct {
	Success                 bool  `json:"success"`
	InstanceIndices         []int `json:"instanceIndices"`
	DefaultInstanceIndices  []int `json:"defaultInstanceIndices"`
}

// ResourceResolver handles resource resolution with caching
type ResourceResolver struct {
	manager  *ResourceManager
	context  map[string]interface{}
	
	// Caches for O(1) lookup by index
	conditionCache    []*ConditionMatchResult
	conditionSetCache []*ConditionSetResolutionResult
	decisionCache     []*DecisionResolutionResult
}

// NewResourceResolver creates a new resource resolver
func NewResourceResolver(manager *ResourceManager, context map[string]interface{}) (*ResourceResolver, error) {
	if manager == nil {
		return nil, fmt.Errorf("resource manager cannot be nil")
	}
	
	if context == nil {
		context = make(map[string]interface{})
	}
	
	// Validate context
	if err := manager.ValidateContext(context); err != nil {
		return nil, fmt.Errorf("invalid context: %w", err)
	}
	
	resolver := &ResourceResolver{
		manager: manager,
		context: context,
		conditionCache:    make([]*ConditionMatchResult, len(manager.conditions)),
		conditionSetCache: make([]*ConditionSetResolutionResult, len(manager.conditionSets)),
		decisionCache:     make([]*DecisionResolutionResult, len(manager.decisions)),
	}
	
	return resolver, nil
}

// UpdateContext updates the resolver context and clears caches
func (rr *ResourceResolver) UpdateContext(context map[string]interface{}) error {
	if context == nil {
		context = make(map[string]interface{})
	}
	
	// Validate context
	if err := rr.manager.ValidateContext(context); err != nil {
		return fmt.Errorf("invalid context: %w", err)
	}
	
	rr.context = context
	rr.clearCaches()
	return nil
}

// clearCaches clears all resolution caches
func (rr *ResourceResolver) clearCaches() {
	for i := range rr.conditionCache {
		rr.conditionCache[i] = nil
	}
	for i := range rr.conditionSetCache {
		rr.conditionSetCache[i] = nil
	}
	for i := range rr.decisionCache {
		rr.decisionCache[i] = nil
	}
}

// ResolveCondition resolves a condition with caching by condition index (matches TypeScript pattern)
func (rr *ResourceResolver) ResolveCondition(conditionIndex int) (*ConditionMatchResult, error) {
	if conditionIndex < 0 || conditionIndex >= len(rr.conditionCache) {
		return nil, fmt.Errorf("condition index %d out of range", conditionIndex)
	}
	
	// Check cache first for O(1) lookup (same as TypeScript)
	if cached := rr.conditionCache[conditionIndex]; cached != nil {
		return cached, nil
	}
	
	// Get condition by index from the compiled collection
	condition, err := rr.manager.GetConditionByIndex(conditionIndex)
	if err != nil {
		return nil, fmt.Errorf("failed to get condition at index %d: %w", conditionIndex, err)
	}
	
	// Get qualifier by its index from the compiled collection
	qualifier, err := rr.manager.GetQualifierByIndex(condition.QualifierIndex)
	if err != nil {
		return nil, fmt.Errorf("failed to get qualifier at index %d: %w", condition.QualifierIndex, err)
	}
	
	// Get context value for this qualifier by name
	contextValue, hasContextValue := rr.context[qualifier.Name]
	
	// Evaluate condition using exact match (simplified implementation)
	// In full implementation, this would use qualifier type's matching logic
	score := NoMatch
	if hasContextValue {
		if rr.valuesMatch(contextValue, condition.Value) {
			score = 100 // Exact match score
		}
	}
	
	// Determine match result based on score and scoreAsDefault
	var result *ConditionMatchResult
	if score > NoMatch {
		result = &ConditionMatchResult{
			Score:     score,
			Priority:  condition.Priority,
			MatchType: MatchTypeMatch,
		}
	} else if condition.ScoreAsDefault != nil && *condition.ScoreAsDefault > NoMatch {
		result = &ConditionMatchResult{
			Score:     *condition.ScoreAsDefault,
			Priority:  condition.Priority,
			MatchType: MatchTypeMatchAsDefault,
		}
	} else {
		result = &ConditionMatchResult{
			Score:     NoMatch,
			Priority:  condition.Priority,
			MatchType: MatchTypeNoMatch,
		}
	}
	
	// Cache the resolved value for future O(1 lookup (matches TypeScript pattern)
	rr.conditionCache[conditionIndex] = result
	return result, nil
}



// ResolveConditionSet resolves a condition set with caching by condition set index (matches TypeScript pattern)
func (rr *ResourceResolver) ResolveConditionSet(conditionSetIndex int) (*ConditionSetResolutionResult, error) {
	if conditionSetIndex < 0 || conditionSetIndex >= len(rr.conditionSetCache) {
		return nil, fmt.Errorf("condition set index %d out of range", conditionSetIndex)
	}
	
	// Check cache first for O(1) lookup (same as TypeScript)
	if cached := rr.conditionSetCache[conditionSetIndex]; cached != nil {
		return cached, nil
	}
	
	// Get condition set by index from the compiled collection
	conditionSet, err := rr.manager.GetConditionSetByIndex(conditionSetIndex)
	if err != nil {
		return nil, fmt.Errorf("failed to get condition set at index %d: %w", conditionSetIndex, err)
	}
	
	// Resolve all conditions in the set (matches TypeScript logic)
	conditions := make([]ConditionMatchResult, 0, len(conditionSet.Conditions))
	matchType := MatchTypeMatch
	totalScore := 0
	
	for _, conditionIndex := range conditionSet.Conditions {
		conditionResult, err := rr.ResolveCondition(conditionIndex)
		if err != nil {
			return nil, fmt.Errorf("failed to resolve condition at index %d: %w", conditionIndex, err)
		}
		
		conditions = append(conditions, *conditionResult)
		
		// If any condition doesn't match, the whole set doesn't match (same as TypeScript)
		if conditionResult.MatchType == MatchTypeNoMatch {
			result := &ConditionSetResolutionResult{
				MatchType:  MatchTypeNoMatch,
				Score:      NoMatch,
				Priority:   0, // Priority would come from condition set priority in full implementation
				Conditions: conditions,
			}
			rr.conditionSetCache[conditionSetIndex] = result
			return result, nil
		}
		
		// If any condition matches as default, the set matches as default (same as TypeScript)
		if conditionResult.MatchType == MatchTypeMatchAsDefault {
			matchType = MatchTypeMatchAsDefault
		}
		
		totalScore += conditionResult.Score
	}
	
	// Calculate average score (simplified - TypeScript uses more complex priority logic)
	averageScore := totalScore
	if len(conditions) > 0 {
		averageScore = totalScore / len(conditions)
	}
	
	result := &ConditionSetResolutionResult{
		MatchType:  matchType,
		Score:      averageScore,
		Priority:   0, // Priority would come from condition set priority in full implementation
		Conditions: conditions,
	}
	
	// Cache the resolved value for future O(1 lookup (matches TypeScript pattern)
	rr.conditionSetCache[conditionSetIndex] = result
	return result, nil
}

// valuesMatch checks if two values match (simplified comparison)
func (rr *ResourceResolver) valuesMatch(contextValue, conditionValue interface{}) bool {
	// Simple equality check - in full implementation this would use qualifier type matching logic
	return fmt.Sprintf("%v", contextValue) == fmt.Sprintf("%v", conditionValue)
}

// ResolveDecision resolves a decision with caching by decision index (matches TypeScript pattern)
func (rr *ResourceResolver) ResolveDecision(decisionIndex int) (*DecisionResolutionResult, error) {
	if decisionIndex < 0 || decisionIndex >= len(rr.decisionCache) {
		return nil, fmt.Errorf("decision index %d out of range", decisionIndex)
	}
	
	// Check cache first for O(1) lookup (same as TypeScript)
	if cached := rr.decisionCache[decisionIndex]; cached != nil {
		return cached, nil
	}
	
	// Get decision by index from the compiled collection
	decision, err := rr.manager.GetDecisionByIndex(decisionIndex)
	if err != nil {
		return nil, fmt.Errorf("failed to get decision at index %d: %w", decisionIndex, err)
	}
	
	// Resolve all condition sets in the decision (matches TypeScript logic)
	type indexedResult struct {
		index  int
		result *ConditionSetResolutionResult
	}
	
	var matchingResults []indexedResult
	var defaultResults []indexedResult
	
	for i, conditionSetIndex := range decision.ConditionSets {
		conditionSetResult, err := rr.ResolveConditionSet(conditionSetIndex)
		if err != nil {
			return nil, fmt.Errorf("failed to resolve condition set at index %d: %w", conditionSetIndex, err)
		}
		
		switch conditionSetResult.MatchType {
		case MatchTypeMatch:
			matchingResults = append(matchingResults, indexedResult{index: i, result: conditionSetResult})
		case MatchTypeMatchAsDefault:
			defaultResults = append(defaultResults, indexedResult{index: i, result: conditionSetResult})
		}
		// MatchTypeNoMatch is ignored
	}
	
	// Sort results by priority (higher priority first, then higher score)
	sortResults := func(results []indexedResult) {
		sort.Slice(results, func(i, j int) bool {
			a, b := results[i].result, results[j].result
			if a.Priority != b.Priority {
				return a.Priority > b.Priority
			}
			return a.Score > b.Score
		})
	}
	
	sortResults(matchingResults)
	sortResults(defaultResults)
	
	// Extract indices
	instanceIndices := make([]int, len(matchingResults))
	for i, result := range matchingResults {
		instanceIndices[i] = result.index
	}
	
	defaultInstanceIndices := make([]int, len(defaultResults))
	for i, result := range defaultResults {
		defaultInstanceIndices[i] = result.index
	}
	
	result := &DecisionResolutionResult{
		Success:                true,
		InstanceIndices:        instanceIndices,
		DefaultInstanceIndices: defaultInstanceIndices,
	}
	
	// Cache the resolved value for future O(1 lookup (matches TypeScript pattern)
	rr.decisionCache[decisionIndex] = result
	return result, nil
}

// ResolveResource resolves a resource to its best matching candidate (matches TypeScript pattern)
func (rr *ResourceResolver) ResolveResource(resourceID string) (*types.CompiledCandidate, error) {
	resource, err := rr.manager.GetResource(resourceID)
	if err != nil {
		return nil, err
	}
	
	// Resolve the decision by index (resource.Decision is now an int index)
	decisionResult, err := rr.ResolveDecision(resource.Decision)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve decision at index %d: %w", resource.Decision, err)
	}
	
	if !decisionResult.Success || (len(decisionResult.InstanceIndices) == 0 && len(decisionResult.DefaultInstanceIndices) == 0) {
		return nil, fmt.Errorf("no matching candidates found for resource %s", resourceID)
	}
	
	// Prefer regular matches over default matches
	var candidateIndex int
	if len(decisionResult.InstanceIndices) > 0 {
		candidateIndex = decisionResult.InstanceIndices[0]
	} else {
		candidateIndex = decisionResult.DefaultInstanceIndices[0]
	}
	
	if candidateIndex >= len(resource.Candidates) {
		return nil, fmt.Errorf("invalid candidate index %d for resource %s", candidateIndex, resourceID)
	}
	
	return &resource.Candidates[candidateIndex], nil
}

// ResolveResourceValue resolves a resource to its composed JSON value
func (rr *ResourceResolver) ResolveResourceValue(resourceID string) (interface{}, error) {
	candidates, err := rr.ResolveAllResourceCandidates(resourceID)
	if err != nil {
		return nil, err
	}
	
	if len(candidates) == 0 {
		return nil, fmt.Errorf("no candidates found for resource %s", resourceID)
	}
	
	// Find the first full candidate and collect all partial candidates above it
	var fullCandidateIndex = -1
	var partialCandidates []types.CompiledCandidate
	
	for i, candidate := range candidates {
		if !candidate.IsPartial {
			fullCandidateIndex = i
			break
		}
		// Collect partial candidates in reverse order (highest priority first)
		partialCandidates = append([]types.CompiledCandidate{candidate}, partialCandidates...)
	}
	
	// Use the full candidate as base, or the last candidate if no full candidate found
	baseCandidateIndex := fullCandidateIndex
	if baseCandidateIndex == -1 {
		baseCandidateIndex = len(candidates) - 1
	}
	baseCandidate := candidates[baseCandidateIndex]
	
	// If no partial candidates to merge, return the base candidate
	if len(partialCandidates) == 0 {
		return baseCandidate.JSON, nil
	}
	
	// Merge partial candidates into the base candidate
	result := baseCandidate.JSON
	for _, partial := range partialCandidates {
		merged, err := mergeJSON(result, partial.JSON)
		if err != nil {
			return nil, fmt.Errorf("failed to merge candidate: %w", err)
		}
		result = merged
	}
	
	return result, nil
}

// ResolveAllResourceCandidates resolves all matching candidates for a resource (matches TypeScript pattern)
func (rr *ResourceResolver) ResolveAllResourceCandidates(resourceID string) ([]types.CompiledCandidate, error) {
	resource, err := rr.manager.GetResource(resourceID)
	if err != nil {
		return nil, err
	}
	
	// Resolve the decision by index (resource.Decision is now an int index)
	decisionResult, err := rr.ResolveDecision(resource.Decision)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve decision at index %d: %w", resource.Decision, err)
	}
	
	if !decisionResult.Success || (len(decisionResult.InstanceIndices) == 0 && len(decisionResult.DefaultInstanceIndices) == 0) {
		return nil, fmt.Errorf("no matching candidates found for resource %s", resourceID)
	}
	
	var candidates []types.CompiledCandidate
	
	// Add regular matches first
	for _, index := range decisionResult.InstanceIndices {
		if index >= len(resource.Candidates) {
			return nil, fmt.Errorf("invalid candidate index %d for resource %s", index, resourceID)
		}
		candidates = append(candidates, resource.Candidates[index])
	}
	
	// Add default matches
	for _, index := range decisionResult.DefaultInstanceIndices {
		if index >= len(resource.Candidates) {
			return nil, fmt.Errorf("invalid candidate index %d for resource %s", index, resourceID)
		}
		candidates = append(candidates, resource.Candidates[index])
	}
	
	return candidates, nil
}

// Helper functions



// mergeJSON merges two JSON objects (simplified implementation)
func mergeJSON(base, overlay interface{}) (interface{}, error) {
	// Convert to maps if they are objects
	baseMap, baseIsMap := base.(map[string]interface{})
	overlayMap, overlayIsMap := overlay.(map[string]interface{})
	
	if baseIsMap && overlayIsMap {
		result := make(map[string]interface{})
		
		// Copy base
		for k, v := range baseMap {
			result[k] = v
		}
		
		// Overlay values
		for k, v := range overlayMap {
			if existing, exists := result[k]; exists {
				// Recursively merge if both are objects
				merged, err := mergeJSON(existing, v)
				if err != nil {
					return nil, err
				}
				result[k] = merged
			} else {
				result[k] = v
			}
		}
		
		return result, nil
	}
	
	// If not both objects, overlay wins
	return overlay, nil
}