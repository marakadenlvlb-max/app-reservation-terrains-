import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchTerrains } from './SearchTerrains';

const RESULTAT = {
  terrainId: 'terrain-1',
  sport: 'foot',
  adresse: 'Rue 12, Dakar',
  type: null as string | null,
  photoPrincipale: null as string | null,
  creneauId: 'creneau-1',
  debut: '2026-09-01T18:00',
  fin: '2026-09-01T19:00',
  tarif: 15000,
  distanceKm: undefined as number | undefined,
};

function createFetchMock(overrides: { results?: typeof RESULTAT[]; ok?: boolean } = {}) {
  // Le mock déclare explicitement (url, options) plutôt qu'un callback sans paramètres : sans
  // ça, `.mock.calls[0]` s'infère comme un tuple vide et le déstructurer plus bas ne type-check pas.
  return vi.fn((_url?: string, _options?: RequestInit) => {
    if (overrides.ok === false) {
      return Promise.resolve({ ok: false, json: async () => null });
    }
    return Promise.resolve({ ok: true, json: async () => overrides.results ?? [RESULTAT] });
  });
}

describe('SearchTerrains', () => {
  it("effectue une recherche sans être connecté (aucun token en localStorage requis)", async () => {
    window.localStorage.clear();
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<SearchTerrains />);

    await user.click(screen.getByRole('button', { name: /rechercher/i }));

    expect(await screen.findByText(/rue 12, dakar/i)).toBeInTheDocument();
    // L'appel ne doit pas exiger d'Authorization : la recherche est publique (US-07).
    const [, options] = fetchMock.mock.calls[0];
    expect((options?.headers as Record<string, string> | undefined)?.Authorization).toBeUndefined();
  });

  it('envoie les filtres sélectionnés dans la requête', async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<SearchTerrains />);

    await user.click(screen.getByRole('radio', { name: /^foot$/i }));
    await user.type(screen.getByLabelText(/localisation/i), 'Dakar');
    fireEvent.change(screen.getByLabelText(/^date$/i), { target: { value: '2026-09-01' } });
    await user.click(screen.getByRole('button', { name: /rechercher/i }));

    await screen.findByText(/rue 12, dakar/i);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('sport=foot');
    expect(url).toContain('localisation=Dakar');
    expect(url).toContain('date=2026-09-01');
  });

  it("affiche un message clair quand aucun créneau ne correspond", async () => {
    vi.stubGlobal('fetch', createFetchMock({ results: [] }));
    const user = userEvent.setup();
    render(<SearchTerrains />);

    await user.click(screen.getByRole('button', { name: /rechercher/i }));

    expect(await screen.findByText(/aucun créneau disponible/i)).toBeInTheDocument();
  });

  it('affiche une erreur si la recherche échoue', async () => {
    vi.stubGlobal('fetch', createFetchMock({ ok: false }));
    const user = userEvent.setup();
    render(<SearchTerrains />);

    await user.click(screen.getByRole('button', { name: /rechercher/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/recherche a échoué/i);
  });

  it('inclut la position GPS dans la recherche une fois le tri par proximité activé (US-09)', async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: {
        getCurrentPosition: (success: PositionCallback) => {
          success({ coords: { latitude: 14.7167, longitude: -17.4677 } } as GeolocationPosition);
        },
      },
    });
    const user = userEvent.setup();
    render(<SearchTerrains />);

    await user.click(screen.getByRole('button', { name: /trier par proximité/i }));

    await screen.findByText(/rue 12, dakar/i);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('latitude=14.7167');
    expect(url).toContain('longitude=-17.4677');
  });

  it('affiche la distance renvoyée par le backend quand elle est présente', async () => {
    vi.stubGlobal('fetch', createFetchMock({ results: [{ ...RESULTAT, distanceKm: 2.3 }] }));
    const user = userEvent.setup();
    render(<SearchTerrains />);

    await user.click(screen.getByRole('button', { name: /rechercher/i }));

    expect(await screen.findByText(/à 2\.3 km/)).toBeInTheDocument();
  });
});
