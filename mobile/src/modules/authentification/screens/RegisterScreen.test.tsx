import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { RegisterScreen } from './RegisterScreen';

// Comme côté web, on mocke fetch plutôt que d'appeler un vrai backend : l'endpoint Laravel
// n'existe pas encore (voir le TODO dans @app/auth-core/registerApi.ts).
const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
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
  });
});
