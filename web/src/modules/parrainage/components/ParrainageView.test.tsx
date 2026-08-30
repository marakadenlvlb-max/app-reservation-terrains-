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
});
