import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

const fetchMock = vi.fn();
const pushMock = vi.fn();

// US-27 : LoginForm redirige désormais vers /accueil via next/navigation plutôt que d'afficher
// un message statique sur place — next/navigation exige un contexte App Router absent de jsdom,
// d'où ce mock (même principe que le mock de fetch, déjà en place pour une autre dépendance externe).
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

beforeEach(() => {
  fetchMock.mockReset();
  pushMock.mockReset();
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
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    );
    // Depuis la correction RNF-002 du 31 août 2026 (BUG-001), le vrai token ('abc123' renvoyé par
    // l'API) n'est plus jamais persisté côté web — voir sessionStorage.ts. localStorage ne
    // contient plus qu'un marqueur non sensible, le vrai secret vivant dans un cookie HttpOnly
    // que ce test (comme le navigateur réel) ne peut pas lire.
    await waitFor(() => expect(window.localStorage.getItem('auth_token')).toBe('authenticated'));
    // US-27 : redirection vers l'accueil post-connexion (referme le TODO qui vivait ici).
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/accueil'));
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
    expect(pushMock).not.toHaveBeenCalled();
  });

  // TC-002-06 (rapport-qa.md) : le test "formulaire vide" plus haut ne prouve que le cas "les
  // deux champs vides ensemble" — pas qu'un seul champ manquant n'affiche que l'erreur qui le
  // concerne (validateLoginPayload vérifie pourtant chaque champ indépendamment).
  it.each([
    {
      cas: 'identifiant seul rempli',
      identifiant: 'joueur@example.com',
      motDePasse: '',
      erreurAttendue: /mot de passe requis/i,
      erreurAbsente: /email ou téléphone requis/i,
    },
    {
      cas: 'mot de passe seul rempli',
      identifiant: '',
      motDePasse: 'motdepasse123',
      erreurAttendue: /email ou téléphone requis/i,
      erreurAbsente: /mot de passe requis/i,
    },
  ])(
    "n'affiche que l'erreur du champ manquant : $cas",
    async ({ identifiant, motDePasse, erreurAttendue, erreurAbsente }) => {
      const user = userEvent.setup();
      render(<LoginForm />);

      if (identifiant) await user.type(screen.getByLabelText(/email ou téléphone/i), identifiant);
      if (motDePasse) await user.type(screen.getByLabelText(/mot de passe/i), motDePasse);
      await user.click(screen.getByRole('button', { name: /se connecter/i }));

      expect(await screen.findByText(erreurAttendue)).toBeInTheDocument();
      expect(screen.queryByText(erreurAbsente)).not.toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );
});
