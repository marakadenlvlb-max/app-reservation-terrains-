<?php

namespace App\Actions\Annonces;

use App\Models\Terrain;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

/**
 * US-27 (module Navigation & Interface globale) — liste des annonces du propriétaire/gestionnaire
 * connecté, pour la page "Mes annonces" (web) / l'écran équivalent (mobile). Triée par date de
 * création décroissante (plus récent d'abord) — même convention que ObtenirHistorique (module
 * Historique), non imposée par le SRS mais raisonnable pour ce type de liste.
 */
class ObtenirMesTerrains
{
    public function handle(User $proprietaire): Collection
    {
        return Terrain::where('proprietaire_id', $proprietaire->id)
            ->with('paliers')
            ->orderByDesc('created_at')
            ->get();
    }
}
