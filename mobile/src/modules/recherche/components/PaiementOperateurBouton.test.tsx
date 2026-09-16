import { fireEvent, render, screen } from '@testing-library/react-native';
import * as WebBrowser from 'expo-web-browser';
import { OPERATEUR_LABELS, OPERATEURS, type Operateur } from '@app/paiement-core';
import { PaiementOperateurBouton } from './PaiementOperateurBouton';

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(() => Promise.resolve({ type: 'dismiss' })),
}));

describe('PaiementOperateurBouton', () => {
  // Sans ce reset, l'historique d'appels de openBrowserAsync (un seul jest.fn() partagé, défini
  // une fois dans jest.mock ci-dessus) fuit d'un test à l'autre — contrairement à `global.fetch`,
  // réassigné à un nouveau jest.fn() dans chaque test.
  beforeEach(() => {
    jest.clearAllMocks();
  });


  it('ouvre le navigateur intégré sur l\'URL de paiement Wave une fois initié', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          paiementId: 'paiement-1',
          checkoutUrl: 'https://checkout.wave.com/xyz',
          montant: 15000,
          reductionParrainagePourcentage: null,
        }),
      })
    ) as unknown as typeof fetch;
    render(<PaiementOperateurBouton reservationId="reservation-1" operateur="wave" token="token-123" />);

    fireEvent.press(screen.getByLabelText('Payer avec Wave'));

    await screen.findByLabelText('Payer avec Wave');
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://checkout.wave.com/xyz');
  });

  it("affiche une erreur si l'initialisation du paiement échoue, sans ouvrir le navigateur", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, json: async () => null })) as unknown as typeof fetch;
    render(<PaiementOperateurBouton reservationId="reservation-1" operateur="wave" token="token-123" />);

    fireEvent.press(screen.getByLabelText('Payer avec Wave'));

    expect(await screen.findByText(/initialisation du paiement a échoué/i)).toBeTruthy();
    expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
  });

  // TC-012-04 / BUG-006 (rapport-qa.md, corrigé le 1 septembre 2026) : `WebBrowser.openBrowserAsync`
  // n'était jamais entouré d'un `try/catch` — une rejection ne devait afficher aucun message.
  it("affiche un message si l'ouverture du navigateur échoue après une initiation réussie", async () => {
    (WebBrowser.openBrowserAsync as jest.Mock).mockRejectedValueOnce(new Error("Impossible d'ouvrir"));
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          paiementId: 'paiement-1',
          checkoutUrl: 'https://checkout.wave.com/xyz',
          montant: 15000,
          reductionParrainagePourcentage: null,
        }),
      })
    ) as unknown as typeof fetch;
    render(<PaiementOperateurBouton reservationId="reservation-1" operateur="wave" token="token-123" />);

    fireEvent.press(screen.getByLabelText('Payer avec Wave'));

    expect(await screen.findByText(/n'a pas pu s'ouvrir/i)).toBeTruthy();
  });

  // TC-012-05 (rapport-qa.md) : la désactivation du bouton pendant l'appel n'était jamais vérifiée.
  it("désactive le bouton pendant que le paiement est en cours d'initiation", async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    global.fetch = jest.fn(() => pending) as unknown as typeof fetch;
    render(<PaiementOperateurBouton reservationId="reservation-1" operateur="wave" token="token-123" />);

    fireEvent.press(screen.getByLabelText('Payer avec Wave'));

    const bouton = await screen.findByLabelText('Payer avec Wave');
    expect(bouton.props.accessibilityState.disabled).toBe(true);

    resolveFetch({
      ok: true,
      json: async () => ({ paiementId: 'paiement-1', checkoutUrl: 'https://checkout.wave.com/xyz' }),
    });
    await screen.findByLabelText('Payer avec Wave');
  });

  // US-13/US-14 : le composant est générique, un seul test paramétré suffit à vérifier qu'il
  // fonctionne aussi pour Orange Money et Moov Money (Wave déjà couvert en détail ci-dessus).
  it.each(OPERATEURS)('fonctionne aussi pour %s (label affiché + appel avec le bon opérateur)', async (operateur: Operateur) => {
    const fetchMock = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          paiementId: 'paiement-1',
          checkoutUrl: `https://checkout.example.com/${operateur}`,
          montant: 15000,
          reductionParrainagePourcentage: null,
        }),
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<PaiementOperateurBouton reservationId="reservation-1" operateur={operateur} token="token-123" />);

    fireEvent.press(screen.getByLabelText(`Payer avec ${OPERATEUR_LABELS[operateur]}`));

    await screen.findByLabelText(`Payer avec ${OPERATEUR_LABELS[operateur]}`);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: JSON.stringify({ reservationId: 'reservation-1', operateur }) })
    );
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(`https://checkout.example.com/${operateur}`);
  });

  // Point de transparence signalé en session QA (rapport-qa.md, 9 septembre 2026) : un parrain
  // dont le paiement est réduit n'avait auparavant aucun moyen de le constater dans l'app.
  it('affiche le montant réduit quand une réduction de parrainage est appliquée', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          paiementId: 'paiement-1',
          checkoutUrl: 'https://checkout.wave.com/xyz',
          montant: 9000,
          reductionParrainagePourcentage: 10,
        }),
      })
    ) as unknown as typeof fetch;
    render(<PaiementOperateurBouton reservationId="reservation-1" operateur="wave" token="token-123" />);

    fireEvent.press(screen.getByLabelText('Payer avec Wave'));

    expect(await screen.findByText(/réduction de parrainage de 10%/i)).toBeTruthy();
    expect(screen.getByText(/9000 fcfa/i)).toBeTruthy();
  });

  it("n'affiche aucun message de réduction quand aucune n'est appliquée", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          paiementId: 'paiement-1',
          checkoutUrl: 'https://checkout.wave.com/xyz',
          montant: 15000,
          reductionParrainagePourcentage: null,
        }),
      })
    ) as unknown as typeof fetch;
    render(<PaiementOperateurBouton reservationId="reservation-1" operateur="wave" token="token-123" />);

    fireEvent.press(screen.getByLabelText('Payer avec Wave'));

    await screen.findByLabelText('Payer avec Wave');
    expect(screen.queryByText(/réduction de parrainage/i)).toBeNull();
  });
});
