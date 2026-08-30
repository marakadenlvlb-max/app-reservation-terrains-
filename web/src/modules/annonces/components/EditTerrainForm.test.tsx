import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditTerrainForm } from './EditTerrainForm';

const TERRAIN = {
  id: 'terrain-1',
  proprietaireId: 'user-1',
  sport: 'foot',
  adresse: 'Rue 12, Dakar',
  latitude: null as number | null,
  longitude: null as number | null,
  type: null as string | null,
  equipements: [] as string[],
  photos: [] as string[],
};

function createFetchMock(overrides: { updateOk?: boolean; deleteOk?: boolean } = {}) {
  return vi.fn((url: string, options?: RequestInit) => {
    if (options?.method === 'PATCH') {
      if (overrides.updateOk === false) {
        return Promise.resolve({ ok: false, json: async () => null });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ...TERRAIN, adresse: 'Rue 20, Dakar' }) });
    }
    if (options?.method === 'DELETE') {
      if (overrides.deleteOk === false) {
        return Promise.resolve({ ok: false, json: async () => ({ message: 'Créneaux encore réservés.' }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }
    return Promise.resolve({ ok: true, json: async () => TERRAIN });
  });
}

beforeEach(() => {
  window.localStorage.setItem('auth_token', 'token-123');
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('EditTerrainForm', () => {
  it("charge et affiche l'annonce existante", async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<EditTerrainForm terrainId="terrain-1" />);

    expect(await screen.findByDisplayValue('Rue 12, Dakar')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /foot/i })).toBeChecked();
  });

  it('enregistre les modifications et affiche une confirmation', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    const user = userEvent.setup();
    render(<EditTerrainForm terrainId="terrain-1" />);

    await screen.findByDisplayValue('Rue 12, Dakar');
    await user.clear(screen.getByLabelText(/adresse/i));
    await user.type(screen.getByLabelText(/adresse/i), 'Rue 20, Dakar');
    await user.click(screen.getByRole('button', { name: /^enregistrer$/i }));

    expect(await screen.findByText(/annonce mise à jour/i)).toBeInTheDocument();
  });

  it("demande confirmation puis retire l'annonce", async () => {
    vi.stubGlobal('fetch', createFetchMock());
    const user = userEvent.setup();
    render(<EditTerrainForm terrainId="terrain-1" />);

    await screen.findByDisplayValue('Rue 12, Dakar');
    await user.click(screen.getByRole('button', { name: /retirer l'annonce/i }));

    expect(window.confirm).toHaveBeenCalled();
    expect(await screen.findByText(/annonce retirée/i)).toBeInTheDocument();
  });

  it("affiche l'erreur du backend si le retrait est refusé (ex. créneaux encore réservés)", async () => {
    vi.stubGlobal('fetch', createFetchMock({ deleteOk: false }));
    const user = userEvent.setup();
    render(<EditTerrainForm terrainId="terrain-1" />);

    await screen.findByDisplayValue('Rue 12, Dakar');
    await user.click(screen.getByRole('button', { name: /retirer l'annonce/i }));

    expect(await screen.findByText(/créneaux encore réservés/i)).toBeInTheDocument();
  });
});
