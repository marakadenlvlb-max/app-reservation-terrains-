import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MesAnnoncesList } from './MesAnnoncesList';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  window.localStorage.clear();
});

describe('MesAnnoncesList', () => {
  it("invite à se connecter si aucune session n'est active", async () => {
    render(<MesAnnoncesList />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/connecte-toi/i);
  });

  it('affiche les annonces du propriétaire/gestionnaire connecté', async () => {
    window.localStorage.setItem('auth_token', 'authenticated');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 'terrain-1',
          proprietaireId: 'user-1',
          sport: 'football',
          adresse: '12 rue du Stade',
          latitude: null,
          longitude: null,
          type: null,
          equipements: [],
          photos: [],
          paliers: [],
          fraisAnnulationPourcentage: 5,
        },
      ],
    });

    render(<MesAnnoncesList />);

    expect(await screen.findByText(/12 rue du stade/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/terrains/mes-terrains'),
      expect.objectContaining({ credentials: 'include' })
    );
    expect(screen.getByRole('link', { name: /modifier/i })).toHaveAttribute('href', '/terrains/terrain-1/modifier');
    expect(screen.getByRole('link', { name: /gérer les créneaux/i })).toHaveAttribute(
      'href',
      '/terrains/terrain-1/creneaux'
    );
  });

  it("affiche un message si l'utilisateur n'a encore publié aucune annonce", async () => {
    window.localStorage.setItem('auth_token', 'authenticated');
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(<MesAnnoncesList />);

    expect(await screen.findByText(/aucune annonce/i)).toBeInTheDocument();
  });
});
