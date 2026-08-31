import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateTerrainForm } from './CreateTerrainForm';

const CREATED_TERRAIN = {
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

function createFetchMock(overrides: { createOk?: boolean; photoOk?: boolean } = {}) {
  return vi.fn((url: string) => {
    if (url.includes('/photos')) {
      if (overrides.photoOk === false) {
        return Promise.resolve({ ok: false, json: async () => null });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ photoUrl: 'https://cdn.example.com/terrain.jpg' }),
      });
    }
    if (url.includes('/api/terrains')) {
      if (overrides.createOk === false) {
        return Promise.resolve({ ok: false, json: async () => null });
      }
      return Promise.resolve({ ok: true, json: async () => CREATED_TERRAIN });
    }
    throw new Error(`URL inattendue dans le test: ${url}`);
  });
}

beforeEach(() => {
  window.localStorage.setItem('auth_token', 'token-123');
});

describe('CreateTerrainForm', () => {
  it("affiche les erreurs de validation et n'appelle pas l'API si sport/adresse manquent", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<CreateTerrainForm />);

    await user.click(screen.getByRole('button', { name: /publier l'annonce/i }));

    expect(await screen.findByText(/sélectionne le sport/i)).toBeInTheDocument();
    expect(screen.getByText(/adresse est requise/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('publie une annonce valide et passe à la section photos', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    const user = userEvent.setup();
    render(<CreateTerrainForm />);

    await user.click(screen.getByRole('radio', { name: /foot/i }));
    await user.type(screen.getByLabelText(/adresse/i), 'Rue 12, Dakar');
    await user.click(screen.getByRole('button', { name: /publier l'annonce/i }));

    expect(await screen.findByText(/annonce publiée/i)).toBeInTheDocument();
  });

  it("affiche une erreur si la publication échoue côté API", async () => {
    vi.stubGlobal('fetch', createFetchMock({ createOk: false }));
    const user = userEvent.setup();
    render(<CreateTerrainForm />);

    await user.click(screen.getByRole('radio', { name: /tennis/i }));
    await user.type(screen.getByLabelText(/adresse/i), 'Rue 12, Dakar');
    await user.click(screen.getByRole('button', { name: /publier l'annonce/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/publication.*échoué/i);
  });

  it('envoie une photo une fois le terrain créé et l\'affiche dans la galerie', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    const user = userEvent.setup();
    render(<CreateTerrainForm />);

    await user.click(screen.getByRole('radio', { name: /basket/i }));
    await user.type(screen.getByLabelText(/adresse/i), 'Rue 12, Dakar');
    await user.click(screen.getByRole('button', { name: /publier l'annonce/i }));
    await screen.findByText(/annonce publiée/i);

    const file = new File(['contenu'], 'terrain.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText(/ajouter une photo/i), file);

    const img = await screen.findByAltText(/photo du terrain/i);
    await waitFor(() => expect(img).toHaveAttribute('src', 'https://cdn.example.com/terrain.jpg'));
  });

  // TC-004-06 (rapport-qa.md) : seul le succès de l'upload était testé.
  it("affiche une erreur si l'envoi de la photo échoue, sans bloquer la galerie", async () => {
    vi.stubGlobal('fetch', createFetchMock({ photoOk: false }));
    const user = userEvent.setup();
    render(<CreateTerrainForm />);

    await user.click(screen.getByRole('radio', { name: /foot/i }));
    await user.type(screen.getByLabelText(/adresse/i), 'Rue 12, Dakar');
    await user.click(screen.getByRole('button', { name: /publier l'annonce/i }));
    await screen.findByText(/annonce publiée/i);

    const file = new File(['contenu'], 'terrain.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText(/ajouter une photo/i), file);

    expect(await screen.findByText(/l'envoi de la photo a échoué/i)).toBeInTheDocument();
    // La galerie (même vide) et le champ d'ajout restent utilisables malgré l'échec.
    expect(screen.getByLabelText(/ajouter une photo/i)).toBeInTheDocument();
  });

  // TC-004-07 / BUG-003 (rapport-qa.md, corrigé le 31 août 2026) : une soumission avant la
  // résolution du token ne doit plus jamais rejeter à tort un utilisateur réellement connecté.
  it('désactive "Publier l\'annonce" tant que le token de session ne sait pas encore résolu', async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    render(<CreateTerrainForm />);

    // Interaction synchrone, avant que webSessionStorage.getToken() n'ait pu résoudre : c'est
    // précisément le moment où BUG-003 provoquait un faux rejet "Connecte-toi...".
    fireEvent.click(screen.getByRole('radio', { name: /foot/i }));
    fireEvent.change(screen.getByLabelText(/adresse/i), { target: { value: 'Rue 12, Dakar' } });
    expect(screen.getByRole('button', { name: /publier l'annonce/i })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /publier l'annonce/i }));
    expect(screen.queryByText(/connecte-toi pour publier/i)).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    // Une fois le token résolu (session bien valide), la publication doit fonctionner normalement.
    await waitFor(() => expect(screen.getByRole('button', { name: /publier l'annonce/i })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: /publier l'annonce/i }));

    expect(await screen.findByText(/annonce publiée/i)).toBeInTheDocument();
  });
});
