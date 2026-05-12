import {
  startRegistration as _startRegistration,
  startAuthentication as _startAuthentication
} from '@simplewebauthn/browser';
import type {
  StartRegistrationOpts,
  RegistrationResponseJSON,
  StartAuthenticationOpts,
  AuthenticationResponseJSON
} from '@simplewebauthn/browser';
import { captureAsyncResult, type Result } from '@fgv/ts-utils';

export type {
  StartRegistrationOpts,
  RegistrationResponseJSON,
  StartAuthenticationOpts,
  AuthenticationResponseJSON
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
