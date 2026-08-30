import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreneauxManager } from './CreneauxManager';

// Les inputs datetime-local/number sont simulés via fireEvent.change plutôt que user.type() :
// userEvent simule des frappes clavier réalistes, peu fiables sur ces widgets composites sous
// jsdom (comportement différent des vrais navigateurs).

const EXISTING_CRENEAU = {
  id: 'creneau-1',
  terrainId: 'terrain-1',
  debut: '2026-09-01T18:00',
  fin: '2026-09-01T19:00',
  tarif: 15000,
  statut: 'disponible',
};

const NEW_CRENEAU = {
  id: 'creneau-2',
  terrainId: 'terrain-1',
  debut: '2026-09-02T10:00',
  fin: '2026-09-02T11:00',
  tarif: 15000,
  statut: 'disponible',
};

const RESERVED_CRENEAU = {
  id: 'creneau-3',
  terrainId: 'terrain-1',
  debut: '2026-09-03T18:00',
  fin: '2026-09-03T19:00',
  tarif: 20000,
  statut: 'reserve',
};

function createFetchMock(
  overrides: { createOk?: boolean; list?: typeof EXISTING_CRENEAU[] } = {}
) {
  return vi.fn((url: string, options?: RequestInit) => {
    if (options?.method === 'POST') {
      if (overrides.createOk === false) {
        return Promise.resolve({ ok: false, json: async () => null });
      }
      return Promise.resolve({ ok: true, json: async () => NEW_CRENEAU });
    }
    if (options?.method === 'PATCH') {
      return Promise.resolve({ ok: true, json: async () => ({ ...EXISTING_CRENEAU, tarif: 18000 }) });
    }
    if (options?.method === 'DELETE') {
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }
    return Promise.resolve({ ok: true, json: async () => overrides.list ?? [EXISTING_CRENEAU] });
  });
}

beforeEach(() => {
  window.localStorage.setItem('auth_token', 'token-123');
});

describe('CreneauxManager', () => {
  it('charge et affiche les créneaux existants', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<CreneauxManager terrainId="terrain-1" />);

    expect(await screen.findByText(/2026-09-01 18:00/)).toBeInTheDocument();
    expect(screen.getByText(/disponible/i)).toBeInTheDocument();
  });

  it("affiche les erreurs de validation et n'appelle pas l'API si le formulaire est incomplet", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<CreneauxManager terrainId="terrain-1" />);

    await screen.findByText(/2026-09-01 18:00/);
    await user.click(screen.getByRole('button', { name: /ajouter le créneau/i }));

    expect(await screen.findByText(/début requises/i)).toBeInTheDocument();
    expect(screen.getByText(/fin requises/i)).toBeInTheDocument();
    expect(screen.getByText(/tarif doit être un nombre positif/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'POST' }));
  });

  it('rejette un créneau dont la fin précède le début', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    const user = userEvent.setup();
    render(<CreneauxManager terrainId="terrain-1" />);

    await screen.findByText(/2026-09-01 18:00/);
    fireEvent.change(screen.getByLabelText(/début/i), { target: { value: '2026-09-02T10:00' } });
    fireEvent.change(screen.getByLabelText(/^fin$/i), { target: { value: '2026-09-02T09:00' } });
    fireEvent.change(screen.getByLabelText(/tarif/i), { target: { value: '15000' } });
    await user.click(screen.getByRole('button', { name: /ajouter le créneau/i }));

    expect(await screen.findByText(/fin doit être après le début/i)).toBeInTheDocument();
  });

  it('ajoute un créneau valide à la liste', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    const user = userEvent.setup();
    render(<CreneauxManager terrainId="terrain-1" />);

    await screen.findByText(/2026-09-01 18:00/);
    fireEvent.change(screen.getByLabelText(/début/i), { target: { value: '2026-09-02T10:00' } });
    fireEvent.change(screen.getByLabelText(/^fin$/i), { target: { value: '2026-09-02T11:00' } });
    fireEvent.change(screen.getByLabelText(/tarif/i), { target: { value: '15000' } });
    await user.click(screen.getByRole('button', { name: /ajouter le créneau/i }));

    expect(await screen.findByText(/2026-09-02 10:00/)).toBeInTheDocument();
  });

  it('modifie un créneau existant', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    const user = userEvent.setup();
    render(<CreneauxManager terrainId="terrain-1" />);

    await screen.findByText(/2026-09-01 18:00/);
    await user.click(screen.getByRole('button', { name: /^modifier$/i }));

    // Deux champs "Tarif" existent maintenant à l'écran (celui de la ligne en édition + celui du
    // formulaire "Ajouter un créneau" toujours visible en dessous) : le premier dans le DOM est
    // celui de la ligne, puisque la liste précède le formulaire d'ajout dans le JSX.
    fireEvent.change(screen.getAllByLabelText(/^tarif$/i)[0], { target: { value: '18000' } });
    await user.click(screen.getByRole('button', { name: /^enregistrer$/i }));

    expect(await screen.findByText(/18000/)).toBeInTheDocument();
  });

  it('retire un créneau existant', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    const user = userEvent.setup();
    render(<CreneauxManager terrainId="terrain-1" />);

    await screen.findByText(/2026-09-01 18:00/);
    await user.click(screen.getByRole('button', { name: /^retirer$/i }));

    expect(screen.queryByText(/2026-09-01 18:00/)).not.toBeInTheDocument();
    expect(await screen.findByText(/aucun créneau défini/i)).toBeInTheDocument();
  });

  it('désactive la modification et le retrait pour un créneau déjà réservé', async () => {
    vi.stubGlobal('fetch', createFetchMock({ list: [RESERVED_CRENEAU] }));
    render(<CreneauxManager terrainId="terrain-1" />);

    await screen.findByText(/2026-09-03 18:00/);
    expect(screen.getByRole('button', { name: /^modifier$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^retirer$/i })).toBeDisabled();
  });
});
