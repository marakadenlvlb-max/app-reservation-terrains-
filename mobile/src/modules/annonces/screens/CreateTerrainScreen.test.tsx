import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { CreateTerrainScreen } from './CreateTerrainScreen';

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

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'file://terrain.jpg', fileName: 'terrain.jpg', mimeType: 'image/jpeg' }],
    })
  ),
  MediaTypeOptions: { Images: 'Images' },
}));

const CREATED_TERRAIN = {
  id: 'terrain-1',
  proprietaireId: 'user-1',
  sport: 'foot',
  adresse: 'Rue 12, Dakar',
  latitude: null as number | null,
  longitude: null as number | null,
  type: null as string | null,
  equipements: [] as string[],
  photos: [] as string[],
};

function createFetchMock() {
  return jest.fn((url: string) => {
    if (url.includes('/photos')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ photoUrl: 'https://cdn.example.com/terrain.jpg' }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => CREATED_TERRAIN });
  });
}

beforeEach(() => {
  mockSecureStore.clear();
  mockSecureStore.set('auth_token', 'token-123');
});

/**
 * CreateTerrainScreen affiche son formulaire immédiatement, sans attendre la résolution du
 * token (contrairement à ReserverCreneauBouton/ProfileScreen, qui gardent un état "pas encore
 * lu" explicite) — c'est voulu, la saisie ne dépend pas de la session avant l'envoi. Mais ça
 * veut dire que rien dans l'UI ne signale quand `mobileSessionStorage.getToken()` (une chaîne de
 * promesses sur expo-secure-store) a fini de se résoudre. `setTimeout(0)` cède la main après
 * toutes les microtâches en attente, garantissant que le token est bien appliqué avant qu'on
 * interagisse avec le formulaire — sans lui, ce test devient aléatoire (passe ou échoue selon le
 * nombre exact de ticks déjà écoulés).
 */
async function flushToken() {
  // Enveloppé dans act() : la résolution du token déclenche un setState (dans le composant)
  // pendant ce flush, que React attend de voir sous act() pour ne pas avertir.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('CreateTerrainScreen', () => {
  it("affiche les erreurs de validation et n'appelle pas l'API si sport/adresse manquent", async () => {
    const fetchMock = createFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<CreateTerrainScreen />);
    await flushToken();

    fireEvent.press(screen.getByLabelText("Publier l'annonce"));

    expect(await screen.findByText(/sélectionne le sport/i)).toBeTruthy();
    expect(screen.getByText(/adresse est requise/i)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('publie une annonce valide et passe à la section photos', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    render(<CreateTerrainScreen />);
    await flushToken();

    fireEvent.press(screen.getByLabelText('Foot'));
    fireEvent.changeText(screen.getByLabelText('Adresse'), 'Rue 12, Dakar');
    fireEvent.press(screen.getByLabelText("Publier l'annonce"));

    expect(await screen.findByText(/annonce publiée/i)).toBeTruthy();
  });

  it('sélectionne et envoie une photo une fois le terrain créé', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    render(<CreateTerrainScreen />);
    await flushToken();

    fireEvent.press(screen.getByLabelText('Basket'));
    fireEvent.changeText(screen.getByLabelText('Adresse'), 'Rue 12, Dakar');
    fireEvent.press(screen.getByLabelText("Publier l'annonce"));
    await screen.findByText(/annonce publiée/i);

    fireEvent.press(screen.getByLabelText('Ajouter une photo'));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/terrains/terrain-1/photos'),
        expect.any(Object)
      )
    );
  });
});
