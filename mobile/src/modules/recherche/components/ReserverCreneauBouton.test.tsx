import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReserverCreneauBouton } from './ReserverCreneauBouton';

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
});

describe('ReserverCreneauBouton', () => {
  it("invite à se connecter si l'utilisateur n'a pas de session", async () => {
    render(<ReserverCreneauBouton creneauId="creneau-1" />);

    expect(await screen.findByText(/connecte-toi pour réserver/i)).toBeTruthy();
  });

  it('verrouille le créneau et affiche un compte à rebours après réservation', async () => {
    mockSecureStore.set('auth_token', 'token-123');
    const expireA = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'reservation-1',
          creneauId: 'creneau-1',
          joueurId: 'user-1',
          statut: 'en_attente_paiement',
          montant: 15000,
          createdAt: new Date().toISOString(),
          expireA,
        }),
      })
    ) as unknown as typeof fetch;
    render(<ReserverCreneauBouton creneauId="creneau-1" />);

    fireEvent.press(await screen.findByLabelText('Réserver'));

    expect(await screen.findByText(/créneau verrouillé/i)).toBeTruthy();
    expect(screen.getByText(/9:5\d|10:00/)).toBeTruthy();
  });

  it("affiche une erreur si le créneau vient déjà d'être réservé par quelqu'un d'autre", async () => {
    mockSecureStore.set('auth_token', 'token-123');
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false, json: async () => ({ message: 'Ce créneau est déjà réservé.' }) })
    ) as unknown as typeof fetch;
    render(<ReserverCreneauBouton creneauId="creneau-1" />);

    fireEvent.press(await screen.findByLabelText('Réserver'));

    expect(await screen.findByText(/déjà réservé/i)).toBeTruthy();
  });

  it('affiche la confirmation dès que le polling détecte un paiement validé côté backend (US-11)', async () => {
    mockSecureStore.set('auth_token', 'token-123');
    const expireA = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    let callCount = 0;
    global.fetch = jest.fn(() => {
      callCount += 1;
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'reservation-1',
          creneauId: 'creneau-1',
          joueurId: 'user-1',
          statut: callCount === 1 ? 'en_attente_paiement' : 'confirmee',
          montant: 15000,
          createdAt: new Date().toISOString(),
          expireA,
        }),
      });
    }) as unknown as typeof fetch;
    render(<ReserverCreneauBouton creneauId="creneau-1" />);

    fireEvent.press(await screen.findByLabelText('Réserver'));

    expect(await screen.findByText(/réservation confirmée/i)).toBeTruthy();
  });

  it('affiche un message clair si la réservation est annulée (paiement refusé)', async () => {
    mockSecureStore.set('auth_token', 'token-123');
    const expireA = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    let callCount = 0;
    global.fetch = jest.fn(() => {
      callCount += 1;
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'reservation-1',
          creneauId: 'creneau-1',
          joueurId: 'user-1',
          statut: callCount === 1 ? 'en_attente_paiement' : 'annulee',
          montant: 15000,
          createdAt: new Date().toISOString(),
          expireA,
        }),
      });
    }) as unknown as typeof fetch;
    render(<ReserverCreneauBouton creneauId="creneau-1" />);

    fireEvent.press(await screen.findByLabelText('Réserver'));

    expect(await screen.findByText(/réservation a été annulée/i)).toBeTruthy();
  });
});
