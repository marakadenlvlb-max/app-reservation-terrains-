'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { estSessionTerminee, useHistorique, type HistoriqueRole } from '@app/historique-core';
import { webSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const STATUT_LABELS: Record<string, string> = {
  en_attente_paiement: 'En attente de paiement',
  confirmee: 'Confirmée',
  annulee: 'Annulée',
};

const TITRES: Record<HistoriqueRole, string> = {
  joueur: 'Mes réservations',
  proprietaire: 'Réservations reçues',
};

const AUTRE_PARTIE_LABELS: Record<HistoriqueRole, string> = {
  joueur: 'Propriétaire/gestionnaire',
  proprietaire: 'Joueur',
};

/**
 * Historique des réservations — US-18 (`role="joueur"`, RF-018) / US-19 (`role="proprietaire"`,
 * RF-019), module Historique. Un seul composant pour les deux vues : structurellement
 * identiques, seul le point de vue (et donc l'endpoint appelé, voir historiqueApi.ts) change.
 */
export function HistoriqueList({ role }: { role: HistoriqueRole }) {
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    webSessionStorage.getToken().then(setToken);
  }, []);

  const { reservations, loading, error } = useHistorique({ role, apiBaseUrl: API_BASE_URL, token: token ?? null });

  if (token === undefined || loading) {
    return <p>Chargement de ton historique…</p>;
  }

  if (error && reservations.length === 0) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {error}
      </p>
    );
  }

  if (reservations.length === 0) {
    return <p className="text-sm text-gray-500">Aucune réservation pour l'instant.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{TITRES[role]}</h1>
      <ul className="flex flex-col gap-2">
        {reservations.map((reservation) => (
          <li key={reservation.id} className="rounded border border-gray-200 px-3 py-2 text-sm">
            <p className="font-medium">
              {reservation.terrain.adresse} — {reservation.terrain.sport}
            </p>
            <p>
              {reservation.creneau.debut.replace('T', ' ')} → {reservation.creneau.fin.replace('T', ' ')} —{' '}
              {reservation.montant}
            </p>
            <p className="text-gray-600">
              {AUTRE_PARTIE_LABELS[role]} : {reservation.autrePartie.nom} —{' '}
              {STATUT_LABELS[reservation.statut] ?? reservation.statut}
            </p>
            {estSessionTerminee(reservation) && (
              <Link
                href={`/reservations/${reservation.id}/noter/${reservation.autrePartie.id}`}
                className="text-blue-600 underline"
              >
                Noter cette session
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
