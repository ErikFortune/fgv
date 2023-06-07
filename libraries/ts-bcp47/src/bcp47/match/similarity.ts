/*
 * Copyright (c) 2022 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import * as Iana from '../../iana';
import * as Unsd from '../../unsd';

import { LanguageSubtag, RegionSubtag } from '../../iana/language-subtags';
import { IsoAlpha2RegionCode, UnM49RegionCode } from '../../iana/model';
import { DefaultRegistries, OverridesRegistry } from '../overrides';

import { GlobalRegion } from '../common';
import { LanguageTag } from '../languageTag';
import { tagSimilarity } from './common';

/**
 * Helper to compare two language tags to determine how closely related they are,
 * applying normalization and language semantics as appropriate.
 * @public
 */
export class LanguageSimilarityMatcher {
  public iana: Iana.LanguageRegistries;
  public unsd: Unsd.RegionCodes;
  public overrides: OverridesRegistry;

  public constructor(iana?: Iana.LanguageRegistries) {
    // istanbul ignore next
    this.iana = iana ?? Iana.DefaultRegistries.languageRegistries;
    this.unsd = Unsd.DefaultRegistries.regionCodes;
    this.overrides = DefaultRegistries.overridesRegistry;
  }

  public matchLanguageTags(t1: LanguageTag, t2: LanguageTag): number {
    // no primary tag is either all private or grandfathered, which must match
    // exactly.
    if (!t1.subtags.primaryLanguage || !t2.subtags.primaryLanguage) {
      return t1.toString().toLowerCase() === t2.toString().toLowerCase()
        ? tagSimilarity.exact
        : tagSimilarity.none;
    }

    let quality = this.matchPrimaryLanguage(t1, t2);
    quality = quality > tagSimilarity.none ? Math.min(this.matchExtlang(t1, t2), quality) : quality;
    quality = quality > tagSimilarity.none ? Math.min(this.matchScript(t1, t2), quality) : quality;
    quality = quality > tagSimilarity.none ? Math.min(this.matchRegion(t1, t2), quality) : quality;
    quality = quality > tagSimilarity.none ? Math.min(this.matchVariants(t1, t2), quality) : quality;
    quality = quality > tagSimilarity.none ? Math.min(this.matchExtensions(t1, t2), quality) : quality;
    quality = quality > tagSimilarity.none ? Math.min(this.matchPrivateUseTags(t1, t2), quality) : quality;

    return quality;
  }

  public matchPrimaryLanguage(lt1: LanguageTag, lt2: LanguageTag): number {
    // istanbul ignore next
    const l1 = lt1.subtags.primaryLanguage?.toLowerCase();
    // istanbul ignore next
    const l2 = lt2.subtags.primaryLanguage?.toLowerCase();

    if (l1 === l2) {
      return tagSimilarity.exact;
    }

    if (lt1.isUndetermined || lt2.isUndetermined) {
      return tagSimilarity.undetermined;
    }

    return tagSimilarity.none;
  }

  public matchExtlang(lt1: LanguageTag, lt2: LanguageTag): number {
    if (lt1.subtags.extlangs?.length !== lt2.subtags.extlangs?.length) {
      return tagSimilarity.none;
    }

    if (lt1.subtags.extlangs) {
      for (let i = 0; i < lt1.subtags.extlangs.length; i++) {
        if (lt1.subtags.extlangs[i].toLowerCase() !== lt2.subtags.extlangs![i].toLowerCase()) {
          return tagSimilarity.none;
        }
      }
    }

    return tagSimilarity.exact;
  }

  public matchScript(lt1: LanguageTag, lt2: LanguageTag): number {
    const s1 = lt1.effectiveScript?.toLowerCase();
    const s2 = lt2.effectiveScript?.toLowerCase();

    if (s1 === s2) {
      return tagSimilarity.exact;
    }

    if (lt1.isUndetermined || lt2.isUndetermined) {
      return tagSimilarity.undetermined;
    }

    return tagSimilarity.none;
  }

  public matchRegion(lt1: LanguageTag, lt2: LanguageTag): number {
    const r1 = lt1.subtags.region?.toUpperCase() as RegionSubtag;
    const r2 = lt2.subtags.region?.toUpperCase() as RegionSubtag;

    if (r1 === r2) {
      return tagSimilarity.exact;
    }

    // region 001 is equivalent to neutral (no region)
    if (r1 === GlobalRegion || r2 === GlobalRegion) {
      // if one tag is 001 and the other in neutral, exact match
      // otherwise, one tag is 001 so neutral region match
      return !r1 || !r2 ? tagSimilarity.exact : tagSimilarity.neutralRegion;
    }

    if (!r1 || !r2) {
      return tagSimilarity.neutralRegion;
    }

    // macro-region match
    const r1IsMacroRegion = Iana.Validate.unM49RegionCode.isWellFormed(r1);
    const r2IsMacroRegion = Iana.Validate.unM49RegionCode.isWellFormed(r2);
    if (r1IsMacroRegion || r2IsMacroRegion) {
      let contained: Unsd.ICountryOrArea | Unsd.Region | undefined;
      let container: Unsd.Region | undefined;
      if (r1IsMacroRegion) {
        container = this.unsd.regions.tryGetRegion(r1 as unknown as UnM49RegionCode);
        contained =
          this.unsd.areas.tryGetAlpha2Area(r2 as unknown as IsoAlpha2RegionCode) ??
          this.unsd.tryGetRegionOrArea(r2 as unknown as UnM49RegionCode);
      } else {
        container = this.unsd.regions.tryGetRegion(r2 as unknown as UnM49RegionCode);
        contained = this.unsd.areas.tryGetAlpha2Area(r1 as unknown as IsoAlpha2RegionCode);
      }
      if (container && contained) {
        if (this.unsd.getIsContained(container, contained)) {
          return tagSimilarity.macroRegion;
        }

        // if they're both regions, also check to see if the second region contains the
        // first
        if (contained.tier !== 'area' && this.unsd.getIsContained(contained, container)) {
          return tagSimilarity.macroRegion;
        }
      }
    }

    // istanbul ignore next
    const o1 = this.overrides.overrides.get(lt1.subtags.primaryLanguage?.toLowerCase() as LanguageSubtag);
    // istanbul ignore next
    const o2 = this.overrides.overrides.get(lt2.subtags.primaryLanguage?.toLowerCase() as LanguageSubtag);

    // orthographic affinity
    if (o1 && o2) {
      // istanbul ignore next
      const a1 = o1.affinity?.get(r1) ?? o1.defaultAffinity;
      // istanbul ignore next
      const a2 = o2.affinity?.get(r2) ?? o2.defaultAffinity;
      if (a1 && a2 && a1 === a2) {
        if (r1 === a1.toUpperCase() || r2 === a2.toUpperCase()) {
          return tagSimilarity.preferredAffinity;
        }
        return tagSimilarity.affinity;
      }
    }

    // preferred region
    if (o1?.preferredRegion === r1 || o2?.preferredRegion === r2) {
      return tagSimilarity.preferredRegion;
    }

    return tagSimilarity.sibling;
  }

  public matchVariants(lt1: LanguageTag, lt2: LanguageTag): number {
    if (lt1.subtags.variants?.length !== lt2.subtags.variants?.length) {
      return tagSimilarity.region;
    }

    if (lt1.subtags.variants) {
      for (let i = 0; i < lt1.subtags.variants.length; i++) {
        if (lt1.subtags.variants[i].toLowerCase() !== lt2.subtags.variants![i].toLowerCase()) {
          return tagSimilarity.region;
        }
      }
    }

    return tagSimilarity.exact;
  }

  public matchExtensions(lt1: LanguageTag, lt2: LanguageTag): number {
    if (lt1.subtags.extensions?.length !== lt2.subtags.extensions?.length) {
      return tagSimilarity.variant;
    }

    if (lt1.subtags.extensions) {
      for (let i = 0; i < lt1.subtags.extensions.length; i++) {
        if (
          lt1.subtags.extensions[i].singleton.toLowerCase() !==
            lt2.subtags.extensions![i].singleton.toLowerCase() ||
          lt1.subtags.extensions[i].value.toLowerCase() !== lt2.subtags.extensions![i].value.toLowerCase()
        ) {
          return tagSimilarity.variant;
        }
      }
    }

    return tagSimilarity.exact;
  }

  public matchPrivateUseTags(lt1: LanguageTag, lt2: LanguageTag): number {
    if (lt1.subtags.privateUse?.length !== lt2.subtags.privateUse?.length) {
      return tagSimilarity.variant;
    }

    if (lt1.subtags.privateUse) {
      for (let i = 0; i < lt1.subtags.privateUse.length; i++) {
        if (lt1.subtags.privateUse[i].toLowerCase() !== lt2.subtags.privateUse![i].toLowerCase()) {
          return tagSimilarity.variant;
        }
      }
    }

    return tagSimilarity.exact;
  }
}
