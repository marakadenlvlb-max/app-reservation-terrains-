import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReserverCreneauBouton } from './ReserverCreneauBouton';

beforeEach(() => {
  window.localStorage.clear();
});

describe('ReserverCreneauBouton', () => {
  it("invite à se connecter si l'utilisateur n'a pas de session", async () => {
    render(<ReserverCreneauBouton creneauId="creneau-1" />);

    expect(await screen.findByText(/connecte-toi pour réserver/i)).toBeInTheDocument();
  });

  it('verrouille le créneau et affiche un compte à rebours après réservation', async () => {
    // expireA calculé par rapport à "maintenant" (horloge réelle, pas de fake timers ici) pour
    // que le compte à rebours affiché reste cohérent quel que soit le jour où le test tourne.
    const expireA = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    window.localStorage.setItem('auth_token', 'token-123');
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'reservation-1',
            creneauId: 'creneau-1',
            joueurId: 'user-1',
            statut: 'en_attente_paiement',
            montant: 15000,
            createdAt: new Date().toISOString(),
            expireA,
          }),
        })
      )
    );
    const user = userEvent.setup();
    render(<ReserverCreneauBouton creneauId="creneau-1" />);

    await user.click(await screen.findByRole('button', { name: /^réserver$/i }));

    expect(await screen.findByText(/créneau verrouillé/i)).toBeInTheDocument();
    // Format mm:ss plutôt qu'une valeur exacte : le temps écoulé entre le mock et l'assertion
    // fait varier la seconde de quelques unités selon la machine.
    expect(screen.getByText(/9:5\d|10:00/)).toBeInTheDocument();
  });

  it('affiche une erreur si le créneau vient déjà d\'être réservé par quelqu\'un d\'autre', async () => {
    window.localStorage.setItem('auth_token', 'token-123');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, json: async () => ({ message: 'Ce créneau est déjà réservé.' }) }))
    );
    const user = userEvent.setup();
    render(<ReserverCreneauBouton creneauId="creneau-1" />);

    await user.click(await screen.findByRole('button', { name: /^réserver$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/déjà réservé/i);
  });

  it('affiche la confirmation dès que le polling détecte un paiement validé côté backend (US-11)', async () => {
    window.localStorage.setItem('auth_token', 'token-123');
    const expireA = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    let callCount = 0;
    // 1er appel = POST de réservation (US-10) → en attente. 2e appel = 1er polling (US-11),
    // immédiat au montage de ReservationStatusPanel → simule un paiement déjà validé entre-temps.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        callCount += 1;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'reservation-1',
            creneauId: 'creneau-1',
            joueurId: 'user-1',
            statut: callCount === 1 ? 'en_attente_paiement' : 'confirmee',
            montant: 15000,
            createdAt: new Date().toISOString(),
            expireA,
          }),
        });
      })
    );
    const user = userEvent.setup();
    render(<ReserverCreneauBouton creneauId="creneau-1" />);

    await user.click(await screen.findByRole('button', { name: /^réserver$/i }));

    expect(await screen.findByText(/réservation confirmée/i)).toBeInTheDocument();
  });

  // TC-010-04 (rapport-qa.md) : tous les tests existants utilisaient un `expireA` dans le futur.
  it('affiche un message clair quand le délai de verrouillage a expiré', async () => {
    window.localStorage.setItem('auth_token', 'token-123');
    // Expiré depuis 1 seconde : dans la marge de grâce du polling (useReservationStatus.ts),
    // donc le statut reste 'en_attente_paiement' comme le renverrait réellement le backend dans
    // cette fenêtre — c'est useCountdown (basé sur l'horloge, pas sur le statut) qui doit détecter
    // l'expiration côté UI.
    const expireA = new Date(Date.now() - 1000).toISOString();
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'reservation-1',
            creneauId: 'creneau-1',
            joueurId: 'user-1',
            statut: 'en_attente_paiement',
            montant: 15000,
            createdAt: new Date().toISOString(),
            expireA,
          }),
        })
      )
    );
    const user = userEvent.setup();
    render(<ReserverCreneauBouton creneauId="creneau-1" />);

    await user.click(await screen.findByRole('button', { name: /^réserver$/i }));

    expect(await screen.findByText(/délai a expiré/i)).toBeInTheDocument();
  });

  // TC-010-05 (rapport-qa.md) : la désactivation du bouton pendant l'appel n'était jamais vérifiée.
  it('désactive le bouton "Réserver" pendant que la réservation est en cours', async () => {
    window.localStorage.setItem('auth_token', 'token-123');
    let resolveFetch: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal('fetch', vi.fn(() => pending));
    const user = userEvent.setup();
    render(<ReserverCreneauBouton creneauId="creneau-1" />);

    await user.click(await screen.findByRole('button', { name: /^réserver$/i }));

    expect(await screen.findByRole('button', { name: /réservation…/i })).toBeDisabled();

    // Résout la promesse et attend la retombée du re-rendu qui en découle : sinon la mise à jour
    // d'état survient après la fin du test, hors du `act()` de testing-library.
    resolveFetch({
      ok: true,
      json: async () => ({
        id: 'reservation-1',
        creneauId: 'creneau-1',
        joueurId: 'user-1',
        statut: 'en_attente_paiement',
        montant: 15000,
        createdAt: new Date().toISOString(),
        expireA: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }),
    });
    await screen.findByText(/créneau verrouillé/i);
  });

  // TC-011-03 (rapport-qa.md, US-11 / RF-014) : aucun test n'exerçait un échec du polling
  // lui-même (distinct d'un paiement refusé, où le backend répond `ok: true` avec statut
  // 'annulee') — ici c'est l'appel de vérification qui échoue techniquement.
  it("affiche une erreur de polling sans faire disparaître le compte à rebours", async () => {
    window.localStorage.setItem('auth_token', 'token-123');
    const expireA = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    let callCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        callCount += 1;
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 'reservation-1',
              creneauId: 'creneau-1',
              joueurId: 'user-1',
              statut: 'en_attente_paiement',
              montant: 15000,
              createdAt: new Date().toISOString(),
              expireA,
            }),
          });
        }
        return Promise.resolve({ ok: false, json: async () => null });
      })
    );
    const user = userEvent.setup();
    render(<ReserverCreneauBouton creneauId="creneau-1" />);

    await user.click(await screen.findByRole('button', { name: /^réserver$/i }));

    expect(await screen.findByText(/créneau verrouillé/i)).toBeInTheDocument();
    expect(await screen.findByText(/impossible de vérifier le statut/i)).toBeInTheDocument();
  });

  it('affiche un message clair si la réservation est annulée (paiement refusé)', async () => {
    window.localStorage.setItem('auth_token', 'token-123');
    const expireA = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    let callCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        callCount += 1;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'reservation-1',
            creneauId: 'creneau-1',
            joueurId: 'user-1',
            statut: callCount === 1 ? 'en_attente_paiement' : 'annulee',
            montant: 15000,
            createdAt: new Date().toISOString(),
            expireA,
          }),
        });
      })
    );
    const user = userEvent.setup();
    render(<ReserverCreneauBouton creneauId="creneau-1" />);

    await user.click(await screen.findByRole('button', { name: /^réserver$/i }));

    expect(await screen.findByText(/réservation a été annulée/i)).toBeInTheDocument();
  });
});
