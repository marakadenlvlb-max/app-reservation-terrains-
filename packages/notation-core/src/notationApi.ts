import type { CreateNotationPayload, Notation, NoteMoyenne } from './types';

/**
 * Appels à l'API backend (Laravel, module Notation & Réputation — architecture.md section 2)
 * — RF-016 (création) et RF-017 (note moyenne).
 *
 * TODO: endpoints backend à confirmer/implémenter côté Laravel. Le backend doit vérifier que
 * `auteurId` (déduit du token) et `cibleId` étaient bien tous deux parties à `reservationId`
 * avant d'accepter la notation — ce n'est pas au frontend de faire confiance à ses propres
 * paramètres pour une vérification aussi sensible (éviter les notations arbitraires).
 */
export async function creerNotation(
  payload: CreateNotationPayload,
  apiBaseUrl: string,
  token: string
): Promise<Notation> {
  const response = await fetch(`${apiBaseUrl}/api/notations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "L'envoi de la notation a échoué. Réessaie plus tard.");
  }

  return response.json();
}

/**
 * Note moyenne d'un utilisateur — RF-017, "visible par les autres utilisateurs". Volontairement
 * sans `token` : contrairement à la création d'une notation, la consulter ne présente aucun
 * risque et doit rester visible avant même une connexion (même principe que la recherche/
 * consultation d'annonce, US-07/US-08).
 */
export async function fetchNoteMoyenne(utilisateurId: string, apiBaseUrl: string): Promise<NoteMoyenne> {
  const response = await fetch(`${apiBaseUrl}/api/utilisateurs/${utilisateurId}/note`);

  if (!response.ok) {
    throw new Error('Impossible de charger la note.');
  }

  return response.json();
}
