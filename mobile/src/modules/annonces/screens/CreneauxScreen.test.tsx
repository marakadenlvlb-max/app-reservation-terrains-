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
  overrides: {
    createOk?: boolean;
    updateOk?: boolean;
    removeOk?: boolean;
    listOk?: boolean;
    list?: typeof EXISTING_CRENEAU[];
  } = {}
) {
  return jest.fn((url: string, options?: RequestInit) => {
    if (options?.method === 'POST') {
      if (overrides.createOk === false) {
        return Promise.resolve({ ok: false, json: async () => ({ message: "L'ajout du créneau a échoué." }) });
      }
      return Promise.resolve({ ok: true, json: async () => NEW_CRENEAU });
    }
    if (options?.method === 'PATCH') {
      if (overrides.updateOk === false) {
        return Promise.resolve({ ok: false, json: async () => ({ message: 'La modification a échoué.' }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ...EXISTING_CRENEAU, tarif: 18000 }) });
    }
    if (options?.method === 'DELETE') {
      if (overrides.removeOk === false) {
        return Promise.resolve({ ok: false, json: async () => ({ message: 'Le retrait a échoué.' }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }
    if (overrides.listOk === false) {
      return Promise.resolve({ ok: false, json: async () => null });
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

  // TC-005-04 (rapport-qa.md) : ce cas existait côté web (CreneauxManager.test.tsx) mais pas
  // côté mobile — écart de parité relevé en session QA.
  it('rejette un créneau dont la fin précède le début', async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    render(<CreneauxScreen terrainId="terrain-1" />);

    await screen.findByText(/2026-09-01T18:00/);
    fireEvent.changeText(screen.getByLabelText('Début'), '2026-09-02T10:00');
    fireEvent.changeText(screen.getByLabelText('Fin'), '2026-09-02T09:00');
    fireEvent.changeText(screen.getByLabelText('Tarif'), '15000');
    fireEvent.press(screen.getByLabelText('Ajouter le créneau'));

    expect(await screen.findByText(/fin doit être après le début/i)).toBeTruthy();
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

  // TC-005-09 (rapport-qa.md) : aucun test ne simulait un échec du chargement initial.
  it('affiche une erreur bloquante si le chargement des créneaux échoue', async () => {
    global.fetch = createFetchMock({ listOk: false }) as unknown as typeof fetch;
    render(<CreneauxScreen terrainId="terrain-1" />);

    expect(await screen.findByText(/créneaux/i)).toBeTruthy();
  });

  // TC-005-10 (rapport-qa.md) : le mock supportait déjà `createOk: false` mais aucun test ne
  // l'invoquait.
  it("affiche une erreur si l'ajout d'un créneau échoue, sans vider le formulaire", async () => {
    global.fetch = createFetchMock({ createOk: false }) as unknown as typeof fetch;
    render(<CreneauxScreen terrainId="terrain-1" />);

    await screen.findByText(/2026-09-01T18:00/);
    fireEvent.changeText(screen.getByLabelText('Début'), '2026-09-02T10:00');
    fireEvent.changeText(screen.getByLabelText('Fin'), '2026-09-02T11:00');
    fireEvent.changeText(screen.getByLabelText('Tarif'), '15000');
    fireEvent.press(screen.getByLabelText('Ajouter le créneau'));

    expect(await screen.findByText(/l'ajout du créneau a échoué/i)).toBeTruthy();
    expect(screen.getByLabelText('Début').props.value).toBe('2026-09-02T10:00');
  });

  // TC-005-11 (rapport-qa.md) : comportement documenté en commentaire ("ne referme le mode
  // édition qu'en cas de succès réel") mais jamais vérifié par un test.
  it('affiche une erreur de modification et laisse le mode édition ouvert', async () => {
    global.fetch = createFetchMock({ updateOk: false }) as unknown as typeof fetch;
    render(<CreneauxScreen terrainId="terrain-1" />);

    await screen.findByText(/2026-09-01T18:00/);
    fireEvent.press(screen.getByLabelText(/^modifier le créneau/i));
    fireEvent.changeText(screen.getByLabelText(/^tarif du créneau/i), '18000');
    fireEvent.press(screen.getByLabelText('Enregistrer'));

    expect(await screen.findByText(/modification a échoué/i)).toBeTruthy();
    expect(screen.getByLabelText('Enregistrer')).toBeTruthy();
  });

  // TC-005-12 (rapport-qa.md) : aucun test ne simulait un échec du retrait.
  it('affiche une erreur de retrait et garde le créneau dans la liste', async () => {
    global.fetch = createFetchMock({ removeOk: false }) as unknown as typeof fetch;
    render(<CreneauxScreen terrainId="terrain-1" />);

    await screen.findByText(/2026-09-01T18:00/);
    fireEvent.press(screen.getByLabelText(/^retirer le créneau/i));

    expect(await screen.findByText(/retrait a échoué/i)).toBeTruthy();
    expect(screen.getByText(/2026-09-01T18:00/)).toBeTruthy();
  });

  // TC-005-13 / BUG-004 (rapport-qa.md, corrigé le 31 août 2026) : un utilisateur déjà
  // authentifié ne doit jamais voir "Connecte-toi..." s'afficher, même brièvement.
  it("n'affiche jamais le message de connexion pour un utilisateur déjà authentifié", async () => {
    global.fetch = createFetchMock() as unknown as typeof fetch;
    render(<CreneauxScreen terrainId="terrain-1" />);

    expect(screen.queryByText(/connecte-toi/i)).toBeNull();

    await screen.findByText(/2026-09-01T18:00/);
    expect(screen.queryByText(/connecte-toi/i)).toBeNull();
  });
});
