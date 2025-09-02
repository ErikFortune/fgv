package bcp47

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"sync"
)

// IANARegistry holds all the IANA language subtag registry data
type IANARegistry struct {
	// Maps for fast lookup
	Languages    map[string]*IANALanguageEntry    `json:"-"`
	ExtLangs     map[string]*IANAExtLangEntry     `json:"-"`
	Scripts      map[string]*IANAScriptEntry      `json:"-"`
	Regions      map[string]*IANARegionEntry      `json:"-"`
	Variants     map[string]*IANAVariantEntry     `json:"-"`
	Grandfathered map[string]*IANAGrandfatheredEntry `json:"-"`
	
	// Raw entries from the JSON file
	Entries []IANAEntry `json:"entries"`
	FileDate string      `json:"fileDate"`
}

// IANAEntry represents a single entry in the IANA registry
type IANAEntry struct {
	Type         string   `json:"type"`
	Subtag       string   `json:"subtag,omitempty"`
	Tag          string   `json:"tag,omitempty"`
	Description  []string `json:"description"`
	Added        string   `json:"added"`
	Deprecated   string   `json:"deprecated,omitempty"`
	PreferredValue string `json:"preferredValue,omitempty"`
	Prefix       []string `json:"prefix,omitempty"`
	SuppressScript string `json:"suppressScript,omitempty"`
	Scope        string   `json:"scope,omitempty"`
	MacroLanguage string  `json:"macroLanguage,omitempty"`
	Comments     []string `json:"comments,omitempty"`
}

// Specific entry types for easier access
type IANALanguageEntry struct {
	Subtag         string
	Description    []string
	Added          string
	Deprecated     string
	PreferredValue string
	SuppressScript string
	Scope          string
	MacroLanguage  string
	Comments       []string
}

type IANAExtLangEntry struct {
	Subtag         string
	Description    []string
	Added          string
	Deprecated     string
	PreferredValue string
	Prefix         []string
	SuppressScript string
	Comments       []string
}

type IANAScriptEntry struct {
	Subtag         string
	Description    []string
	Added          string
	Deprecated     string
	PreferredValue string
	Comments       []string
}

type IANARegionEntry struct {
	Subtag         string
	Description    []string
	Added          string
	Deprecated     string
	PreferredValue string
	Comments       []string
}

type IANAVariantEntry struct {
	Subtag         string
	Description    []string
	Added          string
	Deprecated     string
	PreferredValue string
	Prefix         []string
	Comments       []string
}

type IANAGrandfatheredEntry struct {
	Tag            string
	Description    []string
	Added          string
	Deprecated     string
	PreferredValue string
	Comments       []string
}

// Global registry instance
var (
	globalRegistry *IANARegistry
	registryOnce   sync.Once
	registryError  error
)

// GetRegistry returns the global IANA registry, loading it if necessary
func GetRegistry() (*IANARegistry, error) {
	registryOnce.Do(func() {
		globalRegistry, registryError = LoadIANARegistry()
	})
	return globalRegistry, registryError
}

// LoadIANARegistry loads the IANA language subtag registry from the embedded data
func LoadIANARegistry() (*IANARegistry, error) {
	// Try to load from the data directory
	data, err := os.ReadFile("data/iana/language-subtags.json")
	if err != nil {
		return nil, fmt.Errorf("failed to read IANA registry: %w", err)
	}
	
	var registry IANARegistry
	if err := json.Unmarshal(data, &registry); err != nil {
		return nil, fmt.Errorf("failed to parse IANA registry: %w", err)
	}
	
	// Build lookup maps
	registry.Languages = make(map[string]*IANALanguageEntry)
	registry.ExtLangs = make(map[string]*IANAExtLangEntry)
	registry.Scripts = make(map[string]*IANAScriptEntry)
	registry.Regions = make(map[string]*IANARegionEntry)
	registry.Variants = make(map[string]*IANAVariantEntry)
	registry.Grandfathered = make(map[string]*IANAGrandfatheredEntry)
	
	for _, entry := range registry.Entries {
		switch entry.Type {
		case "language":
			registry.Languages[strings.ToLower(entry.Subtag)] = &IANALanguageEntry{
				Subtag:         entry.Subtag,
				Description:    entry.Description,
				Added:          entry.Added,
				Deprecated:     entry.Deprecated,
				PreferredValue: entry.PreferredValue,
				SuppressScript: entry.SuppressScript,
				Scope:          entry.Scope,
				MacroLanguage:  entry.MacroLanguage,
				Comments:       entry.Comments,
			}
		case "extlang":
			registry.ExtLangs[strings.ToLower(entry.Subtag)] = &IANAExtLangEntry{
				Subtag:         entry.Subtag,
				Description:    entry.Description,
				Added:          entry.Added,
				Deprecated:     entry.Deprecated,
				PreferredValue: entry.PreferredValue,
				Prefix:         entry.Prefix,
				SuppressScript: entry.SuppressScript,
				Comments:       entry.Comments,
			}
		case "script":
			registry.Scripts[strings.ToLower(entry.Subtag)] = &IANAScriptEntry{
				Subtag:         entry.Subtag,
				Description:    entry.Description,
				Added:          entry.Added,
				Deprecated:     entry.Deprecated,
				PreferredValue: entry.PreferredValue,
				Comments:       entry.Comments,
			}
		case "region":
			registry.Regions[strings.ToUpper(entry.Subtag)] = &IANARegionEntry{
				Subtag:         entry.Subtag,
				Description:    entry.Description,
				Added:          entry.Added,
				Deprecated:     entry.Deprecated,
				PreferredValue: entry.PreferredValue,
				Comments:       entry.Comments,
			}
		case "variant":
			registry.Variants[strings.ToLower(entry.Subtag)] = &IANAVariantEntry{
				Subtag:         entry.Subtag,
				Description:    entry.Description,
				Added:          entry.Added,
				Deprecated:     entry.Deprecated,
				PreferredValue: entry.PreferredValue,
				Prefix:         entry.Prefix,
				Comments:       entry.Comments,
			}
		case "grandfathered":
			registry.Grandfathered[strings.ToLower(entry.Tag)] = &IANAGrandfatheredEntry{
				Tag:            entry.Tag,
				Description:    entry.Description,
				Added:          entry.Added,
				Deprecated:     entry.Deprecated,
				PreferredValue: entry.PreferredValue,
				Comments:       entry.Comments,
			}
		}
	}
	
	return &registry, nil
}

// IsValidLanguage checks if a language subtag is in the IANA registry
func (r *IANARegistry) IsValidLanguage(subtag string) bool {
	_, exists := r.Languages[strings.ToLower(subtag)]
	return exists
}

// IsValidExtLang checks if an extended language subtag is in the IANA registry
func (r *IANARegistry) IsValidExtLang(subtag string) bool {
	_, exists := r.ExtLangs[strings.ToLower(subtag)]
	return exists
}

// IsValidScript checks if a script subtag is in the IANA registry
func (r *IANARegistry) IsValidScript(subtag string) bool {
	_, exists := r.Scripts[strings.ToLower(subtag)]
	return exists
}

// IsValidRegion checks if a region subtag is in the IANA registry
func (r *IANARegistry) IsValidRegion(subtag string) bool {
	_, exists := r.Regions[strings.ToUpper(subtag)]
	return exists
}

// IsValidVariant checks if a variant subtag is in the IANA registry
func (r *IANARegistry) IsValidVariant(subtag string) bool {
	_, exists := r.Variants[strings.ToLower(subtag)]
	return exists
}

// IsValidGrandfathered checks if a tag is a grandfathered tag
func (r *IANARegistry) IsValidGrandfathered(tag string) bool {
	_, exists := r.Grandfathered[strings.ToLower(tag)]
	return exists
}

// GetLanguage returns the language entry for a subtag
func (r *IANARegistry) GetLanguage(subtag string) (*IANALanguageEntry, bool) {
	entry, exists := r.Languages[strings.ToLower(subtag)]
	return entry, exists
}

// GetExtLang returns the extended language entry for a subtag
func (r *IANARegistry) GetExtLang(subtag string) (*IANAExtLangEntry, bool) {
	entry, exists := r.ExtLangs[strings.ToLower(subtag)]
	return entry, exists
}

// GetScript returns the script entry for a subtag
func (r *IANARegistry) GetScript(subtag string) (*IANAScriptEntry, bool) {
	entry, exists := r.Scripts[strings.ToLower(subtag)]
	return entry, exists
}

// GetRegion returns the region entry for a subtag
func (r *IANARegistry) GetRegion(subtag string) (*IANARegionEntry, bool) {
	entry, exists := r.Regions[strings.ToUpper(subtag)]
	return entry, exists
}

// GetVariant returns the variant entry for a subtag
func (r *IANARegistry) GetVariant(subtag string) (*IANAVariantEntry, bool) {
	entry, exists := r.Variants[strings.ToLower(subtag)]
	return entry, exists
}

// GetGrandfathered returns the grandfathered tag entry
func (r *IANARegistry) GetGrandfathered(tag string) (*IANAGrandfatheredEntry, bool) {
	entry, exists := r.Grandfathered[strings.ToLower(tag)]
	return entry, exists
}

// ValidateExtLangPrefixes checks if ExtLang subtags have valid prefixes
func (r *IANARegistry) ValidateExtLangPrefixes(primaryLanguage string, extlangs []string) error {
	for _, extlang := range extlangs {
		entry, exists := r.GetExtLang(extlang)
		if !exists {
			continue // Already validated in IsValidExtLang
		}
		
		if len(entry.Prefix) > 0 {
			validPrefix := false
			for _, prefix := range entry.Prefix {
				if strings.ToLower(prefix) == strings.ToLower(primaryLanguage) {
					validPrefix = true
					break
				}
			}
			if !validPrefix {
				return fmt.Errorf("extlang '%s' requires prefix %v, got '%s'", extlang, entry.Prefix, primaryLanguage)
			}
		}
	}
	return nil
}

// ValidateVariantPrefixes checks if variant subtags have valid prefixes
func (r *IANARegistry) ValidateVariantPrefixes(primaryLanguage, script, region string, variants []string) error {
	for _, variant := range variants {
		entry, exists := r.GetVariant(variant)
		if !exists {
			continue // Already validated in IsValidVariant
		}
		
		if len(entry.Prefix) > 0 {
			validPrefix := false
			for _, prefix := range entry.Prefix {
				// Prefix can be a language, language-script, language-region, etc.
				if r.matchesPrefix(prefix, primaryLanguage, script, region) {
					validPrefix = true
					break
				}
			}
			if !validPrefix {
				return fmt.Errorf("variant '%s' requires prefix %v, current tag doesn't match", variant, entry.Prefix)
			}
		}
	}
	return nil
}

// matchesPrefix checks if the current tag matches a variant prefix
func (r *IANARegistry) matchesPrefix(prefix, primaryLanguage, script, region string) bool {
	parts := strings.Split(prefix, "-")
	if len(parts) == 0 {
		return false
	}
	
	// Check primary language
	if strings.ToLower(parts[0]) != strings.ToLower(primaryLanguage) {
		return false
	}
	
	// If prefix has more parts, check them
	for i := 1; i < len(parts); i++ {
		part := parts[i]
		
		// Check if it's a script (4 letters)
		if len(part) == 4 && strings.ToLower(part) == strings.ToLower(script) {
			continue
		}
		
		// Check if it's a region (2 letters or 3 digits)
		if (len(part) == 2 || len(part) == 3) && strings.ToUpper(part) == strings.ToUpper(region) {
			continue
		}
		
		// If we can't match this part, the prefix doesn't match
		return false
	}
	
	return true
}