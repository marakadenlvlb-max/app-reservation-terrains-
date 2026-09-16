import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoriqueList } from './HistoriqueList';

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
  window.localStorage.setItem('auth_token', 'token-123');
});

describe('HistoriqueList', () => {
  it.each([
    { role: 'joueur' as const, url: '/api/reservations/mes-reservations', titre: /mes réservations/i },
    { role: 'proprietaire' as const, url: '/api/reservations/recues', titre: /réservations reçues/i },
  ])('charge le bon endpoint et affiche le bon titre pour le rôle %s', async ({ role, url, titre }) => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR] })
    );
    vi.stubGlobal('fetch', fetchMock);
    render(<HistoriqueList role={role} />);

    expect(await screen.findByText(titre)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(url), expect.any(Object));
  });

  it('propose "Noter cette session" uniquement pour une réservation confirmée et passée', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR, RESERVATION_PASSEE] }))
    );
    render(<HistoriqueList role="joueur" />);

    await screen.findByText(/awa diallo/i);
    const liens = screen.getAllByRole('link', { name: /noter cette session/i });
    expect(liens).toHaveLength(1);
    expect(liens[0]).toHaveAttribute('href', '/reservations/reservation-2/noter/user-3');
  });

  it("affiche un message clair quand il n'y a encore aucune réservation", async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: async () => [] })));
    render(<HistoriqueList role="joueur" />);

    expect(await screen.findByText(/aucune réservation/i)).toBeInTheDocument();
  });

  // US-27 : le menu global ne pointe que vers /historique/joueur, ce lien croisé est le seul
  // chemin restant vers /historique/proprietaire (et réciproquement).
  it.each([
    { role: 'joueur' as const, hrefAttendu: '/historique/proprietaire' },
    { role: 'proprietaire' as const, hrefAttendu: '/historique/joueur' },
  ])('propose un lien vers l\'autre vue pour le rôle $role, liste vide', async ({ role, hrefAttendu }) => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: async () => [] })));
    render(<HistoriqueList role={role} />);

    await screen.findByText(/aucune réservation/i);
    expect(screen.getByRole('link', { name: /voir/i })).toHaveAttribute('href', hrefAttendu);
  });

  it.each([
    { role: 'joueur' as const, hrefAttendu: '/historique/proprietaire' },
    { role: 'proprietaire' as const, hrefAttendu: '/historique/joueur' },
  ])('propose un lien vers l\'autre vue pour le rôle $role, liste non vide', async ({ role, hrefAttendu }) => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR] })));
    render(<HistoriqueList role={role} />);

    await screen.findByText(/awa diallo/i);
    expect(screen.getByRole('link', { name: /voir/i })).toHaveAttribute('href', hrefAttendu);
  });

  it("invite à se connecter si l'utilisateur n'a pas de session", async () => {
    window.localStorage.clear();
    render(<HistoriqueList role="joueur" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/connecte-toi/i);
  });

  // TC-018-05 (rapport-qa.md) : le pattern testé pour les listes sœurs (ReversementsList,
  // notifications) manquait pour l'historique lui-même.
  it("affiche une erreur si le chargement de l'historique échoue", async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, json: async () => null })));
    render(<HistoriqueList role="joueur" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/impossible de charger ton historique/i);
  });

  it('propose "Envoyer un message" pour chaque réservation, quel que soit son statut (US-24 / RF-023)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR, RESERVATION_PASSEE] }))
    );
    render(<HistoriqueList role="joueur" />);

    await screen.findByText(/awa diallo/i);
    const liens = screen.getAllByRole('link', { name: /envoyer un message/i });
    expect(liens).toHaveLength(2);
    expect(liens[0]).toHaveAttribute('href', '/reservations/reservation-1/messages');
  });

  it('propose "Annuler ma réservation" uniquement côté joueur pour une réservation confirmée à venir', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR, RESERVATION_PASSEE] }))
    );
    render(<HistoriqueList role="joueur" />);

    await screen.findByText(/awa diallo/i);
    // La réservation passée est terminée : plus rien à annuler, seule l'à-venir est proposée.
    expect(screen.getAllByRole('button', { name: /annuler ma réservation/i })).toHaveLength(1);
  });

  it("ne propose pas l'annulation côté propriétaire (RF-021 réservée au joueur)", async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR] })));
    render(<HistoriqueList role="proprietaire" />);

    await screen.findByText(/awa diallo/i);
    expect(screen.queryByRole('button', { name: /annuler ma réservation/i })).not.toBeInTheDocument();
  });

  // TC-019-02 (rapport-qa.md) : RF-019 vise explicitement "voir qui a réservé... et quand... afin
  // de suivre son activité et ses revenus" — jusqu'ici seul le nom brut de l'autre partie servait
  // d'ancrage `findByText`, jamais l'étiquette, le créneau ou le montant.
  it('affiche qui a réservé (étiquette + nom), quand (créneau) et le montant (RF-019)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR] })));
    render(<HistoriqueList role="proprietaire" />);

    expect(await screen.findByText(/joueur\s*:\s*awa diallo/i)).toBeInTheDocument();
    expect(screen.getByText(/2099-09-01 18:00:00/)).toBeInTheDocument();
    expect(screen.getByText(/15000/)).toBeInTheDocument();
  });

  it('annule une réservation et affiche le message renvoyé par le backend (US-22 / RF-021)', async () => {
    vi.stubGlobal('fetch', (url: string, options?: RequestInit) => {
      if (options?.method === 'POST' && typeof url === 'string' && url.includes('/annulation')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ rembourse: true, message: 'Remboursement en cours via Wave sous 48h.' }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR] });
    });
    const user = userEvent.setup();
    render(<HistoriqueList role="joueur" />);

    await screen.findByText(/awa diallo/i);
    await user.click(screen.getByRole('button', { name: /annuler ma réservation/i }));

    expect(await screen.findByText(/remboursement en cours via wave/i)).toBeInTheDocument();
    // Le statut affiché reflète l'annulation sans re-fetch, et le bouton disparaît une fois annulée.
    expect(await screen.findByText(/annulée/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /annuler ma réservation/i })).not.toBeInTheDocument();
  });

  // TC-022-04 (rapport-qa.md) : l'échec de l'annulation côté backend n'était jamais exercé.
  it("affiche une erreur et laisse la réservation inchangée si l'annulation échoue", async () => {
    vi.stubGlobal('fetch', (url: string, options?: RequestInit) => {
      if (options?.method === 'POST' && typeof url === 'string' && url.includes('/annulation')) {
        return Promise.resolve({ ok: false, json: async () => ({ message: "L'annulation a échoué." }) });
      }
      return Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR] });
    });
    const user = userEvent.setup();
    render(<HistoriqueList role="joueur" />);

    await screen.findByText(/awa diallo/i);
    await user.click(screen.getByRole('button', { name: /annuler ma réservation/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/l'annulation a échoué/i);
    // La réservation reste inchangée : toujours "Confirmée", bouton toujours disponible.
    expect(screen.getByText(/confirmée/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /annuler ma réservation/i })).toBeInTheDocument();
  });

  // TC-022-05 (rapport-qa.md) : la désactivation du bouton pendant l'appel n'était jamais vérifiée.
  it("désactive le bouton \"Annuler ma réservation\" pendant que l'annulation est en cours", async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal('fetch', (url: string, options?: RequestInit) => {
      if (options?.method === 'POST' && typeof url === 'string' && url.includes('/annulation')) {
        return pending;
      }
      return Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR] });
    });
    const user = userEvent.setup();
    render(<HistoriqueList role="joueur" />);

    await screen.findByText(/awa diallo/i);
    await user.click(screen.getByRole('button', { name: /annuler ma réservation/i }));

    expect(await screen.findByRole('button', { name: /annulation en cours/i })).toBeDisabled();

    resolveFetch({
      ok: true,
      json: async () => ({ rembourse: true, message: 'Remboursement en cours via Wave sous 48h.' }),
    });
    await screen.findByText(/remboursement en cours via wave/i);
  });

  // TC-022-06 (rapport-qa.md) : seule la moitié droite (créneau futur/passé) du ET logique de
  // `estReservationAnnulable` était isolée par un test — pas la moitié gauche (statut confirmé).
  it("ne propose pas l'annulation pour une réservation non confirmée, même à créneau futur", async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: async () => [RESERVATION_EN_ATTENTE] })));
    render(<HistoriqueList role="joueur" />);

    await screen.findByText(/fatou sow/i);
    expect(screen.queryByRole('button', { name: /annuler ma réservation/i })).not.toBeInTheDocument();
  });

  // TC-022-07 (rapport-qa.md) : RF-021 ne déclenche un remboursement que "si l'annulation
  // respecte" le délai — le seul scénario de succès testé jusqu'ici remboursait systématiquement.
  it('affiche le message du backend et annule la réservation même sans remboursement (rembourse: false)', async () => {
    vi.stubGlobal('fetch', (url: string, options?: RequestInit) => {
      if (options?.method === 'POST' && typeof url === 'string' && url.includes('/annulation')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ rembourse: false, message: 'Annulation actée, hors délai : aucun remboursement.' }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => [RESERVATION_A_VENIR] });
    });
    const user = userEvent.setup();
    render(<HistoriqueList role="joueur" />);

    await screen.findByText(/awa diallo/i);
    await user.click(screen.getByRole('button', { name: /annuler ma réservation/i }));

    expect(await screen.findByText(/aucun remboursement/i)).toBeInTheDocument();
    expect(await screen.findByText(/annulée/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /annuler ma réservation/i })).not.toBeInTheDocument();
  });
});
