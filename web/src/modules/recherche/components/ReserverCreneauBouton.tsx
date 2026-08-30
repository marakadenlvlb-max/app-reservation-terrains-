'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCountdown, useReservationStatus, useReserverCreneau, type Reservation } from '@app/reservation-core';
import { OPERATEURS } from '@app/paiement-core';
import { webSessionStorage } from '../../authentification/sessionStorage';
import { PaiementOperateurBouton } from './PaiementOperateurBouton';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * Bouton de réservation d'un créneau — US-10 / RF-010. Séparé de TerrainDetailView pour garder
 * cet écran (public) simple : c'est ce petit composant qui porte la seule partie de la page qui
 * exige une session, avec son propre état de verrouillage/confirmation.
 */
export function ReserverCreneauBouton({ creneauId }: { creneauId: string }) {
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    webSessionStorage.getToken().then(setToken);
  }, []);

  const { reservation, reserving, reserveError, reserver } = useReserverCreneau({
    apiBaseUrl: API_BASE_URL,
    token: token ?? null,
  });

  // `undefined` = pas encore lu depuis le stockage local ; `null` = lu, mais pas connecté.
  if (token === undefined) {
    return null;
  }

  if (token === null) {
    return (
      <Link href="/connexion" className="text-sm text-blue-600 underline">
        Connecte-toi pour réserver
      </Link>
    );
  }

  if (reservation) {
    return <ReservationStatusPanel initial={reservation} apiBaseUrl={API_BASE_URL} token={token} />;
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => void reserver(creneauId)}
        disabled={reserving}
        className="self-start rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
      >
        {reserving ? 'Réservation…' : 'Réserver'}
      </button>
      {reserveError && (
        <p role="alert" className="text-sm text-red-600">
          {reserveError}
        </p>
      )}
    </div>
  );
}

/**
 * Affiche l'état d'une réservation en cours et se met à jour via polling — US-11 / RF-014. Une
 * fois le verrou posé (US-10), rien côté frontend ne peut savoir tout de suite si le paiement a
 * été validé (US-12 à US-14) : on interroge le backend régulièrement jusqu'à un statut terminal.
 */
function ReservationStatusPanel({
  initial,
  apiBaseUrl,
  token,
}: {
  initial: Reservation;
  apiBaseUrl: string;
  token: string;
}) {
  const { reservation: polled, error: pollError } = useReservationStatus({
    reservationId: initial.id,
    expireA: initial.expireA,
    apiBaseUrl,
    token,
  });
  // Tant que le tout premier polling n'a pas répondu, on affiche la réservation qu'on vient de
  // créer localement — évite un flash "vide" au moment même où le verrou vient d'être posé.
  const reservation = polled ?? initial;
  const { remainingSeconds, expired } = useCountdown(reservation.expireA);

  if (reservation.statut === 'confirmee') {
    return <p className="text-sm text-green-600">✅ Réservation confirmée !</p>;
  }

  if (reservation.statut === 'annulee') {
    return <p className="text-sm text-red-600">La réservation a été annulée — ce créneau est de nouveau disponible.</p>;
  }

  if (expired) {
    // Lecture locale optimiste : le prochain polling confirmera l'état réel côté backend, qui
    // fait foi (voir le commentaire dans useReservationStatus.ts sur la marge de grâce).
    return <p className="text-sm text-red-600">Le délai a expiré, ce créneau est redevenu disponible.</p>;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = String(remainingSeconds % 60).padStart(2, '0');
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-green-600">
        Créneau verrouillé — il te reste {minutes}:{seconds} pour finaliser le paiement.
      </p>
      <p className="text-sm text-gray-600">Choisis ton moyen de paiement :</p>
      <div className="flex flex-wrap gap-2">
        {/* Un seul composant générique pour les trois opérateurs (US-12 à US-14) — voir
            PaiementOperateurBouton et l'adaptateur de paiement commun décrit dans architecture.md. */}
        {OPERATEURS.map((operateur) => (
          <PaiementOperateurBouton key={operateur} reservationId={reservation.id} operateur={operateur} token={token} />
        ))}
      </div>
      {pollError && <p className="text-sm text-gray-500">{pollError}</p>}
    </div>
  );
}
