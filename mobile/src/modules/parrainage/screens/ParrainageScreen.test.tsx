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
    await render(<ParrainageScreen />);

    expect(await screen.findByText('AWA1234')).toBeTruthy();
    expect(screen.getByText(/moussa ba/i)).toBeTruthy();
  });

  it("affiche un message clair quand l'utilisateur n'a encore parrainé personne", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({ codeParrainage: 'AWA1234', filleuls: [] }) })
    ) as unknown as typeof fetch;
    await render(<ParrainageScreen />);

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
    await render(<ParrainageScreen />);

    await screen.findByText('AWA1234');
    await fireEvent.changeText(screen.getByLabelText('Code de parrainage'), 'MOU5678');
    await fireEvent.press(screen.getByLabelText('Utiliser'));

    expect(await screen.findByText(/code accepté/i)).toBeTruthy();
  });

  it("invite à se connecter si l'utilisateur n'a pas de session", async () => {
    mockSecureStore.clear();
    await render(<ParrainageScreen />);

    expect(await screen.findByText(/connecte-toi/i)).toBeTruthy();
  });

  // TC-026-05 (rapport-qa.md) : trou de parité mobile — testé côté web mais pas mobile.
  it('affiche une erreur si le code de parrainage est invalide', async () => {
    const fetchMock = jest.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        return Promise.resolve({ ok: false, json: async () => ({ message: 'Ce code de parrainage est invalide.' }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ codeParrainage: 'AWA1234', filleuls: [] }) });
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    await render(<ParrainageScreen />);

    await screen.findByText('AWA1234');
    await fireEvent.changeText(screen.getByLabelText('Code de parrainage'), 'INVALIDE');
    await fireEvent.press(screen.getByLabelText('Utiliser'));

    expect(await screen.findByText(/invalide/i)).toBeTruthy();
    // Le champ n'est PAS vidé après un échec — l'utilisateur doit pouvoir corriger sans retaper.
    expect(screen.getByLabelText('Code de parrainage').props.value).toBe('INVALIDE');
  });

  // TC-026-07 (rapport-qa.md) : le pattern testé pour les écrans sœurs (historique, reversements,
  // notifications, messagerie, recommandations) manquait pour le parrainage lui-même.
  it('affiche une erreur si le chargement du résumé de parrainage échoue', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, json: async () => null })) as unknown as typeof fetch;
    await render(<ParrainageScreen />);

    expect(await screen.findByText(/impossible de charger ton parrainage/i)).toBeTruthy();
  });

  // TC-026-08 (rapport-qa.md) : seule la moitié "pas vidé après un échec" du comportement
  // documenté en commentaire était verrouillée — pas la moitié "vidé après un succès".
  it('vide le champ une fois le code accepté avec succès', async () => {
    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ codeParrainage: 'AWA1234', filleuls: [] }) });
    }) as unknown as typeof fetch;
    await render(<ParrainageScreen />);

    await screen.findByText('AWA1234');
    await fireEvent.changeText(screen.getByLabelText('Code de parrainage'), 'MOU5678');
    await fireEvent.press(screen.getByLabelText('Utiliser'));

    await screen.findByText(/code accepté/i);
    expect(screen.getByLabelText('Code de parrainage').props.value).toBe('');
  });

  // TC-026-09 (rapport-qa.md) : la désactivation du bouton pendant l'appel n'était jamais vérifiée.
  it('désactive le bouton "Utiliser" pendant que l\'envoi est en cours', async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST') return pending;
      return Promise.resolve({ ok: true, json: async () => ({ codeParrainage: 'AWA1234', filleuls: [] }) });
    }) as unknown as typeof fetch;
    await render(<ParrainageScreen />);

    await screen.findByText('AWA1234');
    await fireEvent.changeText(screen.getByLabelText('Code de parrainage'), 'MOU5678');
    await fireEvent.press(screen.getByLabelText('Utiliser'));

    const bouton = await screen.findByLabelText('Utiliser');
    expect(bouton.props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText(/^envoi…$/i)).toBeTruthy();

    resolveFetch({ ok: true, json: async () => ({}) });
    await screen.findByText(/code accepté/i);
  });

  // TC-026-10 (rapport-qa.md) : seul le statut `valide` avec un avantage déjà accordé était
  // exercé — jamais le statut `en_attente` (avantage pas encore accordé).
  it('affiche un filleul en attente sans suffixe avantage', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          codeParrainage: 'AWA1234',
          filleuls: [{ id: 'user-3', nom: 'Fatou Sow', statut: 'en_attente', avantage: null, createdAt: '2026-08-25T10:00:00Z' }],
        }),
      })
    ) as unknown as typeof fetch;
    await render(<ParrainageScreen />);

    expect(await screen.findByText(/fatou sow/i)).toBeTruthy();
    expect(screen.getByText(/^en attente$/i)).toBeTruthy();
  });

  // BUG-008 (rapport-qa.md, corrigé le 9 septembre 2026) : le statut 'utilise' (renvoyé par le
  // backend une fois la réduction consommée, module Paiement) n'était pas traduit — la valeur
  // brute fuyait dans l'UI, accolée à un texte d'avantage devenu trompeur ("sur ta prochaine
  // réservation" alors qu'elle est déjà dépensée).
  it('affiche "Avantage utilisé" sans le texte d\'avantage devenu obsolète', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          codeParrainage: 'AWA1234',
          filleuls: [
            {
              id: 'user-4',
              nom: 'Ousmane Fall',
              statut: 'utilise',
              avantage: '10% de réduction sur ta prochaine réservation.',
              createdAt: '2026-08-25T10:00:00Z',
            },
          ],
        }),
      })
    ) as unknown as typeof fetch;
    await render(<ParrainageScreen />);

    expect(await screen.findByText(/ousmane fall/i)).toBeTruthy();
    expect(screen.getByText(/^avantage utilisé$/i)).toBeTruthy();
    expect(screen.queryByText(/utilise —/i)).toBeNull();
    expect(screen.queryByText(/prochaine réservation/i)).toBeNull();
  });
});
