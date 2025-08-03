package runtime

import (
	"fmt"
	"sort"
	"strconv"
	"strings"

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

// ResolveCondition resolves a condition with caching by index
func (rr *ResourceResolver) ResolveCondition(index int) (*ConditionMatchResult, error) {
	if index < 0 || index >= len(rr.conditionCache) {
		return nil, fmt.Errorf("condition index %d out of range", index)
	}
	
	// Check cache first
	if cached := rr.conditionCache[index]; cached != nil {
		return cached, nil
	}
	
	// Get condition by index
	condition, err := rr.manager.GetConditionByIndex(index)
	if err != nil {
		return nil, fmt.Errorf("failed to get condition at index %d: %w", index, err)
	}
	
	// Get qualifier by index
	qualifier, err := rr.manager.GetQualifierByIndex(condition.QualifierIndex)
	if err != nil {
		return nil, fmt.Errorf("failed to get qualifier at index %d: %w", condition.QualifierIndex, err)
	}
	
	// Get context value for this qualifier
	contextValue, hasContextValue := rr.context[qualifier.Name]
	
	// Evaluate condition (simplified - just check for exact match)
	score := NoMatch
	if hasContextValue && contextValue == condition.Value {
		score = 100 // Exact match
	}
	
	// Determine match result
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
	
	// Cache and return
	rr.conditionCache[index] = result
	return result, nil
}

// evaluateCondition evaluates a condition against context value
func (rr *ResourceResolver) evaluateCondition(condition *types.CompiledCondition, qualifier *types.CompiledQualifier, qualifierType *types.CompiledQualifierType, contextValue interface{}) (int, error) {
	// Handle different qualifier types
	switch qualifierType.ValueType {
	case "string":
		return rr.evaluateStringCondition(condition, contextValue)
	case "number":
		return rr.evaluateNumberCondition(condition, contextValue)
	case "boolean":
		return rr.evaluateBooleanCondition(condition, contextValue)
	default:
		return NoMatch, fmt.Errorf("unsupported qualifier type: %s", qualifierType.ValueType)
	}
}

// evaluateStringCondition evaluates string-based conditions
func (rr *ResourceResolver) evaluateStringCondition(condition *types.CompiledCondition, contextValue interface{}) (int, error) {
	contextStr, ok := contextValue.(string)
	if !ok {
		return NoMatch, nil
	}
	
	conditionValueStr, ok := condition.Value.(string)
	if !ok {
		return NoMatch, fmt.Errorf("condition value is not a string")
	}
	
	switch condition.Operator {
	case "eq", "equals":
		if contextStr == conditionValueStr {
			return 100, nil // Exact match gets high score
		}
		return NoMatch, nil
		
	case "contains":
		if strings.Contains(contextStr, conditionValueStr) {
			return 80, nil // Partial match gets lower score
		}
		return NoMatch, nil
		
	case "startsWith":
		if strings.HasPrefix(contextStr, conditionValueStr) {
			return 90, nil
		}
		return NoMatch, nil
		
	case "endsWith":
		if strings.HasSuffix(contextStr, conditionValueStr) {
			return 90, nil
		}
		return NoMatch, nil
		
	default:
		return NoMatch, fmt.Errorf("unsupported string operator: %s", condition.Operator)
	}
}

// evaluateNumberCondition evaluates number-based conditions
func (rr *ResourceResolver) evaluateNumberCondition(condition *types.CompiledCondition, contextValue interface{}) (int, error) {
	contextNum, err := toFloat64(contextValue)
	if err != nil {
		return NoMatch, nil
	}
	
	conditionNum, err := toFloat64(condition.Value)
	if err != nil {
		return NoMatch, fmt.Errorf("condition value is not a number")
	}
	
	switch condition.Operator {
	case "eq", "equals":
		if contextNum == conditionNum {
			return 100, nil
		}
		return NoMatch, nil
		
	case "gt", "greaterThan":
		if contextNum > conditionNum {
			return 100, nil
		}
		return NoMatch, nil
		
	case "gte", "greaterThanOrEqual":
		if contextNum >= conditionNum {
			return 100, nil
		}
		return NoMatch, nil
		
	case "lt", "lessThan":
		if contextNum < conditionNum {
			return 100, nil
		}
		return NoMatch, nil
		
	case "lte", "lessThanOrEqual":
		if contextNum <= conditionNum {
			return 100, nil
		}
		return NoMatch, nil
		
	default:
		return NoMatch, fmt.Errorf("unsupported number operator: %s", condition.Operator)
	}
}

// evaluateBooleanCondition evaluates boolean-based conditions
func (rr *ResourceResolver) evaluateBooleanCondition(condition *types.CompiledCondition, contextValue interface{}) (int, error) {
	contextBool, ok := contextValue.(bool)
	if !ok {
		return NoMatch, nil
	}
	
	conditionBool, ok := condition.Value.(bool)
	if !ok {
		return NoMatch, fmt.Errorf("condition value is not a boolean")
	}
	
	switch condition.Operator {
	case "eq", "equals":
		if contextBool == conditionBool {
			return 100, nil
		}
		return NoMatch, nil
		
	default:
		return NoMatch, fmt.Errorf("unsupported boolean operator: %s", condition.Operator)
	}
}

// ResolveConditionSet resolves a condition set with caching by index
func (rr *ResourceResolver) ResolveConditionSet(index int) (*ConditionSetResolutionResult, error) {
	if index < 0 || index >= len(rr.conditionSetCache) {
		return nil, fmt.Errorf("condition set index %d out of range", index)
	}
	
	// Check cache first
	if cached := rr.conditionSetCache[index]; cached != nil {
		return cached, nil
	}
	
	// Get condition set by index
	conditionSet, err := rr.manager.GetConditionSetByIndex(index)
	if err != nil {
		return nil, fmt.Errorf("failed to get condition set at index %d: %w", index, err)
	}
	
	// Resolve all conditions in the set
	conditions := make([]ConditionMatchResult, 0, len(conditionSet.Conditions))
	matchType := MatchTypeMatch
	totalScore := 0
	
	for _, conditionIndex := range conditionSet.Conditions {
		conditionResult, err := rr.ResolveCondition(conditionIndex)
		if err != nil {
			return nil, fmt.Errorf("failed to resolve condition at index %d: %w", conditionIndex, err)
		}
		
		conditions = append(conditions, *conditionResult)
		
		// If any condition doesn't match, the whole set doesn't match
		if conditionResult.MatchType == MatchTypeNoMatch {
			result := &ConditionSetResolutionResult{
				MatchType:  MatchTypeNoMatch,
				Score:      NoMatch,
				Priority:   0, // No priority in simplified format
				Conditions: conditions,
			}
			rr.conditionSetCache[index] = result
			return result, nil
		}
		
		// If any condition matches as default, the set matches as default
		if conditionResult.MatchType == MatchTypeMatchAsDefault {
			matchType = MatchTypeMatchAsDefault
		}
		
		totalScore += conditionResult.Score
	}
	
	// Calculate average score
	averageScore := totalScore
	if len(conditions) > 0 {
		averageScore = totalScore / len(conditions)
	}
	
	result := &ConditionSetResolutionResult{
		MatchType:  matchType,
		Score:      averageScore,
		Priority:   0, // No priority in simplified format
		Conditions: conditions,
	}
	
	rr.conditionSetCache[index] = result
	return result, nil
}

// ResolveDecision resolves a decision with caching
func (rr *ResourceResolver) ResolveDecision(decision *types.CompiledAbstractDecision) (*DecisionResolutionResult, error) {
	// Check for valid index
	if decision.Index == nil {
		return nil, fmt.Errorf("decision %s has no index", decision.Key)
	}
	
	index := *decision.Index
	if index < 0 || index >= len(rr.decisionCache) {
		return nil, fmt.Errorf("decision index %d out of range", index)
	}
	
	// Check cache first
	if cached := rr.decisionCache[index]; cached != nil {
		return cached, nil
	}
	
	// Resolve all condition sets in the decision
	type indexedResult struct {
		index  int
		result *ConditionSetResolutionResult
	}
	
	var matchingResults []indexedResult
	var defaultResults []indexedResult
	
	for i, conditionSetKey := range decision.ConditionSets {
		conditionSet, err := rr.manager.GetConditionSet(conditionSetKey)
		if err != nil {
			return nil, fmt.Errorf("failed to get condition set %s: %w", conditionSetKey, err)
		}
		
		conditionSetResult, err := rr.ResolveConditionSet(conditionSet)
		if err != nil {
			return nil, fmt.Errorf("failed to resolve condition set %s: %w", conditionSetKey, err)
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
	
	rr.decisionCache[index] = result
	return result, nil
}

// ResolveResource resolves a resource to its best matching candidate
func (rr *ResourceResolver) ResolveResource(resourceID string) (*types.CompiledCandidate, error) {
	resource, err := rr.manager.GetResource(resourceID)
	if err != nil {
		return nil, err
	}
	
	decision, err := rr.manager.GetDecision(resource.Decision)
	if err != nil {
		return nil, fmt.Errorf("failed to get decision %s: %w", resource.Decision, err)
	}
	
	decisionResult, err := rr.ResolveDecision(decision)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve decision %s: %w", resource.Decision, err)
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

// ResolveAllResourceCandidates resolves all matching candidates for a resource
func (rr *ResourceResolver) ResolveAllResourceCandidates(resourceID string) ([]types.CompiledCandidate, error) {
	resource, err := rr.manager.GetResource(resourceID)
	if err != nil {
		return nil, err
	}
	
	decision, err := rr.manager.GetDecision(resource.Decision)
	if err != nil {
		return nil, fmt.Errorf("failed to get decision %s: %w", resource.Decision, err)
	}
	
	decisionResult, err := rr.ResolveDecision(decision)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve decision %s: %w", resource.Decision, err)
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

// toFloat64 converts various numeric types to float64
func toFloat64(value interface{}) (float64, error) {
	switch v := value.(type) {
	case float64:
		return v, nil
	case float32:
		return float64(v), nil
	case int:
		return float64(v), nil
	case int32:
		return float64(v), nil
	case int64:
		return float64(v), nil
	case string:
		return strconv.ParseFloat(v, 64)
	default:
		return 0, fmt.Errorf("cannot convert %T to float64", value)
	}
}

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