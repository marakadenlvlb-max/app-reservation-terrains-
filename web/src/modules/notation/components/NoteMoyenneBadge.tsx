'use client';

import { useNoteMoyenne } from '@app/notation-core';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * Badge de note moyenne — US-17 / RF-017. Composant volontairement autonome (charge sa propre
 * donnée via `utilisateurId`) pour pouvoir être réutilisé partout où un profil apparaît, sans
 * dépendre de ce que l'écran parent a déjà chargé — aucun écran "profil public" n'existe encore,
 * mais celui-ci est prêt à y être déposé tel quel le jour venu.
 */
export function NoteMoyenneBadge({ utilisateurId }: { utilisateurId: string }) {
  const { noteMoyenne, loading, error } = useNoteMoyenne({ utilisateurId, apiBaseUrl: API_BASE_URL });

  if (loading) {
    return <span className="text-sm text-gray-400">Note…</span>;
  }

  if (error || !noteMoyenne || noteMoyenne.moyenne === null) {
    return <span className="text-sm text-gray-500">Pas encore de note</span>;
  }

  return (
    <span className="text-sm text-gray-700">
      ★ {noteMoyenne.moyenne.toFixed(1)} / 5 ({noteMoyenne.nombreAvis} avis)
    </span>
  );
}
