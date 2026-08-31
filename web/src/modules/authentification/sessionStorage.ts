import type { SessionStorage } from '@app/auth-core';

const TOKEN_KEY = 'auth_token';

/**
 * Marqueur non sensible, PAS le token réel — voir architecture.md, correction du 31 août 2026
 * (BUG-001, rapport-qa.md). Le vrai secret de session vit désormais uniquement dans un cookie
 * `HttpOnly` positionné par le backend (`Set-Cookie` sur la réponse de `/api/auth/login`) : ce
 * cookie n'est JAMAIS lisible par du JavaScript, contrairement à ce que contenait `localStorage`
 * jusqu'ici. Cette constante ne sert qu'à piloter l'affichage ("l'utilisateur semble connecté")
 * — l'autorisation réelle de chaque appel API se fait via le cookie, envoyé automatiquement par
 * le navigateur grâce à `credentials: 'include'` sur chaque `fetch` (voir les `*Api.ts` des
 * packages `@app/*-core`).
 */
const SESSION_MARKER = 'authenticated';

/**
 * Implémentation web du stockage de session — RF-002 / RNF-002.
 *
 * ⚠️ Ne stocke plus le token réel depuis le 31 août 2026 (voir `SESSION_MARKER` ci-dessus) :
 * `setToken`/`clearToken` sont appelés avec la même signature qu'avant (compatibilité avec
 * `useLoginForm`/`useLogout`, partagés avec le mobile), mais ignorent la valeur reçue côté web —
 * le vrai token n'a plus besoin de transiter par ce module pour ce qui est de la persistance.
 */
export const webSessionStorage: SessionStorage = {
  async getToken() {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  async setToken() {
    window.localStorage.setItem(TOKEN_KEY, SESSION_MARKER);
  },
  async clearToken() {
    // Efface le marqueur local ; l'invalidation du cookie HttpOnly lui-même est du ressort du
    // backend (Set-Cookie avec expiration immédiate sur la réponse de /api/auth/logout) — un
    // cookie HttpOnly ne peut de toute façon pas être effacé depuis du JS.
    window.localStorage.removeItem(TOKEN_KEY);
  },
};
