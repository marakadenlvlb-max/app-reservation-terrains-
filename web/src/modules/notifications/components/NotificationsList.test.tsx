import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationsList } from './NotificationsList';

const NOTIF_CONFIRMATION = {
  id: 'notif-1',
  reservationId: 'reservation-1',
  type: 'confirmation_reservation',
  titre: 'Réservation confirmée',
  message: 'Ta réservation du terrain de Rue 12, Dakar est confirmée.',
  lue: false,
  createdAt: '2026-08-30T10:00:00Z',
};

const NOTIF_RAPPEL = {
  id: 'notif-2',
  reservationId: 'reservation-1',
  type: 'rappel_creneau',
  titre: 'Rappel de créneau',
  message: 'Ton créneau commence dans 1 heure.',
  lue: true,
  createdAt: '2026-08-30T17:00:00Z',
};

beforeEach(() => {
  window.localStorage.setItem('auth_token', 'token-123');
});

describe('NotificationsList', () => {
  it('affiche les notifications de confirmation et de rappel', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: async () => [NOTIF_CONFIRMATION, NOTIF_RAPPEL] }))
    );
    render(<NotificationsList />);

    expect(await screen.findByText('Réservation confirmée')).toBeInTheDocument();
    expect(screen.getByText('Rappel de créneau')).toBeInTheDocument();
    expect(screen.getByText(/1 heure/i)).toBeInTheDocument();
  });

  it('marque une notification comme lue', async () => {
    vi.stubGlobal('fetch', (url: string, options?: RequestInit) => {
      if (options?.method === 'PATCH') {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({ ok: true, json: async () => [NOTIF_CONFIRMATION] });
    });
    const user = userEvent.setup();
    render(<NotificationsList />);

    await screen.findByText('Réservation confirmée');
    await user.click(screen.getByRole('button', { name: /marquer comme lue/i }));

    // Une fois lue, le bouton "Marquer comme lue" disparaît (mise à jour optimiste locale).
    expect(screen.queryByRole('button', { name: /marquer comme lue/i })).not.toBeInTheDocument();
  });

  it("affiche un message clair quand il n'y a encore aucune notification", async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: async () => [] })));
    render(<NotificationsList />);

    expect(await screen.findByText(/aucune notification/i)).toBeInTheDocument();
  });

  it("invite à se connecter si l'utilisateur n'a pas de session", async () => {
    window.localStorage.clear();
    render(<NotificationsList />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/connecte-toi/i);
  });
});
