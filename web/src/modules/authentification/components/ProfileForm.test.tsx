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
});
