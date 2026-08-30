import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessagerieView } from './MessagerieView';

const MESSAGE_AUTRE = {
  id: 'message-1',
  reservationId: 'reservation-1',
  contenu: 'Le terrain a-t-il des vestiaires ?',
  estDeMoi: false,
  createdAt: '2026-08-30T10:00:00Z',
};

const MESSAGE_MOI = {
  id: 'message-2',
  reservationId: 'reservation-1',
  contenu: 'Oui, avec éclairage aussi.',
  estDeMoi: true,
  createdAt: '2026-08-30T10:05:00Z',
};

beforeEach(() => {
  window.localStorage.setItem('auth_token', 'token-123');
});

describe('MessagerieView', () => {
  it('affiche les messages existants de la conversation', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: async () => [MESSAGE_AUTRE, MESSAGE_MOI] })));
    render(<MessagerieView reservationId="reservation-1" />);

    expect(await screen.findByText(/vestiaires/i)).toBeInTheDocument();
    expect(screen.getByText(/éclairage aussi/i)).toBeInTheDocument();
  });

  it("affiche un message clair quand la conversation n'a aucun message", async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: async () => [] })));
    render(<MessagerieView reservationId="reservation-1" />);

    expect(await screen.findByText(/aucun message/i)).toBeInTheDocument();
  });

  it('envoie un nouveau message et l\'affiche sans recharger toute la conversation', async () => {
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'message-3',
            reservationId: 'reservation-1',
            contenu: 'Merci !',
            estDeMoi: true,
            createdAt: '2026-08-30T10:10:00Z',
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => [MESSAGE_AUTRE] });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<MessagerieView reservationId="reservation-1" />);

    await screen.findByText(/vestiaires/i);
    await user.type(screen.getByLabelText(/message/i), 'Merci !');
    await user.click(screen.getByRole('button', { name: /envoyer/i }));

    expect(await screen.findByText('Merci !')).toBeInTheDocument();
    const [url, options] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
    expect(url).toContain('/reservations/reservation-1/messages');
    expect(options?.method).toBe('POST');
  });

  it("invite à se connecter si l'utilisateur n'a pas de session", async () => {
    window.localStorage.clear();
    render(<MessagerieView reservationId="reservation-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/connecte-toi/i);
  });
});
