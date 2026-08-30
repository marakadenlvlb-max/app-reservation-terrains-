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
        json: async () => ({ paiementId: 'paiement-1', checkoutUrl: 'https://checkout.wave.com/xyz' }),
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

  // US-13/US-14 : le composant est générique, un seul test paramétré suffit à vérifier qu'il
  // fonctionne aussi pour Orange Money et Moov Money (Wave déjà couvert en détail ci-dessus).
  it.each(OPERATEURS)('fonctionne aussi pour %s (label affiché + appel avec le bon opérateur)', async (operateur: Operateur) => {
    const fetchMock = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ paiementId: 'paiement-1', checkoutUrl: `https://checkout.example.com/${operateur}` }),
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
});
