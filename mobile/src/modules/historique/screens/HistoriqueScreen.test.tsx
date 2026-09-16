import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { HistoriqueScreen } from './HistoriqueScreen';

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

const RESERVATION_A_VENIR = {
  id: 'reservation-1',
  statut: 'confirmee',
  montant: 15000,
  createdAt: '2026-08-20T10:00:00Z',
  terrain: { id: 'terrain-1', sport: 'foot', adresse: 'Rue 12, Dakar' },
  creneau: { id: 'creneau-1', debut: '2099-09-01T18:00:00Z', fin: '2099-09-01T19:00:00Z' },
  autrePartie: { id: 'user-2', nom: 'Awa Diallo' },
};

const RESERVATION_PASSEE = {
  id: 'reservation-2',
  statut: 'confirmee',
  montant: 20000,
  createdAt: '2026-01-10T10:00:00Z',
  terrain: { id: 'terrain-2', sport: 'tennis', adresse: 'Avenue 5, Dakar' },
  creneau: { id: 'creneau-2', debut: '2026-01-15T18:00:00Z', fin: '2026-01-15T19:00:00Z' },
  autrePartie: { id: 'user-3', nom: 'Moussa Ba' },
};

// Créneau futur mais statut non confirmé — isole la moitié du ET logique de
// `estReservationAnnulable` que RESERVATION_PASSEE (statut confirmé, créneau passé) ne couvre pas.
const RESERVATION_EN_ATTENTE = {
  id: 'reservation-3',
  statut: 'en_attente_paiement',
  montant: 10000,
  createdAt: '2026-08-22T10:00:00Z',
  terrain: { id: 'terrain-3', sport: 'basket', adresse: 'Boulevard 3, Dakar' },
  creneau: { id: 'creneau-3', debut: '2099-09-02T18:00:00Z', fin: '2099-09-02T19:00:00Z' },
  autrePartie: { id: 'user-4', nom: 'Fatou Sow' },
};

beforeEach(() => {
  mockSecureStore.clear();
  mockSecureStore.set('auth_token', 'token-123');
});

describe('HistoriqueScreen', () => {
  it.each([
    { role: 'joueur' as const, url: '/api/reservations/mes-reservations', titre: /mes réservations/i },
    { role: 'proprietaire' as const, url: '/api/reservations/recues', titre: /réservations reçues/i },
  ])('charge le bon endpoint et affiche le bon titre pour le rôle %s', async ({ role, url, titre }) => {
    const fetchMock = jest.fn(() => Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR] }));
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<HistoriqueScreen role={role} />);

    expect(await screen.findByText(titre)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(url), expect.any(Object));
  });

  it('propose "Noter cette session" uniquement pour une réservation confirmée et passée', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR, RESERVATION_PASSEE] })
    ) as unknown as typeof fetch;
    render(<HistoriqueScreen role="joueur" />);

    await screen.findByText(/awa diallo/i);
    expect(screen.getAllByText(/noter cette session/i)).toHaveLength(1);
  });

  it("affiche un message clair quand il n'y a encore aucune réservation", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => [] })) as unknown as typeof fetch;
    render(<HistoriqueScreen role="joueur" />);

    expect(await screen.findByText(/aucune réservation/i)).toBeTruthy();
  });

  it("invite à se connecter si l'utilisateur n'a pas de session", async () => {
    mockSecureStore.clear();
    render(<HistoriqueScreen role="joueur" />);

    expect(await screen.findByText(/connecte-toi/i)).toBeTruthy();
  });

  // TC-018-05 (rapport-qa.md) : le pattern testé pour les listes sœurs (ReversementsList,
  // notifications) manquait pour l'historique lui-même.
  it("affiche une erreur si le chargement de l'historique échoue", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, json: async () => null })) as unknown as typeof fetch;
    render(<HistoriqueScreen role="joueur" />);

    expect(await screen.findByText(/impossible de charger ton historique/i)).toBeTruthy();
  });

  it('propose "Envoyer un message" pour chaque réservation, quel que soit son statut (US-24 / RF-023)', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR, RESERVATION_PASSEE] })
    ) as unknown as typeof fetch;
    render(<HistoriqueScreen role="joueur" />);

    await screen.findByText(/awa diallo/i);
    expect(screen.getAllByText(/envoyer un message/i)).toHaveLength(2);
  });

  it('propose "Annuler ma réservation" uniquement côté joueur pour une réservation confirmée à venir', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR, RESERVATION_PASSEE] })
    ) as unknown as typeof fetch;
    render(<HistoriqueScreen role="joueur" />);

    await screen.findByText(/awa diallo/i);
    expect(screen.getAllByLabelText(/annuler ma réservation/i)).toHaveLength(1);
  });

  it("ne propose pas l'annulation côté propriétaire (RF-021 réservée au joueur)", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR] })) as unknown as typeof fetch;
    render(<HistoriqueScreen role="proprietaire" />);

    await screen.findByText(/awa diallo/i);
    expect(screen.queryByLabelText(/annuler ma réservation/i)).toBeNull();
  });

  // TC-019-02 (rapport-qa.md) : RF-019 vise explicitement "voir qui a réservé... et quand... afin
  // de suivre son activité et ses revenus" — jusqu'ici seul le nom brut de l'autre partie servait
  // d'ancrage `findByText`, jamais l'étiquette, le créneau ou le montant.
  it('affiche qui a réservé (étiquette + nom), quand (créneau) et le montant (RF-019)', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR] })
    ) as unknown as typeof fetch;
    render(<HistoriqueScreen role="proprietaire" />);

    expect(await screen.findByText(/joueur\s*:\s*awa diallo/i)).toBeTruthy();
    expect(screen.getByText(/2099-09-01T18:00:00Z/)).toBeTruthy();
    expect(screen.getByText(/15000/)).toBeTruthy();
  });

  it('annule une réservation et affiche le message renvoyé par le backend (US-22 / RF-021)', async () => {
    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST' && typeof url === 'string' && url.includes('/annulation')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ rembourse: true, message: 'Remboursement en cours via Wave sous 48h.' }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR] });
    }) as unknown as typeof fetch;
    render(<HistoriqueScreen role="joueur" />);

    await screen.findByText(/awa diallo/i);
    fireEvent.press(screen.getByLabelText(/annuler ma réservation/i));

    expect(await screen.findByText(/remboursement en cours via wave/i)).toBeTruthy();
    await waitFor(() => expect(screen.queryByLabelText(/annuler ma réservation/i)).toBeNull());
  });

  // TC-022-04 (rapport-qa.md) : l'échec de l'annulation côté backend n'était jamais exercé.
  it("affiche une erreur et laisse la réservation inchangée si l'annulation échoue", async () => {
    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST' && typeof url === 'string' && url.includes('/annulation')) {
        return Promise.resolve({ ok: false, json: async () => ({ message: "L'annulation a échoué." }) });
      }
      return Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR] });
    }) as unknown as typeof fetch;
    render(<HistoriqueScreen role="joueur" />);

    await screen.findByText(/awa diallo/i);
    fireEvent.press(screen.getByLabelText(/annuler ma réservation/i));

    expect(await screen.findByText(/l'annulation a échoué/i)).toBeTruthy();
    // La réservation reste inchangée : toujours "Confirmée", bouton toujours disponible.
    expect(screen.getByText(/confirmée/i)).toBeTruthy();
    expect(screen.getByLabelText(/annuler ma réservation/i)).toBeTruthy();
  });

  // TC-022-05 (rapport-qa.md) : la désactivation du bouton pendant l'appel n'était jamais vérifiée.
  it("désactive le bouton \"Annuler ma réservation\" pendant que l'annulation est en cours", async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST' && typeof url === 'string' && url.includes('/annulation')) {
        return pending;
      }
      return Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR] });
    }) as unknown as typeof fetch;
    render(<HistoriqueScreen role="joueur" />);

    await screen.findByText(/awa diallo/i);
    fireEvent.press(screen.getByLabelText(/annuler ma réservation/i));

    const bouton = await screen.findByLabelText(/annuler ma réservation/i);
    expect(bouton.props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText(/annulation en cours/i)).toBeTruthy();

    resolveFetch({
      ok: true,
      json: async () => ({ rembourse: true, message: 'Remboursement en cours via Wave sous 48h.' }),
    });
    await screen.findByText(/remboursement en cours via wave/i);
  });

  // TC-022-06 (rapport-qa.md) : seule la moitié droite (créneau futur/passé) du ET logique de
  // `estReservationAnnulable` était isolée par un test — pas la moitié gauche (statut confirmé).
  it("ne propose pas l'annulation pour une réservation non confirmée, même à créneau futur", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => [RESERVATION_EN_ATTENTE] })
    ) as unknown as typeof fetch;
    render(<HistoriqueScreen role="joueur" />);

    await screen.findByText(/fatou sow/i);
    expect(screen.queryByLabelText(/annuler ma réservation/i)).toBeNull();
  });

  // TC-022-07 (rapport-qa.md) : RF-021 ne déclenche un remboursement que "si l'annulation
  // respecte" le délai — le seul scénario de succès testé jusqu'ici remboursait systématiquement.
  it('affiche le message du backend et annule la réservation même sans remboursement (rembourse: false)', async () => {
    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST' && typeof url === 'string' && url.includes('/annulation')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ rembourse: false, message: 'Annulation actée, hors délai : aucun remboursement.' }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR] });
    }) as unknown as typeof fetch;
    render(<HistoriqueScreen role="joueur" />);

    await screen.findByText(/awa diallo/i);
    fireEvent.press(screen.getByLabelText(/annuler ma réservation/i));

    expect(await screen.findByText(/aucun remboursement/i)).toBeTruthy();
    await waitFor(() => expect(screen.queryByLabelText(/annuler ma réservation/i)).toBeNull());
  });
});
