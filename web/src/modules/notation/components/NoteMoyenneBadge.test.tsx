import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NoteMoyenneBadge } from './NoteMoyenneBadge';

describe('NoteMoyenneBadge', () => {
  it('affiche la note moyenne et le nombre d\'avis', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({ ok: true, json: async () => ({ utilisateurId: 'user-1', moyenne: 4.5, nombreAvis: 12 }) })
      )
    );
    render(<NoteMoyenneBadge utilisateurId="user-1" />);

    expect(await screen.findByText(/4\.5 \/ 5 \(12 avis\)/)).toBeInTheDocument();
  });

  it("affiche \"Pas encore de note\" si l'utilisateur n'a aucun avis", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: async () => ({ utilisateurId: 'user-1', moyenne: null, nombreAvis: 0 }) }))
    );
    render(<NoteMoyenneBadge utilisateurId="user-1" />);

    expect(await screen.findByText(/pas encore de note/i)).toBeInTheDocument();
  });
});
