import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OPERATEUR_LABELS, OPERATEURS, type Operateur } from '@app/paiement-core';
import { PaiementOperateurBouton } from './PaiementOperateurBouton';

// `ReturnType<typeof vi.spyOn>` seul ne suffit pas à typer précisément l'espion : `spyOn` est
// générique/surchargé, il faut préciser explicitement quelle méthode est espionnée.
let windowOpenSpy: MockInstance<typeof window.open>;

beforeEach(() => {
  windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
});

afterEach(() => {
  windowOpenSpy.mockRestore();
});

describe('PaiementOperateurBouton', () => {
  it("ouvre l'URL de paiement Wave dans un nouvel onglet une fois initié", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            paiementId: 'paiement-1',
            checkoutUrl: 'https://checkout.wave.com/xyz',
            montant: 15000,
            reductionParrainagePourcentage: null,
          }),
        })
      )
    );
    const user = userEvent.setup();
    render(<PaiementOperateurBouton reservationId="reservation-1" operateur="wave" token="token-123" />);

    await user.click(screen.getByRole('button', { name: /payer avec wave/i }));

    expect(windowOpenSpy).toHaveBeenCalledWith('https://checkout.wave.com/xyz', '_blank', 'noopener,noreferrer');
  });

  it("affiche une erreur si l'initialisation du paiement échoue, sans ouvrir d'onglet", async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, json: async () => null })));
    const user = userEvent.setup();
    render(<PaiementOperateurBouton reservationId="reservation-1" operateur="wave" token="token-123" />);

    await user.click(screen.getByRole('button', { name: /payer avec wave/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/initialisation du paiement a échoué/i);
    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  // TC-012-04 / BUG-006 (rapport-qa.md, corrigé le 1 septembre 2026) : `window.open` peut
  // renvoyer `null` si le popup est bloqué — l'utilisateur doit être informé, avec un moyen de
  // continuer quand même, plutôt qu'un bouton qui redevient silencieusement cliquable.
  it("affiche un message et un lien de secours si le popup de paiement est bloqué", async () => {
    windowOpenSpy.mockImplementation(() => null);
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            paiementId: 'paiement-1',
            checkoutUrl: 'https://checkout.wave.com/xyz',
            montant: 15000,
            reductionParrainagePourcentage: null,
          }),
        })
      )
    );
    const user = userEvent.setup();
    render(<PaiementOperateurBouton reservationId="reservation-1" operateur="wave" token="token-123" />);

    await user.click(screen.getByRole('button', { name: /payer avec wave/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/n'a pas pu s'ouvrir/i);
    expect(screen.getByRole('link', { name: /continuer vers le paiement/i })).toHaveAttribute(
      'href',
      'https://checkout.wave.com/xyz'
    );
  });

  // TC-012-05 (rapport-qa.md) : la désactivation du bouton pendant l'appel n'était jamais vérifiée.
  it('désactive le bouton pendant que le paiement est en cours d\'initiation', async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal('fetch', vi.fn(() => pending));
    const user = userEvent.setup();
    render(<PaiementOperateurBouton reservationId="reservation-1" operateur="wave" token="token-123" />);

    await user.click(screen.getByRole('button', { name: /payer avec wave/i }));

    expect(await screen.findByRole('button', { name: /ouverture du paiement…/i })).toBeDisabled();

    resolveFetch({
      ok: true,
      json: async () => ({ paiementId: 'paiement-1', checkoutUrl: 'https://checkout.wave.com/xyz' }),
    });
    await screen.findByRole('button', { name: /payer avec wave/i });
  });

  // US-13/US-14 : le composant est générique, donc un seul test paramétré suffit à vérifier
  // qu'il fonctionne aussi pour Orange Money et Moov Money, pas seulement pour Wave (déjà
  // couvert en détail par le premier test ci-dessus).
  it.each(OPERATEURS)('fonctionne aussi pour %s (label affiché + appel avec le bon opérateur)', async (operateur: Operateur) => {
    const fetchMock = vi.fn(() =>
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
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<PaiementOperateurBouton reservationId="reservation-1" operateur={operateur} token="token-123" />);

    const label = new RegExp(`payer avec ${OPERATEUR_LABELS[operateur]}`, 'i');
    await user.click(screen.getByRole('button', { name: label }));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: JSON.stringify({ reservationId: 'reservation-1', operateur }) })
    );
    expect(windowOpenSpy).toHaveBeenCalledWith(`https://checkout.example.com/${operateur}`, '_blank', 'noopener,noreferrer');
  });

  // Point de transparence signalé en session QA (rapport-qa.md, 9 septembre 2026) : un parrain
  // dont le paiement est réduit n'avait auparavant aucun moyen de le constater dans l'app.
  it('affiche le montant réduit quand une réduction de parrainage est appliquée', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            paiementId: 'paiement-1',
            checkoutUrl: 'https://checkout.wave.com/xyz',
            montant: 9000,
            reductionParrainagePourcentage: 10,
          }),
        })
      )
    );
    const user = userEvent.setup();
    render(<PaiementOperateurBouton reservationId="reservation-1" operateur="wave" token="token-123" />);

    await user.click(screen.getByRole('button', { name: /payer avec wave/i }));

    expect(await screen.findByText(/réduction de parrainage de 10%/i)).toBeInTheDocument();
    expect(screen.getByText(/9000 fcfa/i)).toBeInTheDocument();
  });

  it("n'affiche aucun message de réduction quand aucune n'est appliquée", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            paiementId: 'paiement-1',
            checkoutUrl: 'https://checkout.wave.com/xyz',
            montant: 15000,
            reductionParrainagePourcentage: null,
          }),
        })
      )
    );
    const user = userEvent.setup();
    render(<PaiementOperateurBouton reservationId="reservation-1" operateur="wave" token="token-123" />);

    await user.click(screen.getByRole('button', { name: /payer avec wave/i }));

    await screen.findByRole('button', { name: /payer avec wave/i });
    expect(screen.queryByText(/réduction de parrainage/i)).not.toBeInTheDocument();
  });
});
