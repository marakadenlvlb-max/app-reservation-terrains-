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

function createFetchMock(overrides: { updateOk?: boolean; deleteOk?: boolean; loadOk?: boolean } = {}) {
  return jest.fn((url: string, options?: RequestInit) => {
    if (options?.method === 'PATCH') {
      if (overrides.updateOk === false) {
        return Promise.resolve({ ok: false, json: async () => ({ message: 'La modification a échoué.' }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ...TERRAIN, adresse: 'Rue 20, Dakar' }) });
    }
    if (options?.method === 'DELETE') {
      if (overrides.deleteOk === false) {
        return Promise.resolve({ ok: false, json: async () => ({ message: 'Créneaux encore réservés.' }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }
    if (overrides.loadOk === false) {
      return Promise.resolve({ ok: false, json: async () => null });
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

  // TC-006-05 (rapport-qa.md) : ce cas existait côté web (EditTerrainForm.test.tsx) mais le mock
  // mobile ne supportait même pas `deleteOk` — écart de parité relevé en session QA.
  it("affiche l'erreur du backend si le retrait est refusé (ex. créneaux encore réservés)", async () => {
    global.fetch = createFetchMock({ deleteOk: false }) as unknown as typeof fetch;
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const destructive = buttons?.find((button) => button.style === 'destructive');
      destructive?.onPress?.();
    });
    render(<EditTerrainScreen terrainId="terrain-1" />);

    await screen.findByDisplayValue('Rue 12, Dakar');
    fireEvent.press(screen.getByLabelText("Retirer l'annonce"));

    expect(await screen.findByText(/créneaux encore réservés/i)).toBeTruthy();
  });

  // TC-006-06 (rapport-qa.md) : tous les autres tests supposent la confirmation acceptée —
  // aucun ne vérifiait le chemin "annuler".
  it("n'appelle pas l'API de retrait si l'utilisateur annule l'alerte de confirmation", async () => {
    const fetchMock = createFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      // Simule l'utilisateur qui appuie sur "Annuler" plutôt que le bouton destructif.
      const cancel = buttons?.find((button) => button.style === 'cancel');
      cancel?.onPress?.();
    });
    render(<EditTerrainScreen terrainId="terrain-1" />);

    await screen.findByDisplayValue('Rue 12, Dakar');
    fireEvent.press(screen.getByLabelText("Retirer l'annonce"));

    expect(fetchMock).not.toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'DELETE' }));
    expect(screen.getByDisplayValue('Rue 12, Dakar')).toBeTruthy();
  });

  // TC-006-07 (rapport-qa.md) : seule la modification valide était testée.
  it("affiche une erreur de validation si l'adresse est vidée, sans appeler l'API", async () => {
    const fetchMock = createFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<EditTerrainScreen terrainId="terrain-1" />);

    await screen.findByDisplayValue('Rue 12, Dakar');
    fireEvent.changeText(screen.getByLabelText('Adresse'), '');
    fireEvent.press(screen.getByLabelText('Enregistrer'));

    expect(await screen.findByText(/adresse est requise/i)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'PATCH' }));
  });

  // TC-006-08 (rapport-qa.md) : seul le succès du chargement était testé.
  it("affiche une erreur bloquante si le chargement de l'annonce échoue", async () => {
    global.fetch = createFetchMock({ loadOk: false }) as unknown as typeof fetch;
    render(<EditTerrainScreen terrainId="terrain-1" />);

    expect(await screen.findByText(/annonce/i)).toBeTruthy();
  });

  // TC-006-09 (rapport-qa.md) : le mock ne supportait même pas `updateOk` côté mobile.
  it('affiche une erreur si la modification échoue, sans vider le formulaire', async () => {
    global.fetch = createFetchMock({ updateOk: false }) as unknown as typeof fetch;
    render(<EditTerrainScreen terrainId="terrain-1" />);

    await screen.findByDisplayValue('Rue 12, Dakar');
    fireEvent.changeText(screen.getByLabelText('Adresse'), 'Rue 20, Dakar');
    fireEvent.press(screen.getByLabelText('Enregistrer'));

    expect(await screen.findByText(/modification a échoué/i)).toBeTruthy();
    expect(screen.getByDisplayValue('Rue 20, Dakar')).toBeTruthy();
  });

  // TC-006-10 / BUG-005 (rapport-qa.md, corrigé le 31 août 2026) : un utilisateur déjà
  // authentifié ne doit jamais voir "Connecte-toi..." s'afficher, même brièvement.
  it("n'affiche jamais le message de connexion pour un utilisateur déjà authentifié", async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    render(<EditTerrainScreen terrainId="terrain-1" />);

    expect(screen.queryByText(/connecte-toi/i)).toBeNull();

    await screen.findByDisplayValue('Rue 12, Dakar');
    expect(screen.queryByText(/connecte-toi/i)).toBeNull();
  });
});
