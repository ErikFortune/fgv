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
	Name        string      `json:"name"`
	Description *string     `json:"description,omitempty"`
	ValueType   string      `json:"valueType"`
	Config      interface{} `json:"config,omitempty"`
}

// CompiledQualifier represents a compiled qualifier
type CompiledQualifier struct {
	Name           string `json:"name"`
	QualifierType  string `json:"qualifierType"`
	Value          interface{} `json:"value"`
	Description    *string `json:"description,omitempty"`
}

// CompiledResourceType represents a compiled resource type
type CompiledResourceType struct {
	Name        string `json:"name"`
	Description *string `json:"description,omitempty"`
	MergeMethod string `json:"mergeMethod"`
}

// CompiledCondition represents a compiled condition
type CompiledCondition struct {
	Key             string      `json:"key"`
	Qualifier       string      `json:"qualifier"`
	Operator        string      `json:"operator"`
	Value           interface{} `json:"value"`
	Priority        int         `json:"priority"`
	ScoreAsDefault  *int        `json:"scoreAsDefault,omitempty"`
	Index           *int        `json:"index,omitempty"`
}

// CompiledConditionSet represents a compiled condition set
type CompiledConditionSet struct {
	Key        string   `json:"key"`
	Conditions []string `json:"conditions"`
	Priority   int      `json:"priority"`
	Index      *int     `json:"index,omitempty"`
}

// CompiledAbstractDecision represents a compiled abstract decision
type CompiledAbstractDecision struct {
	Key               string   `json:"key"`
	ConditionSets     []string `json:"conditionSets"`
	Index             *int     `json:"index,omitempty"`
}

// CompiledCandidate represents a compiled resource candidate
type CompiledCandidate struct {
	JSON        interface{} `json:"json"`
	IsPartial   bool        `json:"isPartial"`
	MergeMethod string      `json:"mergeMethod"`
}

// CompiledResource represents a compiled resource
type CompiledResource struct {
	ID           string              `json:"id"`
	ResourceType string              `json:"resourceType"`
	Decision     string              `json:"decision"`
	Candidates   []CompiledCandidate `json:"candidates"`
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