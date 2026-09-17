import { fireEvent, render, screen } from '@testing-library/react-native';
import { MessagerieScreen } from './MessagerieScreen';

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

const MESSAGE_AUTRE = {
  id: 'message-1',
  reservationId: 'reservation-1',
  contenu: 'Le terrain a-t-il des vestiaires ?',
  estDeMoi: false,
  createdAt: '2026-08-30T10:00:00Z',
};

beforeEach(() => {
  mockSecureStore.clear();
  mockSecureStore.set('auth_token', 'token-123');
});

describe('MessagerieScreen', () => {
  it('affiche les messages existants de la conversation', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => [MESSAGE_AUTRE] })) as unknown as typeof fetch;
    await render(<MessagerieScreen reservationId="reservation-1" />);

    expect(await screen.findByText(/vestiaires/i)).toBeTruthy();
  });

  it("affiche un message clair quand la conversation n'a aucun message", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => [] })) as unknown as typeof fetch;
    await render(<MessagerieScreen reservationId="reservation-1" />);

    expect(await screen.findByText(/aucun message/i)).toBeTruthy();
  });

  it("envoie un nouveau message et l'affiche sans recharger toute la conversation", async () => {
    const fetchMock = jest.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'message-3',
            reservationId: 'reservation-1',
            contenu: 'Merci !',
            estDeMoi: true,
            createdAt: '2026-08-30T10:10:00Z',
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => [MESSAGE_AUTRE] });
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    await render(<MessagerieScreen reservationId="reservation-1" />);

    await screen.findByText(/vestiaires/i);
    await fireEvent.changeText(screen.getByLabelText('Message'), 'Merci !');
    await fireEvent.press(screen.getByLabelText('Envoyer'));

    expect(await screen.findByText('Merci !')).toBeTruthy();
  });

  it("invite à se connecter si l'utilisateur n'a pas de session", async () => {
    mockSecureStore.clear();
    await render(<MessagerieScreen reservationId="reservation-1" />);

    expect(await screen.findByText(/connecte-toi/i)).toBeTruthy();
  });

  // TC-024-05 (rapport-qa.md) : le pattern testé pour les listes sœurs (historique, reversements,
  // notifications) manquait pour la messagerie elle-même.
  it('affiche une erreur si le chargement de la conversation échoue', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, json: async () => null })) as unknown as typeof fetch;
    await render(<MessagerieScreen reservationId="reservation-1" />);

    expect(await screen.findByText(/impossible de charger la conversation/i)).toBeTruthy();
  });

  // TC-024-06 (rapport-qa.md) : l'échec de l'envoi n'était jamais exercé.
  it("affiche une erreur si l'envoi du message échoue, sans l'ajouter à la conversation", async () => {
    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        return Promise.resolve({ ok: false, json: async () => ({ message: "L'envoi du message a échoué." }) });
      }
      return Promise.resolve({ ok: true, json: async () => [MESSAGE_AUTRE] });
    }) as unknown as typeof fetch;
    await render(<MessagerieScreen reservationId="reservation-1" />);

    await screen.findByText(/vestiaires/i);
    await fireEvent.changeText(screen.getByLabelText('Message'), 'Merci !');
    await fireEvent.press(screen.getByLabelText('Envoyer'));

    expect(await screen.findByText(/l'envoi du message a échoué/i)).toBeTruthy();
    expect(screen.queryByText('Merci !')).toBeNull();
  });

  // TC-024-07 (rapport-qa.md) : le vidage immédiat du champ (avant résolution de l'envoi) est un
  // choix UX documenté en commentaire mais jamais verrouillé par un test.
  it("vide le champ de saisie immédiatement, avant même que l'envoi soit résolu", async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST') return pending;
      return Promise.resolve({ ok: true, json: async () => [MESSAGE_AUTRE] });
    }) as unknown as typeof fetch;
    await render(<MessagerieScreen reservationId="reservation-1" />);

    await screen.findByText(/vestiaires/i);
    const champ = screen.getByLabelText('Message');
    await fireEvent.changeText(champ, 'Merci !');
    await fireEvent.press(screen.getByLabelText('Envoyer'));

    expect(screen.getByLabelText('Message').props.value).toBe('');

    resolveFetch({
      ok: true,
      json: async () => ({
        id: 'message-3',
        reservationId: 'reservation-1',
        contenu: 'Merci !',
        estDeMoi: true,
        createdAt: '2026-08-30T10:10:00Z',
      }),
    });
    await screen.findByText('Merci !');
  });

  // TC-024-08 (rapport-qa.md) : la désactivation du bouton pendant l'appel n'était jamais vérifiée.
  it('désactive le bouton "Envoyer" pendant que l\'envoi est en cours', async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST') return pending;
      return Promise.resolve({ ok: true, json: async () => [MESSAGE_AUTRE] });
    }) as unknown as typeof fetch;
    await render(<MessagerieScreen reservationId="reservation-1" />);

    await screen.findByText(/vestiaires/i);
    await fireEvent.changeText(screen.getByLabelText('Message'), 'Merci !');
    await fireEvent.press(screen.getByLabelText('Envoyer'));

    const bouton = await screen.findByLabelText('Envoyer');
    expect(bouton.props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText(/^envoi…$/i)).toBeTruthy();

    resolveFetch({
      ok: true,
      json: async () => ({
        id: 'message-3',
        reservationId: 'reservation-1',
        contenu: 'Merci !',
        estDeMoi: true,
        createdAt: '2026-08-30T10:10:00Z',
      }),
    });
    await screen.findByText('Merci !');
  });
});
