import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it("invite à se connecter si l'utilisateur n'a pas de session", async () => {
    window.localStorage.clear();
    render(<HistoriqueList role="joueur" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/connecte-toi/i);
  });
});
