import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MesConversationsList } from './MesConversationsList';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  window.localStorage.clear();
});

describe('MesConversationsList', () => {
  it("invite à se connecter si aucune session n'est active", async () => {
    render(<MesConversationsList />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/connecte-toi/i);
  });

  it('affiche les conversations avec un aperçu du dernier message', async () => {
    window.localStorage.setItem('auth_token', 'authenticated');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          reservationId: 'reservation-1',
          terrain: { id: 'terrain-1', sport: 'football', adresse: '12 rue du Stade' },
          autrePartie: { id: 'user-2', nom: 'Awa Diop' },
          dernierMessage: { contenu: 'On confirme pour 18h ?', createdAt: '2026-09-16T10:00:00' },
        },
      ],
    });

    render(<MesConversationsList />);

    expect(await screen.findByText(/12 rue du stade/i)).toBeInTheDocument();
    expect(screen.getByText(/awa diop/i)).toBeInTheDocument();
    expect(screen.getByText(/on confirme pour 18h/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/messagerie/mes-conversations'),
      expect.objectContaining({ credentials: 'include' })
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/reservations/reservation-1/messages');
  });

  it("affiche un message si l'utilisateur n'a encore aucune conversation", async () => {
    window.localStorage.setItem('auth_token', 'authenticated');
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(<MesConversationsList />);

    expect(await screen.findByText(/aucune conversation/i)).toBeInTheDocument();
  });
});
