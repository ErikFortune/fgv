package runtime

import (
	"fmt"

	"github.com/fgv-vis/fgv/go/ts-bcp47/pkg/bcp47"
	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/qualifiers"
	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/types"
)

// ConditionMatchResult represents the result of evaluating a condition
type ConditionMatchResult struct {
	Matches bool
	Score   types.QualifierMatchScore
}

// ConditionSetResolutionResult represents the result of resolving a condition set
type ConditionSetResolutionResult struct {
	Matches bool
	Score   types.QualifierMatchScore
}

// DecisionResolutionResult represents the result of resolving a decision
type DecisionResolutionResult struct {
	Success bool
	Score   types.QualifierMatchScore
}

// ResourceResolver provides resource resolution with O(1) caching
// This matches the TypeScript ResourceResolver implementation
type ResourceResolver struct {
	manager *ResourceManager
	context map[string]interface{}

	// O(1) cache arrays indexed by condition/conditionSet/decision index
	conditionCache    []*ConditionMatchResult
	conditionSetCache []*ConditionSetResolutionResult
	decisionCache     []*DecisionResolutionResult

	// Qualifier type instances for condition evaluation
	qualifierTypes map[string]types.QualifierType
}

// NewResourceResolver creates a new ResourceResolver with the given context
func NewResourceResolver(manager *ResourceManager, context map[string]interface{}) (*ResourceResolver, error) {
	if manager == nil {
		return nil, fmt.Errorf("manager cannot be nil")
	}

	resolver := &ResourceResolver{
		manager:        manager,
		context:        context,
		qualifierTypes: make(map[string]types.QualifierType),
	}

	// Initialize qualifier types based on bundle configuration
	for _, qualifierType := range manager.qualifierTypes {
		qt, err := resolver.createQualifierType(*qualifierType)
		if err != nil {
			// Fall back to literal qualifier type on error
			literalQT := qualifiers.NewLiteralQualifierTypeWithConfig(qualifiers.LiteralQualifierTypeConfig{
				Name:             qualifierType.Name,
				AllowContextList: true,  // Default to allowing context lists
				CaseSensitive:    false, // Default to case-insensitive
			})
			resolver.qualifierTypes[qualifierType.Name] = literalQT
		} else {
			resolver.qualifierTypes[qualifierType.Name] = qt
		}
	}

	if err := resolver.initializeCaches(); err != nil {
		return nil, fmt.Errorf("failed to initialize caches: %w", err)
	}

	return resolver, nil
}

// createQualifierType creates the appropriate qualifier type based on system type and configuration
func (r *ResourceResolver) createQualifierType(qualifierType types.CompiledQualifierType) (types.QualifierType, error) {
	switch qualifierType.SystemType {
	case "language":
		return r.createLanguageQualifierType(qualifierType)
	case "territory":
		return r.createTerritoryQualifierType(qualifierType)
	case "literal", "":
		return r.createLiteralQualifierType(qualifierType)
	default:
		// Unknown system type, fall back to literal
		return r.createLiteralQualifierType(qualifierType)
	}
}

// createLanguageQualifierType creates a language qualifier type from configuration
func (r *ResourceResolver) createLanguageQualifierType(qualifierType types.CompiledQualifierType) (types.QualifierType, error) {
	config := qualifiers.LanguageQualifierTypeConfig{
		Name:             qualifierType.Name,
		AllowContextList: true, // Default
		AcceptMalformed:  false, // Default
		MinimumScore:     bcp47.SimilarityNone, // Default
		Normalization:    bcp47.Canonical, // Default
		Validation:       bcp47.WellFormed, // Default
	}
	
	// Apply configuration from bundle
	if qualifierType.Configuration != nil {
		if allowContextList, ok := qualifierType.Configuration["allowContextList"].(bool); ok {
			config.AllowContextList = allowContextList
		}
		if acceptMalformed, ok := qualifierType.Configuration["acceptMalformed"].(bool); ok {
			config.AcceptMalformed = acceptMalformed
		}
		if allowedLanguages, ok := qualifierType.Configuration["allowedLanguages"].([]interface{}); ok {
			languages := make([]string, len(allowedLanguages))
			for i, lang := range allowedLanguages {
				if langStr, ok := lang.(string); ok {
					languages[i] = langStr
				}
			}
			config.AllowedLanguages = languages
		}
		if minimumScore, ok := qualifierType.Configuration["minimumScore"].(float64); ok {
			config.MinimumScore = bcp47.SimilarityScore(minimumScore)
		}
	}
	
	return qualifiers.NewLanguageQualifierTypeWithConfig(config)
}

// createTerritoryQualifierType creates a territory qualifier type from configuration
func (r *ResourceResolver) createTerritoryQualifierType(qualifierType types.CompiledQualifierType) (types.QualifierType, error) {
	config := qualifiers.TerritoryQualifierTypeConfig{
		Name:             qualifierType.Name,
		AllowContextList: false, // Default for territory
		AcceptLowercase:  false, // Default
	}
	
	// Apply configuration from bundle
	if qualifierType.Configuration != nil {
		if allowContextList, ok := qualifierType.Configuration["allowContextList"].(bool); ok {
			config.AllowContextList = allowContextList
		}
		if acceptLowercase, ok := qualifierType.Configuration["acceptLowercase"].(bool); ok {
			config.AcceptLowercase = acceptLowercase
		}
		if allowedTerritories, ok := qualifierType.Configuration["allowedTerritories"].([]interface{}); ok {
			territories := make([]string, len(allowedTerritories))
			for i, territory := range allowedTerritories {
				if territoryStr, ok := territory.(string); ok {
					territories[i] = territoryStr
				}
			}
			config.AllowedTerritories = territories
		}
	}
	
	return qualifiers.NewTerritoryQualifierTypeWithConfig(config)
}

// createLiteralQualifierType creates a literal qualifier type from configuration
func (r *ResourceResolver) createLiteralQualifierType(qualifierType types.CompiledQualifierType) (types.QualifierType, error) {
	config := qualifiers.LiteralQualifierTypeConfig{
		Name:             qualifierType.Name,
		AllowContextList: true,  // Default
		CaseSensitive:    false, // Default
	}
	
	// Apply configuration from bundle
	if qualifierType.Configuration != nil {
		if allowContextList, ok := qualifierType.Configuration["allowContextList"].(bool); ok {
			config.AllowContextList = allowContextList
		}
		if caseSensitive, ok := qualifierType.Configuration["caseSensitive"].(bool); ok {
			config.CaseSensitive = caseSensitive
		}
		if enumeratedValues, ok := qualifierType.Configuration["enumeratedValues"].([]interface{}); ok {
			values := make([]string, len(enumeratedValues))
			for i, value := range enumeratedValues {
				if valueStr, ok := value.(string); ok {
					values[i] = valueStr
				}
			}
			config.EnumeratedValues = values
		}
	}
	
	return qualifiers.NewLiteralQualifierTypeWithConfig(config), nil
}

// initializeCaches initializes the cache arrays with the correct size
func (r *ResourceResolver) initializeCaches() error {
	// Initialize caches with nil values, sized to match the collections
	r.conditionCache = make([]*ConditionMatchResult, len(r.manager.conditions))
	r.conditionSetCache = make([]*ConditionSetResolutionResult, len(r.manager.conditionSets))
	r.decisionCache = make([]*DecisionResolutionResult, len(r.manager.decisions))

	return nil
}

// UpdateContext updates the resolver context and clears all caches
func (r *ResourceResolver) UpdateContext(context map[string]interface{}) error {
	r.context = context
	r.clearCaches()
	return nil
}

// clearCaches clears all cached results
func (r *ResourceResolver) clearCaches() {
	// Clear all cache entries by setting to nil
	for i := range r.conditionCache {
		r.conditionCache[i] = nil
	}
	for i := range r.conditionSetCache {
		r.conditionSetCache[i] = nil
	}
	for i := range r.decisionCache {
		r.decisionCache[i] = nil
	}
}

// ResolveCondition resolves a condition by index using O(1 cache lookup
func (r *ResourceResolver) ResolveCondition(conditionIndex int) (*ConditionMatchResult, error) {
	// Bounds check
	if conditionIndex < 0 || conditionIndex >= len(r.manager.conditions) {
		return nil, fmt.Errorf("condition index %d out of bounds", conditionIndex)
	}

	// Check cache first (O(1))
	if r.conditionCache[conditionIndex] != nil {
		return r.conditionCache[conditionIndex], nil
	}

	// Cache miss - evaluate condition
	condition := r.manager.conditions[conditionIndex]
	result, err := r.evaluateCondition(condition)
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate condition %d: %w", conditionIndex, err)
	}

	// Cache the result for future O(1) lookup
	r.conditionCache[conditionIndex] = result
	return result, nil
}

// evaluateCondition evaluates a single condition against the current context
func (r *ResourceResolver) evaluateCondition(condition *types.CompiledCondition) (*ConditionMatchResult, error) {
	// Get the qualifier for this condition
	qualifier, err := r.manager.GetQualifierByIndex(condition.QualifierIndex)
	if err != nil {
		return nil, fmt.Errorf("invalid qualifier index %d: %w", condition.QualifierIndex, err)
	}

	// Get the qualifier type for this qualifier
	qualifierType, exists := r.qualifierTypes[qualifier.Name]
	if !exists {
		// Fallback: create a default literal qualifier type
		qualifierType = qualifiers.NewLiteralQualifierType()
		r.qualifierTypes[qualifier.Name] = qualifierType
	}

	// Get context value for this qualifier
	contextValue, hasContext := r.context[qualifier.Name]
	if !hasContext {
		// No context value - this condition doesn't match
		return &ConditionMatchResult{
			Matches: false,
			Score:   types.NoMatch,
		}, nil
	}

	// Convert context value to string
	contextStr, ok := contextValue.(string)
	if !ok {
		// For now, only support string context values
		return &ConditionMatchResult{
			Matches: false,
			Score:   types.NoMatch,
		}, nil
	}

	// Validate context value
	validatedContext, err := qualifierType.ValidateContextValue(contextStr)
	if err != nil {
		// Invalid context value - no match
		return &ConditionMatchResult{
			Matches: false,
			Score:   types.NoMatch,
		}, nil
	}

	// Validate condition value
	conditionOperator := types.ConditionOperatorMatches // Default operator - currently no operator in CompiledCondition
	
	// Convert condition value to string
	conditionStr := fmt.Sprintf("%v", condition.Value)
	
	validatedCondition, err := qualifierType.ValidateCondition(conditionStr, conditionOperator)
	if err != nil {
		// Invalid condition value - this is a configuration error
		return nil, fmt.Errorf("invalid condition value '%s' for qualifier '%s': %w", conditionStr, qualifier.Name, err)
	}

	// Perform the match using the qualifier type
	score := qualifierType.Matches(validatedCondition, validatedContext, conditionOperator)
	
	return &ConditionMatchResult{
		Matches: score > types.NoMatch,
		Score:   score,
	}, nil
}

// ResolveConditionSet resolves a condition set by index using O(1 cache lookup
func (r *ResourceResolver) ResolveConditionSet(conditionSetIndex int) (*ConditionSetResolutionResult, error) {
	// Bounds check
	if conditionSetIndex < 0 || conditionSetIndex >= len(r.manager.conditionSets) {
		return nil, fmt.Errorf("condition set index %d out of bounds", conditionSetIndex)
	}

	// Check cache first (O(1))
	if r.conditionSetCache[conditionSetIndex] != nil {
		return r.conditionSetCache[conditionSetIndex], nil
	}

	// Cache miss - evaluate condition set
	conditionSet := r.manager.conditionSets[conditionSetIndex]
	
	// A condition set matches if ALL its conditions match
	totalScore := types.QualifierMatchScore(0.0)
	conditionCount := 0

	for _, conditionIndex := range conditionSet.Conditions {
		conditionResult, err := r.ResolveCondition(conditionIndex)
		if err != nil {
			return nil, fmt.Errorf("failed to resolve condition %d in set %d: %w", conditionIndex, conditionSetIndex, err)
		}

		if !conditionResult.Matches {
			// If any condition doesn't match, the whole set doesn't match
			result := &ConditionSetResolutionResult{
				Matches: false,
				Score:   types.NoMatch,
			}
			r.conditionSetCache[conditionSetIndex] = result
			return result, nil
		}

		totalScore += conditionResult.Score
		conditionCount++
	}

	// All conditions matched - calculate average score
	var averageScore types.QualifierMatchScore = types.PerfectMatch
	if conditionCount > 0 {
		averageScore = totalScore / types.QualifierMatchScore(conditionCount)
	}

	result := &ConditionSetResolutionResult{
		Matches: true,
		Score:   averageScore,
	}

	// Cache the result for future O(1) lookup
	r.conditionSetCache[conditionSetIndex] = result
	return result, nil
}

// ResolveDecision resolves a decision by index using O(1) cache lookup
func (r *ResourceResolver) ResolveDecision(decisionIndex int) (*DecisionResolutionResult, error) {
	// Bounds check
	if decisionIndex < 0 || decisionIndex >= len(r.manager.decisions) {
		return nil, fmt.Errorf("decision index %d out of bounds", decisionIndex)
	}

	// Check cache first (O(1))
	if r.decisionCache[decisionIndex] != nil {
		return r.decisionCache[decisionIndex], nil
	}

	// Cache miss - evaluate decision
	decision := r.manager.decisions[decisionIndex]
	
	// Find the best matching condition set
	var bestScore types.QualifierMatchScore = types.NoMatch
	hasMatch := false

	for _, conditionSetIndex := range decision.ConditionSets {
		conditionSetResult, err := r.ResolveConditionSet(conditionSetIndex)
		if err != nil {
			return nil, fmt.Errorf("failed to resolve condition set %d in decision %d: %w", conditionSetIndex, decisionIndex, err)
		}

		if conditionSetResult.Matches && conditionSetResult.Score > bestScore {
			bestScore = conditionSetResult.Score
			hasMatch = true
		}
	}

	result := &DecisionResolutionResult{
		Success: hasMatch,
		Score:   bestScore,
	}

	// Cache the result for future O(1) lookup
	r.decisionCache[decisionIndex] = result
	return result, nil
}

// ResolveResource resolves a resource to its best matching candidate
func (r *ResourceResolver) ResolveResource(resourceID string) (*types.CompiledCandidate, error) {
	candidates, err := r.ResolveAllResourceCandidates(resourceID)
	if err != nil {
		return nil, err
	}

	if len(candidates) == 0 {
		return nil, fmt.Errorf("no matching candidates found for resource '%s'", resourceID)
	}

	// Return the first (best) candidate
	return candidates[0], nil
}

// ResolveAllResourceCandidates resolves a resource to all matching candidates, sorted by priority
func (r *ResourceResolver) ResolveAllResourceCandidates(resourceID string) ([]*types.CompiledCandidate, error) {
	resource, err := r.manager.GetResource(resourceID)
	if err != nil {
		return nil, fmt.Errorf("resource '%s' not found: %w", resourceID, err)
	}

	// Resolve the decision for this resource
	decisionResult, err := r.ResolveDecision(resource.Decision)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve decision %d for resource: %w", resource.Decision, err)
	}

	if !decisionResult.Success {
		return nil, fmt.Errorf("no matching decisions found for resource '%s'", resourceID)
	}

	var matchingCandidates []*types.CompiledCandidate

	for i := range resource.Candidates {
		// For now, add all candidates since the decision already passed
		// TODO: Implement proper candidate filtering based on condition set matching
		matchingCandidates = append(matchingCandidates, &resource.Candidates[i])
	}

	// TODO: Sort by priority and score (candidates are already in priority order from compilation)
	return matchingCandidates, nil
}

// ResolveResourceValue resolves a resource to its composed value by merging all matching candidates
func (r *ResourceResolver) ResolveResourceValue(resourceID string) (interface{}, error) {
	candidates, err := r.ResolveAllResourceCandidates(resourceID)
	if err != nil {
		return nil, err
	}

	if len(candidates) == 0 {
		return nil, fmt.Errorf("no matching candidates found for resource '%s'", resourceID)
	}

	// For now, return the best candidate's value
	// TODO: Implement proper partial candidate merging
	bestCandidate := candidates[0]
	
	// The JSON value is already parsed in CompiledCandidate.JSON
	return bestCandidate.JSON, nil
}