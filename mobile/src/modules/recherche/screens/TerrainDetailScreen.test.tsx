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
});
