import { render, screen } from '@testing-library/react-native';
import { ReversementsScreen } from './ReversementsScreen';

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

const REVERSEMENT_EFFECTUE = {
  paiementId: 'paiement-1',
  reservationId: 'reservation-1',
  operateur: 'wave',
  montant: 15000,
  commission: 1500,
  montantNet: 13500,
  statutReversement: 'effectue',
  datePaiement: '2026-08-25T18:00:00Z',
  dateReversement: '2026-08-28T09:00:00Z',
};

beforeEach(() => {
  mockSecureStore.clear();
});

describe('ReversementsScreen', () => {
  it('affiche la liste des reversements avec montant net et statut', async () => {
    mockSecureStore.set('auth_token', 'token-123');
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => [REVERSEMENT_EFFECTUE] })
    ) as unknown as typeof fetch;
    render(<ReversementsScreen />);

    expect(await screen.findByText(/net 13500/i)).toBeTruthy();
    expect(screen.getByText(/wave.*effectué/i)).toBeTruthy();
  });

  it("affiche un message clair quand il n'y a encore aucun reversement", async () => {
    mockSecureStore.set('auth_token', 'token-123');
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => [] })) as unknown as typeof fetch;
    render(<ReversementsScreen />);

    expect(await screen.findByText(/aucun reversement/i)).toBeTruthy();
  });

  it("invite à se connecter si l'utilisateur n'a pas de session", async () => {
    render(<ReversementsScreen />);

    expect(await screen.findByText(/connecte-toi/i)).toBeTruthy();
  });
});
