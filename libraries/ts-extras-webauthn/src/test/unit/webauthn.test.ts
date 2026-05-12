jest.mock('@simplewebauthn/server');

import '@fgv/ts-utils-jest';
import * as upstream from '@simplewebauthn/server';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type GenerateAuthenticationOptionsOpts,
  type GenerateRegistrationOptionsOpts,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
  type VerifiedAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifyAuthenticationResponseOpts,
  type VerifyRegistrationResponseOpts,
  type WebAuthnCredential
} from '../../index';

describe('generateRegistrationOptions', () => {
  const mockOpts: GenerateRegistrationOptionsOpts = {
    rpName: 'Test RP',
    rpID: 'test.example.com',
    userName: 'user@test.com'
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns Success wrapping upstream result on success', async () => {
    const mockResult = { challenge: 'abc123' } as PublicKeyCredentialCreationOptionsJSON;
    jest.mocked(upstream.generateRegistrationOptions).mockResolvedValueOnce(mockResult);
    expect(await generateRegistrationOptions(mockOpts)).toSucceedWith(mockResult);
  });

  test('returns Failure capturing upstream error message on throw', async () => {
    jest
      .mocked(upstream.generateRegistrationOptions)
      .mockRejectedValueOnce(new Error('Challenge is not in the correct format'));
    expect(await generateRegistrationOptions(mockOpts)).toFailWith(/challenge is not in the correct format/i);
  });
});

describe('verifyRegistrationResponse', () => {
  const mockOpts: VerifyRegistrationResponseOpts = {
    response: {
      id: 'cred-id',
      rawId: 'cred-raw-id',
      response: {
        clientDataJSON: 'client-data',
        attestationObject: 'attestation-object'
      },
      clientExtensionResults: {},
      type: 'public-key'
    } as RegistrationResponseJSON,
    expectedChallenge: 'challenge123',
    expectedOrigin: 'https://test.example.com',
    expectedRPID: 'test.example.com'
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns Success wrapping upstream result on success', async () => {
    const mockResult = { verified: true } as VerifiedRegistrationResponse;
    jest.mocked(upstream.verifyRegistrationResponse).mockResolvedValueOnce(mockResult);
    expect(await verifyRegistrationResponse(mockOpts)).toSucceedWith(mockResult);
  });

  test('returns Failure capturing upstream error message on throw', async () => {
    jest
      .mocked(upstream.verifyRegistrationResponse)
      .mockRejectedValueOnce(new Error('The authenticator response contained invalid attestation'));
    expect(await verifyRegistrationResponse(mockOpts)).toFailWith(/invalid attestation/i);
  });
});

describe('generateAuthenticationOptions', () => {
  const mockOpts: GenerateAuthenticationOptionsOpts = {
    rpID: 'test.example.com'
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns Success wrapping upstream result on success', async () => {
    const mockResult = { challenge: 'xyz789' } as PublicKeyCredentialRequestOptionsJSON;
    jest.mocked(upstream.generateAuthenticationOptions).mockResolvedValueOnce(mockResult);
    expect(await generateAuthenticationOptions(mockOpts)).toSucceedWith(mockResult);
  });

  test('returns Failure capturing upstream error message on throw', async () => {
    jest
      .mocked(upstream.generateAuthenticationOptions)
      .mockRejectedValueOnce(new Error('Unexpected authentication response type'));
    expect(await generateAuthenticationOptions(mockOpts)).toFailWith(
      /unexpected authentication response type/i
    );
  });
});

describe('verifyAuthenticationResponse', () => {
  const mockCredential: WebAuthnCredential = {
    id: 'cred-id',
    publicKey: new Uint8Array([1, 2, 3]),
    counter: 0,
    transports: ['usb']
  };

  const mockOpts: VerifyAuthenticationResponseOpts = {
    response: {
      id: 'cred-id',
      rawId: 'cred-raw-id',
      response: {
        clientDataJSON: 'client-data',
        authenticatorData: 'auth-data',
        signature: 'sig'
      },
      clientExtensionResults: {},
      type: 'public-key'
    } as AuthenticationResponseJSON,
    expectedChallenge: 'challenge123',
    expectedOrigin: 'https://test.example.com',
    expectedRPID: 'test.example.com',
    credential: mockCredential
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns Success wrapping upstream result on success', async () => {
    const mockResult = { verified: true } as unknown as VerifiedAuthenticationResponse;
    jest.mocked(upstream.verifyAuthenticationResponse).mockResolvedValueOnce(mockResult);
    expect(await verifyAuthenticationResponse(mockOpts)).toSucceedWith(mockResult);
  });

  test('returns Failure capturing upstream error message on throw', async () => {
    jest
      .mocked(upstream.verifyAuthenticationResponse)
      .mockRejectedValueOnce(new Error('Credential counter value for given response must be larger than 0'));
    expect(await verifyAuthenticationResponse(mockOpts)).toFailWith(/credential counter value/i);
  });
});
