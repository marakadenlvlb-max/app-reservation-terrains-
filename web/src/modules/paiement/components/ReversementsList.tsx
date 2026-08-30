'use client';

import { useEffect, useState } from 'react';
import { OPERATEUR_LABELS, useReversements } from '@app/paiement-core';
import { webSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  effectue: 'Effectué',
};

/**
 * Liste des reversements du propriétaire/gestionnaire — US-15 / RF-015 (module Paiement).
 * Lecture seule : le reversement est un processus backend automatique selon un cycle défini,
 * cet écran ne fait qu'en afficher l'état, jamais le déclencher.
 */
export function ReversementsList() {
  // `undefined` = pas encore lu depuis le stockage local ; `null` = lu, mais pas connecté. Sans
  // cette distinction, useReversements recevrait `null` dès le tout premier rendu et afficherait
  // un flash "connecte-toi" même pour un utilisateur bien connecté, le temps que la lecture
  // asynchrone du token aboutisse (même piège que dans ReserverCreneauBouton, US-10).
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    webSessionStorage.getToken().then(setToken);
  }, []);

  const { reversements, loading, error } = useReversements({ apiBaseUrl: API_BASE_URL, token: token ?? null });

  if (token === undefined || loading) {
    return <p>Chargement de tes reversements…</p>;
  }

  if (error && reversements.length === 0) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {error}
      </p>
    );
  }

  if (reversements.length === 0) {
    return <p className="text-sm text-gray-500">Aucun reversement pour l'instant.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Mes reversements</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Opérateur</th>
              <th className="py-2 pr-4">Montant brut</th>
              <th className="py-2 pr-4">Commission</th>
              <th className="py-2 pr-4">Montant net</th>
              <th className="py-2 pr-4">Statut</th>
            </tr>
          </thead>
          <tbody>
            {reversements.map((reversement) => (
              <tr key={reversement.paiementId} className="border-b border-gray-100">
                <td className="py-2 pr-4">{(reversement.dateReversement ?? reversement.datePaiement).replace('T', ' ')}</td>
                <td className="py-2 pr-4">{OPERATEUR_LABELS[reversement.operateur]}</td>
                <td className="py-2 pr-4">{reversement.montant}</td>
                <td className="py-2 pr-4">{reversement.commission}</td>
                <td className="py-2 pr-4 font-medium">{reversement.montantNet}</td>
                <td className="py-2 pr-4">
                  {STATUT_LABELS[reversement.statutReversement] ?? reversement.statutReversement}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
