import { render, screen } from '@testing-library/react-native';
import { TerrainDetailScreen } from './TerrainDetailScreen';

const DETAIL = {
  id: 'terrain-1',
  sport: 'foot',
  adresse: 'Rue 12, Dakar',
  type: 'Synthétique extérieur',
  equipements: ['vestiaires', 'eclairage'],
  photos: ['https://cdn.example.com/photo1.jpg'],
  proprietaireNoteMoyenne: 4.5,
  creneauxDisponibles: [{ id: 'creneau-1', debut: '2026-09-01T18:00', fin: '2026-09-01T19:00', tarif: 15000 }],
};

describe('TerrainDetailScreen', () => {
  it("affiche les informations de l'annonce (équipements, note, créneaux)", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => DETAIL })) as unknown as typeof fetch;
    render(<TerrainDetailScreen terrainId="terrain-1" />);

    expect(await screen.findByText(/rue 12, dakar/i)).toBeTruthy();
    expect(screen.getByText(/4.5 \/ 5/)).toBeTruthy();
    expect(screen.getByText('Vestiaires')).toBeTruthy();
    expect(screen.getByText(/2026-09-01T18:00/)).toBeTruthy();
  });

  it("affiche une erreur si l'annonce n'existe plus", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, json: async () => null })) as unknown as typeof fetch;
    render(<TerrainDetailScreen terrainId="terrain-inconnu" />);

    expect(await screen.findByText(/impossible de charger/i)).toBeTruthy();
  });

  // TC-008-04 (rapport-qa.md) : ce cas existait côté web mais pas côté mobile — écart de parité.
  it("indique l'absence de note quand le propriétaire n'en a pas encore reçu", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({ ...DETAIL, proprietaireNoteMoyenne: null }) })
    ) as unknown as typeof fetch;
    render(<TerrainDetailScreen terrainId="terrain-1" />);

    expect(await screen.findByText(/pas encore de note/i)).toBeTruthy();
  });

  // TC-008-05 (rapport-qa.md) : aucun test n'exerçait le cas "aucun créneau disponible".
  it("affiche un message clair quand l'annonce n'a aucun créneau disponible", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({ ...DETAIL, creneauxDisponibles: [] }) })
    ) as unknown as typeof fetch;
    render(<TerrainDetailScreen terrainId="terrain-1" />);

    expect(await screen.findByText(/aucun créneau disponible pour l'instant/i)).toBeTruthy();
  });

  // TC-008-06 (rapport-qa.md) : aucun test n'exerçait le cas "aucune photo" — vérifie surtout
  // l'absence de plantage (le rendu conditionnel `photos.length > 0 && ...` n'est pas exercé
  // ailleurs avec un tableau vide).
  it('affiche le reste du contenu normalement quand l\'annonce n\'a aucune photo', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({ ...DETAIL, photos: [] }) })
    ) as unknown as typeof fetch;
    render(<TerrainDetailScreen terrainId="terrain-1" />);

    expect(await screen.findByText(/rue 12, dakar/i)).toBeTruthy();
    expect(screen.getByText(/4.5 \/ 5/)).toBeTruthy();
  });

  // TC-008-07 (rapport-qa.md) : aucun test n'exerçait le cas "aucun équipement".
  it("n'affiche pas la section équipements quand l'annonce n'en a aucun", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({ ...DETAIL, equipements: [] }) })
    ) as unknown as typeof fetch;
    render(<TerrainDetailScreen terrainId="terrain-1" />);

    await screen.findByText(/rue 12, dakar/i);
    expect(screen.queryByText('Équipements')).toBeNull();
  });

  // TC-008-08 (rapport-qa.md) : aucun test n'exerçait le cas "type absent".
  it("ne plante pas et n'affiche aucune ligne de type quand le type est absent", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({ ...DETAIL, type: null }) })
    ) as unknown as typeof fetch;
    render(<TerrainDetailScreen terrainId="terrain-1" />);

    expect(await screen.findByText(/rue 12, dakar/i)).toBeTruthy();
    expect(screen.queryByText(/synthétique extérieur/i)).toBeNull();
  });
});
