import type { SessionStorage } from '@app/auth-core';

const TOKEN_KEY = 'auth_token';

/**
 * Implémentation web du stockage de session — RF-002. localStorage est suffisant pour une V1 ;
 * un passage à un cookie httpOnly géré par le backend pourra être envisagé plus tard (RNF-002)
 * si l'exposition du token en JS devient un point d'attention.
 */
export const webSessionStorage: SessionStorage = {
  async getToken() {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  async setToken(token: string) {
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  async clearToken() {
    window.localStorage.removeItem(TOKEN_KEY);
  },
};
