<?php

namespace App\Actions\Notation;

use App\Models\Notation;
use App\Models\User;

/**
 * RF-017 — Note moyenne calculée à la volée à partir des NOTATION reçues, plutôt que lue depuis
 * `UTILISATEUR.note_moyenne` (colonne existante, ajoutée pendant le module Authentification).
 * Choix délibéré : `NoteMoyenne.nombreAvis` (types.ts) n'a de toute façon aucune colonne dédiée
 * sur UTILISATEUR, un COUNT est nécessaire de toute façon à la lecture — calculer la moyenne dans
 * la même requête évite un second mécanisme (mettre à jour `note_moyenne` à chaque création de
 * notation) qui pourrait un jour diverger de la réalité. `UTILISATEUR.note_moyenne` reste inutilisé
 * pour l'instant ; à revisiter si un besoin de performance impose un jour de la dénormaliser.
 */
class ObtenirNoteMoyenne
{
    public function handle(User $utilisateur): array
    {
        $stats = Notation::where('cible_id', $utilisateur->id)
            ->selectRaw('avg(note) as moyenne, count(*) as nombre_avis')
            ->first();

        $nombreAvis = (int) $stats->nombre_avis;

        return [
            'utilisateurId' => $utilisateur->id,
            'moyenne' => $nombreAvis > 0 ? round((float) $stats->moyenne, 1) : null,
            'nombreAvis' => $nombreAvis,
        ];
    }
}
