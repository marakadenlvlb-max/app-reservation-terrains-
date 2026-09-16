import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TerrainDetailView } from './TerrainDetailView';

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

describe('TerrainDetailView', () => {
  it("affiche les informations de l'annonce (photos, équipements, note, créneaux)", async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: async () => DETAIL })));
    render(<TerrainDetailView terrainId="terrain-1" />);

    expect(await screen.findByText(/rue 12, dakar/i)).toBeInTheDocument();
    expect(screen.getByText(/4.5 \/ 5/)).toBeInTheDocument();
    expect(screen.getByText('Vestiaires')).toBeInTheDocument();
    expect(screen.getByText(/2026-09-01 18:00/)).toBeInTheDocument();
    expect(screen.getByAltText(/photo du terrain/i)).toHaveAttribute('src', 'https://cdn.example.com/photo1.jpg');
  });

  it("affiche une erreur si l'annonce n'existe plus", async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, json: async () => null })));
    render(<TerrainDetailView terrainId="terrain-inconnu" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/impossible de charger/i);
  });

  it("indique l'absence de note quand le propriétaire n'en a pas encore reçu", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: async () => ({ ...DETAIL, proprietaireNoteMoyenne: null }) }))
    );
    render(<TerrainDetailView terrainId="terrain-1" />);

    expect(await screen.findByText(/pas encore de note/i)).toBeInTheDocument();
  });

  // TC-008-05 (rapport-qa.md) : aucun test n'exerçait le cas "aucun créneau disponible".
  it("affiche un message clair quand l'annonce n'a aucun créneau disponible", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: async () => ({ ...DETAIL, creneauxDisponibles: [] }) }))
    );
    render(<TerrainDetailView terrainId="terrain-1" />);

    expect(await screen.findByText(/aucun créneau disponible pour l'instant/i)).toBeInTheDocument();
  });

  // TC-008-06 (rapport-qa.md) : aucun test n'exerçait le cas "aucune photo".
  it("n'affiche pas de galerie quand l'annonce n'a aucune photo", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: async () => ({ ...DETAIL, photos: [] }) }))
    );
    render(<TerrainDetailView terrainId="terrain-1" />);

    await screen.findByText(/rue 12, dakar/i);
    expect(screen.queryByAltText(/photo du terrain/i)).not.toBeInTheDocument();
  });

  // TC-008-07 (rapport-qa.md) : aucun test n'exerçait le cas "aucun équipement".
  it("n'affiche pas la section équipements quand l'annonce n'en a aucun", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: async () => ({ ...DETAIL, equipements: [] }) }))
    );
    render(<TerrainDetailView terrainId="terrain-1" />);

    await screen.findByText(/rue 12, dakar/i);
    expect(screen.queryByText('Équipements')).not.toBeInTheDocument();
  });

  // TC-008-08 (rapport-qa.md) : aucun test n'exerçait le cas "type absent".
  it('ne plante pas et n\'affiche aucune ligne de type quand le type est absent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: async () => ({ ...DETAIL, type: null }) }))
    );
    render(<TerrainDetailView terrainId="terrain-1" />);

    expect(await screen.findByText(/rue 12, dakar/i)).toBeInTheDocument();
    expect(screen.queryByText(/synthétique extérieur/i)).not.toBeInTheDocument();
  });
});
