import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  window.localStorage.clear();
});

describe('LoginForm', () => {
  it("affiche les erreurs de validation et n'appelle pas l'API si le formulaire est vide", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(await screen.findByText(/email ou téléphone requis/i)).toBeInTheDocument();
    expect(screen.getByText(/mot de passe requis/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('connecte un utilisateur avec des identifiants valides et stocke le token de session', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ utilisateurId: 'user-1', identifiant: 'joueur@example.com', token: 'abc123' }),
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email ou téléphone/i), 'joueur@example.com');
    await user.type(screen.getByLabelText(/mot de passe/i), 'motdepasse123');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({ method: 'POST' })
    );
    await waitFor(() => expect(window.localStorage.getItem('auth_token')).toBe('abc123'));
  });

  it('affiche un message générique si les identifiants sont incorrects', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => null });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email ou téléphone/i), 'joueur@example.com');
    await user.type(screen.getByLabelText(/mot de passe/i), 'mauvais-mot-de-passe');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/identifiant ou mot de passe incorrect/i);
    expect(window.localStorage.getItem('auth_token')).toBeNull();
  });
});
