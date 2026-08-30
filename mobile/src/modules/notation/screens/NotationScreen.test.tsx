import { fireEvent, render, screen } from '@testing-library/react-native';
import { NotationScreen } from './NotationScreen';

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

function createFetchMock(overrides: { submitOk?: boolean } = {}) {
  return jest.fn((url: string, options?: RequestInit) => {
    if (options?.method === 'POST') {
      if (overrides.submitOk === false) {
        return Promise.resolve({ ok: false, json: async () => null });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'notation-1',
          reservationId: 'reservation-1',
          auteurId: 'user-1',
          cibleId: 'user-2',
          note: 5,
          commentaire: null,
          createdAt: '2026-08-30T10:00:00Z',
        }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({ utilisateurId: 'user-2', moyenne: 4.2, nombreAvis: 8 }) });
  });
}

beforeEach(() => {
  mockSecureStore.set('auth_token', 'token-123');
});

describe('NotationScreen', () => {
  it('affiche la note actuelle de la cible', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    render(<NotationScreen reservationId="reservation-1" cibleId="user-2" />);

    expect(await screen.findByText(/4\.2 \/ 5 \(8 avis\)/)).toBeTruthy();
  });

  it("affiche une erreur si aucune note n'est sélectionnée", async () => {
    const fetchMock = createFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<NotationScreen reservationId="reservation-1" cibleId="user-2" />);

    fireEvent.press(await screen.findByLabelText('Envoyer ma note'));

    expect(await screen.findByText(/sélectionne une note/i)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'POST' }));
  });

  it('envoie la notation et affiche une confirmation', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    render(<NotationScreen reservationId="reservation-1" cibleId="user-2" />);

    fireEvent.press(await screen.findByLabelText('5'));
    fireEvent.changeText(screen.getByLabelText('Commentaire'), 'Super session, très ponctuel.');
    fireEvent.press(screen.getByLabelText('Envoyer ma note'));

    expect(await screen.findByText(/note a bien été enregistrée/i)).toBeTruthy();
  });

  it("affiche une erreur si l'envoi échoue", async () => {
    global.fetch = createFetchMock({ submitOk: false }) as unknown as typeof fetch;
    render(<NotationScreen reservationId="reservation-1" cibleId="user-2" />);

    fireEvent.press(await screen.findByLabelText('4'));
    fireEvent.press(screen.getByLabelText('Envoyer ma note'));

    expect(await screen.findByText(/envoi de la notation a échoué/i)).toBeTruthy();
  });
});
