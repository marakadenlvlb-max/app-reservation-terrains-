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
    render(<ProfileScreen />);

    expect(await screen.findByDisplayValue('Awa Diallo')).toBeTruthy();
    expect(screen.getByDisplayValue('Dakar')).toBeTruthy();
  });

  it('affiche une erreur de validation si le nom est vidé', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    render(<ProfileScreen />);

    await screen.findByDisplayValue('Awa Diallo');
    fireEvent.changeText(screen.getByLabelText('Nom'), '');
    fireEvent.press(screen.getByLabelText('Enregistrer'));

    expect(await screen.findByText(/le nom est requis/i)).toBeTruthy();
  });

  it('enregistre les modifications et affiche une confirmation', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    render(<ProfileScreen />);

    await screen.findByDisplayValue('Awa Diallo');
    fireEvent.changeText(screen.getByLabelText('Ville'), 'Abidjan');
    fireEvent.press(screen.getByLabelText('Enregistrer'));

    expect(await screen.findByText(/profil mis à jour/i)).toBeTruthy();
  });

  it('sélectionne et envoie une nouvelle photo de profil', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    render(<ProfileScreen />);

    await screen.findByDisplayValue('Awa Diallo');
    fireEvent.press(screen.getByLabelText('Changer la photo de profil'));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile/photo'),
        expect.any(Object)
      )
    );
  });
});
