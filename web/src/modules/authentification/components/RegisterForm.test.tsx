import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './RegisterForm';

// On mocke fetch plutôt que d'appeler un vrai backend : l'endpoint Laravel n'existe pas encore
// (voir le TODO dans @app/auth-core/registerApi.ts) et ce n'est pas la responsabilité de ce test.
const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('RegisterForm', () => {
  it("affiche les erreurs de validation et n'appelle pas l'API si le formulaire est invalide", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.click(screen.getByRole('button', { name: /créer mon compte/i }));

    expect(await screen.findByText(/email ou téléphone requis/i)).toBeInTheDocument();
    expect(screen.getByText(/au moins 8 caractères/i)).toBeInTheDocument();
    expect(screen.getByText(/sélectionne au moins un sport/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('inscrit un joueur avec des données valides', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ utilisateurId: 'user-1', identifiant: 'joueur@example.com' }),
    });
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email ou téléphone/i), 'joueur@example.com');
    await user.type(screen.getByLabelText(/mot de passe/i), 'motdepasse123');
    await user.click(screen.getByRole('checkbox', { name: /foot/i }));
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/register'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it("affiche une erreur si l'API refuse l'inscription (ex. identifiant déjà utilisé)", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Cet email est déjà utilisé.' }),
    });
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email ou téléphone/i), 'joueur@example.com');
    await user.type(screen.getByLabelText(/mot de passe/i), 'motdepasse123');
    await user.click(screen.getByRole('checkbox', { name: /tennis/i }));
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/déjà utilisé/i);
  });
});
