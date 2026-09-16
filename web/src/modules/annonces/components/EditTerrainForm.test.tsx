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
  paliers: [{ delaiMinutes: 1440, pourcentageRemboursement: 100 }],
  fraisAnnulationPourcentage: 2,
};

function createFetchMock(overrides: { updateOk?: boolean; deleteOk?: boolean; loadOk?: boolean } = {}) {
  return vi.fn((url: string, options?: RequestInit) => {
    if (options?.method === 'PATCH') {
      if (overrides.updateOk === false) {
        return Promise.resolve({ ok: false, json: async () => ({ message: 'La modification a échoué.' }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ...TERRAIN, adresse: 'Rue 20, Dakar' }) });
    }
    if (options?.method === 'DELETE') {
      if (overrides.deleteOk === false) {
        return Promise.resolve({ ok: false, json: async () => ({ message: 'Créneaux encore réservés.' }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }
    if (overrides.loadOk === false) {
      return Promise.resolve({ ok: false, json: async () => null });
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

  // TC-006-06 (rapport-qa.md) : tous les autres tests supposent la confirmation acceptée
  // (mock global dans beforeEach) — aucun ne vérifiait le chemin "annuler".
  it("n'appelle pas l'API de retrait si l'utilisateur annule la confirmation", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    render(<EditTerrainForm terrainId="terrain-1" />);

    await screen.findByDisplayValue('Rue 12, Dakar');
    await user.click(screen.getByRole('button', { name: /retirer l'annonce/i }));

    expect(window.confirm).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'DELETE' }));
    // L'annonce reste affichée normalement, pas de message "Annonce retirée.".
    expect(screen.getByDisplayValue('Rue 12, Dakar')).toBeInTheDocument();
  });

  // TC-006-07 (rapport-qa.md) : seule la modification valide était testée.
  it("affiche une erreur de validation si l'adresse est vidée, sans appeler l'API", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<EditTerrainForm terrainId="terrain-1" />);

    await screen.findByDisplayValue('Rue 12, Dakar');
    await user.clear(screen.getByLabelText(/adresse/i));
    await user.click(screen.getByRole('button', { name: /^enregistrer$/i }));

    expect(await screen.findByText(/adresse est requise/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'PATCH' }));
  });

  // TC-006-08 (rapport-qa.md) : seul le succès du chargement était testé.
  it("affiche une erreur bloquante si le chargement de l'annonce échoue", async () => {
    vi.stubGlobal('fetch', createFetchMock({ loadOk: false }));
    render(<EditTerrainForm terrainId="terrain-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/annonce/i);
  });

  // TC-006-09 (rapport-qa.md) : le mock supportait déjà `updateOk: false` mais aucun test ne
  // l'invoquait — même motif que TC-005-10.
  it('affiche une erreur si la modification échoue, sans vider le formulaire', async () => {
    vi.stubGlobal('fetch', createFetchMock({ updateOk: false }));
    const user = userEvent.setup();
    render(<EditTerrainForm terrainId="terrain-1" />);

    await screen.findByDisplayValue('Rue 12, Dakar');
    await user.clear(screen.getByLabelText(/adresse/i));
    await user.type(screen.getByLabelText(/adresse/i), 'Rue 20, Dakar');
    await user.click(screen.getByRole('button', { name: /^enregistrer$/i }));

    expect(await screen.findByText(/modification a échoué/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Rue 20, Dakar')).toBeInTheDocument();
  });

  // TC-006-10 / BUG-005 (rapport-qa.md, corrigé le 31 août 2026) : un utilisateur déjà
  // authentifié ne doit jamais voir "Connecte-toi..." s'afficher, même brièvement.
  it("n'affiche jamais le message de connexion pour un utilisateur déjà authentifié", async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<EditTerrainForm terrainId="terrain-1" />);

    expect(screen.queryByText(/connecte-toi/i)).not.toBeInTheDocument();

    await screen.findByDisplayValue('Rue 12, Dakar');
    expect(screen.queryByText(/connecte-toi/i)).not.toBeInTheDocument();
  });
});
