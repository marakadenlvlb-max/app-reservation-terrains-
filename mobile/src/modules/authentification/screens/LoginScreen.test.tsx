import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { LoginScreen } from './LoginScreen';

// expo-secure-store s'appuie sur un module natif indisponible sous Jest : on le mocke avec une
// implémentation en mémoire, suffisante pour vérifier que le token est bien écrit/lu.
const mockSecureStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string) => Promise.resolve(mockSecureStore.get(key) ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockSecureStore.set(key, value);
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    mockSecureStore.delete(key);
    return Promise.resolve();
  }),
}));

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  mockSecureStore.clear();
});

describe('LoginScreen', () => {
  it("affiche les erreurs de validation et n'appelle pas l'API si le formulaire est vide", async () => {
    render(<LoginScreen />);

    fireEvent.press(screen.getByLabelText('Se connecter'));

    expect(await screen.findByText(/email ou téléphone requis/i)).toBeTruthy();
    expect(screen.getByText(/mot de passe requis/i)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('connecte un utilisateur avec des identifiants valides et stocke le token de session', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ utilisateurId: 'user-1', identifiant: 'joueur@example.com', token: 'abc123' }),
    });
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('Email ou téléphone'), 'joueur@example.com');
    fireEvent.changeText(screen.getByLabelText('Mot de passe'), 'motdepasse123');
    fireEvent.press(screen.getByLabelText('Se connecter'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockSecureStore.get('auth_token')).toBe('abc123'));
  });

  it('affiche un message générique si les identifiants sont incorrects', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => null });
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('Email ou téléphone'), 'joueur@example.com');
    fireEvent.changeText(screen.getByLabelText('Mot de passe'), 'mauvais-mot-de-passe');
    fireEvent.press(screen.getByLabelText('Se connecter'));

    expect(await screen.findByText(/identifiant ou mot de passe incorrect/i)).toBeTruthy();
    expect(mockSecureStore.get('auth_token')).toBeUndefined();
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
      render(<LoginScreen />);

      if (identifiant) fireEvent.changeText(screen.getByLabelText('Email ou téléphone'), identifiant);
      if (motDePasse) fireEvent.changeText(screen.getByLabelText('Mot de passe'), motDePasse);
      fireEvent.press(screen.getByLabelText('Se connecter'));

      expect(await screen.findByText(erreurAttendue)).toBeTruthy();
      expect(screen.queryByText(erreurAbsente)).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );
});
