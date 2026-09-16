import { fireEvent, render, screen } from '@testing-library/react-native';
import { pushMock } from '../../../testUtils/expoRouterMocks';
import { MesConversationsScreen } from './MesConversationsScreen';

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

beforeEach(() => {
  mockSecureStore.clear();
  pushMock.mockReset();
});

describe('MesConversationsScreen', () => {
  it("invite à se connecter si aucune session n'est active", async () => {
    render(<MesConversationsScreen />);

    expect(await screen.findByText(/connecte-toi/i)).toBeTruthy();
  });

  it('affiche les conversations et navigue vers la conversation au clic', async () => {
    mockSecureStore.set('auth_token', 'token-123');
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => [
          {
            reservationId: 'reservation-1',
            terrain: { id: 'terrain-1', sport: 'football', adresse: '12 rue du Stade' },
            autrePartie: { id: 'user-2', nom: 'Awa Diop' },
            dernierMessage: { contenu: 'On confirme pour 18h ?', createdAt: '2026-09-16T10:00:00' },
          },
        ],
      })
    ) as unknown as typeof fetch;

    render(<MesConversationsScreen />);

    expect(await screen.findByText(/12 rue du stade/i)).toBeTruthy();
    expect(screen.getByText(/awa diop/i)).toBeTruthy();
    expect(screen.getByText(/on confirme pour 18h/i)).toBeTruthy();

    fireEvent.press(screen.getByText(/12 rue du stade/i));
    expect(pushMock).toHaveBeenCalledWith('/reservations/reservation-1/messages');
  });

  it("affiche un message si l'utilisateur n'a encore aucune conversation", async () => {
    mockSecureStore.set('auth_token', 'token-123');
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => [] })) as unknown as typeof fetch;

    render(<MesConversationsScreen />);

    expect(await screen.findByText(/aucune conversation/i)).toBeTruthy();
  });
});
