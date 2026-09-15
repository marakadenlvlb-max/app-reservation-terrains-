<?php

namespace App\Actions\Annonces;

use App\Models\Terrain;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

/**
 * US-06 — Retrait d'une annonce. deleteTerrain (terrainApi.ts) documente explicitement que "le
 * backend est le seul à savoir si des réservations actives dépendent encore de ce terrain" et
 * doit refuser la suppression le cas échéant (ex. 409) — **non implémenté ici** : le module
 * Réservation (US-10, RF-010) n'existe pas encore côté backend, il n'y a donc rien à vérifier
 * contre pour l'instant. Signalé explicitement plutôt que deviné : ce contrôle devra être ajouté
 * quand la table RESERVATION existera, pas une décision métier tranchée à la légère ici.
 */
class RetirerAnnonce
{
    public function handle(Terrain $terrain, User $utilisateur): void
    {
        if ($terrain->proprietaire_id !== $utilisateur->id) {
            throw new AuthorizationException("Cette annonce ne t'appartient pas.");
        }

        $terrain->delete();
    }
}
