<?php

namespace App\Actions\Messagerie;

use App\Models\Reservation;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * US-27/US-28 (module Navigation & Interface globale) — liste des conversations du joueur ou
 * propriétaire/gestionnaire connecté, une par réservation, pour la page "Messagerie" (web/mobile).
 *
 * **Décision métier laissée ouverte par le frontend, tranchée ici** (packages/messagerie-core/src/
 * messagerieApi.ts, commentaire de `fetchMesConversations`) : une réservation sans aucun message
 * n'apparaît PAS dans la liste — RF-023 parle d'une "conversation liée à une réservation", et une
 * réservation sans message n'a encore rien à prévisualiser. Pas un enjeu financier : décision
 * technique raisonnable documentée ici plutôt que devinée en silence ou bloquée sur une question.
 *
 * Triées par date du dernier message décroissante (conversation la plus récemment active en
 * premier) — convention raisonnable pour une messagerie, non imposée par le SRS.
 */
class ObtenirMesConversations
{
    public function handle(User $utilisateur): Collection
    {
        $reservations = Reservation::query()
            ->where(function ($query) use ($utilisateur) {
                $query->where('joueur_id', $utilisateur->id)
                    ->orWhereHas('creneau.terrain', function ($query) use ($utilisateur) {
                        $query->where('proprietaire_id', $utilisateur->id);
                    });
            })
            ->whereHas('messages')
            ->with(['creneau.terrain.proprietaire', 'joueur', 'messages'])
            ->get();

        // `autre_partie`/`dernier_message` : propriétés dynamiques, pas des colonnes — même
        // principe que ObtenirHistorique (module Historique).
        return $reservations
            ->map(function (Reservation $reservation) use ($utilisateur) {
                $estJoueur = $reservation->joueur_id === $utilisateur->id;
                $reservation->autre_partie = $estJoueur
                    ? $reservation->creneau->terrain->proprietaire
                    : $reservation->joueur;
                // Reservation::messages() est ordonnée par created_at croissant : le dernier
                // élément de la collection déjà chargée est donc le message le plus récent — pas
                // besoin d'une deuxième requête ni d'un tri supplémentaire ici.
                $reservation->dernier_message = $reservation->messages->last();

                return $reservation;
            })
            ->sortByDesc(fn (Reservation $reservation) => $reservation->dernier_message->created_at)
            ->values();
    }
}
