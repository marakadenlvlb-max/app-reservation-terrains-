<?php

namespace App\Actions\Annonces;

use App\Models\Creneau;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

/**
 * RF-006 — Retrait d'un créneau. Même règle "reserve" que ModifierCreneau (voir son commentaire) :
 * actée dans backlog.md (US-06), appliquée ici même si rien ne peut encore produire ce statut.
 */
class RetirerCreneau
{
    public function handle(Creneau $creneau, User $utilisateur): void
    {
        if ($creneau->terrain->proprietaire_id !== $utilisateur->id) {
            throw new AuthorizationException("Ce créneau ne t'appartient pas.");
        }

        if ($creneau->statut === 'reserve') {
            abort(409, 'Ce créneau est déjà réservé et ne peut plus être retiré.');
        }

        $creneau->delete();
    }
}
