package types

import (
	"encoding/json"
	"time"
)

// BundleMetadata represents metadata for a resource bundle
type BundleMetadata struct {
	DateBuilt   time.Time `json:"dateBuilt"`
	Checksum    string    `json:"checksum"`
	Version     *string   `json:"version,omitempty"`
	Description *string   `json:"description,omitempty"`
}

// BundleExportMetadata represents optional export metadata
type BundleExportMetadata struct {
	ExportedAt    time.Time              `json:"exportedAt"`
	ExportedFrom  string                 `json:"exportedFrom"`
	Type          string                 `json:"type"`
	FilterContext map[string]interface{} `json:"filterContext,omitempty"`
}

// SystemConfiguration represents the system configuration
type SystemConfiguration struct {
	QualifierTypes []CompiledQualifierType `json:"qualifierTypes"`
	Qualifiers     []CompiledQualifier     `json:"qualifiers"`
	ResourceTypes  []CompiledResourceType  `json:"resourceTypes"`
}

// CompiledQualifierType represents a compiled qualifier type
type CompiledQualifierType struct {
	Name string `json:"name"`
}

// CompiledQualifier represents a compiled qualifier
type CompiledQualifier struct {
	Name            string `json:"name"`
	Type            int    `json:"type"`
	DefaultPriority int    `json:"defaultPriority"`
}

// CompiledResourceType represents a compiled resource type
type CompiledResourceType struct {
	Name string `json:"name"`
}

// CompiledCondition represents a compiled condition
type CompiledCondition struct {
	QualifierIndex int         `json:"qualifierIndex"`
	Value          interface{} `json:"value"`
	Priority       int         `json:"priority"`
	ScoreAsDefault *int        `json:"scoreAsDefault,omitempty"`
}

// CompiledConditionSet represents a compiled condition set
type CompiledConditionSet struct {
	Conditions []int `json:"conditions"`
}

// CompiledAbstractDecision represents a compiled abstract decision
type CompiledAbstractDecision struct {
	ConditionSets []int `json:"conditionSets"`
}

// CompiledCandidate represents a compiled resource candidate
type CompiledCandidate struct {
	JSON        interface{} `json:"json"`
	IsPartial   bool        `json:"isPartial"`
	MergeMethod string      `json:"mergeMethod"`
}

// CompiledResource represents a compiled resource
type CompiledResource struct {
	ID         string              `json:"id"`
	Type       int                 `json:"type"`
	Decision   int                 `json:"decision"`
	Candidates []CompiledCandidate `json:"candidates"`
}

// CompiledResourceCollection represents the complete compiled resource collection
type CompiledResourceCollection struct {
	QualifierTypes []CompiledQualifierType   `json:"qualifierTypes"`
	Qualifiers     []CompiledQualifier       `json:"qualifiers"`
	ResourceTypes  []CompiledResourceType    `json:"resourceTypes"`
	Conditions     []CompiledCondition       `json:"conditions"`
	ConditionSets  []CompiledConditionSet    `json:"conditionSets"`
	Decisions      []CompiledAbstractDecision `json:"decisions"`
	Resources      []CompiledResource        `json:"resources"`
}

// Bundle represents a complete resource bundle
type Bundle struct {
	Metadata           BundleMetadata              `json:"metadata"`
	Config             SystemConfiguration         `json:"config"`
	CompiledCollection CompiledResourceCollection  `json:"compiledCollection"`
	ExportMetadata     *BundleExportMetadata       `json:"exportMetadata,omitempty"`
}

// UnmarshalBundleMetadata handles parsing of the dateBuilt field
func (bm *BundleMetadata) UnmarshalJSON(data []byte) error {
	type Alias BundleMetadata
	aux := &struct {
		DateBuilt string `json:"dateBuilt"`
		*Alias
	}{
		Alias: (*Alias)(bm),
	}
	
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	
	parsedTime, err := time.Parse(time.RFC3339, aux.DateBuilt)
	if err != nil {
		return err
	}
	
	bm.DateBuilt = parsedTime
	return nil
}

// MarshalJSON handles serialization of the dateBuilt field
func (bm BundleMetadata) MarshalJSON() ([]byte, error) {
	type Alias BundleMetadata
	return json.Marshal(&struct {
		DateBuilt string `json:"dateBuilt"`
		*Alias
	}{
		DateBuilt: bm.DateBuilt.Format(time.RFC3339),
		Alias:     (*Alias)(&bm),
	})
}