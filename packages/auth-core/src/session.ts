/**
 * Abstraction du stockage du token de session (RF-002).
 *
 * Web (localStorage) et mobile (expo-secure-store) n'exposent pas la même API, et ce package
 * partagé n'a pas de dépendance à l'un ou l'autre — chaque plateforme fournit sa propre
 * implémentation (voir web/src/modules/authentification/sessionStorage.ts et l'équivalent
 * mobile) et l'injecte dans useLoginForm/useLogout. C'est le même principe que l'injection de
 * `apiBaseUrl` déjà utilisée pour l'inscription (US-01).
 */
export interface SessionStorage {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  clearToken(): Promise<void>;
}
