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
          json: async () => ({ paiementId: 'paiement-1', checkoutUrl: 'https://checkout.wave.com/xyz' }),
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

  // US-13/US-14 : le composant est générique, donc un seul test paramétré suffit à vérifier
  // qu'il fonctionne aussi pour Orange Money et Moov Money, pas seulement pour Wave (déjà
  // couvert en détail par le premier test ci-dessus).
  it.each(OPERATEURS)('fonctionne aussi pour %s (label affiché + appel avec le bon opérateur)', async (operateur: Operateur) => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ paiementId: 'paiement-1', checkoutUrl: `https://checkout.example.com/${operateur}` }),
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
});
