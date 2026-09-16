import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { NavBar } from './NavBar';

const fetchMock = vi.fn();
const pushMock = vi.fn();
let pathnameMock = '/accueil';

// NavBar rend LogoutButton (US-27), qui appelle lui aussi useRouter — les deux doivent être
// mockés ensemble, next/navigation exigeant un contexte App Router absent de jsdom.
vi.mock('next/navigation', () => ({
  usePathname: () => pathnameMock,
  useRouter: () => ({ push: pushMock }),
}));

beforeEach(() => {
  fetchMock.mockReset();
  pushMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  window.localStorage.clear();
  pathnameMock = '/accueil';
});

describe('NavBar', () => {
  it("ne s'affiche pas pour un utilisateur non connecté", async () => {
    render(<NavBar />);

    // `await waitFor` (même vide) laisse le temps à useSessionToken de résoudre (undefined →
    // null) sans que ce test n'ait à réagir à un changement d'état, plutôt qu'une assertion
    // synchrone qui déclencherait un avertissement act() en manquant cette résolution.
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
  });

  // US-28 (Sprint 20) ajoute Recommandations à la nav globale — 9 entrées désormais.
  it('affiche les 9 entrées pour un utilisateur connecté', async () => {
    window.localStorage.setItem('auth_token', 'authenticated');
    render(<NavBar />);

    // useSessionToken résout de façon asynchrone (undefined puis la vraie valeur) — la nav
    // n'apparaît qu'après cette résolution, comme pour tout autre écran du projet.
    expect(await screen.findByRole('navigation')).toBeInTheDocument();
    for (const label of [
      'Accueil',
      'Recherche',
      'Recommandations',
      'Mes annonces',
      'Mes réservations',
      'Messagerie',
      'Notifications',
      'Profil',
    ]) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: /se déconnecter/i })).toBeInTheDocument();
  });

  it("reste masquée sur /connexion même si un marqueur de session traîne", async () => {
    window.localStorage.setItem('auth_token', 'authenticated');
    pathnameMock = '/connexion';
    render(<NavBar />);

    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
  });

  it("reste masquée sur /inscription", async () => {
    window.localStorage.setItem('auth_token', 'authenticated');
    pathnameMock = '/inscription';
    render(<NavBar />);

    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
  });

  it("marque l'entrée de menu correspondant à la route courante", async () => {
    window.localStorage.setItem('auth_token', 'authenticated');
    pathnameMock = '/recherche';
    render(<NavBar />);

    expect(await screen.findByRole('link', { name: 'Recherche' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Accueil' })).not.toHaveAttribute('aria-current');
  });
});
