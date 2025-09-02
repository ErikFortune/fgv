package bundle

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"hash/crc32"
	"io"
	"os"

	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/types"
)

// LoaderOptions configures bundle loading behavior
type LoaderOptions struct {
	SkipChecksumVerification bool
	UseSHA256                bool // If false, uses CRC32 for browser compatibility
}

// DefaultLoaderOptions returns sensible defaults for bundle loading
func DefaultLoaderOptions() LoaderOptions {
	return LoaderOptions{
		SkipChecksumVerification: false,
		UseSHA256:                false, // Use CRC32 for browser compatibility by default
	}
}

// LoadFromFile loads a bundle from a JSON file
func LoadFromFile(path string, opts ...LoaderOptions) (*types.Bundle, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("failed to open bundle file: %w", err)
	}
	defer file.Close()

	return LoadFromReader(file, opts...)
}

// LoadFromReader loads a bundle from a reader
func LoadFromReader(reader io.Reader, opts ...LoaderOptions) (*types.Bundle, error) {
	options := DefaultLoaderOptions()
	if len(opts) > 0 {
		options = opts[0]
	}

	data, err := io.ReadAll(reader)
	if err != nil {
		return nil, fmt.Errorf("failed to read bundle data: %w", err)
	}

	return LoadFromBytes(data, options)
}

// LoadFromBytes loads a bundle from byte data
func LoadFromBytes(data []byte, opts ...LoaderOptions) (*types.Bundle, error) {
	options := DefaultLoaderOptions()
	if len(opts) > 0 {
		options = opts[0]
	}

	var bundle types.Bundle
	if err := json.Unmarshal(data, &bundle); err != nil {
		return nil, fmt.Errorf("failed to parse bundle JSON: %w", err)
	}

	if !options.SkipChecksumVerification {
		if err := verifyBundleIntegrity(&bundle, options.UseSHA256); err != nil {
			return nil, fmt.Errorf("bundle integrity verification failed: %w", err)
		}
	}

	return &bundle, nil
}

// verifyBundleIntegrity checks the bundle's checksum
func verifyBundleIntegrity(bundle *types.Bundle, useSHA256 bool) error {
	// Serialize the compiled collection to compute checksum
	collectionData, err := json.Marshal(bundle.CompiledCollection)
	if err != nil {
		return fmt.Errorf("failed to serialize compiled collection for verification: %w", err)
	}

	var calculatedChecksum string
	if useSHA256 {
		hash := sha256.Sum256(collectionData)
		calculatedChecksum = hex.EncodeToString(hash[:])
	} else {
		// Use CRC32 for browser compatibility (matches TypeScript implementation)
		crc := crc32.ChecksumIEEE(collectionData)
		calculatedChecksum = fmt.Sprintf("%08x", crc)
	}

	if calculatedChecksum != bundle.Metadata.Checksum {
		return fmt.Errorf("checksum mismatch: expected %s, got %s", 
			bundle.Metadata.Checksum, calculatedChecksum)
	}

	return nil
}

// ValidateBundle performs basic validation on a bundle structure
func ValidateBundle(bundle *types.Bundle) error {
	if bundle == nil {
		return fmt.Errorf("bundle is nil")
	}

	if bundle.Metadata.Checksum == "" {
		return fmt.Errorf("bundle metadata missing checksum")
	}

	if len(bundle.CompiledCollection.Resources) == 0 {
		return fmt.Errorf("bundle contains no resources")
	}

	// Validate that all resource references are valid
	qualifierMap := make(map[string]bool)
	for _, q := range bundle.CompiledCollection.Qualifiers {
		qualifierMap[q.Name] = true
	}

	qualifierTypeMap := make(map[string]bool)
	for _, qt := range bundle.CompiledCollection.QualifierTypes {
		qualifierTypeMap[qt.Name] = true
	}

	resourceTypeMap := make(map[string]bool)
	for _, rt := range bundle.CompiledCollection.ResourceTypes {
		resourceTypeMap[rt.Name] = true
	}

	// Validate conditions (simplified since they use indices)
	if len(bundle.CompiledCollection.Conditions) == 0 {
		return fmt.Errorf("bundle contains no conditions")
	}

	// Validate condition sets (simplified since they use indices)
	if len(bundle.CompiledCollection.ConditionSets) == 0 {
		return fmt.Errorf("bundle contains no condition sets")
	}

	// Validate decisions (simplified since they use indices)
	if len(bundle.CompiledCollection.Decisions) == 0 {
		return fmt.Errorf("bundle contains no decisions")
	}

	// Validate resources (simplified validation)
	for _, r := range bundle.CompiledCollection.Resources {
		if r.Type < 0 || r.Type >= len(bundle.CompiledCollection.ResourceTypes) {
			return fmt.Errorf("resource %s references invalid resource type index %d", r.ID, r.Type)
		}
		if r.Decision < 0 || r.Decision >= len(bundle.CompiledCollection.Decisions) {
			return fmt.Errorf("resource %s references invalid decision index %d", r.ID, r.Decision)
		}
		if len(r.Candidates) == 0 {
			return fmt.Errorf("resource %s has no candidates", r.ID)
		}
	}

	return nil
}