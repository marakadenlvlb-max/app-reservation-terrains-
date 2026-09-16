import { render, screen } from '@testing-library/react-native';
import { RecommandationsScreen } from './RecommandationsScreen';

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

const TERRAIN_RECOMMANDE = {
  terrainId: 'terrain-1',
  sport: 'foot',
  adresse: 'Rue 12, Dakar',
  type: null as string | null,
  photoPrincipale: null as string | null,
  equipements: ['vestiaires'],
  tarifMin: 12000,
};

beforeEach(() => {
  mockSecureStore.clear();
  mockSecureStore.set('auth_token', 'token-123');
});

describe('RecommandationsScreen', () => {
  it('affiche les terrains recommandés', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => [TERRAIN_RECOMMANDE] })
    ) as unknown as typeof fetch;
    render(<RecommandationsScreen />);

    expect(await screen.findByText(/rue 12, dakar/i)).toBeTruthy();
    expect(screen.getByText(/12000/)).toBeTruthy();
  });

  it("affiche un message clair quand il n'y a encore aucune recommandation", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => [] })) as unknown as typeof fetch;
    render(<RecommandationsScreen />);

    expect(await screen.findByText(/pas encore de recommandation/i)).toBeTruthy();
  });

  it("invite à se connecter si l'utilisateur n'a pas de session", async () => {
    mockSecureStore.clear();
    render(<RecommandationsScreen />);

    expect(await screen.findByText(/connecte-toi/i)).toBeTruthy();
  });

  // TC-025-04 (rapport-qa.md) : le pattern testé pour les listes sœurs (historique, reversements,
  // notifications, messagerie) manquait pour les recommandations elles-mêmes.
  it('affiche une erreur si le chargement des recommandations échoue', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, json: async () => null })) as unknown as typeof fetch;
    render(<RecommandationsScreen />);

    expect(await screen.findByText(/impossible de charger tes recommandations/i)).toBeTruthy();
  });
});
