jest.mock('@simplewebauthn/browser');

import '@fgv/ts-utils-jest';
import * as upstream from '@simplewebauthn/browser';
import {
  startAuthentication,
  startRegistration,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
  type StartAuthenticationOpts,
  type StartRegistrationOpts
} from '../../index';

describe('startRegistration', () => {
  const mockOpts: StartRegistrationOpts = {
    optionsJSON: {
      challenge: 'abc123',
      rp: { name: 'Test RP', id: 'test.example.com' },
      user: { id: 'user-id', name: 'user@test.com', displayName: 'Test User' },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      timeout: 60000,
      attestation: 'none'
    }
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns Success wrapping upstream result on success', async () => {
    const mockResult = { id: 'cred-id', type: 'public-key' } as RegistrationResponseJSON;
    jest.mocked(upstream.startRegistration).mockResolvedValueOnce(mockResult);
    expect(await startRegistration(mockOpts)).toSucceedWith(mockResult);
  });

  test('returns Failure capturing upstream error message on throw', async () => {
    jest
      .mocked(upstream.startRegistration)
      .mockRejectedValueOnce(new Error('Registration ceremony was sent an abort signal'));
    expect(await startRegistration(mockOpts)).toFailWith(/registration ceremony was sent an abort signal/i);
  });
});

describe('startAuthentication', () => {
  const mockOpts: StartAuthenticationOpts = {
    optionsJSON: {
      challenge: 'xyz789',
      rpId: 'test.example.com',
      timeout: 60000,
      userVerification: 'preferred'
    }
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns Success wrapping upstream result on success', async () => {
    const mockResult = { id: 'cred-id', type: 'public-key' } as AuthenticationResponseJSON;
    jest.mocked(upstream.startAuthentication).mockResolvedValueOnce(mockResult);
    expect(await startAuthentication(mockOpts)).toSucceedWith(mockResult);
  });

  test('returns Failure capturing upstream error message on throw', async () => {
    jest
      .mocked(upstream.startAuthentication)
      .mockRejectedValueOnce(new Error('Authentication ceremony was sent an abort signal'));
    expect(await startAuthentication(mockOpts)).toFailWith(
      /authentication ceremony was sent an abort signal/i
    );
  });
});
