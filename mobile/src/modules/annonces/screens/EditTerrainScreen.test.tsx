import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EditTerrainScreen } from './EditTerrainScreen';

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

const TERRAIN = {
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
  return jest.fn((url: string, options?: RequestInit) => {
    if (options?.method === 'PATCH') {
      return Promise.resolve({ ok: true, json: async () => ({ ...TERRAIN, adresse: 'Rue 20, Dakar' }) });
    }
    if (options?.method === 'DELETE') {
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }
    return Promise.resolve({ ok: true, json: async () => TERRAIN });
  });
}

beforeEach(() => {
  mockSecureStore.set('auth_token', 'token-123');
});

describe('EditTerrainScreen', () => {
  it("charge et affiche l'annonce existante", async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    render(<EditTerrainScreen terrainId="terrain-1" />);

    expect(await screen.findByDisplayValue('Rue 12, Dakar')).toBeTruthy();
  });

  it('enregistre les modifications et affiche une confirmation', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    render(<EditTerrainScreen terrainId="terrain-1" />);

    await screen.findByDisplayValue('Rue 12, Dakar');
    fireEvent.changeText(screen.getByLabelText('Adresse'), 'Rue 20, Dakar');
    fireEvent.press(screen.getByLabelText('Enregistrer'));

    expect(await screen.findByText(/annonce mise à jour/i)).toBeTruthy();
  });

  it("demande confirmation via une alerte native puis retire l'annonce", async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      // Simule l'utilisateur qui appuie sur le bouton destructif "Retirer".
      const destructive = buttons?.find((button) => button.style === 'destructive');
      destructive?.onPress?.();
    });
    render(<EditTerrainScreen terrainId="terrain-1" />);

    await screen.findByDisplayValue('Rue 12, Dakar');
    fireEvent.press(screen.getByLabelText("Retirer l'annonce"));

    expect(alertSpy).toHaveBeenCalled();
    expect(await screen.findByText(/annonce retirée/i)).toBeTruthy();
  });
});
