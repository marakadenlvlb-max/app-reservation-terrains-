'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { estReservationAnnulable, estSessionTerminee, useHistorique, type HistoriqueRole } from '@app/historique-core';
import { useAnnulerReservation } from '@app/reservation-core';
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
 * US-27 (module Navigation & Interface globale) : le menu global ne pointe que vers
 * `/historique/joueur` (une seule entrée "Mes réservations" possible dans la barre horizontale) —
 * ce lien croisé permet d'atteindre l'autre vue depuis ici, cohérent avec l'accueil combiné
 * (un compte peut être joueur ET propriétaire/gestionnaire, `UTILISATEUR` n'a pas de champ `role`).
 */
const AUTRE_VUE: Record<HistoriqueRole, { href: string; label: string }> = {
  joueur: { href: '/historique/proprietaire', label: 'Voir les réservations reçues sur mes terrains' },
  proprietaire: { href: '/historique/joueur', label: 'Voir mes réservations en tant que joueur' },
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
  const { annulingId, annulerError, annuler } = useAnnulerReservation({
    apiBaseUrl: API_BASE_URL,
    token: token ?? null,
  });

  // Mise à jour locale après annulation plutôt qu'un re-fetch complet de l'historique — même
  // approche que la mise à jour optimiste du "marquer comme lue" des notifications (US-20).
  const [statutOverrides, setStatutOverrides] = useState<Record<string, string>>({});
  const [messagesAnnulation, setMessagesAnnulation] = useState<Record<string, string>>({});

  const handleAnnuler = async (reservationId: string) => {
    const resultat = await annuler(reservationId);
    if (resultat) {
      setStatutOverrides((prev) => ({ ...prev, [reservationId]: 'annulee' }));
      setMessagesAnnulation((prev) => ({ ...prev, [reservationId]: resultat.message }));
    }
  };

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
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-500">Aucune réservation pour l'instant.</p>
        <Link href={AUTRE_VUE[role].href} className="text-sm text-blue-600 underline">
          {AUTRE_VUE[role].label}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{TITRES[role]}</h1>
        <Link href={AUTRE_VUE[role].href} className="text-sm text-blue-600 underline">
          {AUTRE_VUE[role].label}
        </Link>
      </div>
      {annulerError && (
        <p role="alert" className="text-sm text-red-600">
          {annulerError}
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {reservations.map((reservation) => {
          const statut = statutOverrides[reservation.id] ?? reservation.statut;
          const effective = { ...reservation, statut };
          return (
            <li key={reservation.id} className="rounded border border-gray-200 px-3 py-2 text-sm">
              <p className="font-medium">
                {reservation.terrain.adresse} — {reservation.terrain.sport}
              </p>
              <p>
                {reservation.creneau.debut.replace('T', ' ')} → {reservation.creneau.fin.replace('T', ' ')} —{' '}
                {reservation.montant}
              </p>
              <p className="text-gray-600">
                {AUTRE_PARTIE_LABELS[role]} : {reservation.autrePartie.nom} — {STATUT_LABELS[statut] ?? statut}
              </p>
              {estSessionTerminee(effective) && (
                <Link
                  href={`/reservations/${reservation.id}/noter/${reservation.autrePartie.id}`}
                  className="text-blue-600 underline"
                >
                  Noter cette session
                </Link>
              )}
              <Link
                href={`/reservations/${reservation.id}/messages`}
                className="block text-blue-600 underline"
              >
                Envoyer un message
              </Link>
              {role === 'joueur' && estReservationAnnulable(effective) && (
                <button
                  type="button"
                  onClick={() => void handleAnnuler(reservation.id)}
                  disabled={annulingId === reservation.id}
                  className="mt-1 block text-red-600 underline disabled:opacity-50"
                >
                  {annulingId === reservation.id ? 'Annulation en cours…' : 'Annuler ma réservation'}
                </button>
              )}
              {messagesAnnulation[reservation.id] && (
                <p className="text-green-700">{messagesAnnulation[reservation.id]}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
