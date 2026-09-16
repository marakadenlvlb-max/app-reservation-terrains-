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

  // TC-010-04 (rapport-qa.md) : tous les tests existants utilisaient un `expireA` dans le futur.
  it('affiche un message clair quand le délai de verrouillage a expiré', async () => {
    mockSecureStore.set('auth_token', 'token-123');
    // Expiré depuis 1 seconde : dans la marge de grâce du polling (useReservationStatus.ts),
    // donc le statut reste 'en_attente_paiement' comme le renverrait réellement le backend dans
    // cette fenêtre — c'est useCountdown (basé sur l'horloge, pas sur le statut) qui doit
    // détecter l'expiration côté UI.
    const expireA = new Date(Date.now() - 1000).toISOString();
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

    expect(await screen.findByText(/délai a expiré/i)).toBeTruthy();
  });

  // TC-010-05 (rapport-qa.md) : la désactivation du bouton pendant l'appel n'était jamais vérifiée.
  it('désactive le bouton "Réserver" pendant que la réservation est en cours', async () => {
    mockSecureStore.set('auth_token', 'token-123');
    let resolveFetch: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    global.fetch = jest.fn(() => pending) as unknown as typeof fetch;
    render(<ReserverCreneauBouton creneauId="creneau-1" />);

    fireEvent.press(await screen.findByLabelText('Réserver'));

    const bouton = await screen.findByLabelText('Réserver');
    expect(bouton.props.accessibilityState.disabled).toBe(true);

    // Résout la promesse et attend la retombée du re-rendu qui en découle.
    resolveFetch({
      ok: true,
      json: async () => ({
        id: 'reservation-1',
        creneauId: 'creneau-1',
        joueurId: 'user-1',
        statut: 'en_attente_paiement',
        montant: 15000,
        createdAt: new Date().toISOString(),
        expireA: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }),
    });
    await screen.findByText(/créneau verrouillé/i);
  });

  // TC-011-03 (rapport-qa.md, US-11 / RF-014) : aucun test n'exerçait un échec du polling
  // lui-même (distinct d'un paiement refusé, où le backend répond `ok: true` avec statut
  // 'annulee') — ici c'est l'appel de vérification qui échoue techniquement.
  it('affiche une erreur de polling sans faire disparaître le compte à rebours', async () => {
    mockSecureStore.set('auth_token', 'token-123');
    const expireA = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    let callCount = 0;
    global.fetch = jest.fn(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.resolve({
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
        });
      }
      return Promise.resolve({ ok: false, json: async () => null });
    }) as unknown as typeof fetch;
    render(<ReserverCreneauBouton creneauId="creneau-1" />);

    fireEvent.press(await screen.findByLabelText('Réserver'));

    expect(await screen.findByText(/créneau verrouillé/i)).toBeTruthy();
    expect(await screen.findByText(/impossible de vérifier le statut/i)).toBeTruthy();
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
