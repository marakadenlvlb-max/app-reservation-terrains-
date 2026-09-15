<?php

namespace App\Actions\Notation;

use App\Models\Notation;
use App\Models\Reservation;
use App\Models\User;

/**
 * RF-016 — Création d'une notation post-session. Deux vérifications explicitement demandées par
 * le frontend (notationApi.ts) et par RF-016 lui-même :
 *
 * 1. "après la session" (RF-016) : la réservation doit être confirmée ET son créneau déjà
 *    terminé — même définition que `estSessionTerminee()` déjà utilisée côté frontend
 *    (packages/historique-core/src/useHistorique.ts) pour n'afficher le lien "Noter cette
 *    session" que sur les sessions passées ; le backend l'applique à son tour plutôt que de faire
 *    confiance au frontend pour ce filtrage.
 * 2. L'auteur (déduit du token, jamais du payload) et la cible doivent être les deux parties
 *    exactes de la réservation (le joueur et le propriétaire du terrain) — exigence explicite du
 *    commentaire de creerNotation, pour empêcher une notation arbitraire entre deux utilisateurs
 *    qui n'ont jamais interagi via cette réservation.
 */
class CreerNotation
{
    /**
     * @param  array{note: int, commentaire: ?string}  $payload
     */
    public function handle(User $auteur, Reservation $reservation, User $cible, array $payload): Notation
    {
        if (! $this->sessionTerminee($reservation)) {
            abort(409, "Cette session n'est pas encore terminée.");
        }

        $proprietaireId = $reservation->creneau->terrain->proprietaire_id;
        $partiesAttendues = [$reservation->joueur_id, $proprietaireId];

        if (! in_array($auteur->id, $partiesAttendues, true) || ! in_array($cible->id, $partiesAttendues, true) || $auteur->id === $cible->id) {
            abort(403, 'Tu ne fais pas partie de cette réservation avec cette cible.');
        }

        if (Notation::where('reservation_id', $reservation->id)->where('auteur_id', $auteur->id)->exists()) {
            abort(409, 'Tu as déjà noté cette session.');
        }

        return Notation::create([
            'reservation_id' => $reservation->id,
            'auteur_id' => $auteur->id,
            'cible_id' => $cible->id,
            'note' => $payload['note'],
            'commentaire' => $payload['commentaire'] ?? null,
        ]);
    }

    /**
     * Même définition que estSessionTerminee() côté frontend : confirmée ET créneau déjà passé.
     */
    private function sessionTerminee(Reservation $reservation): bool
    {
        return $reservation->statut === 'confirmee' && $reservation->creneau->fin->isPast();
    }
}
