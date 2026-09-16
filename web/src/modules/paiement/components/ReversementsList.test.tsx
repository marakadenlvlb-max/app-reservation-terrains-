import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReversementsList } from './ReversementsList';

const REVERSEMENT_EFFECTUE = {
  paiementId: 'paiement-1',
  reservationId: 'reservation-1',
  operateur: 'wave',
  montant: 15000,
  commission: 1500,
  montantNet: 13500,
  statutReversement: 'effectue',
  datePaiement: '2026-08-25T18:00:00Z',
  dateReversement: '2026-08-28T09:00:00Z',
};

const REVERSEMENT_EN_ATTENTE = {
  paiementId: 'paiement-2',
  reservationId: 'reservation-2',
  operateur: 'orange_money',
  montant: 20000,
  commission: 2000,
  montantNet: 18000,
  statutReversement: 'en_attente',
  datePaiement: '2026-08-30T10:00:00Z',
  dateReversement: null as string | null,
};

beforeEach(() => {
  window.localStorage.setItem('auth_token', 'token-123');
});

describe('ReversementsList', () => {
  it('affiche la liste des reversements avec montant net et statut', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: async () => [REVERSEMENT_EFFECTUE, REVERSEMENT_EN_ATTENTE] }))
    );
    render(<ReversementsList />);

    expect(await screen.findByText('13500')).toBeInTheDocument();
    expect(screen.getByText('Effectué')).toBeInTheDocument();
    expect(screen.getByText('En attente')).toBeInTheDocument();
    expect(screen.getByText('Orange Money')).toBeInTheDocument();
  });

  it("affiche un message clair quand il n'y a encore aucun reversement", async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: async () => [] })));
    render(<ReversementsList />);

    expect(await screen.findByText(/aucun reversement/i)).toBeInTheDocument();
  });

  it('affiche une erreur si le chargement échoue', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, json: async () => null })));
    render(<ReversementsList />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/impossible de charger/i);
  });

  it("invite à se connecter si l'utilisateur n'a pas de session", async () => {
    window.localStorage.clear();
    render(<ReversementsList />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/connecte-toi/i);
  });

  // TC-015-06 (rapport-qa.md) : REVERSEMENT_EN_ATTENTE était déjà utilisé dans le premier test
  // mais la colonne date n'y était jamais vérifiée pour cette ligne précise.
  it('affiche la date de paiement en repli quand le reversement est encore en attente', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: async () => [REVERSEMENT_EN_ATTENTE] })));
    render(<ReversementsList />);

    expect(await screen.findByText(/2026-08-30 10:00:00Z/)).toBeInTheDocument();
  });
});
