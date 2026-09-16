import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogoutButton } from './LogoutButton';

const fetchMock = vi.fn();
const pushMock = vi.fn();

// US-27 : LogoutButton redirige désormais vers /connexion via next/navigation — mock nécessaire,
// next/navigation exige un contexte App Router absent de jsdom.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

beforeEach(() => {
  fetchMock.mockReset();
  pushMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  window.localStorage.setItem('auth_token', 'existing-token');
});

describe('LogoutButton', () => {
  it('efface le token de session au clic et redirige vers /connexion', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: /se déconnecter/i }));

    await waitFor(() => expect(window.localStorage.getItem('auth_token')).toBeNull());
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/connexion'));
  });

  it("efface quand même le token en local et redirige, si l'appel au backend échoue", async () => {
    // Le backend peut être injoignable ou le token déjà expiré (voir loginApi.ts) : la
    // déconnexion locale ne doit pas en dépendre.
    fetchMock.mockRejectedValueOnce(new Error('network error'));
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: /se déconnecter/i }));

    await waitFor(() => expect(window.localStorage.getItem('auth_token')).toBeNull());
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/connexion'));
  });
});
