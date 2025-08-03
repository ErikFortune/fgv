package bcp47

import (
	"regexp"
	"strings"
)

// Regular expressions for BCP-47 language tag components
// These patterns are based on RFC 5646 specification
var (
	// Primary language: 2-3 or 5-8 lowercase letters
	languagePattern = regexp.MustCompile(`^([a-z]{2,3}|[a-z]{5,8})$`)
	
	// Extended language: 3 lowercase letters
	extlangPattern = regexp.MustCompile(`^[a-z]{3}$`)
	
	// Script: 4 letters, title case (Xxxx) - strict valid
	// For well-formed, accept any 4 letters
	scriptPattern = regexp.MustCompile(`^[A-Z][a-z]{3}$`)
	scriptWellFormedPattern = regexp.MustCompile(`^[A-Za-z]{4}$`)
	
	// Region: 2 letters (uppercase) or 3 digits (strict valid)
	// For well-formed parsing, we also accept 1 letter or 3 letters
	regionPattern = regexp.MustCompile(`^([A-Z]{2}|[0-9]{3})$`)
	regionWellFormedPattern = regexp.MustCompile(`^([A-Za-z]{1,3}|[0-9]{3})$`)
	
	// Variant: 5-8 alphanumeric or 4 starting with digit
	variantPattern = regexp.MustCompile(`^([0-9][A-Za-z0-9]{3}|[A-Za-z0-9]{5,8})$`)
	
	// Extension singleton: single character (not x or X)
	extensionPattern = regexp.MustCompile(`^[0-9A-WY-Za-wy-z]$`)
	
	// Extension subtag: 2-8 alphanumeric
	extensionSubtagPattern = regexp.MustCompile(`^[A-Za-z0-9]{2,8}$`)
	
	// Private use subtag: 1-8 alphanumeric (RFC 5646)
	// For well-formed parsing, be more permissive
	privateUsePattern = regexp.MustCompile(`^[A-Za-z0-9]{1,}$`)
	
	// Full tag pattern for basic validation
	basicTagPattern = regexp.MustCompile(`^[A-Za-z0-9]([A-Za-z0-9\-]*[A-Za-z0-9])?$`)
)

// Grandfathered tags - these are special cases that don't follow normal BCP-47 rules
var grandfatheredTags = map[string]bool{
	// Regular grandfathered tags
	"art-lojban":   true,
	"cel-gaulish":  true,
	"no-bok":       true,
	"no-nyn":       true,
	"zh-guoyu":     true,
	"zh-hakka":     true,
	"zh-min":       true,
	"zh-min-nan":   true,
	"zh-xiang":     true,
	
	// Irregular grandfathered tags
	"en-gb-oed":    true,
	"i-ami":        true,
	"i-bnn":        true,
	"i-default":    true,
	"i-enochian":   true,
	"i-hak":        true,
	"i-klingon":    true,
	"i-lux":        true,
	"i-mingo":      true,
	"i-navajo":     true,
	"i-pwn":        true,
	"i-tao":        true,
	"i-tay":        true,
	"i-tsu":        true,
	"sgn-be-fr":    true,
	"sgn-be-nl":    true,
	"sgn-ch-de":    true,
}

// ParseState represents the current parsing state
type ParseState int

const (
	StateLanguage ParseState = iota
	StateExtLang
	StateScript
	StateRegion
	StateVariant
	StateExtension
	StatePrivateUse
	StateComplete
)

// Parser handles the parsing of BCP-47 language tags
type Parser struct {
	tag                        string
	parts                      []string
	position                   int
	state                      ParseState
	subtags                    Subtags
	errors                     []string
	currentExtensionSingleton  string
}

// ParseTag parses a BCP-47 language tag string into a LanguageTag structure
func ParseTag(tag string, options ...Option) (*LanguageTag, error) {
	if tag == "" {
		return nil, NewError(ErrorTypeInvalidSyntax, "empty language tag", tag, "")
	}
	
	// Apply configuration
	config := DefaultConfig()
	ApplyOptions(config, options...)
	
	// Check length constraints
	if len(tag) < MinTagLength || len(tag) > MaxTagLength {
		return nil, NewError(ErrorTypeInvalidLength, "tag length out of bounds", tag, "")
	}
	
	// Basic syntax check
	if !basicTagPattern.MatchString(tag) {
		return nil, NewError(ErrorTypeInvalidSyntax, "invalid characters in tag", tag, "")
	}
	
	// Normalize case and check for grandfathered tags
	normalizedTag := strings.ToLower(tag)
	if grandfatheredTags[normalizedTag] {
		return &LanguageTag{
			Tag: tag,
			Subtags: Subtags{
				Grandfathered: normalizedTag,
			},
			validity:        WellFormed, // Start with well-formed, validation can upgrade
			normalization:   config.Normalization,
			IsGrandfathered: true,
			IsUndetermined:  false,
			IsMacroLanguage: false,
		}, nil
	}
	
	// Parse normal tags
	parser := &Parser{
		tag:   tag,
		parts: strings.Split(tag, "-"),
		state: StateLanguage,
	}
	
	err := parser.parse()
	if err != nil {
		return nil, err
	}
	
	// Create the language tag
	languageTag := &LanguageTag{
		Tag:             tag,
		Subtags:         parser.subtags,
		validity:        WellFormed,
		normalization:   config.Normalization,
		IsGrandfathered: false,
		IsUndetermined:  parser.subtags.PrimaryLanguage == UndeterminedLanguage,
		IsMacroLanguage: false, // TODO: Determine from IANA registry
	}
	
	// Apply normalization if requested
	if config.Normalization != None {
		err = parser.normalize(languageTag, config.Normalization)
		if err != nil {
			return nil, err
		}
	}
	
	// Apply validation if requested
	if config.Validity > WellFormed {
		err = parser.validate(languageTag, config.Validity)
		if err != nil {
			return nil, err
		}
	}
	
	return languageTag, nil
}

// parse performs the actual parsing of the tag parts
func (p *Parser) parse() error {
	for p.position < len(p.parts) {
		part := p.parts[p.position]
		
		if part == "" {
			return NewError(ErrorTypeInvalidSyntax, "empty subtag", p.tag, "")
		}
		
		switch p.state {
		case StateLanguage:
			if err := p.parseLanguage(part); err != nil {
				return err
			}
		case StateExtLang:
			if err := p.parseExtLang(part); err != nil {
				return err
			}
		case StateScript:
			if err := p.parseScript(part); err != nil {
				return err
			}
		case StateRegion:
			if err := p.parseRegion(part); err != nil {
				return err
			}
		case StateVariant:
			if err := p.parseVariant(part); err != nil {
				return err
			}
		case StateExtension:
			if err := p.parseExtension(part); err != nil {
				return err
			}
		case StatePrivateUse:
			if err := p.parsePrivateUse(part); err != nil {
				return err
			}
		default:
			return NewError(ErrorTypeInvalidStructure, "unexpected subtag", p.tag, part)
		}
		
		p.position++
	}
	
	return nil
}

// parseLanguage parses the primary language subtag
func (p *Parser) parseLanguage(part string) error {
	lowerPart := strings.ToLower(part)
	
	if !languagePattern.MatchString(lowerPart) {
		return NewError(ErrorTypeInvalidSyntax, "invalid language subtag", p.tag, part)
	}
	
	p.subtags.PrimaryLanguage = lowerPart
	p.state = StateExtLang
	return nil
}

// parseExtLang parses extended language subtags  
func (p *Parser) parseExtLang(part string) error {
	// For now, skip ExtLang parsing for well-formed tags since we don't have IANA registry
	// In the future, we should check against IANA ExtLang registry here
	// This ensures "en-USA" parses USA as region, not extlang
	
	// Move directly to script parsing
	p.state = StateScript
	return p.parseScript(part)
}

// parseScript parses the script subtag
func (p *Parser) parseScript(part string) error {
	// Check if this is a script subtag (4 letters, any case for well-formed)
	if scriptWellFormedPattern.MatchString(part) {
		// Normalize to title case for consistency
		p.subtags.Script = strings.Title(strings.ToLower(part))
		p.state = StateRegion
		return nil
	}
	
	// Not a script, try region
	p.state = StateRegion
	return p.parseRegion(part)
}

// parseRegion parses the region subtag
func (p *Parser) parseRegion(part string) error {
	// Check for private use singleton first (before region matching)
	if strings.ToLower(part) == PrivateUseSingleton {
		p.state = StatePrivateUse
		return nil
	}
	
	upperPart := strings.ToUpper(part)
	
	// For single characters, prefer region for uppercase, extension for lowercase
	if len(part) == 1 {
		if part >= "A" && part <= "Z" && part != "X" {
			// Uppercase single letter -> prefer region (e.g., en-U)
			if regionWellFormedPattern.MatchString(upperPart) {
				p.subtags.Region = upperPart
				p.state = StateVariant
				return nil
			}
		}
		
		// Check if this is an extension singleton
		if extensionPattern.MatchString(part) {
			p.state = StateExtension
			return p.parseExtension(part)
		}
	}
	
	// Check if this is a region subtag (well-formed)
	if regionWellFormedPattern.MatchString(upperPart) {
		p.subtags.Region = upperPart
		p.state = StateVariant
		return nil
	}
	
	// Check if this could be a variant (5-8 chars or 4 starting with digit)
	if variantPattern.MatchString(part) {
		p.state = StateVariant
		return p.parseVariant(part)
	}
	
	// If none of the above, it's an invalid subtag
	return NewError(ErrorTypeInvalidSyntax, "invalid subtag", p.tag, part)
}

// parseVariant parses variant subtags
func (p *Parser) parseVariant(part string) error {
	lowerPart := strings.ToLower(part)
	
	// Check if this is a variant
	if variantPattern.MatchString(lowerPart) {
		// Check for duplicates
		for _, existing := range p.subtags.Variants {
			if existing == lowerPart {
				return NewError(ErrorTypeDuplicateVariant, "duplicate variant subtag", p.tag, part)
			}
		}
		p.subtags.Variants = append(p.subtags.Variants, lowerPart)
		return nil
	}
	
	// Check if this is an extension singleton
	if len(part) == 1 && extensionPattern.MatchString(part) {
		p.state = StateExtension
		return p.parseExtension(part)
	}
	
	// Check if this is private use
	if strings.ToLower(part) == PrivateUseSingleton {
		p.state = StatePrivateUse
		return nil
	}
	
	return NewError(ErrorTypeInvalidSyntax, "invalid subtag", p.tag, part)
}

// parseExtension parses extension subtags
func (p *Parser) parseExtension(part string) error {
	lowerPart := strings.ToLower(part)
	
	// If this is a singleton, start a new extension
	if len(part) == 1 && extensionPattern.MatchString(part) {
		// Check for private use
		if lowerPart == PrivateUseSingleton {
			p.state = StatePrivateUse
			return nil
		}
		
		// Check for duplicate extension singletons
		if p.subtags.Extensions == nil {
			p.subtags.Extensions = make(map[string][]string)
		}
		
		if _, exists := p.subtags.Extensions[lowerPart]; exists {
			return NewError(ErrorTypeDuplicateExtension, "duplicate extension singleton", p.tag, part)
		}
		
		p.subtags.Extensions[lowerPart] = []string{}
		p.currentExtensionSingleton = lowerPart
		return nil
	}
	
	// This should be an extension subtag
	if !extensionSubtagPattern.MatchString(part) {
		return NewError(ErrorTypeInvalidSyntax, "invalid extension subtag", p.tag, part)
	}
	
	// Add to current extension
	if p.currentExtensionSingleton != "" {
		p.subtags.Extensions[p.currentExtensionSingleton] = append(p.subtags.Extensions[p.currentExtensionSingleton], lowerPart)
	}
	
	return nil
}

// parsePrivateUse parses private use subtags
func (p *Parser) parsePrivateUse(part string) error {
	// Skip the 'x' singleton itself
	if strings.ToLower(part) == PrivateUseSingleton {
		return nil
	}
	
	lowerPart := strings.ToLower(part)
	
	if !privateUsePattern.MatchString(lowerPart) {
		return NewError(ErrorTypeInvalidSyntax, "invalid private use subtag", p.tag, part)
	}
	
	p.subtags.PrivateUse = append(p.subtags.PrivateUse, lowerPart)
	return nil
}

// normalize applies normalization to the language tag
func (p *Parser) normalize(tag *LanguageTag, level TagNormalization) error {
	// TODO: Implement normalization using IANA registry data
	// For now, just apply basic case normalization
	
	if level >= Canonical {
		// Canonical normalization: proper case
		if tag.Subtags.PrimaryLanguage != "" {
			tag.Subtags.PrimaryLanguage = strings.ToLower(tag.Subtags.PrimaryLanguage)
		}
		
		for i, extlang := range tag.Subtags.ExtLangs {
			tag.Subtags.ExtLangs[i] = strings.ToLower(extlang)
		}
		
		if tag.Subtags.Script != "" {
			// Script should be title case (first letter upper, rest lower)
			script := strings.ToLower(tag.Subtags.Script)
			if len(script) > 0 {
				tag.Subtags.Script = strings.ToUpper(script[:1]) + script[1:]
			}
		}
		
		if tag.Subtags.Region != "" {
			// Region should be uppercase
			tag.Subtags.Region = strings.ToUpper(tag.Subtags.Region)
		}
		
		for i, variant := range tag.Subtags.Variants {
			tag.Subtags.Variants[i] = strings.ToLower(variant)
		}
		
		// Update the tag string
		tag.Tag = SubtagsToString(tag.Subtags)
	}
	
	if level >= Preferred {
		// TODO: Apply preferred value mappings from IANA registry
	}
	
	tag.normalization = level
	return nil
}

// validate applies validation to the language tag
func (p *Parser) validate(tag *LanguageTag, level TagValidity) error {
	// TODO: Implement validation using IANA registry data
	// For now, just validate basic structure
	
	if level >= Valid {
		// Check that we have a primary language (unless grandfathered)
		if !tag.IsGrandfathered && tag.Subtags.PrimaryLanguage == "" {
			return NewError(ErrorTypeUnknownLanguage, "missing primary language", tag.Tag, "")
		}
		
		// TODO: Validate against IANA registry
	}
	
	if level >= StrictlyValid {
		// TODO: Validate prefix requirements
	}
	
	tag.validity = level
	return nil
}