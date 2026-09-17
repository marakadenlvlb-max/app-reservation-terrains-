import { render, waitFor } from '@testing-library/react-native';
import { replaceMock } from '../../../testUtils/expoRouterMocks';
import { RootRedirect } from './RootRedirect';

const mockSecureStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string) => Promise.resolve(mockSecureStore.get(key) ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockSecureStore.set(key, value);
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    mockSecureStore.delete(key);
    return Promise.resolve();
  }),
}));

beforeEach(() => {
  mockSecureStore.clear();
  replaceMock.mockReset();
});

describe('RootRedirect', () => {
  it('redirige vers /accueil pour un utilisateur connecté', async () => {
    mockSecureStore.set('auth_token', 'token-123');
    await render(<RootRedirect />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/accueil'));
  });

  it('redirige vers /connexion pour un utilisateur non connecté', async () => {
    await render(<RootRedirect />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/connexion'));
  });
});
