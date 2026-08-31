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

  // TC-001-03 (rapport-qa.md) : RF-001 accepte explicitement "email OU téléphone" comme
  // identifiant, mais seul l'email était exercé jusqu'ici par les tests ci-dessus.
  it('accepte un numéro de téléphone comme identifiant (RF-001 : email ou téléphone)', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ utilisateurId: 'user-1', identifiant: '+221771234567' }),
    });
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email ou téléphone/i), '+221771234567');
    await user.type(screen.getByLabelText(/mot de passe/i), 'motdepasse123');
    await user.click(screen.getByRole('checkbox', { name: /foot/i }));
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/format invalide/i)).not.toBeInTheDocument();
  });

  // TC-001-04 / TC-001-05 (rapport-qa.md) : le test "formulaire vide" plus haut ne prouve que le
  // cas "champ vide" de chaque validation — pas un champ rempli mais mal formé/trop court, qui
  // suit un chemin différent dans validateRegisterPayload (packages/auth-core/src/validation.ts).
  it.each([
    {
      cas: 'identifiant au format invalide (ni email ni téléphone)',
      identifiant: 'pasuncontact',
      motDePasse: 'motdepasse123',
      erreurAttendue: /format invalide/i,
    },
    {
      cas: 'mot de passe non vide mais trop court',
      identifiant: 'joueur@example.com',
      motDePasse: 'abc123',
      erreurAttendue: /au moins 8 caractères/i,
    },
  ])('affiche une erreur de validation : $cas', async ({ identifiant, motDePasse, erreurAttendue }) => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email ou téléphone/i), identifiant);
    await user.type(screen.getByLabelText(/mot de passe/i), motDePasse);
    await user.click(screen.getByRole('checkbox', { name: /foot/i }));
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }));

    expect(await screen.findByText(erreurAttendue)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // TC-001-07 (rapport-qa.md) : le champ était déjà `type="password"` dans le code, mais rien ne
  // l'affirmait par un test — pertinent car directement lié à RNF-002.
  it('masque la saisie du mot de passe (RNF-002)', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/mot de passe/i)).toHaveAttribute('type', 'password');
  });
});
