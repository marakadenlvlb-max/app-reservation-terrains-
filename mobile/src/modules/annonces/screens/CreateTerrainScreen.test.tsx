import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { getItemAsync } from 'expo-secure-store';
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

function createFetchMock(overrides: { createOk?: boolean; photoOk?: boolean } = {}) {
  return jest.fn((url: string) => {
    if (url.includes('/photos')) {
      if (overrides.photoOk === false) {
        return Promise.resolve({ ok: false, json: async () => null });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ photoUrl: 'https://cdn.example.com/terrain.jpg' }),
      });
    }
    if (overrides.createOk === false) {
      return Promise.resolve({ ok: false, json: async () => null });
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
    await render(<CreateTerrainScreen />);
    await flushToken();

    await fireEvent.press(screen.getByLabelText("Publier l'annonce"));

    expect(await screen.findByText(/sélectionne le sport/i)).toBeTruthy();
    expect(screen.getByText(/adresse est requise/i)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('publie une annonce valide et passe à la section photos', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    await render(<CreateTerrainScreen />);
    await flushToken();

    await fireEvent.press(screen.getByLabelText('Foot'));
    await fireEvent.changeText(screen.getByLabelText('Adresse'), 'Rue 12, Dakar');
    await fireEvent.press(screen.getByLabelText("Publier l'annonce"));

    expect(await screen.findByText(/annonce publiée/i)).toBeTruthy();
  });

  it('sélectionne et envoie une photo une fois le terrain créé', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    await render(<CreateTerrainScreen />);
    await flushToken();

    await fireEvent.press(screen.getByLabelText('Basket'));
    await fireEvent.changeText(screen.getByLabelText('Adresse'), 'Rue 12, Dakar');
    await fireEvent.press(screen.getByLabelText("Publier l'annonce"));
    await screen.findByText(/annonce publiée/i);

    await fireEvent.press(screen.getByLabelText('Ajouter une photo'));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/terrains/terrain-1/photos'),
        expect.any(Object)
      )
    );
  });

  // TC-004-04 (rapport-qa.md) : ce cas existait côté web (CreateTerrainForm.test.tsx) mais pas
  // côté mobile — écart de parité entre les deux suites relevé en session QA.
  it("affiche une erreur si la publication échoue côté API", async () => {
    global.fetch = createFetchMock({ createOk: false }) as unknown as typeof fetch;
    await render(<CreateTerrainScreen />);
    await flushToken();

    await fireEvent.press(screen.getByLabelText('Tennis'));
    await fireEvent.changeText(screen.getByLabelText('Adresse'), 'Rue 12, Dakar');
    await fireEvent.press(screen.getByLabelText("Publier l'annonce"));

    expect(await screen.findByText(/publication.*échoué/i)).toBeTruthy();
  });

  // TC-004-06 (rapport-qa.md) : seul le succès de l'upload était testé.
  it("affiche une erreur si l'envoi de la photo échoue, sans bloquer l'écran", async () => {
    global.fetch = createFetchMock({ photoOk: false }) as unknown as typeof fetch;
    await render(<CreateTerrainScreen />);
    await flushToken();

    await fireEvent.press(screen.getByLabelText('Foot'));
    await fireEvent.changeText(screen.getByLabelText('Adresse'), 'Rue 12, Dakar');
    await fireEvent.press(screen.getByLabelText("Publier l'annonce"));
    await screen.findByText(/annonce publiée/i);

    await fireEvent.press(screen.getByLabelText('Ajouter une photo'));

    expect(await screen.findByText(/l'envoi de la photo a échoué/i)).toBeTruthy();
    expect(screen.getByLabelText('Ajouter une photo')).toBeTruthy();
  });

  // TC-004-07 / BUG-003 (rapport-qa.md, corrigé le 31 août 2026) : une soumission avant la
  // résolution du token ne doit plus jamais rejeter à tort un utilisateur réellement connecté.
  it("désactive \"Publier l'annonce\" tant que le token de session n'est pas encore résolu", async () => {
    const fetchMock = createFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;

    // RTL v14 (`render`/`fireEvent` async, cf. React 19) draine les micro-tâches en attente à
    // chaque `act()` interne — le `Promise.resolve()` par défaut de `getItemAsync` (mocké plus
    // haut) résoudrait donc avant même la première assertion, rendant impossible d'observer l'état
    // transitoire "token pas encore résolu" qu'on veut vérifier ici. On le remplace, pour ce test
    // seulement, par une promesse qu'on ne résout que nous-mêmes, une fois les assertions faites.
    let resolveToken!: (value: string | null) => void;
    (getItemAsync as jest.Mock).mockImplementationOnce(
      () => new Promise<string | null>((resolve) => { resolveToken = resolve; })
    );

    await render(<CreateTerrainScreen />);
    // Pas de résolution du token ici : c'est précisément le moment où BUG-003 provoquait un faux rejet.

    await fireEvent.press(screen.getByLabelText('Foot'));
    await fireEvent.changeText(screen.getByLabelText('Adresse'), 'Rue 12, Dakar');
    expect(screen.getByLabelText("Publier l'annonce").props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByLabelText("Publier l'annonce"));
    expect(screen.queryByText(/connecte-toi pour publier/i)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();

    // Une fois le token résolu (session bien valide), la publication doit fonctionner normalement.
    await act(async () => {
      resolveToken('token-123');
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await fireEvent.press(screen.getByLabelText("Publier l'annonce"));

    expect(await screen.findByText(/annonce publiée/i)).toBeTruthy();
  });
});
