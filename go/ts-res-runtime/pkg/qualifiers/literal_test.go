package qualifiers

import (
	"testing"

	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/types"
)

func TestNewLiteralQualifierType(t *testing.T) {
	qt := NewLiteralQualifierType()
	
	if qt.Name() != "literal" {
		t.Errorf("Expected name 'literal', got '%s'", qt.Name())
	}
	
	if !qt.AllowContextList() {
		t.Error("Expected AllowContextList to be true by default")
	}
	
	if qt.GetCaseSensitive() {
		t.Error("Expected case sensitivity to be false by default")
	}
	
	if qt.GetEnumeratedValues() != nil {
		t.Error("Expected no enumerated values by default")
	}
	
	if qt.Index() != nil {
		t.Error("Expected index to be nil initially")
	}
}

func TestNewLiteralQualifierTypeWithConfig(t *testing.T) {
	index := 42
	config := LiteralQualifierTypeConfig{
		Name:             "test",
		AllowContextList: false,
		CaseSensitive:    true,
		EnumeratedValues: []string{"a", "b", "c"},
		Index:            &index,
	}
	
	qt := NewLiteralQualifierTypeWithConfig(config)
	
	if qt.Name() != "test" {
		t.Errorf("Expected name 'test', got '%s'", qt.Name())
	}
	
	if qt.AllowContextList() {
		t.Error("Expected AllowContextList to be false")
	}
	
	if !qt.GetCaseSensitive() {
		t.Error("Expected case sensitivity to be true")
	}
	
	enumValues := qt.GetEnumeratedValues()
	expected := []string{"a", "b", "c"}
	if len(enumValues) != len(expected) {
		t.Errorf("Expected %d enumerated values, got %d", len(expected), len(enumValues))
	}
	for i, v := range expected {
		if enumValues[i] != v {
			t.Errorf("Expected enumerated value[%d] = '%s', got '%s'", i, v, enumValues[i])
		}
	}
	
	if qt.Index() == nil || *qt.Index() != 42 {
		t.Errorf("Expected index 42, got %v", qt.Index())
	}
}

func TestIsValidConditionValue(t *testing.T) {
	// Test cases from TypeScript tests
	validIdentifiers := []string{
		"abc",
		"_a10", 
		"this-is-an-identifier",
		"_This_Is_Also-An_Identifier10",
		"A",
	}
	
	invalidIdentifiers := []string{
		"",
		" not_an_identifier",
		"also not an identifier",
		"1not_identifier",
		"rats!",
	}
	
	qt := NewLiteralQualifierType()
	
	for _, valid := range validIdentifiers {
		if !qt.IsValidConditionValue(valid) {
			t.Errorf("Expected '%s' to be valid, but it was not", valid)
		}
	}
	
	for _, invalid := range invalidIdentifiers {
		if qt.IsValidConditionValue(invalid) {
			t.Errorf("Expected '%s' to be invalid, but it was valid", invalid)
		}
	}
}

func TestIsValidConditionValueWithEnumeration(t *testing.T) {
	// Case-sensitive enumeration
	config := LiteralQualifierTypeConfig{
		CaseSensitive:    true,
		EnumeratedValues: []string{"Alpha", "Beta", "Gamma"},
	}
	qt := NewLiteralQualifierTypeWithConfig(config)
	
	// Valid values (exact case)
	validValues := []string{"Alpha", "Beta", "Gamma"}
	for _, valid := range validValues {
		if !qt.IsValidConditionValue(valid) {
			t.Errorf("Expected '%s' to be valid (case-sensitive), but it was not", valid)
		}
	}
	
	// Invalid values (wrong case)
	invalidValues := []string{"alpha", "BETA", "gamma"}
	for _, invalid := range invalidValues {
		if qt.IsValidConditionValue(invalid) {
			t.Errorf("Expected '%s' to be invalid (case-sensitive), but it was valid", invalid)
		}
	}
	
	// Case-insensitive enumeration
	config.CaseSensitive = false
	qt2 := NewLiteralQualifierTypeWithConfig(config)
	
	// All cases should be valid now
	allValues := []string{"Alpha", "alpha", "BETA", "beta", "Gamma", "gamma"}
	for _, valid := range allValues {
		if !qt2.IsValidConditionValue(valid) {
			t.Errorf("Expected '%s' to be valid (case-insensitive), but it was not", valid)
		}
	}
}

func TestIsValidContextValue(t *testing.T) {
	qt := NewLiteralQualifierType() // AllowContextList = true by default
	
	// Single values
	if !qt.IsValidContextValue("valid-identifier") {
		t.Error("Expected single valid identifier to be valid context")
	}
	
	if qt.IsValidContextValue("invalid identifier") {
		t.Error("Expected invalid identifier to be invalid context")
	}
	
	// List values (comma-separated)
	if !qt.IsValidContextValue("alpha,beta,gamma") {
		t.Error("Expected comma-separated list to be valid context")
	}
	
	if !qt.IsValidContextValue("alpha, beta, gamma") {
		t.Error("Expected comma-separated list with spaces to be valid context")
	}
	
	if qt.IsValidContextValue("alpha,invalid identifier,gamma") {
		t.Error("Expected list with invalid item to be invalid context")
	}
	
	// Test with AllowContextList = false
	config := LiteralQualifierTypeConfig{AllowContextList: false}
	qt2 := NewLiteralQualifierTypeWithConfig(config)
	
	if !qt2.IsValidContextValue("alpha") {
		t.Error("Expected single value to be valid when lists not allowed")
	}
	
	if qt2.IsValidContextValue("alpha,beta") {
		t.Error("Expected list to be invalid when lists not allowed")
	}
}

func TestMatches(t *testing.T) {
	qt := NewLiteralQualifierType() // Case-insensitive by default
	
	// Perfect matches (case-insensitive)
	testCases := []struct {
		condition, context string
		expected           types.QualifierMatchScore
	}{
		{"alpha", "alpha", types.PerfectMatch},
		{"Alpha", "alpha", types.PerfectMatch},
		{"ALPHA", "alpha", types.PerfectMatch},
		{"alpha", "ALPHA", types.PerfectMatch},
		{"alpha", "beta", types.NoMatch},
		{"", "", types.PerfectMatch},
	}
	
	for _, tc := range testCases {
		score := qt.Matches(
			types.QualifierConditionValue(tc.condition),
			types.QualifierContextValue(tc.context),
			types.ConditionOperatorMatches,
		)
		if score != tc.expected {
			t.Errorf("Expected match('%s', '%s') = %f, got %f", tc.condition, tc.context, tc.expected, score)
		}
	}
	
	// Test case-sensitive matching
	config := LiteralQualifierTypeConfig{CaseSensitive: true}
	qtSensitive := NewLiteralQualifierTypeWithConfig(config)
	
	caseSensitiveTests := []struct {
		condition, context string
		expected           types.QualifierMatchScore
	}{
		{"alpha", "alpha", types.PerfectMatch},
		{"Alpha", "alpha", types.NoMatch},
		{"ALPHA", "alpha", types.NoMatch},
		{"Alpha", "Alpha", types.PerfectMatch},
	}
	
	for _, tc := range caseSensitiveTests {
		score := qtSensitive.Matches(
			types.QualifierConditionValue(tc.condition),
			types.QualifierContextValue(tc.context),
			types.ConditionOperatorMatches,
		)
		if score != tc.expected {
			t.Errorf("Expected case-sensitive match('%s', '%s') = %f, got %f", tc.condition, tc.context, tc.expected, score)
		}
	}
}

func TestMatchesWithOperators(t *testing.T) {
	qt := NewLiteralQualifierType()
	condition := types.QualifierConditionValue("test")
	context := types.QualifierContextValue("test")
	
	// Test 'always' operator
	score := qt.Matches(condition, context, types.ConditionOperatorAlways)
	if score != types.PerfectMatch {
		t.Errorf("Expected 'always' operator to return PerfectMatch, got %f", score)
	}
	
	// Test 'never' operator  
	score = qt.Matches(condition, context, types.ConditionOperatorNever)
	if score != types.NoMatch {
		t.Errorf("Expected 'never' operator to return NoMatch, got %f", score)
	}
}

func TestMatchesWithContextList(t *testing.T) {
	qt := NewLiteralQualifierType() // AllowContextList = true by default
	
	condition := types.QualifierConditionValue("beta")
	context := types.QualifierContextValue("alpha,beta,gamma")
	
	score := qt.Matches(condition, context, types.ConditionOperatorMatches)
	if score != types.PerfectMatch {
		t.Errorf("Expected perfect match against list containing condition, got %f", score)
	}
	
	// Test with condition not in list
	condition = types.QualifierConditionValue("delta")
	score = qt.Matches(condition, context, types.ConditionOperatorMatches)
	if score != types.NoMatch {
		t.Errorf("Expected no match against list not containing condition, got %f", score)
	}
	
	// Test with spaces
	context = types.QualifierContextValue("alpha, beta , gamma")
	condition = types.QualifierConditionValue("beta")
	score = qt.Matches(condition, context, types.ConditionOperatorMatches)
	if score != types.PerfectMatch {
		t.Errorf("Expected perfect match against spaced list containing condition, got %f", score)
	}
}

func TestIsPotentialMatch(t *testing.T) {
	qt := NewLiteralQualifierType()
	
	// Valid potential matches
	if !qt.IsPotentialMatch("alpha", "alpha") {
		t.Error("Expected exact match to be potential match")
	}
	
	if !qt.IsPotentialMatch("Alpha", "alpha") {
		t.Error("Expected case-insensitive match to be potential match")
	}
	
	if !qt.IsPotentialMatch("beta", "alpha,beta,gamma") {
		t.Error("Expected list match to be potential match")
	}
	
	// Invalid potential matches
	if qt.IsPotentialMatch("alpha", "beta") {
		t.Error("Expected different values to not be potential match")
	}
	
	if qt.IsPotentialMatch("invalid value", "alpha") {
		t.Error("Expected invalid condition to not be potential match")
	}
	
	if qt.IsPotentialMatch("alpha", "invalid value") {
		t.Error("Expected invalid context to not be potential match")
	}
}

func TestSetIndex(t *testing.T) {
	qt := NewLiteralQualifierType()
	
	// First set should succeed
	err := qt.SetIndex(10)
	if err != nil {
		t.Errorf("Expected first SetIndex to succeed, got error: %v", err)
	}
	
	if qt.Index() == nil || *qt.Index() != 10 {
		t.Errorf("Expected index to be 10, got %v", qt.Index())
	}
	
	// Second set should fail (immutable)
	err = qt.SetIndex(20)
	if err == nil {
		t.Error("Expected second SetIndex to fail, but it succeeded")
	}
	
	// Index should remain unchanged
	if qt.Index() == nil || *qt.Index() != 10 {
		t.Errorf("Expected index to remain 10 after failed set, got %v", qt.Index())
	}
}