import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { LogoutButton } from './LogoutButton';

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

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  mockSecureStore.set('auth_token', 'existing-token');
});

describe('LogoutButton', () => {
  it('efface le token de session au clic', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    render(<LogoutButton />);

    fireEvent.press(screen.getByLabelText('Se déconnecter'));

    await waitFor(() => expect(mockSecureStore.has('auth_token')).toBe(false));
  });

  it("efface quand même le token en local si l'appel au backend échoue", async () => {
    fetchMock.mockRejectedValueOnce(new Error('network error'));
    render(<LogoutButton />);

    fireEvent.press(screen.getByLabelText('Se déconnecter'));

    await waitFor(() => expect(mockSecureStore.has('auth_token')).toBe(false));
  });
});
