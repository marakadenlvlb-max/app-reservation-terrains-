import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotationForm } from './NotationForm';

function createFetchMock(overrides: { submitOk?: boolean } = {}) {
  return vi.fn((url: string, options?: RequestInit) => {
    if (options?.method === 'POST') {
      if (overrides.submitOk === false) {
        return Promise.resolve({ ok: false, json: async () => null });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'notation-1',
          reservationId: 'reservation-1',
          auteurId: 'user-1',
          cibleId: 'user-2',
          note: 5,
          commentaire: null,
          createdAt: '2026-08-30T10:00:00Z',
        }),
      });
    }
    // GET note moyenne (NoteMoyenneBadge)
    return Promise.resolve({ ok: true, json: async () => ({ utilisateurId: 'user-2', moyenne: 4.2, nombreAvis: 8 }) });
  });
}

beforeEach(() => {
  window.localStorage.setItem('auth_token', 'token-123');
});

describe('NotationForm', () => {
  it('affiche la note actuelle de la cible', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<NotationForm reservationId="reservation-1" cibleId="user-2" />);

    expect(await screen.findByText(/4\.2 \/ 5 \(8 avis\)/)).toBeInTheDocument();
  });

  it("affiche une erreur si aucune note n'est sélectionnée", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<NotationForm reservationId="reservation-1" cibleId="user-2" />);

    // findByRole (pas getByRole) : le formulaire n'apparaît qu'une fois la lecture asynchrone du
    // token résolue (voir le "token === undefined => null" dans NotationForm.tsx).
    await user.click(await screen.findByRole('button', { name: /envoyer ma note/i }));

    expect(await screen.findByText(/sélectionne une note/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'POST' }));
  });

  it('envoie la notation et affiche une confirmation', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    const user = userEvent.setup();
    render(<NotationForm reservationId="reservation-1" cibleId="user-2" />);

    await user.click(await screen.findByRole('radio', { name: '5' }));
    await user.type(screen.getByLabelText(/commentaire/i), 'Super session, très ponctuel.');
    await user.click(screen.getByRole('button', { name: /envoyer ma note/i }));

    expect(await screen.findByText(/note a bien été enregistrée/i)).toBeInTheDocument();
  });

  it("affiche une erreur si l'envoi échoue", async () => {
    vi.stubGlobal('fetch', createFetchMock({ submitOk: false }));
    const user = userEvent.setup();
    render(<NotationForm reservationId="reservation-1" cibleId="user-2" />);

    await user.click(await screen.findByRole('radio', { name: '4' }));
    await user.click(screen.getByRole('button', { name: /envoyer ma note/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/envoi de la notation a échoué/i);
  });

  // TC-016-05 (rapport-qa.md) : le pattern standard testé partout ailleurs dans le projet
  // manquait pour cet écran précis.
  it("invite à se connecter si l'utilisateur n'a pas de session", async () => {
    window.localStorage.clear();
    render(<NotationForm reservationId="reservation-1" cibleId="user-2" />);

    expect(await screen.findByText(/connecte-toi pour laisser une note/i)).toBeInTheDocument();
  });

  // TC-016-06 (rapport-qa.md) : le seul test d'envoi réussi incluait toujours un commentaire —
  // RF-016 précise pourtant "commentaire optionnel".
  it('envoie la notation sans commentaire (champ réellement optionnel)', async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<NotationForm reservationId="reservation-1" cibleId="user-2" />);

    await user.click(await screen.findByRole('radio', { name: '5' }));
    await user.click(screen.getByRole('button', { name: /envoyer ma note/i }));

    expect(await screen.findByText(/note a bien été enregistrée/i)).toBeInTheDocument();
    // `commentaire.trim() || undefined` (useNoterSession.ts) : un commentaire vide est omis du
    // payload plutôt qu'envoyé comme chaîne vide ou `null` — JSON.stringify élimine les clés
    // `undefined`, donc "commentaire" n'apparaît pas du tout dans le corps envoyé.
    const postCall = fetchMock.mock.calls.find(([, options]) => (options as RequestInit)?.method === 'POST');
    expect(postCall?.[1]?.body).not.toContain('commentaire');
  });

  // TC-016-07 (rapport-qa.md) : la désactivation du bouton pendant l'appel n'était jamais vérifiée.
  it("désactive le bouton \"Envoyer ma note\" pendant que l'envoi est en cours", async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    const noteMoyenneFetch = createFetchMock();
    vi.stubGlobal('fetch', (url: string, options?: RequestInit) =>
      options?.method === 'POST' ? pending : noteMoyenneFetch(url, options)
    );
    const user = userEvent.setup();
    render(<NotationForm reservationId="reservation-1" cibleId="user-2" />);

    await user.click(await screen.findByRole('radio', { name: '5' }));
    await user.click(screen.getByRole('button', { name: /envoyer ma note/i }));

    expect(await screen.findByRole('button', { name: /^envoi…$/i })).toBeDisabled();

    resolveFetch({
      ok: true,
      json: async () => ({
        id: 'notation-1',
        reservationId: 'reservation-1',
        auteurId: 'user-1',
        cibleId: 'user-2',
        note: 5,
        commentaire: null,
        createdAt: '2026-08-30T10:00:00Z',
      }),
    });
    await screen.findByText(/note a bien été enregistrée/i);
  });
});
