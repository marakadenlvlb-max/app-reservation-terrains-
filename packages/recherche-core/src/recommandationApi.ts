import type { TerrainRecommande } from './types';

/**
 * Appel à l'API backend (Laravel, module Recommandations — architecture.md section 2) — RF-024.
 * Contrairement à `searchTerrains`, exige un token : la recommandation dépend de l'historique
 * personnel du joueur connecté, ce n'est pas une fonctionnalité publique.
 *
 * Endpoint implémenté et testé côté backend (skill dev-laravel,
 * `backend/app/Actions/Recommandation/ObtenirRecommandations.php`). **Algorithme explicitement
 * provisoire** (le SRS ne détaille aucun critère) : sport correspondant au profil et/ou à
 * l'historique de réservations, terrains déjà réservés exclus, seuls les terrains ayant un
 * créneau réellement disponible retenus — voir le commentaire de l'Action pour le détail et les
 * limites assumées de cette heuristique.
 */
export async function fetchRecommandations(apiBaseUrl: string, token: string): Promise<TerrainRecommande[]> {
  const response = await fetch(`${apiBaseUrl}/api/recommandations/terrains`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Impossible de charger tes recommandations. Réessaie plus tard.');
  }

  return response.json();
}
