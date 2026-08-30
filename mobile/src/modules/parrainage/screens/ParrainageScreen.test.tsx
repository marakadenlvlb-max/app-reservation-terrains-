import { fireEvent, render, screen } from '@testing-library/react-native';
import { ParrainageScreen } from './ParrainageScreen';

const mockSecureStore = new Map<string, string>([['auth_token', 'token-123']]);
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

const RESUME = {
  codeParrainage: 'AWA1234',
  filleuls: [
    { id: 'user-2', nom: 'Moussa Ba', statut: 'valide', avantage: '1000 FCFA de crédit', createdAt: '2026-08-20T10:00:00Z' },
  ],
};

beforeEach(() => {
  mockSecureStore.clear();
  mockSecureStore.set('auth_token', 'token-123');
});

describe('ParrainageScreen', () => {
  it('affiche le code de parrainage et la liste des filleuls', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => RESUME })) as unknown as typeof fetch;
    render(<ParrainageScreen />);

    expect(await screen.findByText('AWA1234')).toBeTruthy();
    expect(screen.getByText(/moussa ba/i)).toBeTruthy();
  });

  it("affiche un message clair quand l'utilisateur n'a encore parrainé personne", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({ codeParrainage: 'AWA1234', filleuls: [] }) })
    ) as unknown as typeof fetch;
    render(<ParrainageScreen />);

    expect(await screen.findByText(/n'as encore parrainé personne/i)).toBeTruthy();
  });

  it('utilise un code de parrainage reçu et affiche la confirmation', async () => {
    const fetchMock = jest.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ codeParrainage: 'AWA1234', filleuls: [] }) });
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<ParrainageScreen />);

    await screen.findByText('AWA1234');
    fireEvent.changeText(screen.getByLabelText('Code de parrainage'), 'MOU5678');
    fireEvent.press(screen.getByLabelText('Utiliser'));

    expect(await screen.findByText(/code accepté/i)).toBeTruthy();
  });

  it("invite à se connecter si l'utilisateur n'a pas de session", async () => {
    mockSecureStore.clear();
    render(<ParrainageScreen />);

    expect(await screen.findByText(/connecte-toi/i)).toBeTruthy();
  });
});
