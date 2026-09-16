import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { RootRedirect } from './RootRedirect';

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}));

beforeEach(() => {
  pushMock.mockReset();
  replaceMock.mockReset();
  window.localStorage.clear();
});

describe('RootRedirect', () => {
  it('redirige vers /accueil pour un utilisateur connecté', async () => {
    window.localStorage.setItem('auth_token', 'authenticated');
    render(<RootRedirect />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/accueil'));
  });

  it('redirige vers /connexion pour un utilisateur non connecté', async () => {
    render(<RootRedirect />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/connexion'));
  });
});
