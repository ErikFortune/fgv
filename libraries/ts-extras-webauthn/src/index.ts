import {
  generateRegistrationOptions as _generateRegistrationOptions,
  verifyRegistrationResponse as _verifyRegistrationResponse,
  generateAuthenticationOptions as _generateAuthenticationOptions,
  verifyAuthenticationResponse as _verifyAuthenticationResponse
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  PublicKeyCredentialCreationOptionsJSON,
  VerifyRegistrationResponseOpts,
  VerifiedRegistrationResponse,
  GenerateAuthenticationOptionsOpts,
  PublicKeyCredentialRequestOptionsJSON,
  VerifyAuthenticationResponseOpts,
  VerifiedAuthenticationResponse,
  WebAuthnCredential,
  RegistrationResponseJSON,
  AuthenticationResponseJSON
} from '@simplewebauthn/server';
import { captureAsyncResult, type Result } from '@fgv/ts-utils';

export type {
  GenerateRegistrationOptionsOpts,
  PublicKeyCredentialCreationOptionsJSON,
  VerifyRegistrationResponseOpts,
  VerifiedRegistrationResponse,
  GenerateAuthenticationOptionsOpts,
  PublicKeyCredentialRequestOptionsJSON,
  VerifyAuthenticationResponseOpts,
  VerifiedAuthenticationResponse,
  WebAuthnCredential,
  RegistrationResponseJSON,
  AuthenticationResponseJSON
};

/**
 * Result-integration wrapper around `@simplewebauthn/server`'s `generateRegistrationOptions`.
 * Returns `Promise<Result<PublicKeyCredentialCreationOptionsJSON>>`; upstream errors are captured
 * as `Failure` with the original message.
 * @see https://simplewebauthn.dev/docs/packages/server
 * @public
 */
export async function generateRegistrationOptions(
  options: GenerateRegistrationOptionsOpts
): Promise<Result<PublicKeyCredentialCreationOptionsJSON>> {
  return captureAsyncResult(() => _generateRegistrationOptions(options));
}

/**
 * Result-integration wrapper around `@simplewebauthn/server`'s `verifyRegistrationResponse`.
 * Returns `Promise<Result<VerifiedRegistrationResponse>>`; upstream errors are captured
 * as `Failure` with the original message.
 * @see https://simplewebauthn.dev/docs/packages/server
 * @public
 */
export async function verifyRegistrationResponse(
  options: VerifyRegistrationResponseOpts
): Promise<Result<VerifiedRegistrationResponse>> {
  return captureAsyncResult(() => _verifyRegistrationResponse(options));
}

/**
 * Result-integration wrapper around `@simplewebauthn/server`'s `generateAuthenticationOptions`.
 * Returns `Promise<Result<PublicKeyCredentialRequestOptionsJSON>>`; upstream errors are captured
 * as `Failure` with the original message.
 * @see https://simplewebauthn.dev/docs/packages/server
 * @public
 */
export async function generateAuthenticationOptions(
  options: GenerateAuthenticationOptionsOpts
): Promise<Result<PublicKeyCredentialRequestOptionsJSON>> {
  return captureAsyncResult(() => _generateAuthenticationOptions(options));
}

/**
 * Result-integration wrapper around `@simplewebauthn/server`'s `verifyAuthenticationResponse`.
 * Returns `Promise<Result<VerifiedAuthenticationResponse>>`; upstream errors are captured
 * as `Failure` with the original message.
 * @see https://simplewebauthn.dev/docs/packages/server
 * @public
 */
export async function verifyAuthenticationResponse(
  options: VerifyAuthenticationResponseOpts
): Promise<Result<VerifiedAuthenticationResponse>> {
  return captureAsyncResult(() => _verifyAuthenticationResponse(options));
}
