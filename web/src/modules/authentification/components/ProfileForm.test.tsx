import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileForm } from './ProfileForm';

const PROFILE = {
  utilisateurId: 'user-1',
  nom: 'Awa Diallo',
  ville: 'Dakar',
  photoUrl: null as string | null,
  sports: ['foot'],
};

/** Un seul mock de fetch qui distingue GET (chargement), PATCH (sauvegarde) et l'upload photo. */
function createFetchMock() {
  return vi.fn((url: string, options?: RequestInit) => {
    if (url.includes('/api/profile/photo')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ photoUrl: 'https://cdn.example.com/photo.jpg' }),
      });
    }
    if (options?.method === 'PATCH') {
      return Promise.resolve({ ok: true, json: async () => ({ ...PROFILE, ville: 'Abidjan' }) });
    }
    return Promise.resolve({ ok: true, json: async () => PROFILE });
  });
}

beforeEach(() => {
  window.localStorage.setItem('auth_token', 'token-123');
});

describe('ProfileForm', () => {
  it('charge et affiche le profil existant', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<ProfileForm />);

    expect(await screen.findByDisplayValue('Awa Diallo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Dakar')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /foot/i })).toBeChecked();
  });

  it("affiche une erreur de validation si le nom est vidé, sans appeler l'API de sauvegarde", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<ProfileForm />);

    await screen.findByDisplayValue('Awa Diallo');
    await user.clear(screen.getByLabelText(/^nom$/i));
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    expect(await screen.findByText(/le nom est requis/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/profile'),
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('enregistre les modifications et affiche une confirmation', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    const user = userEvent.setup();
    render(<ProfileForm />);

    await screen.findByDisplayValue('Awa Diallo');
    await user.clear(screen.getByLabelText(/ville/i));
    await user.type(screen.getByLabelText(/ville/i), 'Abidjan');
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    expect(await screen.findByText(/profil mis à jour/i)).toBeInTheDocument();
  });

  it('envoie la photo sélectionnée et affiche le nouvel aperçu', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    const user = userEvent.setup();
    render(<ProfileForm />);

    await screen.findByDisplayValue('Awa Diallo');
    const file = new File(['contenu'], 'photo.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText(/photo de profil/i), file);

    const img = await screen.findByAltText(/photo de profil/i);
    await waitFor(() => expect(img).toHaveAttribute('src', 'https://cdn.example.com/photo.jpg'));
  });

  // TC-003-05 (rapport-qa.md) : seul le nom était testé comme champ invalide ; le sport,
  // lui aussi requis par validateProfilePayload, n'avait aucun cas dédié.
  it("affiche une erreur de validation si tous les sports sont décochés, sans appeler l'API de sauvegarde", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<ProfileForm />);

    await screen.findByDisplayValue('Awa Diallo');
    await user.click(screen.getByRole('checkbox', { name: /foot/i })); // décoche l'unique sport déjà sélectionné
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    expect(await screen.findByText(/sélectionne au moins un sport/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/profile'),
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  // TC-003-06 (rapport-qa.md) : seul le succès du chargement était testé.
  it('affiche une erreur bloquante si le chargement du profil échoue', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, json: async () => null })));
    render(<ProfileForm />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/profil/i);
  });

  // TC-003-07 (rapport-qa.md) : le code porte un commentaire explicite ("une fois chargé, une
  // erreur ultérieure ne doit pas faire disparaître le formulaire") jamais vérifié par un test.
  it('affiche une erreur de sauvegarde sans faire disparaître le formulaire déjà chargé', async () => {
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'PATCH') {
        return Promise.resolve({ ok: false, json: async () => ({ message: 'La mise à jour a échoué.' }) });
      }
      return Promise.resolve({ ok: true, json: async () => PROFILE });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<ProfileForm />);

    await screen.findByDisplayValue('Awa Diallo');
    await user.clear(screen.getByLabelText(/ville/i));
    await user.type(screen.getByLabelText(/ville/i), 'Abidjan');
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/mise à jour a échoué/i);
    // Le formulaire reste affiché et modifiable, pas remplacé par un écran d'erreur bloquant.
    expect(screen.getByDisplayValue('Abidjan')).toBeInTheDocument();
  });

  // TC-003-08 (rapport-qa.md) : seul le succès de l'upload était testé.
  it("affiche une erreur si l'envoi de la photo échoue, sans bloquer le reste du formulaire", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/api/profile/photo')) {
        return Promise.resolve({ ok: false, json: async () => ({ message: "L'envoi de la photo a échoué." }) });
      }
      return Promise.resolve({ ok: true, json: async () => PROFILE });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<ProfileForm />);

    await screen.findByDisplayValue('Awa Diallo');
    const file = new File(['contenu'], 'photo.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText(/photo de profil/i), file);

    expect(await screen.findByText(/l'envoi de la photo a échoué/i)).toBeInTheDocument();
    // Le reste du formulaire reste utilisable malgré l'échec de l'upload.
    expect(screen.getByDisplayValue('Awa Diallo')).toBeInTheDocument();
  });

  // TC-003-09 / BUG-002 (rapport-qa.md, corrigé le 31 août 2026) : un utilisateur déjà
  // authentifié ne doit jamais voir "Connecte-toi..." s'afficher, même brièvement, au chargement.
  it("n'affiche jamais le message de connexion pour un utilisateur déjà authentifié", async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<ProfileForm />);

    // Vérification synchrone, immédiatement après le rendu : c'est précisément le moment où
    // BUG-002 provoquait un flash, avant même que le profil n'ait eu le temps de charger.
    expect(screen.queryByText(/connecte-toi/i)).not.toBeInTheDocument();

    await screen.findByDisplayValue('Awa Diallo');
    expect(screen.queryByText(/connecte-toi/i)).not.toBeInTheDocument();
  });
});
