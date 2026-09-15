<?php

namespace App\Actions\Annonces;

use App\Models\Creneau;
use App\Models\Terrain;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

/**
 * RF-006 — Ajout d'un créneau (avec tarif) à un terrain déjà publié. Le chevauchement entre
 * créneaux d'un même terrain n'est volontairement pas vérifié ici : ni RF-006 ni architecture.md
 * ne l'imposent, et le seul chevauchement dont le SRS parle est celui d'une RÉSERVATION sur un
 * créneau déjà occupé (RF-010, verrouillage temporaire — module Réservation, pas encore
 * implémenté). Ne pas inventer cette contrainte à la place du SRS.
 */
class CreerCreneau
{
    /**
     * @param  array{debut: string, fin: string, tarif: float}  $payload
     */
    public function handle(Terrain $terrain, User $utilisateur, array $payload): Creneau
    {
        if ($terrain->proprietaire_id !== $utilisateur->id) {
            throw new AuthorizationException("Cette annonce ne t'appartient pas.");
        }

        return $terrain->creneaux()->create([
            'debut' => $payload['debut'],
            'fin' => $payload['fin'],
            'tarif' => $payload['tarif'],
            // Le défaut 'disponible' de la migration ne suffit pas : Eloquent ne relit pas les
            // valeurs par défaut de la base après un insert (découvert en testant réellement),
            // le modèle en mémoire resterait `null` sans cette valeur explicite.
            'statut' => 'disponible',
        ]);
    }
}
