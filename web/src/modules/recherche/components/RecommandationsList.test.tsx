import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecommandationsList } from './RecommandationsList';

const TERRAIN_RECOMMANDE = {
  terrainId: 'terrain-1',
  sport: 'foot',
  adresse: 'Rue 12, Dakar',
  type: null as string | null,
  photoPrincipale: null as string | null,
  equipements: ['vestiaires'],
  tarifMin: 12000,
};

beforeEach(() => {
  window.localStorage.setItem('auth_token', 'token-123');
});

describe('RecommandationsList', () => {
  it('affiche les terrains recommandés avec un lien vers leur détail', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: async () => [TERRAIN_RECOMMANDE] })));
    render(<RecommandationsList />);

    const lien = await screen.findByRole('link', { name: /rue 12, dakar/i });
    expect(lien).toHaveAttribute('href', '/terrains/terrain-1');
    expect(screen.getByText(/12000/)).toBeInTheDocument();
  });

  it("affiche un message clair quand il n'y a encore aucune recommandation", async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: async () => [] })));
    render(<RecommandationsList />);

    expect(await screen.findByText(/pas encore de recommandation/i)).toBeInTheDocument();
  });

  it("invite à se connecter si l'utilisateur n'a pas de session", async () => {
    window.localStorage.clear();
    render(<RecommandationsList />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/connecte-toi/i);
  });
});
