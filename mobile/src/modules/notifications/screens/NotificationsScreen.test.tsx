import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
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

const NOTIF_RAPPEL = {
  id: 'notif-2',
  reservationId: 'reservation-1',
  type: 'rappel_creneau',
  titre: 'Rappel de créneau',
  message: 'Ton créneau commence dans 1 heure.',
  lue: true,
  createdAt: '2026-08-30T17:00:00Z',
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

  // TC-021-02 (rapport-qa.md) : trou de parité mobile — le web teste déjà le type "rappel", pas
  // le mobile jusqu'ici (seule la fixture de confirmation était utilisée dans ce fichier).
  it('affiche une notification de rappel de créneau avec son libellé (RF-020)', async () => {
    global.fetch = createFetchMock({ list: [NOTIF_RAPPEL] }) as unknown as typeof fetch;
    render(<NotificationsScreen />);

    expect(await screen.findByText('Rappel de créneau')).toBeTruthy();
    expect(screen.getByText(/1 heure/i)).toBeTruthy();
  });

  // TC-021-04 (rapport-qa.md) : le chemin "permission refusée" est explicitement prévu par
  // usePushRegistration.ts ("ce n'est pas une erreur applicative") mais n'était testé nulle part.
  it("ne tente aucun enregistrement et n'affiche aucune erreur si la permission push est refusée", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'undetermined' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    const fetchMock = createFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<NotificationsScreen />);

    await screen.findByText('Réservation confirmée');

    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/push-tokens'), expect.anything());
    expect(screen.queryByText(/impossible d'activer les notifications push/i)).toBeNull();
  });

  // Régression du correctif signalé en QA (rapport-qa.md, session US-21) : `registerError` était
  // auparavant ignoré par NotificationsScreen — un échec d'enregistrement du jeton push restait
  // invisible, alors que c'est le seul canal permettant à un rappel (US-21) d'atteindre
  // l'utilisateur hors de l'application.
  it("affiche un avertissement si l'enregistrement du jeton push échoue", async () => {
    global.fetch = jest.fn((url: string) => {
      if (typeof url === 'string' && url.includes('/push-tokens')) {
        return Promise.resolve({ ok: false, json: async () => null });
      }
      return Promise.resolve({ ok: true, json: async () => [NOTIF_CONFIRMATION] });
    }) as unknown as typeof fetch;
    render(<NotificationsScreen />);

    expect(await screen.findByText(/impossible d'activer les notifications push/i)).toBeTruthy();
    // Non bloquant : le journal in-app reste normalement consultable malgré l'échec du push.
    expect(screen.getByText('Réservation confirmée')).toBeTruthy();
  });

  // TC-020-05 (rapport-qa.md) : le pattern testé pour les listes sœurs (historique, reversements)
  // manquait pour les notifications elles-mêmes.
  it('affiche une erreur si le chargement des notifications échoue', async () => {
    global.fetch = jest.fn((url: string) => {
      if (typeof url === 'string' && url.includes('/push-tokens')) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({ ok: false, json: async () => null });
    }) as unknown as typeof fetch;
    render(<NotificationsScreen />);

    expect(await screen.findByText(/impossible de charger tes notifications/i)).toBeTruthy();
  });

  // TC-020-06 (rapport-qa.md) : comportement volontaire (useNotifications.ts) jamais verrouillé —
  // un échec du marquage comme lue ne doit pas afficher d'erreur bruyante, la notification reste
  // simplement affichée comme non lue.
  it('laisse la notification affichée comme non lue si le marquage échoue, sans erreur bruyante', async () => {
    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (typeof url === 'string' && url.includes('/push-tokens')) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (options?.method === 'PATCH') {
        return Promise.resolve({ ok: false, json: async () => null });
      }
      return Promise.resolve({ ok: true, json: async () => [NOTIF_CONFIRMATION] });
    }) as unknown as typeof fetch;
    render(<NotificationsScreen />);

    await screen.findByText('Réservation confirmée');
    fireEvent.press(screen.getByLabelText(/marquer comme lue/i));

    expect(await screen.findByLabelText(/marquer comme lue/i)).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  // TC-020-07 (rapport-qa.md) : trou de parité mobile — testé côté web mais pas mobile.
  it("invite à se connecter si l'utilisateur n'a pas de session", async () => {
    mockSecureStore.clear();
    render(<NotificationsScreen />);

    expect(await screen.findByText(/connecte-toi/i)).toBeTruthy();
  });
});
