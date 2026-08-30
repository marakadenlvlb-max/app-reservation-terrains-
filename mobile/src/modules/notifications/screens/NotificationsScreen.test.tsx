import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NotificationsScreen } from './NotificationsScreen';

const mockSecureStore = new Map<string, string>([['auth_token', 'token-123']]);
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

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[xxxx]' })),
}));

const NOTIF_CONFIRMATION = {
  id: 'notif-1',
  reservationId: 'reservation-1',
  type: 'confirmation_reservation',
  titre: 'Réservation confirmée',
  message: 'Ta réservation du terrain de Rue 12, Dakar est confirmée.',
  lue: false,
  createdAt: '2026-08-30T10:00:00Z',
};

function createFetchMock(overrides: { list?: (typeof NOTIF_CONFIRMATION)[] } = {}) {
  return jest.fn((url: string, options?: RequestInit) => {
    if (typeof url === 'string' && url.includes('/push-tokens')) {
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }
    if (options?.method === 'PATCH') {
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }
    return Promise.resolve({ ok: true, json: async () => overrides.list ?? [NOTIF_CONFIRMATION] });
  });
}

beforeEach(() => {
  mockSecureStore.clear();
  mockSecureStore.set('auth_token', 'token-123');
});

describe('NotificationsScreen', () => {
  it('affiche les notifications reçues', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    render(<NotificationsScreen />);

    expect(await screen.findByText('Réservation confirmée')).toBeTruthy();
  });

  it('marque une notification comme lue', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    render(<NotificationsScreen />);

    await screen.findByText('Réservation confirmée');
    fireEvent.press(screen.getByLabelText(/marquer comme lue/i));

    // fireEvent est synchrone : il ne faut pas s'attendre à ce que le passage de `lue` à `true`
    // (piloté par un appel API asynchrone dans markAsRead) soit déjà appliqué juste après.
    await waitFor(() => expect(screen.queryByLabelText(/marquer comme lue/i)).toBeNull());
  });

  it("affiche un message clair quand il n'y a encore aucune notification", async () => {
    global.fetch = createFetchMock({ list: [] }) as unknown as typeof fetch;
    render(<NotificationsScreen />);

    expect(await screen.findByText(/aucune notification/i)).toBeTruthy();
  });

  it('enregistre le jeton push une fois la permission accordée', async () => {
    const fetchMock = createFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<NotificationsScreen />);

    await screen.findByText('Réservation confirmée');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/push-tokens'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ pushToken: 'ExponentPushToken[xxxx]' }),
      })
    );
  });
});
