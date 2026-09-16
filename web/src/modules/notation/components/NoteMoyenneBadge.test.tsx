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

  // TC-017-03 (rapport-qa.md) : comportement confirmé plutôt que supposé — un échec technique de
  // chargement affiche le même texte qu'une absence réelle d'avis (`error || !noteMoyenne ||
  // noteMoyenne.moyenne === null` ne distingue pas les deux cas). Signalé comme ambiguïté de
  // conception à arbitrer, pas corrigé unilatéralement ici — ce test verrouille le comportement
  // actuel pour qu'un changement futur soit délibéré, pas accidentel.
  it('affiche aussi "Pas encore de note" si le chargement échoue techniquement (comportement actuel, voir rapport-qa.md)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, json: async () => null })));
    render(<NoteMoyenneBadge utilisateurId="user-1" />);

    expect(await screen.findByText(/pas encore de note/i)).toBeInTheDocument();
  });
});
