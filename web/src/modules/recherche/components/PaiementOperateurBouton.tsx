'use client';

import { OPERATEUR_LABELS, useInitierPaiement, type Operateur } from '@app/paiement-core';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * Bouton de paiement pour un opérateur donné — US-12 / RF-011 (Wave pour l'instant ; Orange
 * Money et Moov Money suivront à l'identique, US-13/US-14, en changeant seulement `operateur`).
 */
export function PaiementOperateurBouton({
  reservationId,
  operateur,
  token,
}: {
  reservationId: string;
  operateur: Operateur;
  token: string;
}) {
  const { initiating, initiateError, initier } = useInitierPaiement({ apiBaseUrl: API_BASE_URL, token });

  const handleClick = async () => {
    const url = await initier(reservationId, operateur);
    if (url) {
      // Nouvel onglet plutôt qu'une redirection complète (window.location.href) : RF-011 précise
      // "sans sortir de l'application" pour l'expérience de paiement — garder l'app ouverte dans
      // son onglet d'origine s'en rapproche davantage qu'une navigation qui la quitterait.
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={initiating}
        className="self-start rounded border border-blue-600 px-3 py-1 text-sm font-medium text-blue-600 disabled:opacity-50"
      >
        {initiating ? 'Ouverture du paiement…' : `Payer avec ${OPERATEUR_LABELS[operateur]}`}
      </button>
      {initiateError && (
        <p role="alert" className="text-sm text-red-600">
          {initiateError}
        </p>
      )}
    </div>
  );
}
