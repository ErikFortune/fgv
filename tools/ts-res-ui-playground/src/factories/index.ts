/**
 * Custom qualifier type and resource type factories for the ts-res-ui-playground.
 * These factories demonstrate how to extend the ts-res system with custom types.
 */

export { ContrastQualifierType } from './ContrastQualifierType';
export type {
  IContrastQualifierTypeConfig,
  IContrastQualifierTypeCreateParams
} from './ContrastQualifierType';

export { ContrastQualifierTypeFactory, contrastQualifierTypeFactory } from './ContrastQualifierTypeFactory';
