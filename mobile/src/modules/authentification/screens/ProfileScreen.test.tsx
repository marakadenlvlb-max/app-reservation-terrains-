import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ProfileScreen } from './ProfileScreen';

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
      assets: [{ uri: 'file://photo.jpg', fileName: 'photo.jpg', mimeType: 'image/jpeg' }],
    })
  ),
  MediaTypeOptions: { Images: 'Images' },
}));

const PROFILE = {
  utilisateurId: 'user-1',
  nom: 'Awa Diallo',
  ville: 'Dakar',
  photoUrl: null as string | null,
  sports: ['foot'],
};

function createFetchMock() {
  return jest.fn((url: string, options?: RequestInit) => {
    if (url.includes('/api/profile/photo')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ photoUrl: 'https://cdn.example.com/photo.jpg' }),
      });
    }
    if (options?.method === 'PATCH') {
      return Promise.resolve({ ok: true, json: async () => ({ ...PROFILE, ville: 'Abidjan' }) });
    }
    return Promise.resolve({ ok: true, json: async () => PROFILE });
  });
}

beforeEach(() => {
  mockSecureStore.clear();
  mockSecureStore.set('auth_token', 'token-123');
});

describe('ProfileScreen', () => {
  it('charge et affiche le profil existant', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    await render(<ProfileScreen />);

    expect(await screen.findByDisplayValue('Awa Diallo')).toBeTruthy();
    expect(screen.getByDisplayValue('Dakar')).toBeTruthy();
  });

  it('affiche une erreur de validation si le nom est vidé', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    await render(<ProfileScreen />);

    await screen.findByDisplayValue('Awa Diallo');
    await fireEvent.changeText(screen.getByLabelText('Nom'), '');
    await fireEvent.press(screen.getByLabelText('Enregistrer'));

    expect(await screen.findByText(/le nom est requis/i)).toBeTruthy();
  });

  it('enregistre les modifications et affiche une confirmation', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    await render(<ProfileScreen />);

    await screen.findByDisplayValue('Awa Diallo');
    await fireEvent.changeText(screen.getByLabelText('Ville'), 'Abidjan');
    await fireEvent.press(screen.getByLabelText('Enregistrer'));

    expect(await screen.findByText(/profil mis à jour/i)).toBeTruthy();
  });

  it('sélectionne et envoie une nouvelle photo de profil', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    await render(<ProfileScreen />);

    await screen.findByDisplayValue('Awa Diallo');
    await fireEvent.press(screen.getByLabelText('Changer la photo de profil'));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile/photo'),
        expect.any(Object)
      )
    );
  });

  // TC-003-05 (rapport-qa.md) : seul le nom était testé comme champ invalide ; le sport, lui
  // aussi requis par validateProfilePayload, n'avait aucun cas dédié.
  it('affiche une erreur de validation si tous les sports sont décochés', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    await render(<ProfileScreen />);

    await screen.findByDisplayValue('Awa Diallo');
    await fireEvent.press(screen.getByLabelText('Foot')); // décoche l'unique sport déjà sélectionné
    await fireEvent.press(screen.getByLabelText('Enregistrer'));

    expect(await screen.findByText(/sélectionne au moins un sport/i)).toBeTruthy();
  });

  // TC-003-06 (rapport-qa.md) : seul le succès du chargement était testé.
  it('affiche une erreur bloquante si le chargement du profil échoue', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, json: async () => null })) as unknown as typeof fetch;
    await render(<ProfileScreen />);

    expect(await screen.findByText(/profil/i)).toBeTruthy();
  });

  // TC-003-07 (rapport-qa.md) : le code porte un commentaire explicite ("une fois chargé, une
  // erreur ultérieure ne doit pas faire disparaître le formulaire") jamais vérifié par un test.
  it('affiche une erreur de sauvegarde sans faire disparaître le formulaire déjà chargé', async () => {
    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'PATCH') {
        return Promise.resolve({ ok: false, json: async () => ({ message: 'La mise à jour a échoué.' }) });
      }
      return Promise.resolve({ ok: true, json: async () => PROFILE });
    }) as unknown as typeof fetch;
    await render(<ProfileScreen />);

    await screen.findByDisplayValue('Awa Diallo');
    await fireEvent.changeText(screen.getByLabelText('Ville'), 'Abidjan');
    await fireEvent.press(screen.getByLabelText('Enregistrer'));

    expect(await screen.findByText(/mise à jour a échoué/i)).toBeTruthy();
    expect(screen.getByDisplayValue('Abidjan')).toBeTruthy();
  });

  // TC-003-08 (rapport-qa.md) : seul le succès de l'upload était testé.
  it("affiche une erreur si l'envoi de la photo échoue, sans bloquer le reste du formulaire", async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/api/profile/photo')) {
        return Promise.resolve({ ok: false, json: async () => ({ message: "L'envoi de la photo a échoué." }) });
      }
      return Promise.resolve({ ok: true, json: async () => PROFILE });
    }) as unknown as typeof fetch;
    await render(<ProfileScreen />);

    await screen.findByDisplayValue('Awa Diallo');
    await fireEvent.press(screen.getByLabelText('Changer la photo de profil'));

    expect(await screen.findByText(/l'envoi de la photo a échoué/i)).toBeTruthy();
    expect(screen.getByDisplayValue('Awa Diallo')).toBeTruthy();
  });

  // TC-003-09 / BUG-002 (rapport-qa.md, corrigé le 31 août 2026) : un utilisateur déjà
  // authentifié ne doit jamais voir "Connecte-toi..." s'afficher, même brièvement, au chargement.
  it("n'affiche jamais le message de connexion pour un utilisateur déjà authentifié", async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    await render(<ProfileScreen />);

    expect(screen.queryByText(/connecte-toi/i)).toBeNull();

    await screen.findByDisplayValue('Awa Diallo');
    expect(screen.queryByText(/connecte-toi/i)).toBeNull();
  });
});
