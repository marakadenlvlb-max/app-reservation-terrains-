import type { TerrainRecommande } from './types';

/**
 * Appel à l'API backend (Laravel, module Recommandations — architecture.md section 2) — RF-024.
 * Contrairement à `searchTerrains`, exige un token : la recommandation dépend de l'historique
 * personnel du joueur connecté, ce n'est pas une fonctionnalité publique.
 * TODO: endpoint backend à confirmer/implémenter côté Laravel (l'algorithme de suggestion
 * lui-même — ex. terrains du même sport que l'historique récent — reste une décision backend).
 */
export async function fetchRecommandations(apiBaseUrl: string, token: string): Promise<TerrainRecommande[]> {
  const response = await fetch(`${apiBaseUrl}/api/recommandations/terrains`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Impossible de charger tes recommandations. Réessaie plus tard.');
  }

  return response.json();
}
