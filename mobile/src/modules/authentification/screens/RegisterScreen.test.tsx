import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { pushMock } from '../../../testUtils/expoRouterMocks';
import { RegisterScreen } from './RegisterScreen';

// Comme côté web, on mocke fetch plutôt que d'appeler un vrai backend : l'endpoint Laravel
// n'existe pas encore (voir le TODO dans @app/auth-core/registerApi.ts).
const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  pushMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe('RegisterScreen', () => {
  it("affiche les erreurs de validation et n'appelle pas l'API si le formulaire est invalide", async () => {
    render(<RegisterScreen />);

    fireEvent.press(screen.getByLabelText('Créer mon compte'));

    expect(await screen.findByText(/email ou téléphone requis/i)).toBeTruthy();
    expect(screen.getByText(/au moins 8 caractères/i)).toBeTruthy();
    expect(screen.getByText(/sélectionne au moins un sport/i)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('inscrit un joueur avec des données valides', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ utilisateurId: 'user-1', identifiant: 'joueur@example.com' }),
    });
    render(<RegisterScreen />);

    fireEvent.changeText(screen.getByLabelText('Email ou téléphone'), 'joueur@example.com');
    fireEvent.changeText(screen.getByLabelText('Mot de passe'), 'motdepasse123');
    fireEvent.press(screen.getByLabelText('Foot'));
    fireEvent.press(screen.getByLabelText('Créer mon compte'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/register'),
      expect.objectContaining({ method: 'POST' })
    );
    // US-29 : redirection vers /connexion (pas /accueil — l'inscription seule n'authentifie pas).
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/connexion'));
  });

  it("affiche une erreur si l'API refuse l'inscription (ex. identifiant déjà utilisé)", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Cet email est déjà utilisé.' }),
    });
    render(<RegisterScreen />);

    fireEvent.changeText(screen.getByLabelText('Email ou téléphone'), 'joueur@example.com');
    fireEvent.changeText(screen.getByLabelText('Mot de passe'), 'motdepasse123');
    fireEvent.press(screen.getByLabelText('Tennis'));
    fireEvent.press(screen.getByLabelText('Créer mon compte'));

    expect(await screen.findByText(/déjà utilisé/i)).toBeTruthy();
    expect(pushMock).not.toHaveBeenCalled();
  });

  // TC-001-03 (rapport-qa.md) : RF-001 accepte explicitement "email OU téléphone" comme
  // identifiant, mais seul l'email était exercé jusqu'ici par les tests ci-dessus.
  it('accepte un numéro de téléphone comme identifiant (RF-001 : email ou téléphone)', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ utilisateurId: 'user-1', identifiant: '+221771234567' }),
    });
    render(<RegisterScreen />);

    fireEvent.changeText(screen.getByLabelText('Email ou téléphone'), '+221771234567');
    fireEvent.changeText(screen.getByLabelText('Mot de passe'), 'motdepasse123');
    fireEvent.press(screen.getByLabelText('Foot'));
    fireEvent.press(screen.getByLabelText('Créer mon compte'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/format invalide/i)).toBeNull();
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
    render(<RegisterScreen />);

    fireEvent.changeText(screen.getByLabelText('Email ou téléphone'), identifiant);
    fireEvent.changeText(screen.getByLabelText('Mot de passe'), motDePasse);
    fireEvent.press(screen.getByLabelText('Foot'));
    fireEvent.press(screen.getByLabelText('Créer mon compte'));

    expect(await screen.findByText(erreurAttendue)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // TC-001-07 (rapport-qa.md) : le champ était déjà `secureTextEntry` dans le code, mais rien ne
  // l'affirmait par un test — pertinent car directement lié à RNF-002.
  it('masque la saisie du mot de passe (RNF-002)', () => {
    render(<RegisterScreen />);

    expect(screen.getByLabelText('Mot de passe').props.secureTextEntry).toBe(true);
  });

  // US-29 : /connexion n'était atteignable depuis ici que via App.tsx codé en dur.
  it('propose un lien vers /connexion', () => {
    render(<RegisterScreen />);

    fireEvent.press(screen.getByText(/se connecter/i));

    expect(pushMock).toHaveBeenCalledWith('/connexion');
  });
});
