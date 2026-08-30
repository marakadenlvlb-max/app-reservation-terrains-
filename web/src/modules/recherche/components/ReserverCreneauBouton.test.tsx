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
