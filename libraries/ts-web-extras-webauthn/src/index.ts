import {
  startRegistration as _startRegistration,
  startAuthentication as _startAuthentication
} from '@simplewebauthn/browser';
import type {
  StartRegistrationOpts,
  RegistrationResponseJSON,
  StartAuthenticationOpts,
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON
} from '@simplewebauthn/browser';
import { captureAsyncResult, type Result } from '@fgv/ts-utils';

export type {
  StartRegistrationOpts,
  RegistrationResponseJSON,
  StartAuthenticationOpts,
  AuthenticationResponseJSON,
  /**
   * The options objects a caller passes in. Re-exported so consumers can name the type they mean
   * rather than dereferencing to it via indexed access off `StartRegistrationOpts` — which works,
   * and which a consumer was doing because these two were simply omitted here rather than
   * deliberately withheld.
   */
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON
};

/**
 * Result-integration wrapper around `@simplewebauthn/browser`'s `startRegistration`.
 * Returns `Promise<Result<RegistrationResponseJSON>>`; upstream errors are captured
 * as `Failure` with the original message.
 * @see https://simplewebauthn.dev/docs/packages/browser
 * @public
 */
export async function startRegistration(
  options: StartRegistrationOpts
): Promise<Result<RegistrationResponseJSON>> {
  return captureAsyncResult(() => _startRegistration(options));
}

/**
 * Result-integration wrapper around `@simplewebauthn/browser`'s `startAuthentication`.
 * Returns `Promise<Result<AuthenticationResponseJSON>>`; upstream errors are captured
 * as `Failure` with the original message.
 * @see https://simplewebauthn.dev/docs/packages/browser
 * @public
 */
export async function startAuthentication(
  options: StartAuthenticationOpts
): Promise<Result<AuthenticationResponseJSON>> {
  return captureAsyncResult(() => _startAuthentication(options));
}
