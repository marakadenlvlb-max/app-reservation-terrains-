import { fireEvent, render, screen } from '@testing-library/react-native';
import { CreneauxScreen } from './CreneauxScreen';

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

const EXISTING_CRENEAU = {
  id: 'creneau-1',
  terrainId: 'terrain-1',
  debut: '2026-09-01T18:00',
  fin: '2026-09-01T19:00',
  tarif: 15000,
  statut: 'disponible',
};

const NEW_CRENEAU = {
  id: 'creneau-2',
  terrainId: 'terrain-1',
  debut: '2026-09-02T10:00',
  fin: '2026-09-02T11:00',
  tarif: 15000,
  statut: 'disponible',
};

const RESERVED_CRENEAU = {
  id: 'creneau-3',
  terrainId: 'terrain-1',
  debut: '2026-09-03T18:00',
  fin: '2026-09-03T19:00',
  tarif: 20000,
  statut: 'reserve',
};

function createFetchMock(
  overrides: { createOk?: boolean; list?: typeof EXISTING_CRENEAU[] } = {}
) {
  return jest.fn((url: string, options?: RequestInit) => {
    if (options?.method === 'POST') {
      if (overrides.createOk === false) {
        return Promise.resolve({ ok: false, json: async () => null });
      }
      return Promise.resolve({ ok: true, json: async () => NEW_CRENEAU });
    }
    if (options?.method === 'PATCH') {
      return Promise.resolve({ ok: true, json: async () => ({ ...EXISTING_CRENEAU, tarif: 18000 }) });
    }
    if (options?.method === 'DELETE') {
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }
    return Promise.resolve({ ok: true, json: async () => overrides.list ?? [EXISTING_CRENEAU] });
  });
}

beforeEach(() => {
  mockSecureStore.set('auth_token', 'token-123');
});

describe('CreneauxScreen', () => {
  it('charge et affiche les créneaux existants', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    render(<CreneauxScreen terrainId="terrain-1" />);

    expect(await screen.findByText(/2026-09-01T18:00/)).toBeTruthy();
  });

  it("affiche les erreurs de validation et n'appelle pas l'API de création si le formulaire est incomplet", async () => {
    const fetchMock = createFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<CreneauxScreen terrainId="terrain-1" />);

    await screen.findByText(/2026-09-01T18:00/);
    fireEvent.press(screen.getByLabelText('Ajouter le créneau'));

    expect(await screen.findByText(/début requises/i)).toBeTruthy();
    expect(screen.getByText(/fin requises/i)).toBeTruthy();
    expect(screen.getByText(/tarif doit être un nombre positif/i)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'POST' }));
  });

  it('ajoute un créneau valide à la liste', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    render(<CreneauxScreen terrainId="terrain-1" />);

    await screen.findByText(/2026-09-01T18:00/);
    fireEvent.changeText(screen.getByLabelText('Début'), '2026-09-02T10:00');
    fireEvent.changeText(screen.getByLabelText('Fin'), '2026-09-02T11:00');
    fireEvent.changeText(screen.getByLabelText('Tarif'), '15000');
    fireEvent.press(screen.getByLabelText('Ajouter le créneau'));

    expect(await screen.findByText(/2026-09-02T10:00/)).toBeTruthy();
  });

  it('modifie un créneau existant', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    render(<CreneauxScreen terrainId="terrain-1" />);

    await screen.findByText(/2026-09-01T18:00/);
    fireEvent.press(screen.getByLabelText(/^modifier le créneau/i));
    fireEvent.changeText(screen.getByLabelText(/^tarif du créneau/i), '18000');
    fireEvent.press(screen.getByLabelText('Enregistrer'));

    expect(await screen.findByText(/18000/)).toBeTruthy();
  });

  it('retire un créneau existant', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    render(<CreneauxScreen terrainId="terrain-1" />);

    await screen.findByText(/2026-09-01T18:00/);
    fireEvent.press(screen.getByLabelText(/^retirer le créneau/i));

    expect(await screen.findByText(/aucun créneau défini/i)).toBeTruthy();
  });

  it('désactive la modification et le retrait pour un créneau déjà réservé', async () => {
    global.fetch = createFetchMock({ list: [RESERVED_CRENEAU] }) as unknown as typeof fetch;
    render(<CreneauxScreen terrainId="terrain-1" />);

    await screen.findByText(/2026-09-03T18:00/);
    // Pressable ne propage pas `disabled` tel quel sur le nœud hôte rendu : il le fond dans
    // `accessibilityState.disabled` (confirmé en exécutant ce test, voir aussi le commentaire
    // équivalent dans CreneauxManager pour la version web).
    expect(screen.getByLabelText(/^modifier le créneau/i).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByLabelText(/^retirer le créneau/i).props.accessibilityState.disabled).toBe(true);
  });
});
