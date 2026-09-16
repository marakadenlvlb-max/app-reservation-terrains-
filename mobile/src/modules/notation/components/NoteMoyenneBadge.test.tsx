import { render, screen } from '@testing-library/react-native';
import { NoteMoyenneBadge } from './NoteMoyenneBadge';

describe('NoteMoyenneBadge', () => {
  it("affiche la note moyenne et le nombre d'avis", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({ utilisateurId: 'user-1', moyenne: 4.5, nombreAvis: 12 }) })
    ) as unknown as typeof fetch;
    render(<NoteMoyenneBadge utilisateurId="user-1" />);

    expect(await screen.findByText(/4\.5 \/ 5 \(12 avis\)/)).toBeTruthy();
  });

  it('affiche "Pas encore de note" si aucun avis', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({ utilisateurId: 'user-1', moyenne: null, nombreAvis: 0 }) })
    ) as unknown as typeof fetch;
    render(<NoteMoyenneBadge utilisateurId="user-1" />);

    expect(await screen.findByText(/pas encore de note/i)).toBeTruthy();
  });

  // TC-017-03 (rapport-qa.md) : comportement confirmé plutôt que supposé — voir le commentaire
  // équivalent côté web pour le détail de l'ambiguïté signalée.
  it('affiche aussi "Pas encore de note" si le chargement échoue techniquement (comportement actuel, voir rapport-qa.md)', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, json: async () => null })) as unknown as typeof fetch;
    render(<NoteMoyenneBadge utilisateurId="user-1" />);

    expect(await screen.findByText(/pas encore de note/i)).toBeTruthy();
  });
});
