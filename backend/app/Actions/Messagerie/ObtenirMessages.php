<?php

namespace App\Actions\Messagerie;

use App\Models\Reservation;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Collection;

/**
 * RF-023 — consultation de la conversation liée à une réservation. Réservée aux deux parties de
 * cette réservation (le joueur et le propriétaire/gestionnaire du terrain) : une conversation
 * "au sujet d'une réservation" n'a de sens que pour qui y participe, pas pour n'importe quel
 * utilisateur connecté — même logique d'autorisation que CreerNotation (module Notation).
 */
class ObtenirMessages
{
    public function handle(User $utilisateur, Reservation $reservation): Collection
    {
        $this->assertPartiePrenante($utilisateur, $reservation);

        return $reservation->messages;
    }

    public static function assertPartiePrenante(User $utilisateur, Reservation $reservation): void
    {
        $proprietaireId = $reservation->creneau->terrain->proprietaire_id;

        if (! in_array($utilisateur->id, [$reservation->joueur_id, $proprietaireId], true)) {
            throw new AuthorizationException("Tu ne fais pas partie de cette réservation.");
        }
    }
}
