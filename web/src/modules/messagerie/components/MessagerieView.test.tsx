import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessagerieView } from './MessagerieView';

const MESSAGE_AUTRE = {
  id: 'message-1',
  reservationId: 'reservation-1',
  contenu: 'Le terrain a-t-il des vestiaires ?',
  estDeMoi: false,
  createdAt: '2026-08-30T10:00:00Z',
};

const MESSAGE_MOI = {
  id: 'message-2',
  reservationId: 'reservation-1',
  contenu: 'Oui, avec éclairage aussi.',
  estDeMoi: true,
  createdAt: '2026-08-30T10:05:00Z',
};

beforeEach(() => {
  window.localStorage.setItem('auth_token', 'token-123');
});

describe('MessagerieView', () => {
  it('affiche les messages existants de la conversation', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: async () => [MESSAGE_AUTRE, MESSAGE_MOI] })));
    render(<MessagerieView reservationId="reservation-1" />);

    expect(await screen.findByText(/vestiaires/i)).toBeInTheDocument();
    expect(screen.getByText(/éclairage aussi/i)).toBeInTheDocument();
  });

  it("affiche un message clair quand la conversation n'a aucun message", async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: async () => [] })));
    render(<MessagerieView reservationId="reservation-1" />);

    expect(await screen.findByText(/aucun message/i)).toBeInTheDocument();
  });

  it('envoie un nouveau message et l\'affiche sans recharger toute la conversation', async () => {
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'message-3',
            reservationId: 'reservation-1',
            contenu: 'Merci !',
            estDeMoi: true,
            createdAt: '2026-08-30T10:10:00Z',
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => [MESSAGE_AUTRE] });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<MessagerieView reservationId="reservation-1" />);

    await screen.findByText(/vestiaires/i);
    await user.type(screen.getByLabelText(/message/i), 'Merci !');
    await user.click(screen.getByRole('button', { name: /envoyer/i }));

    expect(await screen.findByText('Merci !')).toBeInTheDocument();
    const [url, options] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
    expect(url).toContain('/reservations/reservation-1/messages');
    expect(options?.method).toBe('POST');
  });

  it("invite à se connecter si l'utilisateur n'a pas de session", async () => {
    window.localStorage.clear();
    render(<MessagerieView reservationId="reservation-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/connecte-toi/i);
  });

  // TC-024-05 (rapport-qa.md) : le pattern testé pour les listes sœurs (historique, reversements,
  // notifications) manquait pour la messagerie elle-même.
  it('affiche une erreur si le chargement de la conversation échoue', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, json: async () => null })));
    render(<MessagerieView reservationId="reservation-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/impossible de charger la conversation/i);
  });

  // TC-024-06 (rapport-qa.md) : l'échec de l'envoi n'était jamais exercé.
  it("affiche une erreur si l'envoi du message échoue, sans l'ajouter à la conversation", async () => {
    vi.stubGlobal('fetch', (url: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        return Promise.resolve({ ok: false, json: async () => ({ message: "L'envoi du message a échoué." }) });
      }
      return Promise.resolve({ ok: true, json: async () => [MESSAGE_AUTRE] });
    });
    const user = userEvent.setup();
    render(<MessagerieView reservationId="reservation-1" />);

    await screen.findByText(/vestiaires/i);
    await user.type(screen.getByLabelText(/message/i), 'Merci !');
    await user.click(screen.getByRole('button', { name: /envoyer/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/l'envoi du message a échoué/i);
    expect(screen.queryByText('Merci !')).not.toBeInTheDocument();
  });

  // TC-024-07 (rapport-qa.md) : le vidage immédiat du champ (avant résolution de l'envoi) est un
  // choix UX documenté en commentaire mais jamais verrouillé par un test.
  it('vide le champ de saisie immédiatement, avant même que l\'envoi soit résolu', async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal('fetch', (url: string, options?: RequestInit) => {
      if (options?.method === 'POST') return pending;
      return Promise.resolve({ ok: true, json: async () => [MESSAGE_AUTRE] });
    });
    const user = userEvent.setup();
    render(<MessagerieView reservationId="reservation-1" />);

    await screen.findByText(/vestiaires/i);
    const champ = screen.getByLabelText(/message/i);
    await user.type(champ, 'Merci !');
    await user.click(screen.getByRole('button', { name: /envoyer/i }));

    // Le champ est déjà vide alors que l'appel réseau n'est pas encore résolu.
    expect(champ).toHaveValue('');

    resolveFetch({
      ok: true,
      json: async () => ({
        id: 'message-3',
        reservationId: 'reservation-1',
        contenu: 'Merci !',
        estDeMoi: true,
        createdAt: '2026-08-30T10:10:00Z',
      }),
    });
    await screen.findByText('Merci !');
  });

  // TC-024-08 (rapport-qa.md) : la désactivation du bouton pendant l'appel n'était jamais vérifiée.
  it('désactive le bouton "Envoyer" pendant que l\'envoi est en cours', async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal('fetch', (url: string, options?: RequestInit) => {
      if (options?.method === 'POST') return pending;
      return Promise.resolve({ ok: true, json: async () => [MESSAGE_AUTRE] });
    });
    const user = userEvent.setup();
    render(<MessagerieView reservationId="reservation-1" />);

    await screen.findByText(/vestiaires/i);
    await user.type(screen.getByLabelText(/message/i), 'Merci !');
    await user.click(screen.getByRole('button', { name: /envoyer/i }));

    expect(await screen.findByRole('button', { name: /^envoi…$/i })).toBeDisabled();

    resolveFetch({
      ok: true,
      json: async () => ({
        id: 'message-3',
        reservationId: 'reservation-1',
        contenu: 'Merci !',
        estDeMoi: true,
        createdAt: '2026-08-30T10:10:00Z',
      }),
    });
    await screen.findByText('Merci !');
  });
});
