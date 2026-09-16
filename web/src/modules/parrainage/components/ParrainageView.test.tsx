import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParrainageView } from './ParrainageView';

const RESUME = {
  codeParrainage: 'AWA1234',
  filleuls: [
    { id: 'user-2', nom: 'Moussa Ba', statut: 'valide', avantage: '1000 FCFA de crédit', createdAt: '2026-08-20T10:00:00Z' },
  ],
};

beforeEach(() => {
  window.localStorage.setItem('auth_token', 'token-123');
});

describe('ParrainageView', () => {
  it('affiche le code de parrainage et la liste des filleuls', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: async () => RESUME })));
    render(<ParrainageView />);

    expect(await screen.findByText('AWA1234')).toBeInTheDocument();
    expect(screen.getByText(/moussa ba/i)).toBeInTheDocument();
    expect(screen.getByText(/1000 fcfa de crédit/i)).toBeInTheDocument();
  });

  it("affiche un message clair quand l'utilisateur n'a encore parrainé personne", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: async () => ({ codeParrainage: 'AWA1234', filleuls: [] }) }))
    );
    render(<ParrainageView />);

    expect(await screen.findByText(/n'as encore parrainé personne/i)).toBeInTheDocument();
  });

  it('utilise un code de parrainage reçu et affiche la confirmation', async () => {
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ codeParrainage: 'AWA1234', filleuls: [] }) });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<ParrainageView />);

    await screen.findByText('AWA1234');
    await user.type(screen.getByLabelText(/code de parrainage/i), 'MOU5678');
    await user.click(screen.getByRole('button', { name: /utiliser/i }));

    expect(await screen.findByText(/code accepté/i)).toBeInTheDocument();
    const [, options] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
    expect(options?.method).toBe('POST');
    expect(options?.body).toBe(JSON.stringify({ code: 'MOU5678' }));
  });

  it('affiche une erreur si le code de parrainage est invalide', async () => {
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        return Promise.resolve({ ok: false, json: async () => ({ message: 'Ce code de parrainage est invalide.' }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ codeParrainage: 'AWA1234', filleuls: [] }) });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<ParrainageView />);

    await screen.findByText('AWA1234');
    await user.type(screen.getByLabelText(/code de parrainage/i), 'INVALIDE');
    await user.click(screen.getByRole('button', { name: /utiliser/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalide/i);
    // Le champ n'est PAS vidé après un échec, contrairement à un succès — l'utilisateur doit
    // pouvoir corriger sans retaper le code.
    expect(screen.getByLabelText(/code de parrainage/i)).toHaveValue('INVALIDE');
  });

  it("invite à se connecter si l'utilisateur n'a pas de session", async () => {
    window.localStorage.clear();
    render(<ParrainageView />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/connecte-toi/i);
  });

  // TC-026-07 (rapport-qa.md) : le pattern testé pour les écrans sœurs (historique, reversements,
  // notifications, messagerie, recommandations) manquait pour le parrainage lui-même.
  it('affiche une erreur si le chargement du résumé de parrainage échoue', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, json: async () => null })));
    render(<ParrainageView />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/impossible de charger ton parrainage/i);
  });

  // TC-026-08 (rapport-qa.md) : seule la moitié "pas vidé après un échec" du comportement
  // documenté en commentaire était verrouillée par un test — pas la moitié "vidé après un succès".
  it('vide le champ une fois le code accepté avec succès', async () => {
    vi.stubGlobal('fetch', (url: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ codeParrainage: 'AWA1234', filleuls: [] }) });
    });
    const user = userEvent.setup();
    render(<ParrainageView />);

    await screen.findByText('AWA1234');
    const champ = screen.getByLabelText(/code de parrainage/i);
    await user.type(champ, 'MOU5678');
    await user.click(screen.getByRole('button', { name: /utiliser/i }));

    await screen.findByText(/code accepté/i);
    expect(champ).toHaveValue('');
  });

  // TC-026-09 (rapport-qa.md) : la désactivation du bouton pendant l'appel n'était jamais vérifiée.
  it('désactive le bouton "Utiliser" pendant que l\'envoi est en cours', async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal('fetch', (url: string, options?: RequestInit) => {
      if (options?.method === 'POST') return pending;
      return Promise.resolve({ ok: true, json: async () => ({ codeParrainage: 'AWA1234', filleuls: [] }) });
    });
    const user = userEvent.setup();
    render(<ParrainageView />);

    await screen.findByText('AWA1234');
    await user.type(screen.getByLabelText(/code de parrainage/i), 'MOU5678');
    await user.click(screen.getByRole('button', { name: /utiliser/i }));

    expect(await screen.findByRole('button', { name: /^envoi…$/i })).toBeDisabled();

    resolveFetch({ ok: true, json: async () => ({}) });
    await screen.findByText(/code accepté/i);
  });

  // TC-026-10 (rapport-qa.md) : seul le statut `valide` avec un avantage déjà accordé était
  // exercé — jamais le statut `en_attente` (avantage pas encore accordé).
  it('affiche un filleul en attente sans suffixe avantage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            codeParrainage: 'AWA1234',
            filleuls: [{ id: 'user-3', nom: 'Fatou Sow', statut: 'en_attente', avantage: null, createdAt: '2026-08-25T10:00:00Z' }],
          }),
        })
      )
    );
    render(<ParrainageView />);

    expect(await screen.findByText(/fatou sow/i)).toBeInTheDocument();
    expect(screen.getByText(/^en attente$/i)).toBeInTheDocument();
  });

  // BUG-008 (rapport-qa.md, corrigé le 9 septembre 2026) : le statut 'utilise' (renvoyé par le
  // backend une fois la réduction consommée, module Paiement) n'était pas traduit — la valeur
  // brute fuyait dans l'UI, accolée à un texte d'avantage devenu trompeur ("sur ta prochaine
  // réservation" alors qu'elle est déjà dépensée).
  it('affiche "Avantage utilisé" sans le texte d\'avantage devenu obsolète', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
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
      )
    );
    render(<ParrainageView />);

    expect(await screen.findByText(/ousmane fall/i)).toBeInTheDocument();
    expect(screen.getByText(/^avantage utilisé$/i)).toBeInTheDocument();
    expect(screen.queryByText(/utilise —/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/prochaine réservation/i)).not.toBeInTheDocument();
  });
});
