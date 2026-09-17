import { fireEvent, render, screen } from '@testing-library/react-native';
import { pushMock } from '../../../testUtils/expoRouterMocks';
import { MesAnnoncesScreen } from './MesAnnoncesScreen';

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
  pushMock.mockReset();
});

describe('MesAnnoncesScreen', () => {
  it("invite à se connecter si aucune session n'est active", async () => {
    await render(<MesAnnoncesScreen />);

    expect(await screen.findByText(/connecte-toi/i)).toBeTruthy();
  });

  it('affiche les annonces du propriétaire/gestionnaire connecté et navigue au clic', async () => {
    mockSecureStore.set('auth_token', 'token-123');
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => [
          {
            id: 'terrain-1',
            proprietaireId: 'user-1',
            sport: 'football',
            adresse: '12 rue du Stade',
            latitude: null,
            longitude: null,
            type: null,
            equipements: [],
            photos: [],
            paliers: [],
            fraisAnnulationPourcentage: 5,
          },
        ],
      })
    ) as unknown as typeof fetch;

    await render(<MesAnnoncesScreen />);

    expect(await screen.findByText(/12 rue du stade/i)).toBeTruthy();

    await fireEvent.press(screen.getByText(/modifier/i));
    expect(pushMock).toHaveBeenCalledWith('/terrains/terrain-1/modifier');

    await fireEvent.press(screen.getByText(/gérer les créneaux/i));
    expect(pushMock).toHaveBeenCalledWith('/terrains/terrain-1/creneaux');
  });

  it("affiche un message si l'utilisateur n'a encore publié aucune annonce", async () => {
    mockSecureStore.set('auth_token', 'token-123');
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => [] })) as unknown as typeof fetch;

    await render(<MesAnnoncesScreen />);

    expect(await screen.findByText(/aucune annonce/i)).toBeTruthy();
  });
});
