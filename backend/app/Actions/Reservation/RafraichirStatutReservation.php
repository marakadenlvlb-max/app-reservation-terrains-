<?php

namespace App\Actions\Reservation;

use App\Models\Reservation;
use Illuminate\Support\Facades\DB;

/**
 * US-11 / RF-014 — Relit le statut d'une réservation, appelé par le polling frontend
 * (useReservationStatus.ts). Aucun scheduler/tâche planifiée n'existe dans ce dépôt pour expirer
 * un verrou en arrière-plan : l'expiration est donc constatée paresseusement, à la lecture — la
 * première requête de statut envoyée après l'échéance du verrou (`Reservation::expireA()`) fait
 * elle-même la transition 'en_attente_paiement' → 'annulee' et libère le créneau, avant de
 * répondre. C'est exactement le rôle que joue déjà le polling côté frontend, donc aucune requête
 * "perdue" ne peut laisser une réservation expirée indéfiniment visible comme active.
 *
 * La transition vers 'confirmee' n'existe pas encore : elle dépendra du webhook de paiement
 * (US-12 à US-14, module Paiement, pas encore implémenté) — hors périmètre de cette tâche.
 */
class RafraichirStatutReservation
{
    public function handle(Reservation $reservation): Reservation
    {
        if ($reservation->statut === 'en_attente_paiement' && now()->greaterThan($reservation->expireA())) {
            DB::transaction(function () use ($reservation) {
                $reservation->update(['statut' => 'annulee']);
                $reservation->creneau->update(['statut' => 'disponible']);
            });
        }

        return $reservation;
    }
}
