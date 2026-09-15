<?php

namespace App\Http\Resources\Historique;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Forme exacte de `HistoriqueReservation` (packages/historique-core/src/types.ts) : id, statut,
 * montant, createdAt, terrain{id,sport,adresse}, creneau{id,debut,fin}, autrePartie{id,nom} — pas
 * plus (ni tarif, ni équipements/photos : l'historique n'en a pas besoin).
 *
 * `autre_partie` est une propriété dynamique posée par ObtenirHistorique (pas une relation
 * Eloquent) — voir son commentaire pour pourquoi ce choix n'est pas fait ici.
 */
class HistoriqueReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'statut' => $this->statut,
            'montant' => (float) $this->montant,
            'createdAt' => $this->created_at->toIso8601String(),
            'terrain' => [
                'id' => $this->creneau->terrain->id,
                'sport' => $this->creneau->terrain->sport,
                'adresse' => $this->creneau->terrain->adresse,
            ],
            'creneau' => [
                'id' => $this->creneau->id,
                'debut' => $this->creneau->debut->toIso8601String(),
                'fin' => $this->creneau->fin->toIso8601String(),
            ],
            'autrePartie' => [
                'id' => $this->autre_partie->id,
                'nom' => $this->autre_partie->nom,
            ],
        ];
    }
}
