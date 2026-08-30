import { render, screen } from '@testing-library/react-native';
import { HistoriqueScreen } from './HistoriqueScreen';

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

const RESERVATION_A_VENIR = {
  id: 'reservation-1',
  statut: 'confirmee',
  montant: 15000,
  createdAt: '2026-08-20T10:00:00Z',
  terrain: { id: 'terrain-1', sport: 'foot', adresse: 'Rue 12, Dakar' },
  creneau: { id: 'creneau-1', debut: '2099-09-01T18:00:00Z', fin: '2099-09-01T19:00:00Z' },
  autrePartie: { id: 'user-2', nom: 'Awa Diallo' },
};

const RESERVATION_PASSEE = {
  id: 'reservation-2',
  statut: 'confirmee',
  montant: 20000,
  createdAt: '2026-01-10T10:00:00Z',
  terrain: { id: 'terrain-2', sport: 'tennis', adresse: 'Avenue 5, Dakar' },
  creneau: { id: 'creneau-2', debut: '2026-01-15T18:00:00Z', fin: '2026-01-15T19:00:00Z' },
  autrePartie: { id: 'user-3', nom: 'Moussa Ba' },
};

beforeEach(() => {
  mockSecureStore.clear();
  mockSecureStore.set('auth_token', 'token-123');
});

describe('HistoriqueScreen', () => {
  it.each([
    { role: 'joueur' as const, url: '/api/reservations/mes-reservations', titre: /mes réservations/i },
    { role: 'proprietaire' as const, url: '/api/reservations/recues', titre: /réservations reçues/i },
  ])('charge le bon endpoint et affiche le bon titre pour le rôle %s', async ({ role, url, titre }) => {
    const fetchMock = jest.fn(() => Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR] }));
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<HistoriqueScreen role={role} />);

    expect(await screen.findByText(titre)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(url), expect.any(Object));
  });

  it('propose "Noter cette session" uniquement pour une réservation confirmée et passée', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR, RESERVATION_PASSEE] })
    ) as unknown as typeof fetch;
    render(<HistoriqueScreen role="joueur" />);

    await screen.findByText(/awa diallo/i);
    expect(screen.getAllByText(/noter cette session/i)).toHaveLength(1);
  });

  it("affiche un message clair quand il n'y a encore aucune réservation", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => [] })) as unknown as typeof fetch;
    render(<HistoriqueScreen role="joueur" />);

    expect(await screen.findByText(/aucune réservation/i)).toBeTruthy();
  });

  it("invite à se connecter si l'utilisateur n'a pas de session", async () => {
    mockSecureStore.clear();
    render(<HistoriqueScreen role="joueur" />);

    expect(await screen.findByText(/connecte-toi/i)).toBeTruthy();
  });
});
