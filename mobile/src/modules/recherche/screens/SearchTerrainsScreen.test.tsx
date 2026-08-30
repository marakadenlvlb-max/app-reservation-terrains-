import { fireEvent, render, screen } from '@testing-library/react-native';
import { SearchTerrainsScreen } from './SearchTerrainsScreen';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 14.7167, longitude: -17.4677 } })
  ),
}));

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
  equipements: [] as ('vestiaires' | 'eclairage' | 'surface')[],
};

function createFetchMock(overrides: { results?: typeof RESULTAT[]; ok?: boolean } = {}) {
  // Le mock déclare explicitement (url) plutôt qu'un callback sans paramètres : sans ça,
  // `.mock.calls[0]` s'infère comme un tuple vide et le déstructurer plus bas ne type-check pas.
  return jest.fn((_url?: string) => {
    if (overrides.ok === false) {
      return Promise.resolve({ ok: false, json: async () => null });
    }
    return Promise.resolve({ ok: true, json: async () => overrides.results ?? [RESULTAT] });
  });
}

describe('SearchTerrainsScreen', () => {
  it("effectue une recherche sans nécessiter de session", async () => {
    const fetchMock = createFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<SearchTerrainsScreen />);

    fireEvent.press(screen.getByLabelText('Rechercher'));

    expect(await screen.findByText(/rue 12, dakar/i)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]).toHaveLength(1); // un seul argument (l'URL) : pas d'options avec un header Authorization
  });

  it('envoie le sport sélectionné dans la requête', async () => {
    const fetchMock = createFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<SearchTerrainsScreen />);

    fireEvent.press(screen.getByLabelText('Foot'));
    fireEvent.press(screen.getByLabelText('Rechercher'));

    await screen.findByText(/rue 12, dakar/i);
    expect(fetchMock.mock.calls[0][0]).toContain('sport=foot');
  });

  it('affiche un message clair quand aucun créneau ne correspond', async () => {
    global.fetch = createFetchMock({ results: [] }) as unknown as typeof fetch;
    render(<SearchTerrainsScreen />);

    fireEvent.press(screen.getByLabelText('Rechercher'));

    expect(await screen.findByText(/aucun créneau disponible/i)).toBeTruthy();
  });

  it('affiche une erreur si la recherche échoue', async () => {
    global.fetch = createFetchMock({ ok: false }) as unknown as typeof fetch;
    render(<SearchTerrainsScreen />);

    fireEvent.press(screen.getByLabelText('Rechercher'));

    expect(await screen.findByText(/recherche a échoué/i)).toBeTruthy();
  });

  it('inclut la position GPS dans la recherche une fois le tri par proximité activé (US-09)', async () => {
    const fetchMock = createFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<SearchTerrainsScreen />);

    fireEvent.press(screen.getByLabelText('Trier par proximité'));

    await screen.findByText(/rue 12, dakar/i);
    expect(fetchMock.mock.calls[0][0]).toContain('latitude=14.7167');
    expect(fetchMock.mock.calls[0][0]).toContain('longitude=-17.4677');
  });

  it('affiche la distance renvoyée par le backend quand elle est présente', async () => {
    global.fetch = createFetchMock({ results: [{ ...RESULTAT, distanceKm: 2.3 }] }) as unknown as typeof fetch;
    render(<SearchTerrainsScreen />);

    fireEvent.press(screen.getByLabelText('Rechercher'));

    expect(await screen.findByText(/à 2\.3 km/)).toBeTruthy();
  });

  it('envoie le prix max et les équipements sélectionnés dans la requête (US-23 / RF-022)', async () => {
    const fetchMock = createFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<SearchTerrainsScreen />);

    fireEvent.changeText(screen.getByLabelText('Prix max'), '20000');
    fireEvent.press(screen.getByLabelText('Vestiaires'));
    fireEvent.press(screen.getByLabelText('Éclairage'));
    fireEvent.press(screen.getByLabelText('Rechercher'));

    await screen.findByText(/rue 12, dakar/i);
    expect(fetchMock.mock.calls[0][0]).toContain('prixMax=20000');
    expect(fetchMock.mock.calls[0][0]).toContain('equipements=vestiaires%2Ceclairage');
  });

  it("désactive le filtre de distance max tant que la position GPS n'est pas connue, puis l'active une fois acquise", async () => {
    const fetchMock = createFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<SearchTerrainsScreen />);

    expect(screen.getByLabelText('Distance max (km)').props.editable).toBe(false);

    fireEvent.press(screen.getByLabelText('Trier par proximité'));
    await screen.findByText(/rue 12, dakar/i);

    expect(screen.getByLabelText('Distance max (km)').props.editable).toBe(true);

    fireEvent.changeText(screen.getByLabelText('Distance max (km)'), '5');
    fireEvent.press(screen.getByLabelText('Rechercher'));

    await screen.findByText(/rue 12, dakar/i);
    const dernierAppel = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
    expect(dernierAppel[0]).toContain('distanceMaxKm=5');
  });

  it('affiche les équipements du terrain quand le backend les renvoie', async () => {
    global.fetch = createFetchMock({
      results: [{ ...RESULTAT, equipements: ['vestiaires', 'eclairage'] }],
    }) as unknown as typeof fetch;
    render(<SearchTerrainsScreen />);

    fireEvent.press(screen.getByLabelText('Rechercher'));

    expect(await screen.findByText(/vestiaires, éclairage/i)).toBeTruthy();
  });
});
