'use client';

import { useState } from 'react';
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
  const { initiating, initiateError, montantFacture, reductionParrainagePourcentage, initier } = useInitierPaiement({
    apiBaseUrl: API_BASE_URL,
    token,
  });
  // BUG-006 (rapport-qa.md, corrigé le 1 septembre 2026) : `window.open` peut échouer
  // silencieusement (popup bloqué par le navigateur — un scénario courant, pas un cas exotique) ;
  // le code ignorait sa valeur de retour, laissant l'utilisateur devant un bouton qui redevient
  // cliquable sans le moindre message, alors que le paiement est resté "initié" côté backend.
  // `openError`/`fallbackUrl` sont un état séparé de `initiateError` : ce n'est pas l'initiation
  // qui a échoué, c'est l'étape d'ouverture, une fois l'URL déjà obtenue avec succès.
  const [openError, setOpenError] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  const handleClick = async () => {
    setOpenError(null);
    setFallbackUrl(null);
    const url = await initier(reservationId, operateur);
    if (url) {
      // Nouvel onglet plutôt qu'une redirection complète (window.location.href) : RF-011 précise
      // "sans sortir de l'application" pour l'expérience de paiement — garder l'app ouverte dans
      // son onglet d'origine s'en rapproche davantage qu'une navigation qui la quitterait.
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        setOpenError('Le paiement n\'a pas pu s\'ouvrir (bloqué par le navigateur). Autorise les popups pour ce site, ou continue via le lien ci-dessous.');
        setFallbackUrl(url);
      }
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
      {/* Transparence de la réduction de parrainage (rapport-qa.md, 9 septembre 2026) : sans ce
          message, un parrain payait moins cher sans jamais pouvoir le constater dans l'app. */}
      {reductionParrainagePourcentage !== null && montantFacture !== null && (
        <p className="text-sm text-green-700">
          Réduction de parrainage de {reductionParrainagePourcentage}% appliquée — montant facturé : {montantFacture} FCFA.
        </p>
      )}
      {openError && (
        <div className="flex flex-col gap-1">
          <p role="alert" className="text-sm text-red-600">
            {openError}
          </p>
          {fallbackUrl && (
            <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline">
              Continuer vers le paiement
            </a>
          )}
        </div>
      )}
    </div>
  );
}
